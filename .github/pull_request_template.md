### General

- [ ] If adding new feature, did you add test for it?
- [ ] Did you change protobuf definitions?
	- [ ] Does the code work with both old and new structure?
- [ ] Did you add appropriate logs for new code? In proper levels?
- [ ] Did you remove all `console.log`s / `println!()`s used for debugging (or replaced with `log.debug()` / `trace!()` respectively)?

### Docs

- [ ] Are your public js methods / functions properly documented (using ESDoc tags)?
- [ ] Is your rust code properly documented?
- [ ] Did you add you change to CHANGELOG.md?

### Other

- [ ] Did you run `yarn run dist` locally without errors?
- [ ] Did you try to run the node with all subsystems (UI+WS, P2P node, rovers, persistence)?
- [ ] Did you try to rebase on top of base branch?
- [ ] Have you squashed all "fix typo"-kind and `fixup!` commits?

### If fixing bug

- [ ] Did you add test so that we don't introduce it again?
- [ ] If fixing existing GitHub issue does this PR contain `Closes #<PR>` reference?
