var DISABLED_OPCODES = [
  /* Bitwise logic */
  'OP_INVERT',
  'OP_AND',
  'OP_OR',
  'OP_XOR',
  /* Arithmetic */
  'OP_2MUL',
  'OP_2DIV',
  'OP_MUL',
  'OP_DIV',
  'OP_MOD',
  'OP_LSHIFT',
  'OP_RSHIFT'
]

var ASYNC_OPCODES = [
  'OP_DEPSET',
  'OP_X',
  'OP_Q',
  'OP_MAKERCOLL',
  'OP_CHECKSIGNODATA',
  'OP_CHECKSIGNODATAVERIFY',
  'OP_NONCELOCKBLC',
  'OP_MINUNITVALUE',
  'OP_MONOID',
  'OP_MONAD',
  'OP_ENDMONAD',
  'OP_TAKERPAIR',
  'OP_CALLBACK',
  'OP_MYLX',
  'OP_PROMISE',
  'OP_EMERGENCY',
  'OP_XMLRPC',
  'OP_RATEMARKET',
  'OP_FIX',
  'OP_ENVOUTPOINTUNIT',
  'OP_ENVOUTPOINTHASH',
  'OP_ENVOUTPOINTVALUE',
  'OP_ENVOUTPOINTNONCE',
  'OP_ENVOUTPOINTLOCKTIME',
  'OP_ENVOUTPOINTOVERLINE'
]

var MARKED_OPCODES = [
  'OP_DEPSET',
  'OP_MAKERCOLL',
  'OP_MARK',
  'OP_PROMISE'
]

var Validator = {

  /*
   * !!! THE ENTIRE SCRIPT INPUT + OUPUT MUST BE GIVEN !!!
   * Determines and builds query object for existing marked opcodes
   */
  includesMarkedOpcode (inputAndOutput) {
    var included = false
    var markedOperations = []
    var tray = []
    inputAndOutput.split(' ').forEach((chunk) => {
      if (chunk.indexOf('OP_') > -1) {
        if (MARKED_OPCODES.indexOf(chunk) > -1) {
          markedOperations.push({
            opCode: chunk,
            stack: [].concat(tray)
          })
        }
        // reset the stack after every OP_CODE
        tray.length = 0
      } else {
        tray.push(chunk)
      }
    })
    return markedOperations
  },

  includesCallbackOpcode (input) {
    return input.indexOf('OP_CALLBACK') > -1
  },

  includesAsyncOpcode (input) {
    var minIdx = null
    var minIdxOpcode = null
    ASYNC_OPCODES.forEach((opcode) => {
      var idx = input.indexOf(opcode)
      if (idx !== -1) {
        if (minIdx == null || idx < minIdx) {
          minIdx = idx
          minIdxOpcode = opcode
        }
      }
    })
    return minIdxOpcode
  },

  includesDisabledOpcode (input) {
    return Validator.getDisabledOpcode(input) != null
  },

  getDisabledOpcode (input) {
    var minIdx = null
    var minIdxOpcode = null
    DISABLED_OPCODES.forEach((opcode) => {
      var idx = input.indexOf(opcode)
      if (idx !== -1) {
        if (minIdx == null || idx < minIdx) {
          minIdx = idx
          minIdxOpcode = opcode
        }
      }
    })
    return minIdxOpcode
  },

  DisabledOpcodeException (input) {
    var disabledOpcode = Validator.getDisabledOpcode(input)
    this.toString = () => {
      return 'Included a disabled command: ' + disabledOpcode
    }
  }
}

module.exports = Validator
