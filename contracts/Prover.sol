pragma solidity ^0.4.13;

import {Sets} from "./Sets.sol";

contract Prover {
    // attach library
    using Sets for Sets.addressSet;
    using Sets for Sets.bytes32Set;

    // storage vars
    address owner;
    Sets.addressSet users;
    mapping(address => Account) internal accounts;

    // structs
    struct Account {
        Sets.bytes32Set entries;
        mapping(bytes32 => Entry) values;
    }

    struct Entry {
        uint time;
        uint staked;
    }


    // constructor
    function Prover() {
        owner = msg.sender;
    }
    
    
    // fallback: unmatched transactions will be returned
    function() {
        revert();
    }


    // modifier to check if a target address has a particular entry
    modifier entryExists(address target, bytes32 dataHash, bool exists) {
        assert(accounts[target].entries.contains(dataHash) == exists);
        _;
    }


    // external functions
    // allow access to our structs via functions with convenient return values
    function registeredUsers() public constant
        returns (uint number_unique_addresses, address[] unique_addresses)
    {
        return (users.length(), users.members);
    }

    function userEntries(address target) external constant returns (bytes32[]) {
        return accounts[target].entries.members;
    }
    // proving
    function proveIt(address target, bytes32 dataHash) external constant
        returns (bool proved, uint time, uint staked)
    {
        return status(target, dataHash);
    }

    function proveIt(address target, string dataString) external constant
        returns (bool proved, uint time, uint staked)
    {
        return status(target, sha3(dataString));
    }

    
    // public functions
    // adding entries
    function addEntry(bytes32 dataHash) payable {
        _addEntry(dataHash);
    }

    function addEntry(string dataString) payable
    {
        _addEntry(sha3(dataString));
    }

    // deleting entries
    function deleteEntry(bytes32 dataHash) {
        _deleteEntry(dataHash);
    }

    function deleteEntry(string dataString) {
        _deleteEntry(sha3(dataString));
    }
    
    // allow owner to delete contract if no accounts exist
    function selfDestruct() {
        if ((msg.sender == owner) && (users.length() == 0)) {
            selfdestruct(owner);
        }
    }


    // internal functions
    function _addEntry(bytes32 dataHash)
        entryExists(msg.sender, dataHash, false)
        internal
    {
        users.insert(msg.sender);
        accounts[msg.sender].entries.insert(dataHash);
        accounts[msg.sender].values[dataHash] = Entry(now, msg.value);
    }

    function _deleteEntry(bytes32 dataHash)
        entryExists(msg.sender, dataHash, true)
        internal
    {
        uint rebate = accounts[msg.sender].values[dataHash].staked;
        // update user account
        delete accounts[msg.sender].values[dataHash];
        accounts[msg.sender].entries.remove(dataHash);
        // delete from users if this was the user's last entry
        if (accounts[msg.sender].entries.length() == 0) {
            users.remove(msg.sender);
        }
        // send the rebate
        if (rebate > 0) msg.sender.transfer(rebate);
    }

    // return status of arbitrary address and dataHash
    function status(address target, bytes32 dataHash) internal constant
        returns (bool proved, uint time, uint staked)
    {
        return (accounts[msg.sender].entries.contains(dataHash),
                accounts[target].values[dataHash].time,
                accounts[target].values[dataHash].staked);
    }
}
