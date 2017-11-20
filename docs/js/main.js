"use strict";
// namespace for non-DOM dependent functions
var helper = {
    web3: false,
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    hexFormat: function (string) {
        return "0x" + string
    },
    parseFile: function (file, options) {
        // credit to alediaferia on Github for most of this code!
        // Valid options are:
        // - errorCallback:
        // an optional function that accepts an object of type FileReader.error
        // - chunkCallback:
        // a function that accepts the read chunk as its first argument.
        // the second argument is an in that represents the fraction of the file
        // that has cumulatively been loaded. if binary option is set to true,
        // this function will receive an instance of ArrayBuffer, otherwise a String
        // - finishedCallback:
        // an optional function invoked as soon as the whole file has been read successfully
        // - binary:
        // If true chunks will be read through FileReader.readAsArrayBuffer
        // otherwise as FileReader.readAsText. Default is true
        // - bytesPerChunk:
        // The chunk size to be used, in bytes. Default is .25M
        // - singleChunk:
        // Whether to read in file as a single chunk. Default is false, overrides bytesPerChunk

        var defaulter = function(name, _default) {return name in options ? options[name] : _default};
        var options = typeof options === 'undefined' ? {} : options;
        var errorCallback = defaulter('errorCallback', function() {});
        var chunkCallback = defaulter('chunkCallback', function() {});
        var finishedCallback = defaulter('finishedCallback', function() {});
        var binary = defaulter('binary', true);
        var bytesPerChunk = defaulter('binary', 2**8 * 2**10);
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
        }

        var readChunk = function() {
            var blob = file.slice(offset, bytesPerChunk + offset);
            var reader = new FileReader();
            reader.onload = onLoadHandler;
            if (binary) {
                reader.readAsArrayBuffer(blob);
            } else {
                reader.readAsText(blob);
            }
        }
        readChunk();
    }
};

// DOM-dependent stuff
$(function() {
    // callback functions
    function registeredUsers() {
        var Prover = helper.contracts.Prover;

        Prover.registeredUsers.call(function (error, users) {
            if (error) {
                console.log(error);
            } else {
                var itemHTML = '<li class="list-group-item"></li>';
                for (let i=0; i < users.length; i++) {
                    $("#registeredUsersAddresses").append(itemHTML);
                }
                // add addresses
                $('#registeredUsersAddresses li').each(function (index) {
                    $(this).text(users[index]);
                });
                // update badge
                $("#registeredUsersNumber").html(users.length);
            }
        });
    }
    // export to helper so that we can autopopulate
    helper.registeredUsers = registeredUsers;

    function userEntries(event) {
        var Prover = helper.contracts.Prover;
        var address = $("#userEntriesAddress").val();

        Prover.userEntries.call(address, function (error, entries) {
            $('#entriesList').html("");
            if (error) {
                console.log(error);
                $("#userEntries").html("&nbsp;");
            } else {
                if (entries.length >= 1) {
                    $("#userEntries").html(entries.length + " " + (entries.length == 1 ? "entry" : "entries") + " found");
                    $("#userEntries").removeClass("noselect alert-dark alert-danger alert-success");
                    $("#userEntries").addClass("alert-success");
                    // add list items
                    var itemHTML = '<li class="list-group-item"></li>';
                    for (let i=0; i < entries.length; i++) {
                        $("#entriesList").append(itemHTML);
                    }
                    // add addresses
                    $('#entriesList li').each(function (index) {
                        $(this).text(entries[index]);
                    });
                } else {
                    $("#userEntries").removeClass("alert-dark alert-danger alert-success");
                    $("#userEntries").addClass("alert-danger");
                    $("#userEntries").html("No entries found");
                }
            }
        });
    }

    async function entryInformation() {
        stateChange("default", "&nbsp;");
        function stateChange(state, text) {
            var element = $("#entryInformation");
            element.removeClass("alert-dark alert-danger alert-success noselect");
            if (state == "proven") {
                element.addClass('alert-success');
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
            hash = await hashFile(file);
        }
        var Prover = helper.contracts.Prover;

        Prover.entryInformation.call(address, hash, function (error, entryInfo) {
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
                    displayString.push("against " + web3.fromWei(entryInfo[2].toNumber(), "ether") + " ETH");
                    stateChange("proven", displayString.join(" "));
                } else {
                    stateChange("unproven", "Unproven");
                }
            }
        });
    }

    function hashMessage(message) {
        var hashObject = keccak256.create();
        hashObject.update(message);
        return helper.hexFormat(hashObject.hex());
    }

    async function hashFile(file) {
        var hashObject = keccak256.create();
        var success = false;

        var errorCallback = function(error) {
            console.log(error);
            $("#fileHashModal").modal('hide');
        }
        var chunkCallback = function(chunk, percentDone) {
            hashObject.update(chunk);
            $("#progressBar").attr("style", "width: " + percentDone.toString() + "%");
        }
        var finishedCallback = function() {
            success = true;
            $("#fileHashModal").modal('hide');
        }
        helper.parseFile(file, {
            "errorCallback": errorCallback,
            "chunkCallback": chunkCallback,
            "finishedCallback": finishedCallback
        });
        // await until the modal closes
        while (($("#fileHashModal").data('bs.modal') || {})._isShown) {
            await helper.sleep(100);
        }
        if (success) {
            return helper.hexFormat(hashObject.hex());
        }
    }

    // add event listeners
    $("#userEntriesSubmit")[0].addEventListener("click", userEntries);
    $("#entryInformationSubmit")[0].addEventListener("click", entryInformation);

    // add clipboard functionality
    var clipboard = new Clipboard('.copyable');
    clipboard.on('success', function(event) {
        console.log(event);
    });
    clipboard.on('error', function(e) {
        console.log(event);
    });

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
        $(".entryFile").hide()
        $(".entryText").hide()
        // unhide the right one
        if (selection != "File") {
            $(".entryText").show();
            $(".entryText").attr("placeholder", placeholders[selection]);
            $(".entryText").val("");
        } else {
            $(".entryFile").show()
            $(".entryFile").val("");
        }
    });

    // this is also tried on window load
    if (helper.web3) {
        registeredUsers();
    }

    function fileUploadListener () {
        var fileName = $(this).val().split("\\").pop();
        $(this).next('.custom-file-control').addClass("selected").html(fileName);
    }
    // hide and add event listener to file uploader
    $(".entryFile").children("input").on('change', fileUploadListener);
    $(".entryFile").hide()

    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })

});

// web3 initialization
$(window).on("load", function () {
    function initializeWeb3() {
        if (typeof web3 !== 'undefined') {
            window.web3 = new Web3(web3.currentProvider);
            helper.web3 = true;
            $("#web3Button").attr("title", "Web3 Provider detected: " + web3.currentProvider.constructor.name);
            $("#web3Button").removeClass("btn-outline-danger");
            $("#web3Button").addClass("btn-outline-success");
        } else {
            console.log('No Web3 injection detected');
            //window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/key"));
            //helper.web3 = true;
        }
    }
    function getContracts() {
        var addresses = {
            Hash: "0xca260ffffb0270ee07ec6892fa9d44f040454e4d",
            Prover: "0x117ca39dffc4da6fb3af6145dfff246830637fe2"
        };
        var abis = {
            Hash: [{"constant":true,"inputs":[{"name":"dataString","type":"string"}],"name":"hashString","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":true,"inputs":[{"name":"dataBytes","type":"bytes"}],"name":"hashBytes","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"pure","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}],
            Prover: [{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"entryInformation","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"staked","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[],"name":"registeredUsers","outputs":[{"name":"unique_addresses","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"entries","type":"bytes32[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":false,"stateMutability":"nonpayable","type":"fallback"}]
        };
        return {
            Hash: web3.eth.contract(abis.Hash).at(addresses.Hash),
            Prover: web3.eth.contract(abis.Prover).at(addresses.Prover)
        }
    }
    initializeWeb3();
    helper.contracts = getContracts()
    // this is also tried at the end of document ready
    if ("registeredUsers" in helper) {
        helper.registeredUsers();
    }
})
