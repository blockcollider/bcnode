#! /usr/bin/env bash
lbtcbh () {
    height=$(curl --silent https://blockchain.info/latestblock | jq .height | tr -d "\\n\"")
    height=$((height))
    hash=$(curl --silent https://blockchain.info/block-height/$height?format=json | jq .blocks[0].hash | tr -d "\\n\"")
    echo -n "$hash"
}

export DISABLE_IPH_TEST=true
export BC_PREVENT_INITAL_SYNC=true
export BTC_BOOT_BLOCK=$(lbtcbh)
echo "Using $BTC_BOOT_BLOCK as previous BTC block hash"
export BC_GRPC_PORT=11111
export BC_MINER_KEY=0xd96690dae10BEC38e368E30714e228d240c1cbB2
export BC_LIMIT_MINER=true
export BC_ROVER_REPLAY=false
export MIN_HEALTH_NET=true
export BC_BT_VALIDATION=false
export BC_NETWORK="test"
export BC_RUST_MINER=false
export BC_GRPC_RUST_MINER_PORT=50052
export USER_QUORUM=1
export DEBUG="bcnode:p2p*"
export BC_UI_PORT=3001
rm -Rf log-test1.txt && ./bin/cli start --rpc --ws --ui  --node $@ 2>&1 | tee log-test1.txt
