var secrets = require('./secrets.js')
var ethereumjsWallet = require('ethereumjs-wallet');
var ProviderEngine = require("web3-provider-engine");
var WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
var Web3Subprovider = require("web3-provider-engine/subproviders/web3.js");
var Web3 = require("web3");
var FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');

// create wallet from existing private key
var privateKey = secrets.config.myPrivateKey;
var wallet = ethereumjsWallet.fromPrivateKey(new Buffer(privateKey, "hex"));

// mainnet
var providerUrl = "https://mainnet.infura.io/" + secrets.config.infuraKey;
var engine = new ProviderEngine();

engine.addProvider(new FilterSubprovider());
engine.addProvider(new WalletSubprovider(wallet, {}));
engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerUrl)));
engine.start();

var gas = 4712388;
var gasPrice = web3.toWei(1.5, "gwei");

module.exports = {
    networks: {
        live: {
            network_id: 1,
            host: "localhost",
            port: 8545,
            gas: gas,
            gasPrice: gasPrice,
            from: secrets.config.myAddress
        },
        infuraLive: {
            network_id: 1,
            provider: engine,
            gas: gas,
            gasPrice: gasPrice,
            from: secrets.config.myAddress
        }
    }
};
