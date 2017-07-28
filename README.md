# Prove It
Playing around with ethereum contracts.

1. sets.sol: Deployed at 0xD71d1864e5eC4c0754e38C5b0353Cf9F883f4c5a.
[Etherscan](https://etherscan.io/address/0xd71d1864e5ec4c0754e38c5b0353cf9f883f4c5a).

2. prover.sol. For some reason I can't get this to verify on Etherscan, but you
can check the bytecode against the output of:
```solc prover.sol --libraries libraries --optimize --bin-runtime```
run with solc version 0.4.13+commit.0fb4cb1a.Linux.g++.
Deployed at 0x7Aef44E5e6930F8799559aFB046Ccd8692044f86. [Etherscan](https://etherscan.io/address/0x7aef44e5e6930f8799559afb046ccd8692044f86).

To interact with prover.sol, you'll need its ABI: [{"constant":false,"inputs":[{"name":"dataString","type":"string"}],"name":"deleteEntry","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"dataString","type":"string"}],"name":"addEntry","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"usersGetter","outputs":[{"name":"number_unique_addresses","type":"uint256"},{"name":"unique_addresses","type":"address[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataString","type":"string"}],"name":"proveIt","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"value","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"proveIt","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"value","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":false,"type":"fallback"}]

