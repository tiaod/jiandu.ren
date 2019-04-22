const QueueService = require("moleculer-bull")
const nano = require('../nano')
const feeds = nano.use('feeds')
const axios = require('axios')
const FeedParser = require('feedparser')
const { MoleculerClientError } = require('moleculer').Errors
module.exports = {
  name: 'feed',
  dependencies: ['manager'],
  mixins: [QueueService(process.env.TRANSPORTER)],
  queues: {
    async fetch(job){
      this.logger.info('开始从rss订阅源获取数据')
      job.process(10)
      return
    }
  },
  hooks: {
    before: {
      '*':async function getDB(ctx){
        if(!ctx.params.feedUrl) return
        let project
        try{
          ctx.feed = await feeds.get(ctx.params.feedUrl)
          ctx.db = nano.use(`feeds-${ctx.feed._id}`)
        }catch(e){
          if(e.error=='not_found'){
            throw new MoleculerClientError('RSS不存在', 404, 'not_found')
          }else{
            throw e
          }
        }
      }
    }
  },
  actions: {
    fetch:{
      params: {
        url: 'string'
      },
      async handler(ctx){
        let feedparser = await this.fetch(ctx.params.url)
        return feedparser
        // return new Promise(function(resolve, reject) {
        //   let count = 0 // 已经获取的数量
        //   feedparser.on('readable', function () {
        //     // This is where the action is!
        //     var stream = this; // `this` is `feedparser`, which is a stream
        //     var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
        //     var item;
        //
        //     while (item = stream.read()) {
        //       console.log(item)
        //
        //       count++
        //     }
        //   })
        //   feedparser.on('error', function (error) {
        //     reject(error)
        //   })
        //   feedparser.on('end', function(){
        //     resolve(count)
        //   })
        // })
      }
    }
  },
  methods: {
    async fetch(url, params){
      let res = await axios.get(url, { params, responseType:'stream' })
      let feedparser = new FeedParser({
        feedurl:url
      })

      res.data.pipe(feedparser)
      return feedparser
    }
  }
}
