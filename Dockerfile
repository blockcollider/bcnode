FROM node:8.11
MAINTAINER Tomas Korcak <tk@blockcollider.org>

RUN apt-get update && apt-get install -y \
    libboost-dev \
    unzip

# Add non-privileged user
RUN adduser --disabled-password --gecos '' bc

# Create src/log folder, copy sources from host and set permissions
RUN mkdir /home/bc/src && mkdir /home/bc/src/logs
ADD . /home/bc/src
RUN chown -R bc:bc /home/bc

WORKDIR /home/bc

# Drop privileges
USER bc

# Install yarn
RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s -- --version 1.5.1 \
    && export PATH=$HOME/.yarn/bin:$PATH

ENV PATH "/home/bc/.yarn/bin:$PATH"

# Install protobuf
RUN curl -OL https://github.com/google/protobuf/releases/download/v3.5.1/protoc-3.5.1-linux-x86_64.zip \
    && unzip protoc-3.5.1-linux-x86_64.zip -d /home/bc/protoc3 \
    && export PATH=$HOME/protoc3/bin:$PATH

ENV PATH "/home/bc/protoc3/bin:$PATH"

# Install nightly rust
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain nightly \
    && export PATH=$HOME/.cargo/bin:$PATH \
    && rustup update \
    && rustc -Vv \
    && cargo -V \
    && rustup component add rust-src

ENV PATH "/home/bc/.cargo/bin:$PATH"

# Install neon-bindings
RUN npm install -g neon-cli --prefix $HOME/.npm

ENV PATH "/home/bc/.npm/bin:$PATH"

WORKDIR /home/bc/src

# And build everything
RUN yarn run dist

EXPOSE 3000 9090

ENTRYPOINT [ "node", "./bin/cli" ]
