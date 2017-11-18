var Hash = artifacts.require("./Hash.sol");

contract('Hash', function(accounts) {
    // TODO add dummy array buffers to test hashBytes
    // dummy strings
    var dummyStrings = [
        "",
        "test",
        "español"
    ];
    numberDummyStrings = dummyStrings.length;
    assert.isAtLeast(numberDummyStrings, 1, "at least 1 dummy string must be provided")

    it("should hash dummy strings correctly", async function () {
        let instance = await Hash.deployed();
        for (i = 0; i < numberDummyStrings; i++) {
            let returnedHash = await instance.hashString.call(dummyStrings[i]);
            var expectedHash = web3.sha3(dummyStrings[i]);
            // var expectedHash = web3.utils.soliditySha3(dummyStrings[i]);
            assert.equal(
                returnedHash,
                expectedHash,
                "'" + dummyStrings[i] + "' hashed to '" + returnedHash + "' instead of '" + expectedHash + "' as expected"
            );
        }
    });
});
