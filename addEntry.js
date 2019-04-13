var secrets = require('./secrets.js')
var Web3 = require('web3');
var tx = require('ethereumjs-tx');

var web3 = new Web3(
    new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/' + secrets.config.infuraKey)
);

// sending address info
var fromAddress = secrets.config.myAddress;
var privateKey = new Buffer(secrets.config.myPrivateKey, "hex");
var nonce = web3.toHex(web3.eth.getTransactionCount(fromAddress));
var balance = web3.fromWei(web3.eth.getBalance(fromAddress).toNumber(), "ether");

// Prover's latest deployed address
var toAddress = '0x117ca39dffc4da6fb3af6145dfff246830637fe2';

// gas variables
var gasPrice = web3.toHex(1*1e9);
var gasLimit = web3.toHex(4712388);

// value to send
var value = web3.toHex(0);

// construct call data for addEntry and a message (string) that will be hashed
var message = "ProveIt";
var data = [];
// add function signature
data.push(web3.sha3("addEntry(bytes32)").substring(0, 10));
// add argument (no need to pad, it's already 32 bytes)
data.push(web3.sha3(message).substring(2));
data = data.join("");

// prep the transaction
var rawTx = {
    nonce: nonce,
    from: fromAddress,
    to: toAddress,
    value: value,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    data: data
};

// send it
var transaction = new tx(rawTx);
transaction.sign(privateKey);
var serializedTx = transaction.serialize().toString('hex');
web3.eth.sendRawTransaction('0x' + serializedTx, function(err, result) {
    if(err) {
        console.log(err);
    } else {
        console.log('success');
        console.log(result);
    }
});
