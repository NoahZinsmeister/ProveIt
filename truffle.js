var secrets = require('./secrets.js')
var ethereumjsWallet = require('ethereumjs-wallet');
var Web3 = require("web3");
var ProviderEngine = require("web3-provider-engine");
var FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
var WalletSubprovider = require('web3-provider-engine/subproviders/wallet.js');
var Web3Subprovider = require("web3-provider-engine/subproviders/web3.js");

// create wallet from existing private key
var privateKey = secrets.config.myPrivateKey;
var wallet = ethereumjsWallet.fromPrivateKey(new Buffer(privateKey, "hex"));

// mainnet
var providerURL = {
    Main: "https://mainnet.infura.io/v3" + secrets.config.infuraKey,
    Ropsten: "https://ropsten.infura.io/v3" + secrets.config.infuraKey,
    Rinkeby: "https://rinkeby.infura.io/v3" + secrets.config.infuraKey
};
var engines = {
    Main: new ProviderEngine(),
    Ropsten: new ProviderEngine(),
    Rinkeby: new ProviderEngine()
};
var networks = ["Main", "Ropsten", "Rinkeby"];
for (let i=0; i<networks.length; i++) {
    engines[networks[i]].addProvider(new FilterSubprovider());
    engines[networks[i]].addProvider(new WalletSubprovider(wallet, {}));
    engines[networks[i]].addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(providerURL[networks[i]])));
    engines[networks[i]].start();
}
var gas = 4712388;
var gasPrice = 1.5*1e9;

module.exports = {
    networks: {
        infuraMain: {
            network_id: 1,
            provider: engines["Main"],
            gas: gas,
            gasPrice: gasPrice,
            from: secrets.config.myAddress
        },
        infuraRopsten: {
            network_id: 3,
            provider: engines["Ropsten"],
            gas: gas/2,
            gasPrice: gasPrice,
            from: secrets.config.myAddress
        },
        infuraRinkeby: {
            network_id: 4,
            provider: engines["Rinkeby"],
            gas: gas,
            gasPrice: gasPrice,
            from: secrets.config.myAddress
        }
    }
};
