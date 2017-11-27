/*jshint esversion: 6 */
var helperNamespace = window.helperNamespace || {};
// add shared stuff to namespace
helperNamespace.web3 = false;
helperNamespace.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
helperNamespace.hexFormat = function (string) {
    return "0x" + string;
};
helperNamespace.parseFile = function (file, opts) {
    // credit to alediaferia on Github for most of this code!
    // - errorCallback:
    // - chunkCallback:
    // - finishedCallback:
    // - binary:
    // - bytesPerChunk:
    // - singleChunk:
    var defaulter = function(name, _default) {return name in options ? options[name] : _default;};
    var options = typeof opts === 'undefined' ? {} : opts;
    var errorCallback = defaulter('errorCallback', function() {});
    var chunkCallback = defaulter('chunkCallback', function() {});
    var finishedCallback = defaulter('finishedCallback', function() {});
    var binary = defaulter('binary', true);
    var bytesPerChunk = defaulter('binary', 2^8 * 2^10);
    var singleChunk = defaulter('binary', false);

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
    // callback functions

    // things to do when a list-group-item child of masterUserParent is clicked:
    // 1) add content
    // 2) (remove these from all siblings also) make it active

    function autoPopulate() {
        function userEntry(address, name) {
            var out=`
            <div class="list-group-item d-flex justify-content-between cursor-pointer z-up children-noprop" role="tab">
                <alert class="alert alert-light h-100 my-auto cursor-auto">
                    <a target="_blank" href="https://etherscan.io/address/${address}" class="my-auto nounderline">${address}</a>
                    <br><small><a target="_blank" href="https://etherscan.io/enslookup?q=${name}" class="my-auto nounderline">${name}</a></small>
                </alert>
                <button type="button" class="btn btn-light nofocus my-auto copyable cursor-pointer" data-clipboard-text="${address}">Copy</button>
            </div>
            <div role="tablist">
                <div class="collapse" role="tabpanel">
                </div>
            </div>`;
            return out;
        }

        helperNamespace.Prover.registeredUsers.call(function(error, users) {
            if (error) {
                console.log(error);
            } else {
                //var ENSNames = [""];
                // update badge
                $("#usersNumber").html(users.length);
                // populate users
                let entries = [];
                for (let i=0; i < users.length; i++) {
                    //entries.push(userEntry(users[i], ENSNames[i]));
                    entries.push(userEntry(users[i], ""));
                }
                $("#masterUserParent").html(entries.join(""));
                // initialize tooltips
                initializeCopyables();
                // set the noprop click listener
                $('.children-noprop').on("click", noPropListener);
                // fix the border on the bottom-most entry
                $(".list-group-item[role='tab']").last().addClass("bottom-border");
            }
        });
    }
    // export so that we can potentially autopopulate on window load
    helperNamespace.autoPopulate = autoPopulate;

    function noPropListener(event) {
        // if the click was on a child element, pass
        if ($(this).prop("tagName") !== $(event.target).prop("tagName")) {
        } else {
            collapser = $(this).next().children();
            // click on main element, check if populated and toggle
            if ($(this).next().children().children().length == 0) {
                populateEntries(collapser);
            }
            $("#masterUserParent").find(".collapse[role='tabpanel']").removeClass("active");
            $("#masterUserParent").find(".collapse[role='tabpanel']").collapse("hide");
            //$(this).addClass("active");
            collapser.collapse("toggle");
        }
    }

    function populateEntries(addressNode) {
        function entryList(entry) {
            var out =`
            <div class="list-group-item d-flex justify-content-between border-bottom-0 rounded-0">
                <span class="h-100 my-auto">
                    ${entry}
                </span>
                <button type="button" class="btn btn-light nofocus my-auto copyable cursor-pointer" data-clipboard-text="${entry}">Copy</button>
            </div>`;
            return out;
        }
        var address = $(addressNode).parents().first().prev().find("button").attr("data-clipboard-text");
        helperNamespace.Prover.userEntries.call(address, function (error, entries) {
            $('#entriesList').html("");
            if (error) {
               console.log(error);
            } else {
                var out = [];
                // beginning
                out.push(`
                <div class="row">
                    <div class="col-sm-1"></div>
                    <ul class="col-sm-11 list-group">`);
                for (let i = 0; i < entries.length; i++) {
                    out.push(entryList(entries[i]));
                }
                // end
                out.push(`</ul></div>`);
                addressNode.html(out.join(""));
                $(".list-group-item").last().addClass("bottom-border");
                // initialize tooltips
                initializeCopyables();
                //entries.length == 1
            }
        });
    }

    /* jshint ignore:start */
    async function entryInformation() {
        /* jshint ignore:end */
        stateChange("default", "&nbsp;");
        function stateChange(state, text) {
            var element = $("#entryInformation");
            element.removeClass("alert-dark alert-danger alert-success noselect");
            if (state == "proven") {
                element.addClass('alert-success copyable');
                initializeCopyables();
            } else if (state == "unproven") {
                element.addClass('alert-danger noselect');
            } else if (state == "default") {
                element.addClass('alert-dark noselect');
            }
            element.html(text);
        }
        var address = $("#entryInformationAddress").val();
        var entryType = $("#entryType").html();
        var hash;
        if (entryType == "Entry Hash") {
            hash = $(".entryText").val();
        } else if (entryType == "Text") {
            hash = hashMessage($(".entryText").val());
        } else if (entryType == "File") {
            var fileList = $(".custom-file-input")[0].files;
            if (fileList.length !== 1) {
                console.log('Please select 1 and only 1 file.');
                return;
            }
            var file = fileList[0];
            $("#progressBar").style = "width: 0%";
            $("#fileHashModal").modal('show');
            /* jshint ignore:start */
            hash = await hashFile(file);
            /* jshint ignore:end */
        }

        helperNamespace.Prover.entryInformation.call(address, hash, function (error, entryInfo) {
            if (error) {
                console.log(error);
            } else {
                if (entryInfo[0]) {
                    var date = new Date(entryInfo[1].toNumber() * 1000);
                    var displayString = [];
                    displayString.push("Submitted on");
                    displayString.push(date.toLocaleString("en-US", {year: 'numeric', month: 'long', day: 'numeric'}));
                    displayString.push("at");
                    displayString.push(date.toLocaleString("en-US", {hour: "numeric", minute: "numeric"}));
                    displayString.push("against " + web3.fromWei(entryInfo[2].toNumber(), "ether") + " ETH.");
                    stateChange("proven", displayString.join(" "));
                } else {
                    stateChange("unproven", "Unproven.");
                }
            }
        });
        /* jshint ignore:start */
    }
    /* jshint ignore:end */

    function hashMessage(message) {
        var hashObject = keccak256.create();
        hashObject.update(message);
        return helperNamespace.hexFormat(hashObject.hex());
    }

    /* jshint ignore:start */
    async function hashFile(file) {
        /* jshint ignore:end */
        var hashObject = keccak256.create();
        var success = false;

        var errorCallback = function(error) {
            console.log(error);
            $("#fileHashModal").modal('hide');
        };
        var chunkCallback = function(chunk, percentDone) {
            hashObject.update(chunk);
            $("#progressBar").attr("style", "width: " + percentDone.toString() + "%");
        };
        var finishedCallback = function() {
            success = true;
            $("#fileHashModal").modal('hide');
        };
        /* jshint ignore:start */
        helperNamespace.parseFile(file, {
            "errorCallback": errorCallback,
            "chunkCallback": chunkCallback,
            "finishedCallback": finishedCallback
        });
        /* jshint ignore:end */
        // await until the modal closes
        while (($("#fileHashModal").data('bs.modal') || {})._isShown) {
            /* jshint ignore:start */
            await helperNamespace.sleep(100);
            /* jshint ignore:end */
        }
        if (success) {
            return helperNamespace.hexFormat(hashObject.hex());
        }
        /* jshint ignore:start */
    }
    /* jshint ignore:end */

    // add event listeners
    $("#entryInformationSubmit")[0].addEventListener("click", entryInformation);

    // add clipboard functionality
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


    function clipboardSuccess(event) {
        changeTooltipTitle(event.trigger, "Copied!");
        $(event.trigger).one('shown.bs.tooltip', function () {
            $(this).tooltip("disable");
        });
        $(event.trigger).tooltip("enable").tooltip("show");
    }
    function clipboardError(event) {
        changeTooltipTitle(event.trigger, "An error occured, please copy manually.");
        $(event.trigger).one('shown.bs.tooltip', function () {
            $(this).tooltip("disable");
        });
        $(event.trigger).tooltip("enable").tooltip("show");
    }
    clipboard.on('success', clipboardSuccess);
    clipboard.on('error', clipboardError);

    function initializeCopyables() {
        $('.copyable').attr("data-toggle", "tooltip")
        .attr("data-trigger", "hover")
        .attr("data-placement", "right");
    }

    $("#entryToggle button").on('click', function (event) {
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
            $(".entryText").show();
            $(".entryText").attr("placeholder", placeholders[selection]);
            $(".entryText").val("");
        } else {
            $(".entryFile").show();
            $(".entryFile").val("");
        }
    });

    function fileUploadListener () {
        var fileName = $(this).val().split("\\").pop();
        $(this).next('.custom-file-control').addClass("selected").html(fileName);
    }

    // hide and add event listener to file uploader
    $(".entryFile").hide();
    $(".entryFile").children("input").on('change', fileUploadListener);

    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

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
        $("#web3Button").attr("title", "Web3 Provider detected: " + web3.currentProvider.constructor.name);
        $("#web3Button").removeClass("btn-outline-danger");
        $("#web3Button").addClass("btn-outline-success");
    }
    initializeWeb3();

    // contract initialization after web3
    function initializeContracts() {
        var addresses = {
            Hash: "0xca260ffffb0270ee07ec6892fa9d44f040454e4d",
            Prover: "0x117ca39dffc4da6fb3af6145dfff246830637fe2"
        };
        var abis = {
            Hash: [{"constant":true,"inputs":[{"name":"dataString","type":"string"}],"name":"hashString","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"dataBytes","type":"bytes"}],"name":"hashBytes","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}],
            Prover: [{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"entryInformation","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"staked","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"registeredUsers","outputs":[{"name":"unique_addresses","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"entries","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
        };
        helperNamespace.Hash = web3.eth.contract(abis.Hash).at(addresses.Hash);
        helperNamespace.Prover = web3.eth.contract(abis.Prover).at(addresses.Prover);
    }
    initializeContracts();

    // this is also tried at the end of document ready
    if (!helperNamespace.autoPopulated & "autoPopulate" in helperNamespace) {
        helperNamespace.autoPopulate();
        helperNamespace.autoPopulated = true;
    }
});
