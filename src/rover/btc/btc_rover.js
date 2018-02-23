const { Hub } = require('iris')
const logging = require('../../logger')
const Controller = require('./controller')

const main = () => {
  const controller = new Controller(logging.logger, Hub)
  controller.init()
}

main()
