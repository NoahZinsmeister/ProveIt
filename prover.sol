pragma solidity ^0.4.12;

import "./sets.sol";

contract Prover {
    /* for reference, a schematic of the storage vars and structs
    owner:  address1
    users:  bytes32Set1
    ledger: {address1: UserAccount1, ...}
    UserAccount: {"hashes": hashes1, "entries": {dataHash1: Entry1, ...}}
    Entry1 {"time": time1, "value": value1}
    */


    // attach library
    using Sets for *;


    // storage vars
    address owner;
    Sets.addressSet internal users;
    mapping (address => UserAccount) internal ledger;
    
    
    // structs
    struct UserAccount {
        Sets.bytes32Set hashes;
        mapping (bytes32 => Entry) entries;
    }

    struct Entry {
        uint256 time;
        uint256 value;
    }


    // constructor
    function Prover() {
        owner = msg.sender;
    }
    
    
    // fallback: unmatched transactions will be returned
    function () {
        revert();
    }


    // modifier to check if sender has an account
    modifier hasAccount() {
        assert(ledger[msg.sender].hashes.length() >= 1);
        _;
    }


    // external functions
    // proving
    function proveIt(address target, bytes32 dataHash) external constant
        returns (bool proved, uint256 time, uint256 value)
    {
        return status(target, dataHash);
    }

    function proveIt(address target, string dataString) external constant
        returns (bool proved, uint256 time, uint256 value)
    {
        return status(target, sha3(dataString));
    }
    
    // allow access to our structs via functions with convenient return values
    function usersGetter() public constant
        returns (uint256 number_unique_addresses, address[] unique_addresses)
    {
        return (users.length(), users.members);
    }

    function userEntries(address target) external constant returns (bytes32[]) {
        return ledger[target].hashes.members;
    }
    
    
    // public functions
    // adding entries
    function addEntry(bytes32 dataHash) payable {
        _addEntry(dataHash);
    }

    function addEntry(string dataString) payable {
        _addEntry(sha3(dataString));
    }

    // deleting entries
    function deleteEntry(bytes32 dataHash) hasAccount {
        _deleteEntry(dataHash);
    }

    function deleteEntry(string dataString) hasAccount {
        _deleteEntry(sha3(dataString));
    }
    
    // allow owner to delete contract if no accounts exist
    function selfDestruct() {
        if ((msg.sender == owner) && (users.length() == 0)) {
            selfdestruct(owner);
        }
    }


    // internal functions
    function _addEntry(bytes32 dataHash) internal {
        // ensure the entry doesn't exist
        assert(!ledger[msg.sender].hashes.contains(dataHash));
        // update UserAccount (hashes then entries)
        ledger[msg.sender].hashes.insert(dataHash);
        ledger[msg.sender].entries[dataHash] = Entry(now, msg.value);
        // add sender to userlist
        users.insert(msg.sender);
    }

    function _deleteEntry(bytes32 dataHash) internal {
        // ensure the entry does exist
        assert(ledger[msg.sender].hashes.contains(dataHash));
        uint256 rebate = ledger[msg.sender].entries[dataHash].value;
        // update UserAccount (hashes then entries)
        ledger[msg.sender].hashes.remove(dataHash);
        delete ledger[msg.sender].entries[dataHash];
        // send the rebate
        if (rebate > 0) {
            msg.sender.transfer(rebate);
        }
        // delete from userlist if this was the user's last entry
        if (ledger[msg.sender].hashes.length() == 0) {
            users.remove(msg.sender);
        }
    }

    // return status of arbitrary address and dataHash
    function status(address target, bytes32 dataHash) internal constant
        returns (bool proved, uint256 time, uint256 value)
    {
        return (ledger[msg.sender].hashes.contains(dataHash),
                ledger[target].entries[dataHash].time,
                ledger[target].entries[dataHash].value);
    }
}

