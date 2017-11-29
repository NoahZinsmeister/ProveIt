# ProveIt

At long last, we have the technology. You can finally _prove_ to your friends that you liked that band before they were cool! :ok_hand:

ProveIt implements proof of historical data possession on the Ethereum blockchain. What this means in practice is that any Ethereum address can submit a 32-byte cryptographic hash to ProveIt's ledger and gain the ability to prove that the owner(s) of this address wrote/possessed the text/data that resolves to the hash at a particular time. The ledger also allows addresses to stake arbitrary amounts of Ether alongside their entries, lending credibility.

### To view/query the ProveIt ledger
* Download the [MetaMask](https://metamask.io/) plugin for Chrome.
* Visit the [Github Page](https://noahzinsmeister.github.io/ProveIt/) for this repo.
### To submit an entry to ProveIt (Warning: for advanced users only)
* Modify `addEntry.js` as appropriate and run (`node addEntry.js`).

I'll add the ability to add/delete ledger entries soon via the Github Page and MetaMask, but for now you're on your own (though it's not that hard, again see `addEntry.js`).

### Potential uses cases
* __Alice__ is a rabid Elon Musk fan, and wants to make a prediction about Musk's glorious future endeavors. Using her Ethereum address __Address<sub>Alice</sub>__, __Alice__ could submit ```By 2030, a company founded or owned in part by Elon Musk will have delivered a human to the surface of Mars.``` to the ProveIt ledger at time __T__. At any point from now until 2030, __Alice__ could submit evidence of her ownership of __Address<sub>Alice</sub>__ in standard ways (i.e. by signing a credible message via something like the [Etherscan verifySig tool](https://etherscan.io/verifySig)), thereby proving that she made this statement at time __T__. This makes her seem prescient, and more importantly, affirms her Musk fanhood. One could imagine, however, that a rival Musk supporter __Bob__ might submit many such messages, varying the year, and revealing only the one that makes him appear most credible. To combat this issue, __Alice__ can lock up an arbitrary amount of ether, __x__, alongside her statement. This amount cannot be recovered without destroying the associated ledger entry. If we assume that __Bob__ must submit 20 different entries to have a high probability of ending up with at least one very close prediction, he’s forced to lock up 20*__x__ ether to guarantee that his revealed entry will have the same amount of credibility as __Alice__'s, dissuading him from attacking.
* Imagine that __Alice__ is also an amateur paparazza, and manages to snap an incredibly ~~compromising~~ flattering photograph of Elon at time __T__. She’s desperately worried that the photo will be stolen and published by __Bob__ at __T+1__, depriving her of all potential proceeds. If __Alice__ wants to be able to prove that she possessed this photo at __T__ she could simply make a (cryptographically secure) 32-byte hash of this photograph, and store the hash in ProveIt. The data that produced this hash will of course be unknown at __T__, but upon __Bob__'s release of the photo at __T+1__, __Alice__ could prove her prior possession by letting anyone see that the photo hashes to the entry that she made in ProveIt at time __T__.

### Technical notes
* While building ProveIt, I realized that having set functionality would be helpful, so I implemented it in contracts/Sets.sol. It's quite efficient, with O(1) insertion, removal, and existence checks.
* Hash.sol is deployed at: ```0xca260ffffb0270ee07ec6892fa9d44f040454e4d``` and is [verified on Etherscan](https://etherscan.io/address/0x48d904b3bf1cfcd7e1ce2dbcf7dcaecf0b0575c6).
* Sets.sol is deployed at: ```0x48d904b3bf1cfcd7e1ce2dbcf7dcaecf0b0575c6``` and is [verified on Etherscan](https://etherscan.io/address/0x48d904b3bf1cfcd7e1ce2dbcf7dcaecf0b0575c6).
* Prover.sol is deployed at: ```0x117ca39dffc4da6fb3af6145dfff246830637fe2``` and is [verified on Etherscan](https://etherscan.io/address/0x117ca39dffc4da6fb3af6145dfff246830637fe2).
