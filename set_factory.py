# generate library of Sets for selected solidity value-types

standalones = ("address", )
uint = ("uint", "uint8")
_int =  ("int", "int8")
_bytes = ("byte", "bytes32")

solidity_types = standalones + uint + _int + _bytes

pre = """pragma solidity ^0.4.18;

// sets support up to 2^256-2 members
// memberIndices stores the index of members + 1, not their actual index
library Sets {"""
typed_set = """
    // {0} set
    struct {0}Set {{
        {0}[] members;
        mapping({0} => uint) memberIndices;
    }}

    function insert({0}Set storage self, {0} other) public {{
        if (!contains(self, other)) {{
            assert(length(self) < 2**256-1);
            self.members.push(other);
            self.memberIndices[other] = length(self);
        }}
    }}

    function remove({0}Set storage self, {0} other) public {{
        if (contains(self, other)) {{
            uint replaceIndex = self.memberIndices[other];
            {0} lastMember = self.members[length(self)-1];
            // overwrite other with the last member and remove last member
            self.members[replaceIndex-1] = lastMember;
            self.members.length--;
            // reflect this change in the indices
            self.memberIndices[lastMember] = replaceIndex;
            delete self.memberIndices[other];
        }}
    }}

    function contains({0}Set storage self, {0} other) public view returns (bool) {{
        return self.memberIndices[other] > 0;
    }}

    function length({0}Set storage self) public view returns (uint) {{
        return self.members.length;
    }}""".format
body = "\n\n".join(typed_set(t) for t in solidity_types)
post = """
}"""

with open("contracts/Sets.sol", "w") as file:
    file.write("".join((pre, body, post)))
