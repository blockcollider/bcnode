const crypto = require('crypto')
const hash = crypto.createHash("sha256").update("test").digest("hex")
const MTX = require("../mtx.js")
const Output = require("../output.js")
const SubInput = require("../subinput.js")
const SubOutput = require("../suboutput.js")
const Script = require("../../script/script")
const Opcode = require("../../script/opcode")

const subInput = {
  prevout: {
    hash: hash,
    index: 0
  }
}

describe('primitives', () => {
  let output

  beforeEach(() => {
    output = new Output()
  })

  test('ouputs', () => {
    const subOutput = new SubOutput()

    subOutput.script.pushSym("HASH160")
    output.stack.addInput(subInput)
    output.stack.outputs.push(subOutput)

    expect(output.stack.inputs[0]).toBeInstanceOf(SubInput)
    expect(output.stack.inputs[0].prevout.hash).toBe("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")
    expect(output.stack.inputs[0].sequence).toBe(4294967295)
    expect(output.stack.mutable).toBe(true)
    expect(output.stack.outputs[0].script).toBeInstanceOf(Script)
    expect(output.stack.outputs[0].script.code[0]).toBeInstanceOf(Opcode)
    expect(output.stack.outputs[0].script.code[0].data).toBe(null)
    expect(output.stack.outputs[0].script.code[0].value).toBe(169)
  })

  test('input', () => {
    const input = {
      prevout: {
        hash: hash,
        index: 0
      }
    }
    const mtx = new MTX({
      inputs: [input]
    })

    mtx.outputs.push(output)

    expect(mtx.outputs[0].stack.outputs).toHaveLength(0)
  })
})
