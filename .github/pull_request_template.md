- [ ] Did you add you change to CHANGELOG.md?
- [ ] Did you change protobuf definitions?
	- [ ] Does the code work with both old and new structure?
- [ ] Did you run `yarn run dist` locally?
- [ ] Did you try to run the node with all subsystems (UI+WS, P2P node, rovers, persistence)?
- [ ] Did you add appropriate logs for new code? In proper levels?
- [ ] Did you remove all `console.log`s / `println!()`s used for debugging (or replaced with `log.debug()` / `trace!()` respectively)?

**If fixing bug**

- [ ] Did you add test so that we don't introduce it again?
- [ ] If fixing existing GitHub issue does this PR contain `Closes #<PR>` reference
