#! /usr/bin/env bash

# export APPVEYOR_TOKEN="<your-api-token>"

curl -H "Authorization: Bearer $APPVEYOR_TOKEN" -H "Content-Type: application/json" -X DELETE https://ci.appveyor.com/api/projects/korczis/bcnode/buildcache


