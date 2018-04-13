# Ubuntu - Installation from sources

## Create sudo enabled user

```
# Create new user
$ adduser username bc

# Add user to sudo group
$ usermod -aG sudo bc
```


## Login as sudo enabled user

```
# Switch from root to sudo enabled user
$ su - bc
```

## Intall required apt-pacakges

```
# Update package cache
$ sudo apt-get update

# Install required packages
$ sudo apt-get -y install git python unzip curl build-essential libboost-dev
```

## Install rust

```
# Install nightly rustup (rust version manager) and nightly rust
$ curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly

# Add rustup to path
$ export PATH=$HOME/.cargo/bin:$PATH

# Update rustup, just for sure
$ rustup update

# Print rustup version
$ rustc -Vv

# Print cargo version
$ cargo -V

# Download rust sources
$ rustup component add rust-src
```

# Install protocol buffers

```
# Download protobuf
$ curl -OL https://github.com/google/protobuf/releases/download/v3.5.1/protoc-3.5.1-linux-x86_64.zip

# Unzip protobuf
$ unzip protoc-3.5.1-linux-x86_64.zip -d $HOME/protoc3

# Add protobuf to path
$ export PATH=$HOME/protoc3/bin:$PATH
$ echo "export PATH=$HOME/protoc3/bin:$PATH" >> $HOME/.bash_rc

# Verify installation
$ protoc --version
```

# Install nvm (node version) manager

```
# Download and install nvm
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash

# Load nvm
$ export NVM_DIR="$HOME/.nvm"
$ [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
$ [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Install stable node
$ nvm install stable
```

# Install yarn

```
# Download installer and run it
$ curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.5.1

# Add yarn to path
$ source $HOME/.bashrc
```

# Install neon bindings

```
# Install neon bindings via npm
$ npm install -g neon-cli
```

# Clone git sources

```
$ git clone https://github.com/blockcollider/bcnode.git && cd bcnode
```

# Build everything

```
$ yarn && yarn run dist
```

# Create directory for logs

```
$ mkdir logs
```

# Run it!

```
./bin/cli --ws --rovers --ui --node
```

# Open ui

```
$ open http://localhost:3000
```

# Write final path to .bash_rc

```
$ echo "export PATH=$PATH" >> $HOME/.bash_rc
```
