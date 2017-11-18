var Prover = artifacts.require("./Prover.sol");

contract('Prover', function(accounts) {
    it("0 registered users at the start", async function () {
        let instance = await Prover.deployed();
        let users = await instance.registeredUsers.call();
        assert.equal(
            users.length,
            0,
            "'>0 users found at the start"
        );
    });

    var test_string = "test";
    it("adding entry", async function () {
        let instance = await Prover.deployed();
        await instance.addEntry(web3.sha3(test_string), {from: accounts[0]});
        let entries = await instance.userEntries(accounts[0]);
        assert.equal(entries[0], web3.sha3(test_string), "entry  not registered");
        let entryinfo = await instance.entryInformation(accounts[0], web3.sha3(test_string));
        assert.equal(entryinfo[0], true, "entry not made");
    });
    it("adding the same entry from a different user", async function () {
        let instance = await Prover.deployed();
        await instance.addEntry(web3.sha3(test_string), {from: accounts[1]});
        let users = await instance.registeredUsers.call();
        assert.equal(users.length, 2, "second user not recognized");
        let entry0 = await instance.entryInformation(accounts[0], web3.sha3(test_string));
        let entry1 = await instance.entryInformation(accounts[1], web3.sha3(test_string));
        assert.isTrue(entry0[0] && entry1[0], "entry not the same");
    });
    it("overwriting the value of the old entry", async function () {
        let instance = await Prover.deployed();
        let oldEntry = await instance.entryInformation(accounts[0], web3.sha3(test_string));
        var oldTime = oldEntry[1].toNumber();
        await instance.deleteEntry(web3.sha3(test_string), {from: accounts[0]});
        var txData = [];
        // add function signature
        txData.push(web3.sha3("addEntry(bytes32)").substring(0, 10));
        // add argument
        txData.push(web3.sha3(test_string).substring(2));
        await instance.sendTransaction({
            from: accounts[0],
            value: web3.toWei(1, "ether"),
            data: txData.join("")});
        //await instance.addEntry(web3.sha3(test_string), {from: accounts[0]});
        let newEntry = await instance.entryInformation(accounts[0], web3.sha3(test_string));
        var newTime = newEntry[1].toNumber();
        var newStaked = newEntry[2].toNumber();
        assert.isAtLeast(newTime, oldTime, "time overwritten incorrectly");
        assert.equal(newStaked, web3.toWei(1, "ether"), "amount staked overwritten incorrectly");
    });
});
