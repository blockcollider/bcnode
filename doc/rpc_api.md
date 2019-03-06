# RPC API

In order to begin calling the BC RPC Interface, make sure to run your miner using the `--rpc` and `--scookie=testCookie123` flags. You can replace `testCookie123` with any string. Each of the calls will be sent using the following method.
```javascript
// npm i node-fetch is you have not installed node-fetch
const fetch = require('node-fetch');

var url = 'https://localhost:3000/rpc'; //-replace 3000 with the port you are running the miner on
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

let auth = 'Basic ' + btoa(':testCookie123');

fetch(url, {
    method: 'post',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': auth
    },
    body: JSON.stringify(body) //the following methods will give example of the body construction
}).then((response) => {
    response.json().then(function(data) {
      console.log(data);
    });
}).catch((err) => {
    console.error('err')
    console.error(err)
})
```

### Get Balance
This will return the Unconfirmed and Confirmed NRG Balance of the specified address.
```javascript
// string  bc_address = 1;
var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'getBalance',
    params: [
        'BC_ADDRESS',
    ]
}
```

### Get Blake Hash
This will return a string that has been hashed `n` number of times using blake2bl.
```javascript
var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'getBlake2bl',
    params: ['BC_ADDRESS', 2] //this will return blake2bl(blake2bl(bc_address))
};
```

### Place Maker Order
This will submit a maker order to your miner and return the tx hash if succesful, and an error if not.
```javascript
// maker wants 1 btc and sends 10 eth

// uint64  shift_starts_at = 1; - how many blocks in the future the order is activated
// uint64  deposit_ends_at = 2; - how many blocks in the future the order can be traded until
// uint64  settle_ends_at = 3; - how many blocks in the future the order can be settled until
// string  pays_with_chain_id = 4; - lowercase symbol of the chain you are going to pay in (i.e - 'btc','eth','wav','lsk','neo')
// string  wants_chain_id = 5; - lowercase symbol of the chain you are going to recieve in (i.e - 'btc','eth','wav','lsk','neo')
// string  wants_chain_address = 6; - address of the chain you want to recieve in
// string  wants_unit = 7; - the amount of the want_chain_id you are requesting
// string  pays_unit = 8; - the amount of the pays_with_chain_id you are willing to pay
// string  bc_address = 9; - the ETH Address of your BSEC Wallet
// string  bc_private_key_hex = 10; - the hex version of your ETH Private Key of your BSEC Wallet
// string  collateralized_nrg = 11; - the amount of NRG you are collateralizing in this order
// string  nrg_unit = 12; - this minimum amount of NRG a taker must submit to partially take this order.

var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'placeMakerOrder',
    params: [
        0, 150, 200000,
        'btc', 'eth', 'BTC_ADDRESS', '10', '1',
        'BC_ADDRESS', 'BC_PRIVATE_KEY_HEX',
        '6', '1'
    ]
}
```


### Place Taker Order
This will submit a taker order to your miner and return the tx hash if succesful, and an error if not.
```javascript
// maker wants 1 btc and sends 10 eth
// taker wants 5 eth and sends 0.5 btc

// string  wants_chain_address = 1; -  address of the chain you want to recieve in
// string  sends_chain_address = 2; -  address of the chain you will pay from
// string  maker_tx_hash = 3; - tx hash of the order you are taking
// uint32  maker_tx_output_index = 4; - output_index as retrieved from getOpenOrders for that maker tx
// string  bc_address = 5; - the ETH Address of your BSEC Wallet
// string  bc_private_key_hex = 6; - the hex version of your ETH Private Key of your BSEC Wallet
// string  collateralized_nrg = 7; - the amount of NRG you are collateralizing in this order. Must be a multiple of the nrgUnit in the original maker order

var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'placeTakerOrder',
    params: [
        'ETH_ADDRSS', 'BTC_ADDRESS',
        'MAKER_TX_HASH', 0,
        'BC_ADDRESS', 'f9b99a468d6f8b6bd1925ac20207aeb1a1824b10c5f04f3b6d817b476b33f270',
        '3'
    ]
}
```
### Get Open Orders
This will return all the active maker orders that have not been taken and are still whose deposit periods have not ended.
```javascript
var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'getOpenOrders',
    params: []
}
```


### Get Matched Orders
This will return all the taken orders whose settlement periods have not ended.lo
```javascript
var body = {
    jsonrpc: '2.0',
    id: 1234,
    method: 'getMatchedOpenOrders',
    params: []
}
```
