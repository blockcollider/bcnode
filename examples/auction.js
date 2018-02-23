
/*
 *  Decentralized exchange of assets in multiple blockchains using modified Bitcoin Script (BEAM) on Block Collider
 *
 *  Ex. Trade Bitcoin for Waves, Ethereum or NEO. 
 *
 *  WHAT YOU GET FROM RUNNING THIS
 *  1. An open order of Bitcoin listed on the Block Collider. 
 *  2. One or more parties can optionally fulfill your rate 
 *  3. After a set period of time your Bitcoin is unlisted but still redeemable by you.
 *
 *  Learn more at https://docs.blockcollider.org
 *
 */

const Script = require("../src/script/script");
const Polyglot = require("../src/polyglot");
const Stack = require("../src/primitives/stack");
const StackOutput = require("../src/primitives/stackoutput");
const Output = require("../src/primitives/output");
const Account = require("../src/account");
const Convert = require("../src/utils/converter");
const strings = require("../src/utils/strings");

/* Polyglot is an abstraction layer for multiple smart contract languages */
const poly = new Polyglot({ log: false });

/* NRG ChangeBox Address means the nrg is lost whenever the underlying transaction moves */
const changeBoxPair = account.createChangeBoxAddress();
const btcDepositPair = account.combineAddresses(changeBoxPair, account.btc.createKeyPair());

/* 
 * Actual BTC Transaction 
 */
const btcTx = poly.btc.createTransaction({
	to: btcDepositPair.address,
	amount: Convert.btc(0.5, "btc").toSatoshis(),
	from: account.btc.address[0]
});

/* 
 * Actual NRG Transaction (for ChangeBox tx)
 */
const tx = poly.collider.tx()

/* Fund NRG Change Box */
const changeBoxOutput = new Output(); 

/* Create output and add to the changeBox transaction */
const outputExchange = new Output(); 
	  outputExchange.stack = new Stack();
	  outputExchange.script.fromArray([
	 	Convert.btc().id + "TOSTACK", // input hash of the type of units contained in the stack (must pass through from input)
	 	Convert.nrg().id + " 1000 LOCKSTACKIMMUTABLEEXP", // Stack can be dumped at block height 3000
	 	"PUSHDATA "+ changeBoxPair.address // Address of changeBox (optional OP_RETURN vs PUSHDATA) 
      ]);		

/* Prove you have loaded NRG to the change box with a second output */
const outputChangeBox = new Output()
      outputChangeBox.to = changeBoxPair.address;
      outputChangeBox.value = Convert.nrg(2, "nrg").toBosons(); 
     
	  /* Freeze 1000 NRG in the stack and send 2 NRG to the change box address*/
	  tx.addOutput(outputExchange);
      tx.addOutput(outputChangeBox);

/* Transfer the NRG from the Output TX to the Stack */
const stackInput = new StackInput()
      stackInput.script.fromRaw(Convert.nrg(1000, "nrg").toBosons() + "BALANCE");
	    output.stack.addInput(stackInput);

/*
 * blockHeight+aliceTxIdBtc aliceTxSig btcDepositAddress CHECKSIGCHAINBENEFACTOR
 * 
 *
 */

// SXF = 130   

const stackOutputBTC = new StackOutput()

	  stackOutputBTC.script.fromArray([
          "DUP",
          "PUSHDATA " + btcDepositPair.address,
          "PUSHDATA " + Convert.btc().id,
          "CHECKSIGCHAINBENEFACTOR", 
          "PUSHDATA " + Convert.nrg().id,
          "PUSHDATA 10", // 10 blocks of same kind in the block collider NRG chain  
          "PUSHDATA 5" // 5 confirmations for  
          "VERIFYBLOCKCHAINSEQUENCEGTE", // Ensures the txID provided is found in a number of blocks before it is redeemable 
          "PUSHDATA 1000", // this means that for 1000 NRG
          "BALANCEUNITS",
          "PUSHDATA "+ Convert.eth().id,
          "PUSHDATA "+ Convert.btc().id,
          "SWITCH",  // forces the verified blockchains switch every other time 
          "PUSHDATA "+Convert.btc().id,  
          "VERFIYSIGCLAIM", // Makes sure the signature provided is of the correct chain
          "PUSHDATA " + Convert.nrg().id,
          "PUSHDATA " + Convert.nrg(10, "nrg").toBosons(),
          "VERIFYLEASEDBALANCE" // this is the amount that must be leased 
      ]); 

      output.stack.addOutput(stackOutputBTC);


/* the tx object is now a fully contained transaction ready to sign and send to Block Collider. Happy trading! */


