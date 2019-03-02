# CLI

## Commands

### `start`

Starts the bcnode

### `newTx`

Attempts to create a new TX.

`./bin/cli newTx <from> <to> <amount> <fee> <private_key_hex>`

Example:

`BC_GRPC_PORT=<same as while starting> ./bin/cli newTx 0x6be01d47d5df4cded293998fb39d6cb2cb4bb3cc 0xd57bd96f13830dc32fd156f0a3d1d0fd0d214590 "25.3" "0.66" 1c8c4e0dc9f48f721731956edab676dfcb0539e17b4118d3ef00c760ae788473`

Means send `25.3NRG` from `0x6be01d47d5df4cded293998fb39d6cb2cb4bb3cc` to `0xd57bd96f13830dc32fd156f0a3d1d0fd0d214590` with fee of `0.66NRG`

### `balance`

Attempts to create a new TX.

`./bin/cli balance <address>`

Example:

`BC_GRPC_PORT=<same as while starting> ./bin/cli balance 0x6be01d47d5df4cded293998fb39d6cb2cb4bb3cc`

Get both confirmed and unconfirmed balance of `0x6be01d47d5df4cded293998fb39d6cb2cb4bb3cc`. Correct value is dependent on the state of sync (if your node is not fully synced, it will report invalid data).
