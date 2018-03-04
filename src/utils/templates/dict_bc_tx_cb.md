## version: Number 
The version of that must be supported by the parser/validation of the transaction. 

## txid: String - "Transaction ID" 
User provided hash which is combined with the hash(txMinerAddress + txWork + txMinerFeeAlloc + txHash + Length of steradian)

## txHash: String 
Value is created by the merkle root of the hashes of the inputs and outputs. Used as a unique key to represent the transaction

## txWork: String 
The raw nonce that when concatenated with the value of txMinerAddress hashed and compared to the "hash" key provides the distance score.

## distance: Number - "Distance"
The distance score of the transaction

## feePerKilobyte: Number - "Fee Per Kilobyte"
The award amount provided per kilobyte for the entire 

## txMinerFeeAlloc: Number - "Transaction Miner Fee Allocation" 
The amount of the fee to be removed by the tx miner otherwise 0.

## steradian: Reserved 

## ninputs: Number - "Numnber of Inputs" 
The number of inputs used in the transaction

## noutputs: Number - "Numnber of Outputs" 
The number of outputs used in the transaction

## inputs: List[input]
List containing inputs of the transaction

## outputs: List[output]
List containing outputs of the resulting outputs of the transaction

## inputs.0.prev: Object
Reference of the previous output used to resolve this input

## inputs.0.prev.txId: String
Reference to the transaction ID to be solved by the following signature value and data.

## inputs.0.prev.outputIndex: Number
Reference to the output which is being solved by the input signature

## inputs.0.expire: Number 
If no transaction occurs by the provided block height the outputs are invalid. Otherwise no expiration has a value of 0. Only valid in stack transactions.

## inputs.0.signature: String
Signature of the script code and data which resolves the referenced previous hash 

## ouputs.0.class: Number
The transactoin class to validate the structure of the output. 

## ouputs.0.version: Number
The version of parser which supports the class and validation of the the transactions script, signatures, and data structure

## outputs.0.n: Number
The output order of execuation in the transaction. 

## outputs.0.value: Number
The value of NRG to be sent to the output

## outputs.0.address: Number
The public key which is assigned this unspent stack.

## outputs.0.script: String
The script which when compiled validates spends the output.

## outputs.0.nsinputs: Number
The number of inputs within the transaction output stack 

## outputs.0.nsoutputs: Number
The number of stack outputs within the transaction output stack 

## outputs.0.stackinputs: List[stackinputs]
A list of stack inputs used in this transaction. 

## outputs.0.stackinputs.0.prev: Object
The object referenced the previous transaction stack output. If the stackTXId == the txHash of the transaction this is a stack creation transaction

## outputs.0.stackinputs.0.prev.stackTxId: String 
Reference to the stack transaction ID to be solved by the following signature value and data.

## outputs.0.stackinputs.0.prev.stackOutputIndex: Number 
Reference to index of the output to be resolved by the input.

## outputs.0.stackinputs.0.signature: String 
Signature providing the solution for the output referenced in the prevStackTxId 

## outputs.0.stackoutputs.0.struct: Number
The validate test for the arguments included in the stack operation.

## outputs.0.stackoutputs.0.value: Number
The validate test for the arguments included in the stack operation.

## outputs.0.stackoutputs.0.script: String
The persistent script that is must correctly compiled to resolve the stack

## outputs.0.stackoutputs.0.expire: Number
THe block height which must be less than the expire block height referenced in the parent of the transaction. The value is spendable by the owner of the stackinputs if the block height is less than the given value.  

## outputs.0.stackoutputs.0.n: Number
The execuation order index for the output relative to the other transaction stack outputs.

## outputs.0.stackoutputs.0.stackSequence: Number
The index of the execution order of the outputs of the entire stack.
