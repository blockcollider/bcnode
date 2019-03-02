/**
 * Copyright (c) 2017-present, BlockCollider developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const { randomBytes } = require('crypto')
const fs = require('fs-extra')
const secp256k1 = require('secp256k1')
const { txInputSignature, newBlankTxs, signData, pubKeyToAddr, txHash, outPointOutputHash } = require('../../core/txUtils')
const { blake2bl, blake2blc } = require('../../utils/crypto')
const { getGenesisBlock } = require('../../bc/genesis')
const { TransactionOutput, TransactionInput, OutPoint, Transaction } = require('../../protos/core_pb')
const BN = require('bn.js')
const Interpreter = require('../index')
const PersistenceRocksDb = require('../../persistence/rocksdb').default
const { humanToBN, COIN_FRACS: { NRG } } = require('../../core/coin')

const TX_DEFAULT_FEE = humanToBN('100', NRG)

// jest.mock('../../persistence/rocksdb')

const randomPrivateKey = () => {
  let privKey
  do {
    privKey = randomBytes(32)
  } while (!secp256k1.privateKeyVerify(privKey))

  return privKey
}

describe('Interpreter', () => {
  // beforeEach(() => {
  //  // $FlowFixMe - flow is unable to properly type mocked module
  //  PersistenceRocksDb.mockClear()
  // })
  afterEach((done) => {
    // $FlowFixMe - flow is unable to properly type mocked module
    fs.remove('_test_data', done)
  })

  it('unlocks', () => {
    const privateKey = randomPrivateKey()
    // console.log('privKey', privateKey.toString('hex'))
    const dataToSign = randomBytes(128)
    const frog = randomBytes(128)
    // $FlowFixMe
    const signature: Buffer = signData(dataToSign, privateKey)

    const pubKey = secp256k1.publicKeyCreate(privateKey, true) // true => compressed
    // console.log('pubKey: ' + pubKey.toString('hex'))
    // console.log('frog: ' + blake2bl(frog.toString('hex')))
    // console.log('dataToSign: ' + blake2bl(dataToSign.toString('hex')))

    const address = pubKeyToAddr(secp256k1.publicKeyConvert(pubKey, false)).toString('hex')

    const inputUnlockScriptValid = [
      signature.toString('hex'), // .slice(3) + 'aaa',
      pubKey.toString('hex'),
      address
    ].join(' ')
    // console.log('signature: ' + signature.toString('hex'))

    const inputUnlockScriptBroken = [
      signature.toString('hex'), // .slice(3) + 'aaa',
      pubKey.toString('hex'),
      address
    ].join(' ')

    const outputLockScript = [
      'OP_BLAKE2BLC',
      blake2blc(address),
      'OP_EQUALVERIFY',
      'OP_CHECKSIGVERIFY'
    ].join(' ')

    // console.log('address: ' + address)
    // console.log('blake2blc(address): ' + blake2blc(address))

    let interpreter = new Interpreter({})
    expect(interpreter.unlock(outputLockScript, inputUnlockScriptValid, dataToSign, false)).toBe(true)
    interpreter = new Interpreter({})
    expect(interpreter.unlock(outputLockScript, inputUnlockScriptBroken, frog, false)).toBe(false)
  })

  it('evaluateAsync for NRG transfer tx validation', async () => {
    const privateKey = randomPrivateKey()
    const pubKey = secp256k1.publicKeyCreate(privateKey, true) // true => compressed
    const address = pubKeyToAddr(secp256k1.publicKeyConvert(pubKey, false)).toString('hex')

    const txTemplate = new Transaction()
    const txOutput = new TransactionOutput()
    const outputLockScript = [
      'OP_BLAKE2BL',
      blake2bl(blake2bl(address)),
      'OP_EQUALVERIFY',
      'OP_CHECKSIGVERIFY'
    ].join(' ')
    txOutput.setValue(new Uint8Array(new BN(16).toBuffer()))
    txOutput.setUnit(new Uint8Array(new BN(1).toBuffer()))
    txOutput.setScriptLength(outputLockScript.length)
    txOutput.setOutputScript(new Uint8Array(Buffer.from(outputLockScript, 'ascii')))
    txTemplate.setOutputsList([txOutput])
    txTemplate.setNoutCount(1)

    const txInput = new TransactionInput()

    const outPoint = new OutPoint()
    outPoint.setValue(new BN(32).toBuffer())
    outPoint.setHash(blake2bl('i am hash'))
    outPoint.setIndex(0)

    const signature = txInputSignature(outPoint, txTemplate, privateKey)
    txInput.setOutPoint(outPoint)
    const inputUnlockScriptValid = [
      signature.toString('hex'),
      pubKey.toString('hex'),
      blake2bl(address)
    ].join(' ')
    txInput.setScriptLength(inputUnlockScriptValid.length)
    txInput.setInputScript(new Uint8Array(Buffer.from(inputUnlockScriptValid, 'ascii')))

    let interpreter = new Interpreter({})
    expect(await interpreter.evaluateAsync(outputLockScript, inputUnlockScriptValid, txInput, txTemplate)).toBe(true)

    interpreter = new Interpreter({})
    const invalidSignature = signData(randomBytes(128), privateKey)
    const inputUnlockScriptBroken = [
      invalidSignature.toString('hex'),
      pubKey.toString('hex'),
      blake2bl(address)
    ].join(' ')
    expect(await interpreter.evaluateAsync(outputLockScript, inputUnlockScriptBroken, txInput, txTemplate)).toBe(false)
  })

  // it('OP_DEPSET it passes if current height in deposit window', (done) => {
  //  const promiseFunctions = async () => {
  //    const persistence = new PersistenceRocksDb('./_test_data')
  //    await persistence.open()

  //    const childInputBlock = getGenesisBlock()
  //    childInputBlock.setHash('9120c8bafedecc2b720e3accdc94f8810e54f7b1734cfc8470dc3cfe7c2f9805')
  //    childInputBlock.setHeight(880)

  //    // precidents and superlatives

  //    await persistence.put('bc.block.latest', childInputBlock)
  //    await persistence.put(`bc.block.${childInputBlock.getHash()}`, childInputBlock)
  //    await persistence.put(`bc.block.${getGenesisBlock().getHash()}`, getGenesisBlock())

  //    const outputValue = new BN(10000000).sub(TX_DEFAULT_FEE).toBuffer()
  //    const outputUnit = new BN(1).toBuffer()
  //    const interpreter = new Interpreter(persistence)
  //    const childPrivKey = randomPrivateKey()
  //    const childPubKey = secp256k1.publicKeyCreate(childPrivKey, false) // false => uncompressed
  //    const childPubAddr = pubKeyToAddr(childPubKey.slice(1))

  //    const pairTx = newBlankTxs()
  //    const parentTx = pairTx[0]
  //    const childTx = pairTx[1]

  //    const key = `bc.txs.${getGenesisBlock().getHash()}`
  //    await interpreter.persistence.del(key)

  //    const parentOutputScript = [
  //      '0',
  //      '450',
  //      '800',
  //      'OP_DEPSET',
  //      '3',
  //      'OP_GATE',
  //      'OP_BLAKE2BL',
  //      blake2bl(blake2bl(childPubAddr)),
  //      'OP_EQUALVERIFY',
  //      'OP_CHECKSIGNOPUBKEYVERIFY'
  //    ].join(' ')

  //    const scriptBuffer = Buffer.from(parentOutputScript, 'ascii')

  //    const parentOutput = new TransactionOutput([
  //      new Uint8Array(outputValue), // output.value - fee
  //      new Uint8Array(outputUnit),
  //      scriptBuffer.length,
  //      new Uint8Array(scriptBuffer)
  //    ])

  //    const parentOutPoint = new OutPoint()
  //    parentOutPoint.setValue(new Uint8Array(outputValue))
  //    parentOutPoint.setHash(getGenesisBlock().getHash()) // references block hash as coinbase
  //    parentOutPoint.setIndex(0)

  //    const parentSignature = txInputSignature(parentOutPoint, parentTx, childPrivKey).toString('hex')
  //    const parentDataToSign = outPointOutputHash(parentOutPoint, parentTx.getOutputsList())

  //    const parentInputScript = [
  //      blake2bl(parentDataToSign), // <-- this will be assembled while verifying the TX
  //      parentSignature,
  //      blake2bl(childPubAddr)
  //    ].join(' ')

  //    const parentInput = new TransactionInput()
  //    parentInput.setOutPoint(parentOutPoint)
  //    parentInput.setScriptLength(parentInputScript.length)
  //    parentInput.setInputScript(new Uint8Array(Buffer.from(parentInputScript, 'ascii')))

  //    parentTx.setVersion(1)
  //    parentTx.setNonce('0')
  //    parentTx.setInputsList([parentInput])
  //    parentTx.setOutputsList([parentOutput])
  //    parentTx.setNinCount(1)
  //    parentTx.setNoutCount(1)
  //    parentTx.setOverline('0')
  //    parentTx.setLockTime('0')

  //    const parentHash = txHash(parentTx)
  //    parentTx.setHash(parentHash.toString('hex'))

  //    const putTx = await interpreter.persistence.putTransaction(parentTx, getGenesisBlock().getHash(), 0, 'bc', { asBuffer: true })
  //    if (putTx === undefined || putTx === false) {
  //      return Promise.reject(new Error('failed to persist tx'))
  //    }

  //    const childOutputScript = [
  //      'OP_BLAKE2BL',
  //      blake2bl(blake2bl(childPubAddr)), // child pays to itself
  //      'OP_EQUALVERIFY',
  //      'OP_CHECKSIGNOPUBKEYVERIFY'
  //    ].join(' ')

  //    const childOutput = new TransactionOutput([
  //      new Uint8Array(outputValue),
  //      new Uint8Array(outputUnit),
  //      childOutputScript.length,
  //      new Uint8Array(Buffer.from(childOutputScript, 'ascii'))
  //    ])

  //    childTx.setOutputsList([childOutput])

  //    // test function spends to itself
  //    const outpoint = new OutPoint()
  //    outpoint.setValue(new Uint8Array(outputValue))
  //    outpoint.setHash(parentHash.toString('hex')) // set the tx hash of the parent output tx
  //    outpoint.setIndex(0) // index of the tx parent output

  //    const signature = txInputSignature(outpoint, childTx, childPrivKey).toString('hex')
  //    const dataToSign = outPointOutputHash(outpoint, childTx.getOutputsList())
  //    const childInputScript = [
  //      blake2bl(dataToSign), // <-- this will be assembled while verifying the TX
  //      signature,
  //      blake2bl(childPubAddr)
  //    ].join(' ')

  //    const childInput = new TransactionInput()
  //    childInput.setOutPoint(outpoint)
  //    childInput.setScriptLength(childInputScript.length)
  //    childInput.setInputScript(new Uint8Array(Buffer.from(childInputScript, 'ascii')))

  //    childTx.setVersion(1)
  //    childTx.setInputsList([childInput])
  //    childTx.setNinCount(1)
  //    childTx.setNoutCount(1)
  //    childTx.setNonce('0')
  //    childTx.setOverline('0')
  //    childTx.setLockTime(0)

  //    childTx.setHash(txHash(childTx))

  //    const res = await interpreter.evaluateAsync(parentOutputScript, childInputScript, childInput, childTx, false)
  //    persistence = null
  //    return res
  //  }

  //  promiseFunctions().then((env) => {
  //    expect(env).toBe(true)

  //    done()
  //  })
  // })
  // it('OP_CALLBACK restricts execution to monadic outpoint', (done) => {
  //  const promiseFunctions = async () => {
  //    /*
  //   * this situation would occur if a user was spending a taker transaction
  //   */
  //    const persistence = new PersistenceRocksDb('./_test_data')
  //    await persistence.open()

  //    const childInputBlock = getGenesisBlock()
  //    childInputBlock.setHash('9120c8bafedecc2b720e3accdc94f8810e54f7b1734cfc8470dc3cfe7c2f9805')
  //    childInputBlock.setHeight(480)

  //    await persistence.put('bc.block.latest', childInputBlock)
  //    await persistence.put(`bc.block.${childInputBlock.getHash()}`, childInputBlock)
  //    await persistence.put(`bc.block.${getGenesisBlock().getHash()}`, getGenesisBlock())

  //    const outputValue = new BN(10000000).sub(TX_DEFAULT_FEE).toBuffer()
  //    const outputUnit = new BN(1).toBuffer()
  //    const interpreter = new Interpreter(persistence)
  //    const childPrivKey = randomPrivateKey()
  //    const childPubKey = secp256k1.publicKeyCreate(childPrivKey, false) // false => uncompressed
  //    const childPubAddr = pubKeyToAddr(childPubKey.slice(1))

  //    const pairTx = newBlankTxs(3)
  //    const callbackTx = pairTx[0]
  //    const parentTx = pairTx[1]
  //    const childTx = pairTx[2]

  //    const parentOutPoint = new OutPoint()
  //    parentOutPoint.setValue(new Uint8Array(outputValue))
  //    parentOutPoint.setHash(getGenesisBlock().getHash()) // references block hash as coinbase
  //    parentOutPoint.setIndex(0)

  //    const parentOutputScript = [
  //      getGenesisBlock().getHash().toString('hex'),
  //      '0',
  //      'OP_CALLBACK',
  //      'OP_BLAKE2BL',
  //      blake2bl(blake2bl(childPubAddr)),
  //      'OP_EQUALVERIFY',
  //      'OP_CHECKSIGNOPUBKEYVERIFY'
  //    ].join(' ')

  //    const scriptBuffer = Buffer.from(parentOutputScript, 'ascii')

  //    const parentOutput = new TransactionOutput([
  //      new Uint8Array(outputValue), // output.value - fee
  //      new Uint8Array(outputUnit),
  //      scriptBuffer.length,
  //      new Uint8Array(scriptBuffer)
  //    ])

  //    const parentSignature = txInputSignature(parentOutPoint, parentTx, childPrivKey).toString('hex')
  //    const parentDataToSign = outPointOutputHash(parentOutPoint, parentTx.getOutputsList())

  //    const parentInputScript = [
  //      blake2bl(parentDataToSign), // <-- this will be assembled while verifying the TX
  //      parentSignature,
  //      blake2bl(childPubAddr)
  //    ].join(' ')

  //    const parentInput = new TransactionInput()
  //    parentInput.setOutPoint(parentOutPoint)
  //    parentInput.setScriptLength(parentInputScript.length)
  //    parentInput.setInputScript(new Uint8Array(Buffer.from(parentInputScript, 'ascii')))

  //    parentTx.setVersion(1)
  //    parentTx.setNonce('0')
  //    parentTx.setInputsList([parentInput])
  //    parentTx.setOutputsList([parentOutput])
  //    parentTx.setNinCount(1)
  //    parentTx.setNoutCount(1)
  //    parentTx.setOverline('0')
  //    parentTx.setLockTime('0')

  //    // !! Force overriding the hash for this test only !!
  //    const parentHash = txHash(parentTx)
  //    parentTx.setHash(parentHash.toString('hex'))

  //    const callbackOutPoint = new OutPoint()
  //    callbackOutPoint.setValue(new Uint8Array(outputValue))
  //    callbackOutPoint.setHash(getGenesisBlock().getHash()) // references block hash as coinbase
  //    callbackOutPoint.setIndex(0)

  //    const callbackOutputScript = [
  //      'OP_BLAKE2BL',
  //      blake2bl(blake2bl(childPubAddr)),
  //      'OP_EQUALVERIFY',
  //      'OP_CHECKSIGNOPUBKEYVERIFY'
  //    ].join(' ')

  //    const callbackScriptBuffer = Buffer.from(callbackOutputScript, 'ascii')

  //    const callbackOutput = new TransactionOutput([
  //      new Uint8Array(outputValue), // output.value - fee
  //      new Uint8Array(outputUnit),
  //      scriptBuffer.length,
  //      new Uint8Array(callbackScriptBuffer)
  //    ])

  //    const callbackSignature = txInputSignature(callbackOutPoint, callbackTx, childPrivKey).toString('hex')
  //    const callbackDataToSign = outPointOutputHash(callbackOutPoint, callbackTx.getOutputsList())

  //    const callbackInputScript = [
  //      blake2bl(callbackDataToSign), // <-- this will be assembled while verifying the TX
  //      callbackSignature,
  //      blake2bl(childPubAddr)
  //    ].join(' ')

  //    const callbackInput = new TransactionInput()
  //    callbackInput.setOutPoint(callbackOutPoint)
  //    callbackInput.setScriptLength(callbackInputScript.length)
  //    callbackInput.setInputScript(new Uint8Array(Buffer.from(callbackInputScript, 'ascii')))

  //    callbackTx.setVersion(1)
  //    callbackTx.setNonce('0')
  //    callbackTx.setInputsList([callbackInput])
  //    callbackTx.setOutputsList([callbackOutput])
  //    callbackTx.setNinCount(1)
  //    callbackTx.setNoutCount(1)
  //    callbackTx.setOverline('0')
  //    callbackTx.setLockTime('0')

  //    // !! Force overriding the hash for this test only !!
  //    // const parentHash = txHash(parentTx)
  //    // parentTx.setHash(parentHash.toString('hex'))
  //    callbackTx.setHash(getGenesisBlock().getHash().toString('hex'))

  //    // const key = `bc.txs.${getGenesisBlock().getHash()}`
  //    // await interpreter.persistence.del(key)

  //    // const key = `bc.txs.${getGenesisBlock().getHash()}`
  //    // await interpreter.persistence.del(key)

  //    const putCallbackTx = await interpreter.persistence.putTransaction(callbackTx, getGenesisBlock().getHash(), 0, 'bc', { asBuffer: true })
  //    if (putCallbackTx === undefined || putCallbackTx === false) {
  //      return Promise.reject(new Error('failed to persist tx'))
  //    }

  //    const putTx = await interpreter.persistence.putTransaction(parentTx, childInputBlock.getHash(), 0, 'bc', { asBuffer: true })
  //    if (putTx === undefined || putTx === false) {
  //      return Promise.reject(new Error('failed to persist tx'))
  //    }

  //    const childOutputScript = [
  //      'OP_BLAKE2BL',
  //      blake2bl(blake2bl(childPubAddr)), // child pays to itself
  //      'OP_EQUALVERIFY',
  //      'OP_CHECKSIGNOPUBKEYVERIFY'
  //    ].join(' ')

  //    const childOutput = new TransactionOutput([
  //      new Uint8Array(outputValue),
  //      new Uint8Array(outputUnit),
  //      childOutputScript.length,
  //      new Uint8Array(Buffer.from(childOutputScript, 'ascii'))
  //    ])

  //    childTx.setOutputsList([childOutput])

  //    // test function spends to itself
  //    const outpoint = new OutPoint()
  //    outpoint.setValue(new Uint8Array(outputValue))
  //    outpoint.setHash(getGenesisBlock().getHash().toString('hex')) // set the tx hash of the parent output tx
  //    outpoint.setIndex(0) // index of the tx parent output

  //    const signature = txInputSignature(outpoint, childTx, childPrivKey).toString('hex')
  //    const dataToSign = outPointOutputHash(outpoint, childTx.getOutputsList())
  //    const childInputScript = [
  //      blake2bl(dataToSign), // <-- this will be assembled while verifying the TX
  //      signature,
  //      blake2bl(childPubAddr)
  //    ].join(' ')

  //    const childInput = new TransactionInput()
  //    childInput.setOutPoint(outpoint)
  //    childInput.setScriptLength(childInputScript.length)
  //    childInput.setInputScript(new Uint8Array(Buffer.from(childInputScript, 'ascii')))

  //    childTx.setVersion(1)
  //    childTx.setInputsList([childInput])
  //    childTx.setNinCount(1)
  //    childTx.setNoutCount(1)
  //    childTx.setNonce('0')
  //    childTx.setOverline('0')
  //    childTx.setLockTime(0)

  //    childTx.setHash(txHash(childTx).toString('hex'))

  //    const res = await interpreter.parseAsync(parentOutputScript, childInputScript, childInput, childTx, false)
  //    persistence = null
  //    return res
  //  }

  //  promiseFunctions().then((res) => {
  //    if (res.env !== undefined) {
  //      expect(res.env.CALLBACK_TX).not.toBe(true)
  //    } else {
  //      expect(res).toBe(true)
  //    }
  //    done()
  //  })
  // })

  it('OP_MONAD operator on subsets', (done) => {
    const promiseFunctions = async () => {
    /*
     * this situation would occur if a user was spending a taker transaction
     */
      let persistence = new PersistenceRocksDb('./_test_data')
      await persistence.open()

      const childInputBlock = getGenesisBlock()
      childInputBlock.setHash('9120c8bafedecc2b720e3accdc94f8810e54f7b1734cfc8470dc3cfe7c2f9805')
      childInputBlock.setHeight(480)

      await persistence.put('bc.block.latest', childInputBlock)
      await persistence.put(`bc.block.${childInputBlock.getHash()}`, childInputBlock)
      await persistence.put(`bc.block.${getGenesisBlock().getHash()}`, getGenesisBlock())

      const outputValue = new BN(10000000).sub(TX_DEFAULT_FEE).toBuffer()
      const outputUnit = new BN(1).toBuffer()
      const interpreter = new Interpreter(persistence)
      const childPrivKey = randomPrivateKey()
      const childPubKey = secp256k1.publicKeyCreate(childPrivKey, false) // false => uncompressed
      const childPubAddr = pubKeyToAddr(childPubKey.slice(1)).toString('hex')

      const pairTx = newBlankTxs(3)
      const callbackTx = pairTx[0]
      const parentTx = pairTx[1]
      const childTx = pairTx[2]

      const parentOutPoint = new OutPoint()
      parentOutPoint.setValue(new Uint8Array(outputValue))
      parentOutPoint.setHash(getGenesisBlock().getHash()) // references block hash as coinbase
      parentOutPoint.setIndex(0)

      const parentOutputScript = [
        childPubAddr,
        'OP_BLAKE2BLC',
        blake2blc(childPubAddr),
        'OP_EQUALVERIFY',
        'OP_CHECKSIGNOPUBKEYVERIFY'
      ].join(' ')

      const scriptBuffer = Buffer.from(parentOutputScript, 'ascii')

      const parentOutput = new TransactionOutput([
        new Uint8Array(outputValue), // output.value - fee
        new Uint8Array(outputUnit),
        scriptBuffer.length,
        new Uint8Array(scriptBuffer)
      ])

      const parentSignature = txInputSignature(parentOutPoint, parentTx, childPrivKey).toString('hex')
      const parentDataToSign = outPointOutputHash(parentOutPoint, parentTx.getOutputsList())

      const parentInputScript = [
        blake2bl(parentDataToSign), // <-- this will be assembled while verifying the TX
        parentSignature,
        blake2bl(childPubAddr)
      ].join(' ')

      const parentInput = new TransactionInput()
      parentInput.setOutPoint(parentOutPoint)
      parentInput.setScriptLength(parentInputScript.length)
      parentInput.setInputScript(new Uint8Array(Buffer.from(parentInputScript, 'ascii')))

      parentTx.setVersion(1)
      parentTx.setNonce('0')
      parentTx.setInputsList([parentInput])
      parentTx.setOutputsList([parentOutput])
      parentTx.setNinCount(1)
      parentTx.setNoutCount(1)
      parentTx.setOverline('0')
      parentTx.setLockTime('0')

      // !! Force overriding the hash for this test only !!
      const parentHash = txHash(parentTx)
      parentTx.setHash(parentHash.toString('hex'))

      const callbackOutPoint = new OutPoint()
      callbackOutPoint.setValue(new Uint8Array(outputValue))
      callbackOutPoint.setHash(getGenesisBlock().getHash()) // references block hash as coinbase
      callbackOutPoint.setIndex(0)

      const callbackOutputScript = [
        'OP_BLAKE2BLC',
        blake2blc(childPubAddr),
        'OP_EQUALVERIFY',
        'OP_CHECKSIGNODATAVERIFY'
      ].join(' ')

      const callbackScriptBuffer = Buffer.from(callbackOutputScript, 'ascii')

      const callbackOutput = new TransactionOutput([
        new Uint8Array(outputValue), // output.value - fee
        new Uint8Array(outputUnit),
        scriptBuffer.length,
        new Uint8Array(callbackScriptBuffer)
      ])

      const callbackSignature = txInputSignature(callbackOutPoint, callbackTx, childPrivKey).toString('hex')
      const callbackDataToSign = outPointOutputHash(callbackOutPoint, callbackTx.getOutputsList())

      const callbackInputScript = [
        blake2bl(callbackDataToSign), // <-- this will be assembled while verifying the TX
        callbackSignature,
        blake2bl(childPubAddr)
      ].join(' ')

      const callbackInput = new TransactionInput()
      callbackInput.setOutPoint(callbackOutPoint)
      callbackInput.setScriptLength(callbackInputScript.length)
      callbackInput.setInputScript(new Uint8Array(Buffer.from(callbackInputScript, 'ascii')))

      callbackTx.setVersion(1)
      callbackTx.setNonce('0')
      callbackTx.setInputsList([callbackInput])
      callbackTx.setOutputsList([callbackOutput])
      callbackTx.setNinCount(1)
      callbackTx.setNoutCount(1)
      callbackTx.setOverline('0')
      callbackTx.setLockTime('0')

      // !! Force overriding the hash for this test only !!
      // const parentHash = txHash(parentTx)
      // parentTx.setHash(parentHash.toString('hex'))
      callbackTx.setHash(getGenesisBlock().getHash().toString('hex'))

      // const key = `bc.txs.${getGenesisBlock().getHash()}`
      // await interpreter.persistence.del(key)

      // const key = `bc.txs.${getGenesisBlock().getHash()}`
      // await interpreter.persistence.del(key)

      const putCallbackTx = await interpreter.persistence.putTransaction(callbackTx, getGenesisBlock().getHash(), 0, 'bc', { asBuffer: true })
      if (putCallbackTx === undefined || putCallbackTx === false) {
        return Promise.reject(new Error('failed to persist tx'))
      }

      const putTx = await interpreter.persistence.putTransaction(parentTx, childInputBlock.getHash(), 0, 'bc', { asBuffer: true })
      if (putTx === undefined || putTx === false) {
        return Promise.reject(new Error('failed to persist tx'))
      }

      const childOutputScript = [
        childPubAddr,
        'OP_BLAKE2BLC',
        blake2blc(childPubAddr), // child pays to itself
        'OP_EQUALVERIFY',
        'OP_CHECKSIGNOPUBKEYVERIFY'
      ].join(' ')

      const childOutput = new TransactionOutput([
        new Uint8Array(outputValue),
        new Uint8Array(outputUnit),
        childOutputScript.length,
        new Uint8Array(Buffer.from(childOutputScript, 'ascii'))
      ])

      childTx.setOutputsList([childOutput])

      // test function spends to itself
      const outpoint = new OutPoint()
      outpoint.setValue(new Uint8Array(outputValue))
      outpoint.setHash(getGenesisBlock().getHash().toString('hex')) // set the tx hash of the parent output tx
      outpoint.setIndex(0) // index of the tx parent output

      const signature = txInputSignature(outpoint, childTx, childPrivKey).toString('hex')
      const dataToSign = outPointOutputHash(outpoint, childTx.getOutputsList())
      const childInputScript = [
        blake2bl(dataToSign), // <-- this will be assembled while verifying the TX
        signature,
        blake2bl(childPubAddr)
      ].join(' ')

      const childInput = new TransactionInput()
      childInput.setOutPoint(outpoint)
      childInput.setScriptLength(childInputScript.length)
      childInput.setInputScript(new Uint8Array(Buffer.from(childInputScript, 'ascii')))

      childTx.setVersion(1)
      childTx.setInputsList([childInput])
      childTx.setNinCount(1)
      childTx.setNoutCount(1)
      childTx.setNonce('0')
      childTx.setOverline('0')
      childTx.setLockTime(0)

      childTx.setHash(txHash(childTx).toString('hex'))

      try {
        const res = await interpreter.parseAsync(parentOutputScript, childInputScript, childInput, childTx, false)
        persistence = null
        return res
      } catch (err) {
        done(err)
      }
    }

    promiseFunctions().then((res) => {
      if (res !== undefined && res.env !== undefined) {
        expect(res.env.CALLBACK_TX).not.toBe(true)
      } else {
        expect(res).not.toBe(undefined)
      }
      done()
    })
  })
})
