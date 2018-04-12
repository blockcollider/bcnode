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

# RUN cargo install clippy \
#     && cargo install cargo-fuzz \
#     && cargo install sccache
# ENV RUSTC_WRAPPER sccache

# Install neon-bindings
RUN npm install -g neon-cli

# COPY package.json package.json
# COPY package-lock.json package-lock.json
# RUN yarn

# Create /src folder and switch to it
RUN mkdir /src
WORKDIR /src

COPY . .

# And build everything
RUN yarn run dist

RUN mkdir -p /src/logs

EXPOSE 3000 9090

ENTRYPOINT [ "node", "./bin/cli" ]

