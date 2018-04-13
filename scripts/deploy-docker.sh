#!/usr/bin/env bash

if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
    docker build -t blockcollider/bcnode:${TRAVIS_BRANCH} ..
fi
