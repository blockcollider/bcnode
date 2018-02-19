
/*
 *  Stable Coin using modified Bitcoin Script (BEAM) on Block Collider
 *
 *  Ex. Deploy a fixed supply token supply stablecoin with managed issuance 
 *  as a basket of assets on Waves, Ethereum, and NEO. Compatible with Basecoin!
 *
 *  WHAT YOU GET FROM RUNNING THIS
 *  1. Fixed supply token deployed on Waves, Ethereum, and NEO blockchains managed by your account.
 *  2. Token is fully owned by you but people once they have it can sell it back to you for a fixed NRG rate.
 *  3. NRG is locked up from your account to a Stablecoin address deployed to the Block Collider. 
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

/* Polyglot is an abstraction layer for multiple smart contract languages */
const poly = new Polyglot({ log: false });


/* 
 * DEFAULT: Waves Token Asset 
 * REF: https://github.com/wavesplatform/Waves/wiki/Waves-Node-REST-API#post-assetsissue 
 */
const wavToken = poly.wav.createToken({
    name: 'STAC',
    description: 'Some choice words',
    quantity: 10000000000, // Equates to 100000.00000 tokens
    precision: 5, 
    reissuable: false,
    fee: 100000000,
    timestamp: Date.now()
}).deploy(account);

/* 
 * DEFAULT: ERC20 
 * REF: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md 
 */
const ethToken = poly.eth.createToken({
	name: 'Stable Coin',
	symbol: "STAC",
	decimals: 18,
	totalSupply: 100000 * 10**uint(decimals),
	owner: ""	
}).deploy(account);

/* 
 * DEFAULT: Nep5 NEO Token Contract from Trinity Scaling Technology 
 * REF: https://github.com/trinity-project/trinity/blob/master/contract/trinity-contract/nep5_contract/Contract1.cs
 */
const neoToken = poly.neo.createToken({
	name: 'Stable Coin',
	symbol: "STAC",
	decimals: 18,
	totalSupply: 100000 * 10**uint(18),
	owner: ""	
}).deploy(account);

/* Create default Block Collider Transaction! */
const tx = poly.collider.tx();

/* Create output which contains a stack */
const output = new Output(); 
	  output.stack = new Stack();
	  output.script.fromArray([
	 	Convert.nrg().id + "TOSTACK", // input hash of the type of units contained in the stack (must pass through from input)
	 	Convert.nrg().id + " 600000 LOCKSTACKIMMUTABLEEXP" // Stack can be dumped at block height 600000 
      ]);		

	  /* Fuel the transation with unspent NRG */
	  tx.addInput(account.uxto[0]);

	  /* Stacks are directly assigned an output or a dedicated output is automatically created if added to stack */
	  tx.addOutput(output);

	  /* Assign stack to output */
	  tx.addOutput(output);

/* Transfer the NRG from the Output TX to the Stack */
const stackInput = new StackInput()
      stackInput.script.fromRaw(Convert.nrg(30, "nrg").toBosons() + "BALANCE");

	  output.stack.addInput(stackInput);

/* Create the script logic the stack must follow */
const wavOutput = new StackOutput()
	  wavOutput.script.fromArray([
          "OVER",
          "SWAP",
          "PUSHDATA " + Convert.wav().id,
          "VERFIYSIGCLAIM", // Makes sure the signature provided is of the correct chain
          "DUP",
          "PUSHDATA " + wavToken.address(),
          "PUSHDATA " + Convert.wav().id,
          "CHECKSIGCHAINBENEFACTOR", 
          "PUSHDATA " + Convert.wav().id,
          "PUSHDATA 5",
          "PUSHDATA 100"
          "VERIFYBLOCKCHAINSEQUENCEGTE", // Ensures the txID provided is found in a number of blocks before it is redeemable 
          "PUSHDATA 10", // this means that for 10 waves STAC TOKEN you can redeem 1 NRG 
          "BALANCEUNITS",
          "PUSHDATA " + Convert.nrg(10, "nrg").toBosons(),
          "BALANCE"
      ]); 

/* Add the remaining two tokens */
const ethOutput = new StackOutput(); 
      ethOutput.script.fromArray([ "OVER", "SWAP", "PUSHDATA " + Convert.eth().id, "VERFIYSIGCLAIM", "DUP", "PUSHDATA " + ethToken.address(), "PUSHDATA " + Convert.eth().id, "CHECKSIGCHAINBENEFACTOR", "PUSHDATA " + Convert.eth().id, "PUSHDATA 5", "PUSHDATA 100" "VERIFYBLOCKCHAINSEQUENCEGTE", "PUSHDATA 10", "BALANCEUNITS", "PUSHDATA " + Convert.nrg(10, "nrg").toBosons(), "BALANCE" ]); 

const neoOutput = new StackOutput(); 
      neoOutput.script.fromArray([ "OVER", "SWAP", "PUSHDATA " + Convert.neo().id, "VERFIYSIGCLAIM", "DUP", "PUSHDATA " + neoToken.address(), "PUSHDATA " + Convert.neo().id, "CHECKSIGCHAINBENEFACTOR", "PUSHDATA " + Convert.neo().id, "PUSHDATA 5", "PUSHDATA 100" "VERIFYBLOCKCHAINSEQUENCEGTE", "PUSHDATA 10", "BALANCEUNITS", "PUSHDATA " + Convert.nrg(10, "nrg").toBosons(), "BALANCE" ]); 
	  
	  /* Add all stable coin addresses to the stack */
	  output.stack.addOutput(wavOutput);
	  output.stack.addOutput(ethOutput);
	  output.stack.addOutput(neoOutput);


/* the tx object is now a fully contained transaction ready to sign and send to Block Collider! */


