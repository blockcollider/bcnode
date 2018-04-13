# Release

How to release new version.

## Steps

- Checkout latest upstream master
- Build
- Run tests
- Merge master -> release
- Wait for CI
- Build docker image
- Release docker image
- Tag latest version

## After release

- Checkout master
- Bump version in package.json
- Create new section in CHANGELOG.md
- Update diff link in CHANGELOG.md
