FROM node:8

MAINTAINER tk@blockcollider.org

# See https://github.com/libp2p/js-libp2p-webrtc-star#rendezvous-server-aka-signalling-server

RUN npm install libp2p-webrtc-star

CMD ["./node_modules/.bin/star-signal", "--port=9090", "--host=0.0.0.0"]
