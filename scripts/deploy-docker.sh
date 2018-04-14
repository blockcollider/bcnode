#!/usr/bin/env bash

# See https://docs.travis-ci.com/user/build-stages/share-docker-image/
if [ "$TRAVIS_PULL_REQUEST" == "false" ]; then
    git clean -f
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    docker build -t blockcollider/bcnode ..
    docker tag blockcollider/bcnode blockcollider/bcnode:${TRAVIS_BRANCH}
    docker push blockcollider/bcnode:${TRAVIS_BRANCH}
fi
