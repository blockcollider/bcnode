import assert from 'assert';

describe('Array', () => {
  describe('#indexOf()', () => {
    it('should return -1 when the value is not present', () => {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
  //describe('OP_CHECKSIGFROMCHAIN', () => {
  //  it('should validate the chain address data and signature', () => {
  //    const input = new Script([
  //       Opcode.fromData(new Buffer("n1ZCYg9YXtB5XCZazLxSmPDa8iwJRZHhGx")),
  //       Opcode.fromData(new Buffer("H/DIn8uA1scAuKLlCx+/9LnAcJtwQQ0PmcPrJUq90aboLv3fH5fFvY+vmbfOSFEtGarznYli6ShPr9RXwY9UrIY=")),
  //       Opcode.fromData(new Buffer("hello, world")),
  //       Opcode.fromData(new Buffer("btc")),
  //       Opcode.fromSymbol("checksigfromchain")
  //     ]);
  //  });
  //});
});
