# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) ([olivierlacan/keep-a-changelog](https://github.com/olivierlacan/keep-a-changelog))
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased](https://github.com/blockcollider/bcnode/compare/v0.1.0...HEAD)

### Added

- [Global] - Added env variable BC_CONFIG 
- [CLI] - Added command "balance <address>" to get NRG balance
- [CLI] - --miner-key option validates formatted address 
- [Sentry] - Log more details
- [Sentry] - Log version as sentry 'release'
- [CLI] - Name the process - bcnode
- [Global] - Added benchmark module
- [Engine] - Add stats/monitor
- [Rover] - Kill all child rovers at ctrl+c
- [Global] - Added env variables BC_LOG, BC_DEBUG
- [CLI] - New option --miner-key
- [UI] - Serve documentation - /doc
- [CI] - Automatically build docker images
- [Docker] - Mountable volumes - _data, config, logs
- [Docker] - Use foreverjs

### Changed

- [UI] - Polish UI

### Removed

### Fixed

## [0.1.0](https://github.com/blockcollider/bcnode/compare/24f54034f8d23a74e5d191528523952fb716c853...v0.1.0)

First official public version.
