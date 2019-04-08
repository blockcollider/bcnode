# Rovers

Rovers are parts of Block Collider responsible for listening on (and sometimes
actively pulling from) the rovered chain.

In the bcnode implementation these are currently run and separate processes forked
from the main bcnode process, named `bc-rover-<chain name>` where <chain name> is one
of `btc`, `eth`, `lsk`, `neo` and `wav`.

## main process <-> rover communication

Communication with the main process is done using [gRPC
protocol](https://grpc.io/about/) and is bi-directional.

After start of the rover, it reports readiness back to the main process and channel
for sending commands in direction from main process to rover is stored as part of the
rover manager class.

Communication in direction from rover back to main process is done using standard RPC
call, no channel is needed.

## Rover commands

Rovers recognize 2 commands now, `fetch_block` and `resync`, each one can contain
data specific for the command. These commands are defined and protocol buffer
messages in the `../../protos/rover.proto` definition.

### `resync` command

While rovers are being started for the first time from the main process, status of
each rovered chain is pulled from the persistence. If in the past 72 hours there is a
gap in the blockchain of the rovered chain, this gap (can be multiple) is added as
an interval `[missing_from_block_number; missing_to_block_number]` to the data of
the `resync` command which is then send to the rover being started. Also, if present,
the latest know block of the chain is added to the message.

Rover uses this command to pull missing block intervals from the chain so that the
past 72 hours of the blockschain are complete before start of the mining. How exactly
is the responsibilty of the respective rover (e.g. ETH rover issues `getBlockHeaders`
network messages with these intervals, contrary to e.g. NEO which does not have
ability to pull intervals of blocks from API and blocks have to be requested one by
one).

If no last block or no intervals are present in the command data, the rover is
considered not to be running for the last 72 hours and all the blocks from this time
interval are requested from the network and it takes a while to download these. This
is also a case of the first run (using empty persistence)

#### note about BTC

As block numbers are being used in resync message, BTC rover now can't use the
intervals (BTC network protocol needs block hashes to request block headers - see
[getblockheaders Protocol
documentation](https://en.bitcoin.it/wiki/Protocol_documentation#getheaders)) so BTC
always tried to pull all the 72 hours history of blocks.

### `fetch_block` command

While the main process is recieving BC blockchain blocks, some rovered chain block
referenced from this block can be missing in the persistence. `fetch_block` command
is used to request specific block fron the rovered blockchain to be able to validate
the incoming BC block.


## Rovers sending information back to main process

- rover successfully started - `join(RoverIdent)` rpc call
- report rovered block - `collectBlock` rpc call
- report initial sync status - `reportSyncStatus(RoverSyncStatus)` rpc call
- check if TX is before settlement height - `isBeforeSettleHeight` rpc call
