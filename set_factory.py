# quicky to generate Sets of arbitrary type

solidity_types = ("bytes32", "address")

pre = """pragma solidity ^0.4.13;

// should I implement SetsLight with only memberExists and length?
library Sets {
"""
typed_set = lambda x: """    // {0} set
    struct {0}Set {{
        {0}[] members;
        mapping ({0} => bool) memberExists;
        mapping ({0} => uint256) memberIndex;
    }}

    function insert({0}Set storage self, {0} other) {{
        // only do anything if entry doesn't exist
        if (!self.memberExists[other]) {{
            // ensure that pushing won't overflow uint256
            assert(self.members.length + 1 > self.members.length);
            self.members.push(other);
            // update mappings
            self.memberIndex[other] = self.members.length - 1;
            self.memberExists[other] = true;
        }}
    }}

    function remove({0}Set storage self, {0} other) {{
        // only do anything if entry exists
        if (self.memberExists[other])  {{
            // if this isn't the last element
            if (self.members.length > 1) {{
                uint256 index = self.memberIndex[other];
                // copy last value over value to remove
                self.members[index] = self.members[self.members.length - 1];
                // update the index of the newly copied value
                self.memberIndex[self.members[index]] = index;
            }}
            // decrement length
            self.members.length -= 1;
            // update mapping (don't need to change index, exists catches all)
            self.memberExists[other] = false;
        }}
    }}

    function contains({0}Set storage self, {0} other) returns (bool) {{
        return self.memberExists[other];
    }}

    function length({0}Set storage self) returns (uint256) {{
        return self.members.length;
    }}""".format(x)
body = "\n\n\n".join(typed_set(t) for t in solidity_types)
post = """
}
"""

with open("sets.sol", "w") as file:
    file.write("".join([pre, body, post]))

