# Environment variables


## BTC_BOOT_BLOCK

For speeding up start of mining you can provide previous latest BTC block's hash in `BTC_BOOT_BLOCK`. This may sound a bit off but
for getting the last block from BTC network this is the way to go - the peer protocol needs to now which blocks you already have and
by providing previous last hash of block in `getblocks` message to peer you will get the last one.

For convenience, you can use this bash function on unix-like platforms:

```bash
lbtcbh () {
    height=$(curl --silent https://blockchain.info/latestblock | jq .height | tr -d "\\n\"")
    height=$((height-1))
    hash=$(curl --silent https://blockchain.info/block-height/$height?format=json | jq .blocks[0].hash | tr -d "\\n\"")
    echo -n "$hash"
}
```

After defining this fn e.g. in you `.bash_profile` you can now run bcnode e.g. like `BTC_BOOT_BLOCK="$(lbtcbh)" ./.run.sh`

In Windows PowerShell you can put function:

```powershell
function PreviousLatestBtcHash
{
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $LastHeight = Invoke-WebRequest https://blockchain.info/latestblock | ConvertFrom-Json | select -expand height
  $LastHeight = $LastHeight - 1
  $Url = "https://blockchain.info/block-height/$LastHeight" + "?format=json"
  $PreviousLatestHash = Invoke-WebRequest $Url | ConvertFrom-Json | select -ExpandProperty blocks | select -ExpandProperty hash
  Write-Host $PreviousLatestHash
}
```

into `%UserProfile%\My Documents\WindowsPowerShell\profile.ps1` and then you will able be to run `PreviousLatestBtcHash` in you PowerShell
and use the hash as value for `BTC_BOOT_BLOCK`.

NOTE: You may need to run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in your PowerShell for the first time.

## BC_GRPC_RUST_MINER_PORT

16-bit number

Default port for Rust miner's grpc server to bind is `50051`, you can configure a different one using this property.

Useful for running multiple instances of bcnode with rust miner on the same machine.
