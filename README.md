Block Collider 
==============
Mining node with built-in block rover, DHT, and client discovery. 

## Index
* init.js - startup file
* time.js - ntp offset, local UTC and UNIX timestamps
* string.js - standardized string operations, random hash, UUID
* roverbase.js - process manager for blockchain rovers 
* discovery.js - DNS/NAT/disc-channel and Bittorrent client discovery
* identity.js - local configuration of client
* network.js - interface and events for the network
* dht.js - underlying storage and peer logic for network 

## Install

## Message Types

## Block Reward

The block reward remains the same at 1000 Carbons per Emblem. 

(66 * Variance Threshold) / Unused Transaction Variance Allowance 

## Consensys Longest Chain + Weighted Mining 

Nodes relay transactions to eachother. If a node recieves a transaction it has already recieved from another node/peer it weights that node for block election.
Block election / consensys

* Node A, B, C, D, E are mining

* Node C and D are not connected however they are both connected to A, B, and E

* Node A and B discover a hash that passes the threshold.

* Node A and B send their claim hash to Node C and D. C and D each begin mining on different chains. 

* Node C and D relay the winning hash to E who beings mining based on how the weight of C or D. 

* Nodes collect weight be relaying transactions to nodes that already have the same transaction. 

In this way nodes are indirectly incentivised to always relay transactions in an effort to gain weight among other nodes. 



## Helix Block

prevHash: 


