const QueueService = require("moleculer-bull")
const axios = require('axios')
const FeedParser = require('feedparser')
const nano = require('../nano')
const feeds = nano.use('feeds')
const { MoleculerClientError } = require('moleculer').Errors
module.exports = {
  name: 'feed',
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
  async started(){
    await require('../nano/login')

  },
  actions: {
    create:{
      params: {
        url: 'string',
        name: {type:'string', optional:true}, //RSS的名字。如果提供这个字段会覆盖默认的
        description: {type:'string', optional:true}, //RSS的描述。如果提供这个字段会覆盖默认的
      },
      async handler(ctx){
        if(!ctx.meta.user){
          throw new MoleculerClientError('需要先登录才能进行操作',401,'unauthorized')
        }
        try{
          let feed = await feeds.get(ctx.params.url) //尝试获得项目
          throw new MoleculerClientError('feed已存在。',400,'conflicted')
        }catch(e){
          if(e.reason!=='missing'){ //抛出的错误不是项目不存在
            throw e
          }
        }
        let feedparser = await this.fetch(ctx.params.url)
        return new Promise((resolve, reject) => {
          feedparser.on('meta', meta=>{
            console.log('获得了meta', meta)
          })
        })
        // let feed = {
        //   _id: ctx.params.url,
        //   type: 'feed',
        //   name: ''
        // }
      }
    },
    fetch:{
      params: {
        feedUrl: 'string'
      },
      async handler(ctx){
        let feedparser = await this.fetch(url)
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
      }
    },
    initdb:{ // 初始化数据库，并且设置数据库的权限以及索引。如果数据库已经存在，则不会进行任何操作。
      visibility: 'public',
      params: {
        dbname: 'string',
        security: { type: 'object', optional: true },
        indexes: { type: 'array', optional: true }
      },
      async handler(ctx){
        this.logger.info(`初始化数据库: ${ctx.params.dbname}`)
        let db = nano.use(ctx.params.dbname)
        try{
          this.logger.debug(`检查数据库${ctx.params.dbname}是否存在`)
          let res = await db.info()//检查数据库是否已经创建
          this.logger.debug(`${ctx.params.dbname}数据库已创建。`)
        }catch(e){
          if(e.statusCode === 404){
            this.logger.debug(`${ctx.params.dbname}数据库未创建，正在创建……`)
            await nano.db.create(ctx.params.dbname)
            this.logger.debug(`${ctx.params.dbname}数据库创建成功。`)
          }else{
            this.logger.info('未知错误:', e)
            throw e
          }
        }
        if(ctx.params.security){
          this.logger.debug(`正在设置${ctx.params.dbname}数据库的权限……`)
          await nano.request({
            method: 'put',
            db: ctx.params.dbname,
            doc: '_security',
            body: ctx.params.security
          })
          this.logger.debug(`设置权限完成。`)
        }
        if(ctx.params.indexes){
          this.logger.debug('正在创建索引……')
          for(let index of ctx.params.indexes){
            await nano.use(ctx.params.dbname).createIndex(index)
          }
          this.logger.debug('创建索引完成。')
        }
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
