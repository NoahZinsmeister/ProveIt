# Prove It
Playing around with ethereum contracts.

1. sets.sol: Deployed at 0xD71d1864e5eC4c0754e38C5b0353Cf9F883f4c5a.
[Etherscan](https://etherscan.io/address/0xd71d1864e5ec4c0754e38c5b0353cf9f883f4c5a).


2. prover.sol. Deployed at 0x7Aef44E5e6930F8799559aFB046Ccd8692044f86.
[Etherscan](https://etherscan.io/address/0x7aef44e5e6930f8799559afb046ccd8692044f86).

If you don't trust Etherscan's verification, you can check the bytecode against
the output of: ```solc --optimize --libraries libraries --bin-runtime *.sol```.
Run with solc version 0.4.13+commit.0fb4cb1a.Linux.g++.

