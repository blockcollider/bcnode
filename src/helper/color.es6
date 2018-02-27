const colors = require('colors')

export function getColor (tag) {
  switch (tag) {
    case 'wav': {
      return colors.bgCyan(tag)
    }

    case 'lsk': {
      return colors.bgRed(tag)
    }

    case 'eth': {
      return colors.bgMagenta(tag)
    }

    case 'btc': {
      return colors.bgYellow(tag)
    }

    case 'neo': {
      return colors.bgGreen(tag)
    }
  }
}
