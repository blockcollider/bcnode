BC Transaction Dictionary
=========================

# Transaction Classes
* 1 - Value 
* 2 - Promise 
* 3 - Callback 
* 66 - Emblem 
* 99 - Snark Release 

# Transaction Structs
* 100 - Marked/Unmark 
* 101 - Collateral 
* 102 - Reward Address 

## Collateral Base Output 
* prevHash: The transaction id of the previous collatoral transaction  

## Callback Transaction

* hash: the hash of the serialized data of the transaction
* work: the public key of the miner or transaction miner + the random value or nonce 
* txid: the hash of work and "hash" values concatendated  
* fpk: fee-per-kilobyte
* v: version 
* d: edit distance / ranged difficulty 
* inputs: array of base transactions
* inputs[0]: transaction sending NRG to a hash controlled by the user  
* outputs: array of base transactions
* outputs[0]: class 3 fiber transaction

