FROM node:8

MAINTAINER tk@blockcollider.org

# See https://github.com/libp2p/js-libp2p-webrtc-star#rendezvous-server-aka-signalling-server

# Create /src folder and switch to it
RUN mkdir /src
WORKDIR /src

COPY . .

RUN yarn

ENTRYPOINT ["./node_modules/.bin/rendezvous"]
