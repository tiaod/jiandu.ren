const QueueService = require("moleculer-bull")
const axios = require('axios')
const FeedParser = require('feedparser')
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
      let res = await axios.get(url, { params, responseType:'stream' })
      let feedparser = new FeedParser({
        feedurl:url
      })

      res.data.pipe(feedparser)
      return new Promise(function(resolve, reject) {
        let count = 0 // 已经获取的数量
        feedparser.on('readable', function () {
          // This is where the action is!
          var stream = this; // `this` is `feedparser`, which is a stream
          var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
          var item;

          while (item = stream.read()) {
            console.log(item)
            count++
          }
        })
        feedparser.on('error', function (error) {
          reject(error)
        })
        feedparser.on('end', function(){
          resolve(count)
        })
      })

      return feedparser
    }
  }
}
