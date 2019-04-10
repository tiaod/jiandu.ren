const QueueService = require("moleculer-bull");
module.exports = {
  name: 'rss',
  mixins: [QueueService(process.env.TRANSPORTER)],
  queues: {
    async fetch(job){
      this.logger.info('开始从rss订阅源获取数据')
      job.process(10)
      return
    }
  }
}
