/*jshint esversion: 6 */
ProveIt = (function($) {
    return {
        supportsES6: function() {
            try {
                new Function("(a = 0) => a");
                return true;
            }
                catch (err) {
                    return false;
            }
        },

        web3Status: {"supportedNetworks": ["Mainnet", "Rinkeby (proof-of-authority)", "Ropsten (test)"]},

        changeTooltipTitle: function (tooltip, text) {
            var originalTitle = $(tooltip).attr("data-original-title");
            if (typeof originalTitle !== typeof undefined && originalTitle !== false) {
                $(tooltip).attr('data-original-title', text);
            } else {
                $(tooltip).attr('title', text);
            }
        },

        parseFile: function (file, opts) {
            // credit to alediaferia on Github for most of this code
            // callback params: errorCallback, chunkCallback, finishedCallback:
            // other params: binary (true | false), bytesPerChunk | singleChunk
            var options = typeof opts === 'undefined' ? {} : opts;
            var defaulter = function(name, _default) {return name in options ? options[name] : _default;};
            var errorCallback = defaulter('errorCallback', function() {});
            var chunkCallback = defaulter('chunkCallback', function() {});
            var finishedCallback = defaulter('finishedCallback', function() {});
            var binary = defaulter('binary', true);
            var bytesPerChunk = defaulter('bytesPerChunk', Math.pow(2, 8) * Math.pow(2, 10)); //.25 megabytes
            var singleChunk = defaulter('singleChunk', false);

            var fileSize = file.size;
            if (singleChunk) {
                bytesPerChunk = fileSize;
            }
            var offset = 0;

            var onLoadHandler = function(event) {
                if (event.target.error) {
                    errorCallback(event.target.error);
                    return;
                } else {
                    offset += event.total;
                    // process current chunk
                    chunkCallback(event.target.result, Math.round(offset / fileSize * 100));
                    if (offset < fileSize) {
                        // need to read another chunk
                        readChunk();
                    } else {
                        // finished reading all chunks
                        finishedCallback();
                        return;
                    }
                }
            };

            var readChunk = function() {
                var blob = file.slice(offset, bytesPerChunk + offset);
                var reader = new FileReader();
                reader.onload = onLoadHandler;
                if (binary) {
                    reader.readAsArrayBuffer(blob);
                } else {
                    reader.readAsText(blob);
                }
            };
            readChunk();
        },

        disable: function (tabNames, switchTo="about", messages={}) {
            tabNames.map(x => {
                $(`#${x}-tab`).addClass("disabled");
            });
            var submitMessage = "submit" in messages ? messages.submit : "Submission is currently only supported via MetaMask.";
            var readMessage = "read" in messages ? messages.read : "Please ensure your Web3 provider if functioning correctly and try again.";
            // add tooltips explaining why disabled
            if (tabNames.includes("submit")) {
                $("#submit-tab")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "auto")
                    .attr("data-trigger", "hover")
                    .attr("title", submitMessage)
                    .tooltip();
            }
            if (tabNames.includes("read")) {
                $("#read-tab")
                    .attr("data-toggle", "tooltip")
                    .attr("data-placement", "auto")
                    .attr("data-trigger", "hover")
                    .attr("title", readMessage)
                    .tooltip();
            }
            $(`#${switchTo}-tab`).tab("show");
            return;
        },

        ENSName: function (address) {
            return new Promise((resolve, reject) => {
                // try to reverse lookup a name for the provided address
                ProveIt.ens.reverse(address).name().then(claimedName => {
                    // get the address associated with the claimedName
                    return ProveIt.ens.resolver(claimedName).addr().then(claimedNameAddress => {
                        // only resolve if addresses match
                        if (claimedNameAddress == address.toLowerCase()) {
                            resolve(claimedName);
                        } else {
                            reject("Claimed name didn't point to original address.");
                        }
                    }).catch(resolverError => {
                        reject(`Error when trying to resolve ${claimedName}.`);
                    });
                }).catch(reverseError => {
                    reject(`Error when trying to reverse lookup ${address}.`);
                });
            });
        },

        autoPopulate: function () {
            function changeBadge(text, badge) {
                $("#usersBadge")
                .html(text)
                .removeClass("badge-primary badge-warning badge-error")
                .addClass(badge);
            }
            function userEntry(address, name, network) {
                var newline = name == "" ? "": `<br><small><a target="_blank" href="https://${network}etherscan.io/enslookup?q=${name}" class="nounderline">${name}</a></small>`;
                var out=`
                <div class="list-group-item d-flex justify-content-between align-items-center flex-nowrap">
                <div class="order-md-1 order-3">
                <a target="_blank" href="https://${network}etherscan.io/address/${address}" class="nounderline">${address}</a>
                ${newline}
                </div>
                <div class="order-md-2 order-2 mr-3"></div>
                <button class="order-md-3 order-1 btn btn-outline-primary nofocus copyable cursor-pointer" data-clipboard-text="${address}">Copy</a>
                </div>`;
                return out;
            }
            function updateUsers (addresses, names) {
                var entries = [];
                var network = {
                    "Mainnet": "",
                    "Rinkeby (proof-of-authority)": "rinkeby.",
                    "Ropsten (test)": "ropsten."}[ProveIt.web3Status.networkName];
                for (let i=0; i < addresses.length; i++) {
                    entries.push(userEntry(addresses[i], names[i], network));
                }
                // populate users
                $("#masterUserParent").html(entries.join(""));
                // initialize copyables
                ProveIt.initializeCopyables($("#masterUserParent"));
                // change badge
                changeBadge(addresses.length, "badge-primary");
                $("#registeredUsersAddresses").collapse("show");
            }

            changeBadge("Loading...", "badge-warning");
            ProveIt.Prover.registeredUsers.call(function (error, users) {
                if (error) {
                    changeBadge("Error", "badge-danger");
                    console.log(error);
                } else {
                    var usersChecksummed = users.map(x => web3.toChecksumAddress(x));
                    Promise.all(users.map(x => {
                        // if any address returns an error, simply return a blank
                        return ProveIt.ENSName(x).catch(ENSError => {
                            return "";
                        });
                    }))
                    .then(ENSNamesResolved => updateUsers(usersChecksummed, ENSNamesResolved))
                    .catch(error => {
                        changeBadge("Error", "badge-danger");
                        console.log(error);
                    });
                }
            });
        },
        /*
        populateEntries: function (event) {
            // variable identification
            var address, amount,
            var address = $("#userEntriesAddress").val();

            if (! web3.isAddress(address)) {
                event.preventDefault();
                event.stopPropagation();
                $("#userEntriesAddress").addClass('is-invalid');
                $("#userEntries").html("");
                return;
            } else {
                $("#userEntriesAddress").removeClass("is-invalid").addClass('is-valid');
            }

            function entryList (entry) {
                var out =`
                <div class="list-group-item d-flex justify-content-between">
                <alert class="my-auto alert" role="alert">
                ${entry}
                </alert>
                <button type="button" class="btn btn-outline-primary nofocus my-auto copyable cursor-pointer" data-clipboard-text="${entry}">Copy</button>
                </div>
                `;
                return out;
            }
            function errorEntries (text) {
                var out =`
                <div class="alert alert-danger noselect text-center" role="alert">
                ${text}
                </div>
                `;
                return out;
            }

            ProveIt.Prover.userEntries.call(address, function (error, entries) {
                if (error) {
                    $("#userEntries").html(noEntries("Error."));
                    console.log(error);
                    return;
                } else {
                    if (entries.length >= 1) {
                        var out = [];
                        for (let i=0; i < entries.length; i++) {
                            out.push(entryList(entries[i]));
                        }
                        $("#userEntries").html(out.join(""));
                        initializeCopyables($("#userEntries"));
                    } else {
                        $("#userEntries").html(errorEntries("No entries found."));
                    }
                }
            });
        },
        */
        entryInformation: function (event) {
            function stateChange(text, state) {
                var classes;
                switch (state) {
                    case "proven":
                        classes = "alert-success";
                        break;
                    case "info":
                        classes = "alert-info";
                        break;
                    case "error":
                        classes = "alert-danger noselect";
                        break;
                    case "default":
                        classes = "alert-dark noselect";
                        break;
                    case "warning":
                        classes = "alert-warning noselect";
                        break;
                }

                form.find("[role='alert']")
                    .removeClass("alert-info alert-dark alert-danger alert-success alert-warning noselect")
                    .addClass(classes)
                    .html(text);
            }

            var form = $(event.target).html() == "ProveIt" ? $("#readEntry") : $("#submitEntry");

            // form validation
            var address, amount;
            if (form.attr("id") == "readEntry") {
                address = form.find(".form-group:eq(0)").find(".form-control:eq(0)");
            } else {
                amount = form.find(".form-group:eq(1)").find(".form-control:eq(0)");
            }
            var entryType = form.find("[data-toggle='dropdown']").first().html();
            // get the tag containing the "entry" input
            if (entryType == "File") {
                entry = form.find(".custom-file-input");
            } else {
                if (form.attr("id") == "readEntry") {
                    entry = form.find(".form-group:eq(1)").find(".form-control:eq(0)");
                } else {
                    entry = form.find(".form-group:eq(0)").find(".form-control:eq(0)");
                }
            }

            // validate all relevant fields
            function validateEntries() {
                var allPassed = true;
                function passed(node, valid) {
                    node.removeClass("is-valid is-invalid");
                    if (valid) {
                        node.addClass("is-valid");
                    } else {
                        node.addClass("is-invalid");
                        allPassed = false;
                    }
                }
                // validate address
                if (typeof address !== 'undefined') {
                    if (web3.isAddress(address.val())) {
                        passed(address, true);
                    } else {
                        passed(address, false);
                    }
                }
                // validate amount
                if (typeof amount !== 'undefined') {
                    if ((!isNaN(+amount.val())) & amount.val() != "") {
                        passed(amount, true);
                    } else {
                        passed(amount, false);
                    }
                }

                // validate entry
                switch (entryType) {
                    case "Entry Hash":
                        if (entry.val().substring(0, 2) == "0x" & entry.val().length == 66) {
                            passed(entry, true);
                        } else {
                            passed(entry, false);
                        }
                        break;
                    case "Text":
                        if (entry.val().length >= 1) {
                            passed(entry, true);
                        } else {
                            passed(entry, false);
                        }
                        break;
                    case "File":
                        if (entry[0].files.length == 1) {
                            passed(entry, true);
                        } else {
                            passed(entry, false);
                        }
                        break;
                }
                return allPassed;
            }
            // if at least one invalid entry
            if (! validateEntries()) {
                stateChange("&nbsp;", "default");
                return;
            }

            stateChange("Loading...", "default");

            var hash;
            switch (entryType) {
                case "Entry Hash":
                    hash = entry.val();
                    parseResult();
                    break;
                case "Text":
                    hash = ProveIt.hashText(entry.val());
                    parseResult();
                    break;
                case "File":
                    ProveIt.hashFile(entry[0].files[0]).then(hashResolved => {
                        $("#fileHashModalButton")
                            .removeClass("btn-outline-success btn-outline-danger")
                            .addClass("btn-outline-success")
                            .html("Success");
                        hash = hashResolved;
                        parseResult();
                    }).catch(error => {
                        $("#fileHashModal").modal('hide');
                        stateChange(error, "error");
                        return;
                    });
                    break;
            }

            function parseResult () {
                if (form.attr("id") == "readEntry") {
                    ProveIt.Prover.entryInformation.call(address.val(), hash, function (error, entryInfo) {
                        if (error) {
                            stateChange("Error.", "warning");
                            console.log(error);
                            return;
                        } else {
                            if (entryInfo[0]) {
                                var date = new Date(entryInfo[1].toNumber() * 1000);
                                var displayString = [];
                                displayString.push("Submitted on");
                                displayString.push(date.toLocaleString("en-US", {
                                    timeZone: "UTC",
                                    hour12: false,
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'}));
                                displayString.push("at");
                                displayString.push(date.toLocaleString("en-US", {
                                    timeZone: "UTC",
                                    hour12: false,
                                    hour: "numeric",
                                    minute: "numeric",
                                    timeZoneName: "short"}));
                                displayString.push("against " + web3.fromWei(entryInfo[2].toNumber(), "ether") + " ETH.");
                                stateChange(displayString.join(" "), "proven");
                            } else {
                                stateChange("Unproven.", "error");
                            }
                        }
                    });
                } else {
                    // check if matamask acct needs to be unlocked
                    if (typeof ProveIt.web3Status.account == "undefined") {
                        stateChange("Please unlock your MetaMask account.", "warning");
                    }
                    var data = [];
                    // add function signature
                    data.push(web3.sha3("addEntry(bytes32)").substring(0, 10));
                    // add argument (no need to pad, it's already 32 bytes)
                    data.push(hash.substring(2));
                    data = data.join("");
                    console.log();
                    web3.eth.sendTransaction({
                        from: ProveIt.web3Status.account,
                        to: ProveIt.Prover.address,
                        value: web3.toWei(+amount.val(), "ether"),
                        gas: 400000,
                        gasPrice: web3.toWei(5, "gwei"),
                        data: data,
                    }, function (error, txHash) {
                        if (error) {
                            console.log(error);
                            stateChange("Error.", "error");
                        } else {
                            var network = {
                                "Mainnet": "",
                                "Rinkeby (proof-of-authority)": "rinkeby.",
                                "Ropsten (test)": "ropsten."}[ProveIt.web3Status.networkName];
                            var txLink = `<a target="_blank" href="https://${network}etherscan.io/tx/${txHash}" class="nounderline">${txHash}</a>`;
                            stateChange(`Transaction Hash: ${txLink}`, "info");
                            /*
                            var isMined = new Promise((resolve, reject) => {
                                function mined() {
                                    if (web3.eth.getTransaction(txHash, function(error, txInfo) {
                                        return (error | txInfo.blockHash == null) ? false : true;
                                    });
                                }
                                // add event listener for modal close, which cancels the promise
                                $("#fileHashModal").one('hide.bs.modal', function (event) {
                                    reject("File upload cancelled.");
                                });
                                $("#fileHashModal").modal('show');
                                // start parsing the file
                                ProveIt.parseFile(file, {
                                    "errorCallback": errorCallback,
                                    "chunkCallback": chunkCallback,
                                    "finishedCallback": finishedCallback
                                });
                            });
                            */
                        }
                    });
                }
            }
        },

        hashText: function (message) {
            var hash = browserifyModules.keccak('keccak256').update(message).digest("hex");
            return "0x" + hash;
        },

        hashFile: function (file) {
            var hashObject = browserifyModules.keccak('keccak256');

            var errorCallback = function(error) {
                throw new Error(`File upload error.`);
            };
            var chunkCallback = function(chunk, percentDone) {
                hashObject.update(browserifyModules.Buffer.from(chunk));
                $("#progressBar").attr("style", "width: " + percentDone.toString() + "%");
            };
            var finishedCallback = function() {
                var event = new CustomEvent('hashed', {detail: "0x" + hashObject.digest("hex")});
                $("#fileHashModal")[0].dispatchEvent(event);
            };
            // reset the modal
            $("#progressBar").style = "width: 0%";
            $("#fileHashModalButton")
                .removeClass("btn-success")
                .addClass("btn-danger")
                .html("Cancel");

            return new Promise((resolve, reject) => {
                // add hashed listener to modal
                $("#fileHashModal").one("hashed", function (event) {
                    resolve(event.detail);
                });
                // add event listener for modal close, which cancels the promise
                $("#fileHashModal").one('hide.bs.modal', function (event) {
                    reject("File upload cancelled.");
                });
                $("#fileHashModal").modal('show');
                // start parsing the file
                ProveIt.parseFile(file, {
                    "errorCallback": errorCallback,
                    "chunkCallback": chunkCallback,
                    "finishedCallback": finishedCallback
                });
            });
        },

        inputToggle: function (event) {
            var selection = $(this).html();
            var inputHTML = {
                "Entry Hash": `<input type="text" class="form-control" placeholder="0x...">`,
                Text: `<input type="text" class="form-control" placeholder="Your Message...">`,
                File: `<label class="custom-file col-lg" id="entryField">
                  <input type="file" class="custom-file-input">
                  <span class="custom-file-control rounded-right">Choose File...</span>
                </label>`
            }[selection];
            var form = $(event.target).closest("form").attr("id") == "readEntry" ? $("#readEntry") : $("#submitEntry");
            // update the addon text
            form.find("[data-toggle='dropdown']").html(selection);
            // update the html
            form.find(".input-group-btn").next().replaceWith(inputHTML);
            if (selection == "File") {
                form.find(".input-group-btn").next()
                    .children("input").on('change', ProveIt.fileUploadListener);
            }
        },

        fileUploadListener: function (event) {
            var fileName = $(this).val().split("\\").pop();
            $(this).next('.custom-file-control').html(fileName);
        },

        clipboardSuccess: function (event) {
            ProveIt.changeTooltipTitle(event.trigger, "Copied!");
            $(event.trigger).one('shown.bs.tooltip', function () {
                $(this).tooltip("disable");
            });
            $(event.trigger).tooltip("enable").tooltip("show");
        },

        clipboardError: function (event) {
            ProveIt.changeTooltipTitle(event.trigger, "An error occured, please copy manually.");
            $(event.trigger).one('shown.bs.tooltip', function () {
                $(this).tooltip("disable");
            });
            $(event.trigger).tooltip("enable").tooltip("show");
        },

        initializeCopyables: function (element) {
            element
                .find('.copyable')
                .attr("data-toggle", "tooltip")
                .attr("data-trigger", "hover")
                .attr("data-placement", "auto")
                .tooltip({delay: {hide: 400}});
        },

        initializeWeb3: function() {
            if (typeof web3 !== 'undefined') {
                window.web3 = new Web3(web3.currentProvider);
                if (!web3.currentProvider.isMetaMask) {
                    ProveIt.disable(["submit"], "read");
                }
            } else {
                window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/zKmHyEn4VwJ4in3cptiL"));
                ProveIt.web3Status.defaultedToInfura = true;
                ProveIt.disable(["submit"], "read");
            }
            ProveIt.web3CheckOnce();
            ProveIt.web3CheckMany();
        },

        initializeContracts: function (network) {
            var contracts = {
                Hash: {
                    abi: [{"constant":true,"inputs":[{"name":"dataString","type":"string"}],"name":"hashString","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"dataBytes","type":"bytes"}],"name":"hashBytes","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
                },
                Prover: {
                    abi: [{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"entryInformation","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"staked","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"registeredUsers","outputs":[{"name":"unique_addresses","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"entries","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
                }
            };
            switch (network) {
                case "Mainnet":
                    contracts.Hash.address = "0xca260ffffb0270ee07ec6892fa9d44f040454e4d";
                    contracts.Prover.address = "0x117ca39dffc4da6fb3af6145dfff246830637fe2";
                    break;
                case "Rinkeby (proof-of-authority)":
                    contracts.Hash.address = "0x125bbe680d2c6665151ad8c9c89727a64683fdcb";
                    contracts.Prover.address = "0x286e1143ab350d0238be4494da6dab9ca3662517";
                    break;
                case "Ropsten (test)":
                    contracts.Hash.address = "0x125bbe680d2c6665151ad8c9c89727a64683fdcb";
                    contracts.Prover.address = "0x286e1143ab350d0238be4494da6dab9ca3662517";
                    break;
            }
            Object.keys(contracts).map(key => {
                ProveIt[key] = web3.eth.contract(contracts[key].abi).at(contracts[key].address);
            });
        },

        updateWeb3Tooltip: function () {
            function changeButton(status, tooltipText, innerText="Web3") {
                ProveIt.changeTooltipTitle($("#web3Button"), tooltipText);
                var possibleStates = "btn-outline-success btn-outline-danger btn-outline-secondary btn-outline-warning";
                switch (status) {
                    case "success":
                        $("#web3Button")
                            .removeClass(possibleStates)
                            .addClass("btn-outline-success")
                            .html(innerText);
                    break;
                    case "warning":
                        $("#web3Button")
                            .removeClass(possibleStates)
                            .addClass("btn-outline-warning")
                            .html(innerText);
                    break;
                    case "danger":
                        $("#web3Button")
                        .removeClass(possibleStates)
                            .addClass("btn-outline-danger")
                            .html(innerText);
                        break;
                }
            }
            if (ProveIt.web3Status.defaultedToInfura) {
                changeButton("warning", `No Web3 provider detected, falling back to Infura. Consider installing MetaMask or using a ĐApp-friendly browser.`, ProveIt.web3Status.networkName);
            } else {
                changeButton("success", `Web3 provider: ${ProveIt.web3Status.providerName}`, ProveIt.web3Status.networkName);
            }
        },

        web3CheckMany: function () {
            // set default acct (metamask only for now)
            if (web3.currentProvider.isMetaMask) {
                if (ProveIt.web3Status.account !== web3.eth.accounts[0]) {
                    ProveIt.web3Status.account = web3.eth.accounts[0];
                }
            }
            // schedule repeat
            setTimeout(ProveIt.web3CheckMany, 1000);
        },

        launchErrorModal: function (title, message) {
            var modal = $("#errorModal");
            modal.find(".modal-title").html(title);
            modal.find(".modal-body").html(message);
            modal.modal("show");
        },

        web3CheckOnce: function () {
            // set provider name
            ProveIt.web3Status.providerName = web3.currentProvider.constructor.name;
            // set network name
            web3.version.getNetwork((error, networkId) => {
                var networkName;
                if (error) {
                    ProveIt.launchErrorModal(
                        "Web3 Error",
                        `Could not detect network, please ensure that your Web3 provider <strong>${ProveIt.web3Status.providerName}</strong> is functioning correctly.`);
                    ProveIt.disable(["read", "submit"]);
                    return;
                }
                else {
                    switch (networkId) {
                        case "0":
                            networkName = 'Olympic (pre-release)';
                            break;
                        case "1":
                            networkName = 'Mainnet';
                            break;
                        case "2":
                            networkName = 'Morden (deprecated)';
                            break;
                        case "3":
                            networkName = 'Ropsten (test)';
                            break;
                        case "4":
                            networkName = 'Rinkeby (proof-of-authority)';
                            break;
                        case "42":
                            networkName = 'Kovan (proof-of-authority)';
                            break;
                        default:
                            networkName = 'unknown';
                    }
                }
                ProveIt.web3Status.networkName = networkName;
                if (! ProveIt.web3Status.supportedNetworks.includes(ProveIt.web3Status.networkName)) {
                    ProveIt.launchErrorModal(
                        "Unsupported Network",
                        `Your Web3 provider <strong>${ProveIt.web3Status.providerName}</strong> is currently on the <strong>${ProveIt.web3Status.networkName}</strong> network. ProveIt is not supported on this network, please switch to one of: [${ProveIt.web3Status.supportedNetworks.join(", ")}].`);
                    ProveIt.disable(["read", "submit"]);
                    return;
                }
                // now that we know web3 is initialized and on a proper network...
                ProveIt.ens = new browserifyModules.ENS(web3);
                ProveIt.initializeContracts(ProveIt.web3Status.networkName);
                ProveIt.updateWeb3Tooltip();
                ProveIt.autoPopulate();
            });
        }
    };
})(jQuery, browserifyModules);

// DOM-dependent code
$(function() {
    ProveIt.DOMReady = true;
    if (!supportsES6()) {
        alert("Please visit from a modern browser that supports ES6.");
        ProveIt.disable(["read", "submit"]);
    }
    // clipboard functionality
    var clipboard = new Clipboard('.copyable', {
        text: function(trigger) {
            return $(trigger).attr("data-clipboard-text");
        }
    });
    clipboard.on('success', ProveIt.clipboardSuccess);
    clipboard.on('error', ProveIt.clipboardError);

    // add event listeners
    $("#readEntry, #submitEntry").find(".nofocus").on("click", ProveIt.entryInformation);
    $("#readEntry, #submitEntry").find(".dropdown-menu button").on('click', ProveIt.inputToggle);
    //$("#userEntriesSubmit").on("click", ProveIt.populateEntries);

    // initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    if (ProveIt.web3Status.available & !ProveIt.autoPopulated) {
        ProveIt.autoPopulated = true;

    }
});

// window-dependent code
$(window).on("load", function () {
    function DOMReadyWrapper () {
        if (ProveIt.DOMReady) {
            ProveIt.initializeWeb3();
        } else {
            setTimeout(DOMReadyWrapper, 10);
        }
    }
    DOMReadyWrapper();
});
