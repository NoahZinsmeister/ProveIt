# ProveIt

At long last, we have the technology. You can finally _prove_ to your friends that you liked that band before they were cool! :ok_hand:

ProveIt implements proof of historical data possession on the Ethereum blockchain. What this means in practice is that any Ethereum address can submit a 32-byte cryptographic hash to ProveIt's ledger and gain the ability to prove that the owner(s) of this address wrote/possessed the text/data that resolves to the hash at a particular time. The ledger also allows addresses to stake arbitrary amounts of Ether alongside their entries, lending credibility.

### To view/query the ProveIt ledger
* Method 1 (easier):
    1. Download the [MetaMask](https://metamask.io/) plugin for Chrome.
    2. Visit the [Github Page](https://noahzinsmeister.github.io/ProveIt/) for this repo.
* Method 2 (harder):
    1. Clone this repo.
    2. Edit `docs/js/secrets.js.example` to include your own INFURA API key (which you can request for free [here](https://infura.io/)), and rename it `secrets.js`.
    3. open index.html.

### To submit an entry to ProveIt (Warning: for advanced users only)
* Modify `addEntry.js` as appropriate and run (`node addEntry.js`).

At some point I'll be adding the ability to add/delete ledger entries via the Github Page and MetaMask, but for now you're on your own (though it's not that hard, again see `addEntry.js`).

### Potential uses cases
* Individual __I__ is a rabid Elon Musk fan, and wants to make a prediction about Musk's glorious future endeavors. Using their Ethereum address __A__, __I__ could submit ```By 2030, a company founded or owned in part by Elon Musk will have delivered a human to the surface of Mars``` to the ProveIt ledger at time __T__. At any point from now until 2030, __I__ can submit evidence of their ownership of __A__ in standard ways (i.e. by signing a credible message via something like the [Etherscan verifySig tool](https://etherscan.io/verifySig)) thereby proving that they made this statement at time __T__. This makes __I__ seem prescient, and more importantly, affirms their Musk fanhood. One could imagine, however, that a rival Musk supporter __R__ might submit many such messages, varying the year, and revealing only the one that makes them appear most credible. To combat this issue, __I__ can lock up an arbitrary amount, __x__, of ether alongside their statement. This amount cannot be recovered without destroying the associated ledger entry. If we assume that __R__ must submit 20 different entries to have a high probability of ending up with at least one very close prediction, they’re forced to lock up 20*__x__ ether, dissuading them from attacking.
* Imagine that Individual __I__ is also an amateur paparazzo/a, and manages to snap an incredibly ~~compromising~~ valuable photograph of Elon. They’re desperately worried that this photo will be stolen and published by __R__, depriving __I__ of all glory and potential proceeds. If __I__ wishes to prove possession of this photograph at time __T__ they can simply make a (cryptographically secure) 32-byte hash of this photograph, and store the hash in ProveIt. The data that produced this hash will of course be unknown at time __T__, but at any point in the future __I__ could release the data (photograph) and allow anyone to verify that it does indeed hash to the entry that __I__ made in ProveIt at time __T__.

### Technical notes
* While building ProveIt, I realized that having set functionality would be helpful, so I implemented it in contracts/Sets.sol. It's quite efficient, with O(1) insertion, removal, and existence checks.
* Migrations.sol is deployed at: ```0xe5F0323264ff7988e74974295C8BBc215fe58B26``` and is [verified on Etherscan](https://etherscan.io/address/0xe5f0323264ff7988e74974295c8bbc215fe58b26).
* Hash.sol is deployed at: ```0xa7620C421d29db2bb991cD603a725b960E927cEd``` and is [verified on Etherscan](https://etherscan.io/address/0xa7620c421d29db2bb991cd603a725b960e927ced).
* Sets.sol is deployed at: ```0xfA5e85584c895483aF162b6B87b6e8730bD41183``` and is [verified on Etherscan](https://etherscan.io/address/0xfa5e85584c895483af162b6b87b6e8730bd41183).
* Prover.sol is deployed at: ```0x1f5cDff41Fb9B17996D6F0fcA6Ab9C5bEd96F20f``` and is [verified on Etherscan](https://etherscan.io/address/0x1f5cdff41fb9b17996d6f0fca6ab9c5bed96f20f).
