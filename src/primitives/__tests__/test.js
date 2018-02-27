const crypto = require('crypto')
const hash = crypto.createHash("sha256").update("test").digest("hex")
const MTX = require("../mtx")
const Output = require("../output.js")
const StackInput = require("../stackinput.js")
const StackOutput = require("../stackoutput.js")
const Script = require("../../script/script")
const Opcode = require("../../script/opcode")

const stackInput = {
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
    const stackOutput = new StackOutput()

    stackOutput.script.pushSym("HASH160")
    output.stack.addInput(stackInput)
    output.stack.outputs.push(stackOutput)

    expect(output.stack.inputs[0]).toBeInstanceOf(StackInput)
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
