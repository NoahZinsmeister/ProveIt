var Hash = artifacts.require("./Hash.sol");
var Sets = artifacts.require("./Sets.sol");
var Prover = artifacts.require("./Prover.sol");

module.exports = function(deployer) {
    deployer.deploy(Hash);
    deployer.deploy(Sets);
    deployer.link(Sets, Prover);
    deployer.deploy(Prover);
};
