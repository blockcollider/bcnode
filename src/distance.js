const cosine = require('compute-cosine-distance')

function split (t) {
  return t.split('').map(function (an) {
    return an.charCodeAt(0)
  })
}

function distance (a, b) {
  return cosine(split(a), split(b));
}

module.exports = distance
