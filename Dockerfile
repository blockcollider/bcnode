FROM node:8.15-slim
MAINTAINER Adam Kloboucnik <ak@blockcollider.org>

RUN apt-get update && apt-get install -y \
    libboost-dev \
    unzip \
    git \
    python2.7 \
    node-pre-gyp \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/ \
    && ln -s /usr/bin/python2.7 /usr/bin/python

# Install yarn
RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.12.3 \
    && export PATH=$HOME/.yarn/bin:$PATH

ENV PATH "/root/.yarn/bin:$PATH"

# Install protobuf
RUN curl -OL https://github.com/google/protobuf/releases/download/v3.5.1/protoc-3.5.1-linux-x86_64.zip \
    && unzip protoc-3.5.1-linux-x86_64.zip -d /root/protoc3 \
    && export PATH=$HOME/protoc3/bin:$PATH

ENV PATH "/root/protoc3/bin:$PATH"


# Install neon-bindings
# RUN yarn install -g neon-cli forever

# Create /src folder and switch to it
RUN mkdir /src
WORKDIR /src

# Support for mounted volumes
VOLUME /src/_data
VOLUME /src/_data_testnet
VOLUME /src/_debug
VOLUME /src/_logs
VOLUME /src/config

# Get JS deps
# COPY ["package.json", "yarn.lock", "./"]
# RUN yarn

# Add and build native (rust) stuff
# COPY native native
# COPY rust rust
#
# COPY protos protos
# COPY src/protos src/protos

# RUN neon build

# Git -> .version.json
COPY . .
# cannot do following, docker doesn't know how to - all unwanted is in .dockeringore
# COPY app/ bin/ config/ data/ protos/ public/ rust/ scripts/ src/ webpack/ package.json yarn.lock LICENSE README.md .

# # Install packages
# RUN yarn
#
# # Compile protobufs
# RUN yarn proto
#
# # Initial transpile
# RUN yarn transpile -s false
#
# # Build all
# RUN yarn run dist
#
# # Build UI app
# RUN yarn version:generate && yarn webpack
#
# RUN  rm -rf native/target/
# RUN  rm -rf target/

# TODO remove cargo registry
# Install nightly rust and remove it after compilation to slim down the resulting image
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly \
    && export PATH=$HOME/.cargo/bin:$PATH \
    && rustup update \
    && rustc -Vv \
    && cargo -V \
    && rustup component add rust-src \
    && yarn \
    && yarn run proto \
    && yarn run transpile -s false \
    && yarn run version:generate \
    && yarn run webpack \
    && cd rust/bcrust-core/ && rm -rf target/ && cargo build --release && rm -rf target/deps/ && cd - \
    && rm -rf node_modules \
    && NODE_ENV=production yarn install \
    && yarn cache clean \
    && rustup self uninstall -y

RUN mkdir -p /src/logs

EXPOSE 3000 9090

ENTRYPOINT [ "./bin/cli" ]
