const QueueService = require("moleculer-bull")
const axios = require('axios')
module.exports = {
  name: 'rss',
  mixins: [QueueService(process.env.TRANSPORTER)],
  queues: {
    async fetch(job){
      this.logger.info('开始从rss订阅源获取数据')
      job.process(10)
      return
    }
  },
  methods: {
    async get(url, params){
      let res = await axios.get(url, { params })
      return res.data
    }
  }
}
