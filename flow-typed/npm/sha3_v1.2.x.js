// flow-typed signature: 6c73686b0ee9bf9bd0b24f4992dbcffc
// flow-typed version: 6c557e299b/sha3_v1.2.x/flow_>=v0.56.x

declare module "sha3" {
  declare class SHA3Hash {
    constructor(hashLength?: 224 | 256 | 384 | 512): SHA3Hash;
    update(data: any, inputEncoding?: 'binary' | 'ascii' | 'utf8'): void;
    digest(type?: 'hex' | 'binary'): string;
  }

  declare module.exports: {
    SHA3Hash: Class<SHA3Hash>
  }
}
