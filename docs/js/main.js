/*jshint esversion: 6 */
var helperNamespace = window.helperNamespace || {};
// add shared stuff to namespace
helperNamespace.web3 = false;
helperNamespace.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
helperNamespace.parseFile = function (file, opts) {
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
};

// DOM-dependent stuff
$(function() {
    function ENSName (address) {
        // is there a security concern here? can anyone claim a reverse?
        resolver = helperNamespace.ens.reverse(address);
        return resolver.name();
    }

    function autoPopulate() {
        function changeBadge(text, badge) {
            $("#usersBadge")
                .html(text)
                .removeClass("badge-primary badge-warning badge-error")
                .addClass(badge);
        }
        function userEntry(address, name) {
            var out=`
            <div class="list-group-item d-flex justify-content-between" role="tab">
                <alert class="alert alert-light h-100 my-auto cursor-auto">
                    <a target="_blank" href="https://etherscan.io/address/${address}" class="my-auto nounderline">${address}</a>
                    <br><small><a target="_blank" href="https://etherscan.io/enslookup?q=${name}" class="my-auto nounderline">${name}</a></small>
                </alert>
                <button type="button" class="btn btn-primary nofocus my-auto copyable cursor-pointer" data-clipboard-text="${address}">Copy</button>
            </div>`;
            return out;
        }
        function updateUsers (addresses, names) {
            var entries = [];
            for (let i=0; i < addresses.length; i++) {
                entries.push(userEntry(addresses[i], names[i]));
            }
            // populate users
            $("#masterUserParent").html(entries.join(""));
            // initialize copyables
            initializeCopyables($("#masterUserParent"));
            // change badge
            changeBadge(addresses.length, "badge-primary");
            $("#registeredUsersAddresses").collapse("show");
        }

        changeBadge("Loading...", "badge-warning");
        helperNamespace.Prover.registeredUsers.call(function (error, users) {
            if (error) {
                changeBadge("Error", "badge-danger");
                console.log(error);
            } else {
                var usersChecksummed = users.map(x => web3.toChecksumAddress(x));
                Promise.all(users.map(x => {
                    // if any address returns an error, simply return a blank
                    return ENSName(x).catch(ENSError => {
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
    }
    // export so that we can autopopulate ASAP
    helperNamespace.autoPopulate = autoPopulate;

    function populateEntries (event) {
        // form validation
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
              <button type="button" class="btn btn-primary nofocus my-auto copyable cursor-pointer" data-clipboard-text="${entry}">Copy</button>
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

        helperNamespace.Prover.userEntries.call(address, function (error, entries) {
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
    }

    function entryInformation() {
        function stateChange(text, state) {
            var classes;
            switch (state) {
                case "proven":
                    classes = "alert-success";
                    break;
                case "error":
                    classes = "alert-danger noselect";
                    break;
                case "default":
                    classes = "alert-dark noselect";
                    break;
            }

            $("#entryInformation")
                .removeClass("alert-dark alert-danger alert-success noselect")
                .addClass(classes)
                .html(text);
        }

        // form validation
        var address = $("#entryInformationAddress").val();
        var entryType = $("#entryType").html();

        function validHash() {
            // TODO implement validity checks here.
            // hash.substring(0, 2) == "0x" && hash.length == 34;
            return true;
        }

        if (! (web3.isAddress(address) & validHash())) {
            event.preventDefault();
            event.stopPropagation();
            if (! web3.isAddress(address)) {
                $("#entryInformationAddress").addClass('is-invalid');
            }
            stateChange("&nbsp;", "default");
            return;
        } else {
            $("#entryInformationAddress").removeClass("is-invalid").addClass('is-valid');
        }

        stateChange("Loading...", "default");

        var hash;
        switch (entryType) {
            case "Entry Hash":
                hash = $(".entryText").val();
                parseResult();
                break;
            case "Text":
                hash = hashText($(".entryText").val());
                parseResult();
                break;
            case "File":
                var fileList = $(".custom-file-input")[0].files;
                if (fileList.length !== 1) {
                    stateChange("Please select 1 and only 1 file.", "error");
                    return;
                }
                var file = fileList[0];
                hashFile(file).then(hashResolved => {
                    $("#fileHashModalButton")
                        .removeClass("btn-danger")
                        .addClass("btn-success")
                        .html("Close");
                    hash = hashResolved;
                    console.log(hash);
                    parseResult();
                }).catch(error => {
                    $("#fileHashModal").modal('hide');
                    stateChange(error, "error");
                    return;
                });
                break;
        }

        function parseResult () {
            helperNamespace.Prover.entryInformation.call(address, hash, function (error, entryInfo) {
                if (error) {
                    stateChange("Error.", "error");
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
        }
    }

    function hashText(message) {
        var hash = browserifyModules.keccak('keccak256').update(message).digest("hex");
        return "0x" + hash;
    }

    function hashFile(file) {
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
            helperNamespace.parseFile(file, {
                "errorCallback": errorCallback,
                "chunkCallback": chunkCallback,
                "finishedCallback": finishedCallback
            });
        });
    }

    function inputToggle (event) {
        $(this).addClass('active').siblings().removeClass('active');
        var placeholders = {
            "Entry Hash": "0x...",
            "Text": "Your message...",
        };
        var selection = $(this).html();
        // update the addon text
        $("#entryType").html(selection);
        // hide both
        $(".entryFile").hide();
        $(".entryText").hide();
        // unhide the right one
        if (selection != "File") {
            $(".entryText")
                .show()
                .attr("placeholder", placeholders[selection])
                .val("");
        } else {
            $(".entryFile")
                .show()
                .val("");
        }
    }

    function fileUploadListener (event) {
        var fileName = $(this).val().split("\\").pop();
        $(this).next('.custom-file-control').addClass("selected").html(fileName);
    }


    // clipboard functionality
    var clipboard = new Clipboard('.copyable', {
        text: function(trigger) {
            return $(trigger).attr("data-clipboard-text");
        }
    });
    function changeTooltipTitle(tooltip, text) {
        var originalTitle = $(tooltip).attr("data-original-title");
        if (typeof originalTitle !== typeof undefined && originalTitle !== false) {
            $(tooltip).tooltip("hide")
            .attr('data-original-title', text);
        } else {
            $(tooltip).attr('title', text);
        }
    }
    function clipboardSuccess (event) {
        changeTooltipTitle(event.trigger, "Copied!");
        $(event.trigger).one('shown.bs.tooltip', function () {
            $(this).tooltip("disable");
        });
        $(event.trigger).tooltip("enable").tooltip("show");
    }
    function clipboardError (event) {
        changeTooltipTitle(event.trigger, "An error occured, please copy manually.");
        $(event.trigger).one('shown.bs.tooltip', function () {
            $(this).tooltip("disable");
        });
        $(event.trigger).tooltip("enable").tooltip("show");
    }
    clipboard.on('success', clipboardSuccess);
    clipboard.on('error', clipboardError);
    function initializeCopyables (element) {
        element
            .find('.copyable')
            .attr("data-toggle", "tooltip")
            .attr("data-trigger", "hover")
            .attr("data-placement", "right")
            .tooltip({delay: {hide: 400}});
    }

    // add event listeners
    $("#entryInformationSubmit").on("click", entryInformation);
    $("#userEntriesSubmit").on("click", populateEntries);
    $("#entryToggle button").on('click', inputToggle);

    // hide and add event listener to file uploader
    $(".entryFile").hide();
    $(".entryFile").children("input").on('change', fileUploadListener);

    // initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // this is also tried on window load
    if (!helperNamespace.autoPopulated & helperNamespace.web3) {
        autoPopulate();
        helperNamespace.autoPopulated = true;
    }
});


$(window).on("load", function () {
    // web3 initialization
    function initializeWeb3() {
        if (typeof web3 !== 'undefined') {
            window.web3 = new Web3(web3.currentProvider);
        } else {
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/zKmHyEn4VwJ4in3cptiL"));
        }
        helperNamespace.web3 = true;
        helperNamespace.ens = new browserifyModules.ENS(web3);
        $("#web3Button")
            .attr("title", "Web3 Provider detected: " + web3.currentProvider.constructor.name)
            .removeClass("btn-outline-danger")
            .addClass("btn-outline-success");
    }
    initializeWeb3();

    // contract initialization after web3
    function initializeContracts() {
        var contracts = {
            Hash: {
                address: "0xca260ffffb0270ee07ec6892fa9d44f040454e4d",
                abi: [{"constant":true,"inputs":[{"name":"dataString","type":"string"}],"name":"hashString","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"dataBytes","type":"bytes"}],"name":"hashBytes","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
            },
            Prover: {
                address: "0x117ca39dffc4da6fb3af6145dfff246830637fe2",
                abi: [{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"entryInformation","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"staked","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"registeredUsers","outputs":[{"name":"unique_addresses","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"entries","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
            }
        };
        Object.keys(contracts).map(key => {
            helperNamespace[key] = web3.eth.contract(contracts[key].abi).at(contracts[key].address);
        });
    }
    initializeContracts();

    // this is also tried at the end of document ready
    if (!helperNamespace.autoPopulated & "autoPopulate" in helperNamespace) {
        helperNamespace.autoPopulate();
        helperNamespace.autoPopulated = true;
    }
});
