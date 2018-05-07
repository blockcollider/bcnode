### Prerequisites

- [ ] Are you running the latest version?
- [ ] Are you running the docker image or did you built from source?
- [ ] Did you check the README.md for steps to run?
- [ ] Did you check logs? (either in console or in `_logs` directory)

For more information, see the `CONTRIBUTING` guide.

### Description

[Description of the bug or feature]

### Steps to Reproduce

1. [First Step]
2. [Second Step]
3. [and so on...]

**Expected behavior:** [What you expected to happen]

**Actual behavior:** [What actually happened]

### Versions

#### Application (required)

You can get this information:

- from executing `docker ps` if running docker
- from executing `./bin/cli --version` if building from source
- in UI in the Navbar on top:

![UI version](ui-version.png)

```
(replace with output from command above)
```

#### Environment (optional but helpful)

- OS Version (ie. Win10 Home)
- Nodejs (ie. `v8.9.4`)
- Rust (ie. `rustc 1.25.0-nightly (45fba43b3 2018-02-10)`)

### Logs

Attach (as a file) `_logs/bcnode-exception.log` and last `_logs/bcnode-<TIMESTAMP>.log` (the
timestamped logs are rotated each hour, include the one from last hour).
