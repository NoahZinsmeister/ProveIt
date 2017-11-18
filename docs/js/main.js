// web3 initialization
window.addEventListener('load', function () {
    /* TODO: use session storage for infura key
    console.log('No Web3 Injection detected');
    var infura_key = sessionStorage.getItem("infura_key");
    if (infura_key == null) {
        let prompt = window.prompt("Unable to detect a valid Web3 Provider. Please install MetaMask and try again, or, enter your INFURA API key.", "");
        if (prompt) {
            sessionStorage.setItem("infura_key", prompt);
            console.log("INFURA API key stored");
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + prompt));
        } else {
            document.body.innerHTML = 'Please install MetaMask or obtain an INFURA API key.';
        }
    } else {
        window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + infura_key));
    */

    if (typeof web3 !== 'undefined') {
        console.log('Web3 injection detected', web3.currentProvider.constructor.name)
        window.web3 = new Web3(web3.currentProvider);
    } else {
        console.log('No Web3 injection detected')
        window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/INFURA_KEY"));
    }
});

// jquery
$(function() {
    function htmlElements() {
        var out = {};
        var elements = [
            "registeredUsersNumber",
            "registeredUsersAddresses",
            "registeredUsersSubmit",
            "userEntriesAddress",
            "userEntriesSubmit",
            "userEntries",
            "entryInformationAddress",
            "entryInformationHash",
            "entryInformationSubmit",
            "entryInformation",
            "messageInput",
            "messageHash",
            "fileInput",
            "fileHash"
        ];
        for (i=0; i<elements.length; i++) {
            out[elements[i]] = document.getElementById(elements[i]);
        }
        return out
    }

    function contracts() {
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

    function hexFormat(string) {
        return "0x" + string
    }

    function parseFile(file, options) {
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

        defaulter = function(name, _default) {return name in options ? options[name] : _default};
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

        onLoadHandler = function(event) {
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

        readChunk = function() {
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


    // callback functions
    function registeredUsers() {
        var elements = htmlElements();
        var Prover = contracts().Prover;

        Prover.registeredUsers.call(function (error, users) {
            if (error) {
                console.log(error);
            } else {
                elements["registeredUsersNumber"].innerHTML = users.length;
                elements["registeredUsersAddresses"].innerHTML = users;
            }
        });
    }

    function userEntries() {
        var elements = htmlElements();
        var Prover = contracts().Prover;
        address = elements["userEntriesAddress"].value;

        Prover.userEntries.call(address, function (error, entries) {
            if (error) {
                console.log(error);
            } else {
                if (entries.length >= 1) {
                    elements["userEntries"].innerHTML = entries;
                } else {
                    elements["userEntries"].innerHTML = "No entries found.";
                }
            }
        });
    }

    function entryInformation() {
        var elements = htmlElements();
        var address = elements["entryInformationAddress"].value
        var hash = elements["entryInformationHash"].value
        var Prover = contracts().Prover;

        Prover.entryInformation.call(address, hash, function (error, entryInfo) {
            if (error) {
                console.log(error);
            } else {
                if (entryInfo[0]) {
                    outcome = {
                        time: entryInfo[1].toNumber(),
                        staked: web3.fromWei(entryInfo[2].toNumber(), "ether")
                    };
                    var date = new Date(outcome.time*1000);
                    var dateOptions = {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: "numeric",
                        minute: "numeric"};
                    var displayString = [];
                    displayString.push("Proved!")
                    displayString.push("Time: " + date.toLocaleString("en-US", dateOptions));
                    displayString.push("Staked: " + outcome.staked + " ETH");
                    elements["entryInformation"].innerHTML = displayString.join("<br>");
                } else {
                    elements["entryInformation"].innerHTML = "Unproven."
                }
            }
        });
    }

    function hashMessage() {
        var elements = htmlElements();
        var message = elements["messageInput"].value;
        var hashObject = keccak256.create();
        hashObject.update(message);
        elements["messageHash"].innerHTML = hexFormat(hashObject.hex());
    }

    function hashFile() {
        var elements = htmlElements();
        var fileList = elements["fileInput"].files;
        if (fileList.length !== 1) {
            console.log('Please select 1 and only 1 file.');
            return;
        }

        var file = fileList[0];
        var hashObject = keccak256.create();

        errorCallback = function(error) {
            console.log(error);
        }
        chunkCallback = function(chunk, percentDone) {
            hashObject.update(chunk);
            console.log(percentDone);
        }
        finishedCallback = function() {
            elements["fileHash"].innerHTML = hexFormat(hashObject.hex());
        }
        parseFile(file, {
            "errorCallback": errorCallback,
            "chunkCallback": chunkCallback,
            "finishedCallback": finishedCallback
        })
    }

    var elements = htmlElements();
    elements["registeredUsersSubmit"].addEventListener("click", registeredUsers);
    elements["userEntriesSubmit"].addEventListener("click", userEntries);
    elements["entryInformationSubmit"].addEventListener("click", entryInformation);
    elements["messageInput"].addEventListener("input", hashMessage);
    elements["fileInput"].addEventListener("change", hashFile);

    registeredUsers();
});
