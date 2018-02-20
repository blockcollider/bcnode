/**
 * Talisman metrics/distance/ratcliff-obershelp
 * =============================================
 *
 * Function computing the Ratcliff-Obershelp similarity/distance.
 *
 * [References]:
 * https://xlinux.nist.gov/dads/HTML/ratcliffObershelp.html
 * http://collaboration.cmc.ec.gc.ca/science/rpn/biblio/ddj/Website/articles/DDJ/1988/8807/8807c/8807c.htm
 *
 * [Articles]:
 * PATTERN MATCHING: THE GESTALT APPROACH
 * John W. Ratcliff, David E. Metzener
 *
 * Paul E. Black, "Ratcliff/Obershelp pattern recognition", in Dictionary of
 * Algorithms and Data Structures [online], Vreda Pieterse and Paul E. Black,
 * eds. 17 December 2004.
 *
 * [Tags]: string metric.
 */

const GSA = require('mnemonist')
const GeneralizedSuffixArray = GSA.GeneralizedSuffixArray
const cosine = require('compute-cosine-distance')

function split (t) {
  return t.split('').map(function (an) {
    return an.charCodeAt(0)
  })
}

function indexOf (haystack, needle) {
  if (typeof haystack === 'string') return haystack.indexOf(needle)

  for (let i = 0, j = 0, l = haystack.length, n = needle.length; i < l; i++) {
    if (haystack[i] === needle[j]) {
      j++

      if (j === n) return i - j + 1
    } else {
      j = 0
    }
  }

  return -1
}

function matches (a, b) {
  const stack = [a, b]

  let m = 0

  while (stack.length) {
    a = stack.pop()
    b = stack.pop()

    if (!a.length || !b.length) continue

    const lcs = new GeneralizedSuffixArray([a, b]).longestCommonSubsequence(),
      length = lcs.length

    if (!length) continue

    // Increasing matches
    m += length

    // Add to the stack
    const aStart = indexOf(a, lcs),
      bStart = indexOf(b, lcs)

    stack.push(a.slice(0, aStart), b.slice(0, bStart))
    stack.push(a.slice(aStart + length), b.slice(bStart + length))
  }

  return m
}

function similarity (a, b) {
  if (a === b) return 1

  if (!a.length || !b.length) return 0

  return 2 * matches(a, b) / (a.length + b.length)
}

function distance (a, b) {
  return cosine(split(a), split(b));
}

module.exports = distance
