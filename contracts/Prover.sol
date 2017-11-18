pragma solidity ^0.4.18;

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
    function Prover() public {
        owner = msg.sender;
    }

    // fallback
    function() internal {
        revert();
    }


    // modifier to check if a target address has a particular entry
    modifier entryExists(address target, bytes32 dataHash, bool exists) {
        assert(accounts[target].entries.contains(dataHash) == exists);
        _;
    }

    // external functions
    // allow access to our structs via functions with convenient return values
    function registeredUsers()
        external
        view
        returns (address[] unique_addresses) {
        return users.members;
    }
    function userEntries(address target)
        external
        view
        returns (bytes32[] entries) {
        return accounts[target].entries.members;
    }
    function entryInformation(address target, bytes32 dataHash)
        external
        view
        returns (bool proved, uint time, uint staked) {
        return (accounts[target].entries.contains(dataHash),
                accounts[target].values[dataHash].time,
                accounts[target].values[dataHash].staked);
    }

    // public functions
    // adding entries
    function addEntry(bytes32 dataHash)
        public
        payable
        entryExists(msg.sender, dataHash, false){
        users.insert(msg.sender);
        accounts[msg.sender].entries.insert(dataHash);
        accounts[msg.sender].values[dataHash] = Entry(now, msg.value);
    }

    // deleting entries
    function deleteEntry(bytes32 dataHash)
        public
        entryExists(msg.sender, dataHash, true) {
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

    // allow owner to delete contract if no accounts exist
    function selfDestruct() public {
        if ((msg.sender == owner) && (users.length() == 0)) {
            selfdestruct(owner);
        }
    }
}
