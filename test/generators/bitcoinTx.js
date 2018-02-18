// ID we found n github: aR7WPNCrZhhnYRnn8yRT

const bitcoin = require('bitcoinjs-lib')

const user = bitcoin.ECPair.fromWIF('L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy')


class Bitcoin {

    getJSONTx() {

        const builder = new bitcoin.TransactionBuilder()

        builder.addInput('61d520ccb74288c96bc1a2b20ea1c0d5a704776dd0164a396efec3ea7040349d', 0) 
        builder.addOutput('1cMh228HTCiwS8ZsaakH8A8wze1JR5ZsP', 12000)

        builder.sign(0, user)

        console.log(Object.getPrototypeOf(builder.tx));
        console.log(builder.tx);

        return builder.build().toHex()

    }
    getSerializedTx() {
        //const tx = new EthereumTx(defaultTxParams)
        //return tx.serialize().toString("hex");
    }
    getSignedSerializedTx() {
        //const tx = new EthereumTx(defaultTxParams)
        //tx.sign(privateKey)
        //const serializedTx = tx.serialize()
        //return serializedTx.toString("hex");
    }

}

module.exports = Bitcoin;


const btc = new Bitcoin();


const stx = btc.getJSONTx();

console.log("------------");
console.log(stx);

