const { Hub } = require('iris')
const logging = require('../../logger')
const Controller = require('./controller')

const main = () => {
  const hub = new Hub()
  console.log(Hub, hub)
  const controller = new Controller(logging.logger, hub)
  controller.init()
}

main()
