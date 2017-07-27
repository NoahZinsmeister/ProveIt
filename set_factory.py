# generate library of Sets for selected solidity value-types

standalones = ["address"]
uint = ["uint", "uint8"]
_int =  ["int", "int8"]
_bytes = ["byte", "bytes32"]

solidity_types = standalones + uint + _int + _bytes

pre = """pragma solidity ^0.4.13;

// note: breaks if members.length exceeds 2^256-1 (so, not really a problem)
library Sets {"""

typed_set = lambda x: """
    // {0} set
    struct {0}Set {{
        {0}[] members;
        mapping ({0} => bool) memberExists;
        mapping ({0} => uint) memberIndex;
    }}

    function insert({0}Set storage self, {0} other) {{
        if (!self.memberExists[other]) {{
            self.memberExists[other] = true;
            self.memberIndex[other] = self.members.length;
            self.members.push(other);
        }}
    }}

    function remove({0}Set storage self, {0} other) {{
        if (self.memberExists[other])  {{
            self.memberExists[other] = false;
            uint index = self.memberIndex[other];
            // change index of last value to index of other 
            self.memberIndex[self.members[index]] = index;
            // copy last value over other and decrement length
            self.members[index] = self.members[self.members.length - 1];
            self.members.length--;
        }}
    }}

    function contains({0}Set storage self, {0} other) returns (bool) {{
        return self.memberExists[other];
    }}

    function length({0}Set storage self) returns (uint256) {{
        return self.members.length;
    }}
""".format(x)
body = "\n".join(typed_set(t) for t in solidity_types)
post = """}"""

with open("sets.sol", "w") as file:
    file.write("".join([pre, body, post]))
