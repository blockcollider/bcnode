const { Hub } = require('iris')
const logging = require('../../logger')
const Controller = require('./controller').default

const main = () => {
  const hub = new Hub()
  process.title = 'bc-rover-btc'
  const controller = new Controller(logging.logger, hub)
  controller.init()
}

main()
