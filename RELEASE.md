# Release

How to release new version.

## Steps

- Rename `Unreleased` section in [CHANGELOG.md](https://github.com/blockcollider/bcnode/blob/master/CHANGELOG.md) to version specified in [package.json](https://github.com/blockcollider/bcnode/blob/master/package.json)
- Checkout latest upstream master
- Build
- Run tests
- Commit updated CHANGELOG.md
- Merge master -> release
- Build
- Run test
- Push release
- Wait for CI
- Build docker image
- Release docker image
- Tag latest version

## After release

- Bump version in package.json
- Create new `Unreleased` section in CHANGELOG.md
- Update diff link in CHANGELOG.md
