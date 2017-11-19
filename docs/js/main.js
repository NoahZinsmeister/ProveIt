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
    function htmlElements() {
        var out = {};
        var elements = [
            "progressBar",
            "fileHashModal",
            "registeredUsersNumber",
            "registeredUsersAddresses",
            "userEntriesAddress",
            "userEntriesSubmit",
            "userEntries",
            "entryType",
            "entryInformationAddress",
            "entryInformationEntry",
            "entryInformationSubmit",
            "entryInformation",
            "entryToggle"
        ];
        for (let i=0; i<elements.length; i++) {
            out[elements[i]] = document.getElementById(elements[i]);
        }
        return out
    }
    helper.elements = htmlElements();

    // callback functions
    function registeredUsers() {
        var Prover = helper.contracts.Prover;

        Prover.registeredUsers.call(function (error, users) {
            if (error) {
                console.log(error);
            } else {
                helper.elements["registeredUsersNumber"].innerHTML = users.length;
                helper.elements["registeredUsersAddresses"].innerHTML = users;
            }
        });
    }
    // export to helper so that we can autopopulate
    helper.registeredUsers = registeredUsers;

    function userEntries() {
        var Prover = helper.contracts.Prover;
        var address = helper.elements["userEntriesAddress"].value;

        Prover.userEntries.call(address, function (error, entries) {
            if (error) {
                console.log(error);
            } else {
                if (entries.length >= 1) {
                    helper.elements["userEntries"].innerHTML = entries;
                } else {
                    helper.elements["userEntries"].innerHTML = "No entries found.";
                }
            }
        });
    }

    async function entryInformation() {
        function stateChange(state, text) {
            var element = helper.elements["entryInformation"];
            var child = element.getElementsByTagName('p')[0];
            if (state == "proven") {
                $(element).removeClass("border-secondary bg-danger");
                $(element).addClass('bg-success text-white copyable');
                $(child).removeClass("text-muted noselect");
            } else if (state == "unproven") {
                $(element).removeClass('border-secondary bg-success');
                $(element).addClass('bg-danger text-white');
                $(child).removeClass("text-muted");
            } else if (state == "default") {
                $(element).removeClass('bg-danger bg-success text-white');
                $(element).addClass('border-secondary');
                $(child).addClass("text-muted noselect");
            }
            child.innerHTML = text;
        }
        var address = helper.elements["entryInformationAddress"].value;
        var entryType = helper.elements["entryType"].innerHTML;
        var hash;
        if (entryType == "Entry Hash") {
            hash = helper.elements["entryInformationEntry"].value;
        } else if (entryType == "Text") {
            hash = hashMessage(helper.elements["entryInformationEntry"].value);
        } else if (entryType == "File") {
            var fileList = helper.elements["entryInformationEntry"].files;
            if (fileList.length !== 1) {
                console.log('Please select 1 and only 1 file.');
                return;
            }
            var file = fileList[0];
            helper.elements["progressBar"].style = "width: 0%";
            $(helper.elements["fileHashModal"]).modal('show');
            hash = await hashFile(file);
        }
        var Prover = helper.contracts.Prover;

        Prover.entryInformation.call(address, hash, function (error, entryInfo) {
            if (error) {
                console.log(error);
                stateChange("default", "Result");
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
            $(helper.elements["fileHashModal"]).modal('hide');
        }
        var chunkCallback = function(chunk, percentDone) {
            hashObject.update(chunk);
            helper.elements["progressBar"].style = "width: " + percentDone.toString() + "%";
        }
        var finishedCallback = function() {
            success = true;
            $(helper.elements["fileHashModal"]).modal('hide');
        }
        helper.parseFile(file, {
            "errorCallback": errorCallback,
            "chunkCallback": chunkCallback,
            "finishedCallback": finishedCallback
        });
        while (($(helper.elements["fileHashModal"]).data('bs.modal') || {})._isShown) {
            await helper.sleep(500);
        }
        if (success) {
            return helper.hexFormat(hashObject.hex());
        }
    }

    // add event listeners
    helper.elements["userEntriesSubmit"].addEventListener("click", userEntries);
    helper.elements["entryInformationSubmit"].addEventListener("click", entryInformation);

    // add clipboard functionality
    var clipboard = new Clipboard('.copyable');
    clipboard.on('success', function(e) {
        console.log(e);
    });
    clipboard.on('error', function(e) {
        console.log(e);
    });

    $("#entryToggle button").on('click', function (event) {
        $(this).addClass('active').siblings().removeClass('active');
        var placeholders = {
            "Entry Hash": "0x...",
            "Text": "Your message...",
        };
        var selection = this.innerHTML;
        if (selection != "File") {
            helper.elements["entryInformationEntry"].type = "text";
            helper.elements["entryInformationEntry"].placeholder = placeholders[selection];
            helper.elements["entryInformationEntry"].value = "";
        } else {
            $(helper.elements["entryInformationEntry"]).removeAttr("placeholder");
            helper.elements["entryInformationEntry"].type = "file";
        }
        // update the addon text
        helper.elements["entryType"].innerHTML = selection;
    });

    // this is also tried on window load
    if (helper.web3) {
        registeredUsers();
    }
});

// web3 initialization
$(window).on("load", function () {
    function initializeWeb3() {
        if (typeof web3 !== 'undefined') {
            console.log('Web3 injection detected: ', web3.currentProvider.constructor.name);
            window.web3 = new Web3(web3.currentProvider);
            helper.web3 = true;
        } else {
            console.log('No Web3 injection detected');
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/key"));
            helper.web3 = true;
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
