const Block = require('../block');

describe('Block', () => {
  it('can instantiate self', () => {
    expect(new Block()).toBeInstanceIf(Block);
  })
});
