const ethTx = require('ethereumjs-tx');

const txParams = {
  nonce: '0x6', // Replace by nonce for your account on geth node
  gasPrice: '0x09184e72a000', 
  gasLimit: '0x30000',
  to: '0xfa3caabc8eefec2b5e2895e5afbf79379e7268a7', 
  value: '0x00'
};

// Transaction is created
const tx = new ethTx(txParams);
const privKey = Buffer.from('05a20149c1c76ae9da8457435bf0224a4f81801da1d8204cb81608abe8c112ca', 'hex');
// Transaction is signed
tx.sign(privKey);
console.log(tx);
const serializedTx = tx.serialize();
const rawTx = '0x' + serializedTx.toString('hex');
console.log(rawTx)
