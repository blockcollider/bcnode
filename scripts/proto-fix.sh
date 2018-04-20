#! /usr/bin/env bash

system=$(uname -s | tr '[:upper:]' '[:lower:]')
regex='s/if (goog.DEBUG/if (true || goog.DEBUG/g'

if [[ "$system" == 'darwin' ]]; then
    sed -i '' "$regex" src/protos/*.js
elif [[ "$system" == 'linux' ]]; then
    sed -i "$regex" src/protos/*.js
fi
