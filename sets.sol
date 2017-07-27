pragma solidity ^0.4.13;

// should I implement SetsLight with only memberExists and length?
library Sets {
    // bytes32 set
    struct bytes32Set {
        bytes32[] members;
        mapping (bytes32 => bool) memberExists;
        mapping (bytes32 => uint256) memberIndex;
    }

    function insert(bytes32Set storage self, bytes32 other) {
        // only do anything if entry doesn't exist
        if (!self.memberExists[other]) {
            // ensure that pushing won't overflow uint256
            assert(self.members.length + 1 > self.members.length);
            self.members.push(other);
            // update mappings
            self.memberIndex[other] = self.members.length - 1;
            self.memberExists[other] = true;
        }
    }

    function remove(bytes32Set storage self, bytes32 other) {
        // only do anything if entry exists
        if (self.memberExists[other])  {
            // if this isn't the last element
            if (self.members.length > 1) {
                uint256 index = self.memberIndex[other];
                // copy last value over value to remove
                self.members[index] = self.members[self.members.length - 1];
                // update the index of the newly copied value
                self.memberIndex[self.members[index]] = index;
            }
            // decrement length
            self.members.length -= 1;
            // update mapping (don't need to change index, exists catches all)
            self.memberExists[other] = false;
        }
    }

    function contains(bytes32Set storage self, bytes32 other) returns (bool) {
        return self.memberExists[other];
    }

    function length(bytes32Set storage self) returns (uint256) {
        return self.members.length;
    }


    // address set
    struct addressSet {
        address[] members;
        mapping (address => bool) memberExists;
        mapping (address => uint256) memberIndex;
    }

    function insert(addressSet storage self, address other) {
        // only do anything if entry doesn't exist
        if (!self.memberExists[other]) {
            // ensure that pushing won't overflow uint256
            assert(self.members.length + 1 > self.members.length);
            self.members.push(other);
            // update mappings
            self.memberIndex[other] = self.members.length - 1;
            self.memberExists[other] = true;
        }
    }

    function remove(addressSet storage self, address other) {
        // only do anything if entry exists
        if (self.memberExists[other])  {
            // if this isn't the last element
            if (self.members.length > 1) {
                uint256 index = self.memberIndex[other];
                // copy last value over value to remove
                self.members[index] = self.members[self.members.length - 1];
                // update the index of the newly copied value
                self.memberIndex[self.members[index]] = index;
            }
            // decrement length
            self.members.length -= 1;
            // update mapping (don't need to change index, exists catches all)
            self.memberExists[other] = false;
        }
    }

    function contains(addressSet storage self, address other) returns (bool) {
        return self.memberExists[other];
    }

    function length(addressSet storage self) returns (uint256) {
        return self.members.length;
    }
}
