/**
 * Copyright (c) 2017-present, blockcollider.org developers, All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
const crypto = require('crypto')
const { config } = require('./index')

type ContractRoverConfig = {|
  embContractId: string,
  web3ProviderUrl: string
|}

type AssetRoverConfig = {|
  embAssetId: string
|}

export type Network = {|
  id: number,
  roversTestnet: boolean,
  infoHash: string,
  portBase: number,
  quorum: number,
  maximumWaypoints: number,
  rovers: {
    btc: AssetRoverConfig,
    eth: ContractRoverConfig,
    lsk: AssetRoverConfig,
    neo: AssetRoverConfig,
    wav: AssetRoverConfig
  }
|}

export const networks: { [string]: Network } = {
  main: {
    id: 0x01,
    roversTestnet: false,
    infoHash: crypto.createHash('sha1').update('bcbt002' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 16060,
    quorum: 8,
    maximumWaypoints: 31,
    rovers: {
      btc: {
        // $FlowFixMe
        embAssetId: null
      },
      eth: {
        // $FlowFixMe
        embContractId: '0x28b94f58b11ac945341329dbf2e5ef7f8bd44225',
        web3ProviderUrl: 'https://mainnet.infura.io/v3/a0756ffad2704a62a790e751bb99ffac'
      },
      lsk: {
        // $FlowFixMe
        embAssetId: null
      },
      neo: {
        // $FlowFixMe
        embAssetId: null
      },
      wav: {
        // $FlowFixMe
        embAssetId: null
      }
    }
  },
  test: {
    id: 0x3e8,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt002_test' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xbfcde98b92722f9bc33a5ab081397cd2d5409748', // EMB contract id on ropsten
        web3ProviderUrl: 'https://ropsten.infura.io/a0756ffad2704a62a790e751bb99ffac'
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  carter: {
    id: 0x3e1,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt003_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  mckinley: {
    id: 0x3e2,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt004_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  garfield: {
    id: 0x3e3,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt005_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  lincoln: {
    id: 0x3e4,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt006_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  harding: {
    id: 0x3e5,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt007_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  kennedy: {
    id: 0x3e6,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt008_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  },
  coolidge: {
    id: 0x3e8,
    roversTestnet: true,
    infoHash: crypto.createHash('sha1').update('bcbt009_arc' + config.blockchainFingerprintsHash).digest('hex'),
    portBase: 36060,
    quorum: 2,
    maximumWaypoints: 8,
    rovers: {
      btc: {
        embAssetId: 'EMBX'
      },
      eth: {
        embContractId: '0xC95Fd6d744ca1c5D38b09f9F3094f636a2193F27' // EMB contract id on ropsten
      },
      lsk: {
        embAssetId: 'c7f7786a7da926011ad01234f9027396b0bbf5f9680faba4f2c42476341a22bb' // binance hot wallet for a test
      },
      neo: {
        embAssetId: '132947096727c84c7f9e076c90f08fec3bc17f18' // TKY for a test
      },
      wav: {
        embAssetId: 'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWP' // MER for a test
      }
    }
  }
}
