FROM node:8.11
MAINTAINER Tomas Korcak <tk@blockcollider.org>

RUN apt-get update && apt-get install -y \
    libboost-dev \
    unzip

# Install yarn
RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.5.1 \
    && export PATH=$HOME/.yarn/bin:$PATH

ENV PATH "/root/.yarn/bin:$PATH"

# Install protobuf
RUN curl -OL https://github.com/google/protobuf/releases/download/v3.5.1/protoc-3.5.1-linux-x86_64.zip \
    && unzip protoc-3.5.1-linux-x86_64.zip -d /root/protoc3 \
    && export PATH=$HOME/protoc3/bin:$PATH

ENV PATH "/root/protoc3/bin:$PATH"

# Install nightly rust
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly \
    && export PATH=$HOME/.cargo/bin:$PATH \
    && rustup update \
    && rustc -Vv \
    && cargo -V \
    && rustup component add rust-src

ENV PATH "/root/.cargo/bin:$PATH"

# Install neon-bindings
RUN npm install -g neon-cli forever

# Create /src folder and switch to it
RUN mkdir /src
WORKDIR /src

# Support for mounted volumes
VOLUME /src/_data
VOLUME /src/_debug
VOLUME /src/_logs
VOLUME /src/config

# Get JS deps
COPY ["package.json", "yarn.lock", "./"]
RUN yarn

# Add and build native (rust) stuff
ADD native native
RUN rm -rf native/target
ADD rust rust
RUN rm -rf rust/target

ADD protos protos
ADD src/protos src/protos

RUN neon build

# Git -> .version.json
COPY .version.json .
COPY . .

# And build everything
RUN yarn run dist

RUN  rm -rf native/target/
RUN  rm -rf target/

RUN mkdir -p /src/logs

EXPOSE 3000 9090

ENTRYPOINT [ "./bin/cli" ]

