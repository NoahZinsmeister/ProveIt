# Prove-It
Playing around with ethereum contracts.

Latest version deployed at 0xd8553210929035d8510F3048bBf4b3045Ce7b935. [Etherscan](https://etherscan.io/address/0xd8553210929035d8510f3048bbf4b3045ce7b935).

Bytecode taken from the output of: ```solc prover.sol --libraries libraries --optimize --bin```. 

Output of solc --version: ```solc, the solidity compiler commandline interface
Version: 0.4.13+commit.0fb4cb1a.Linux.g++```.

ABI: [{"constant":false,"inputs":[{"name":"dataString","type":"string"}],"name":"deleteEntry","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"dataString","type":"string"}],"name":"addEntry","outputs":[],"payable":true,"type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"addEntry","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[],"name":"usersGetter","outputs":[{"name":"number_unique_addresses","type":"uint256"},{"name":"unique_addresses","type":"address[]"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"selfDestruct","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"}],"name":"userEntries","outputs":[{"name":"","type":"bytes32[]"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataString","type":"string"}],"name":"proveIt","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"value","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"target","type":"address"},{"name":"dataHash","type":"bytes32"}],"name":"proveIt","outputs":[{"name":"proved","type":"bool"},{"name":"time","type":"uint256"},{"name":"value","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"dataHash","type":"bytes32"}],"name":"deleteEntry","outputs":[],"payable":false,"type":"function"},{"inputs":[],"payable":false,"type":"constructor"},{"payable":false,"type":"fallback"}]

