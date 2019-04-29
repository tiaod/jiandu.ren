const nano = require('../nano')
const feeds = nano.use('feeds')
const { MoleculerClientError } = require('moleculer').Errors
// const feedfetcher = require('./feedfetcher')
module.exports = {
  name: 'manager',
  async started(){
    await require('../nano/login')
    await this.actions.initdb({
      dbname: 'feeds',
      security: {
        "members": {
          "roles": [
            "_admin"
          ]
        }
      },
      indexes:[{
        index: {
          fields: ['owner'],
        },
        ddoc: 'projectIndexes',
        name: 'listByOwner'
      }]
    })
  },
  actions: {
    createFeed:{
      params: {
        url: 'string',
        title: {type:'string', optional:true}, //RSS的名字。如果提供这个字段会覆盖默认的
        description: {type:'string', optional:true}, //RSS的描述。如果提供这个字段会覆盖默认的
      },
      async handler(ctx){
        console.log('创建feed！')
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

        let feed = {
          _id: ctx.params.url,
          type: 'feed',
          owner: ctx.meta.user.name,
          title: ctx.params.title,
          description: ctx.params.description,
        }

        let stream = await ctx.call('feed.fetch',{
          url:ctx.params.url
        })

        // console.log('成功获取stream：', stream)
        stream.on('meta', meta=>{
          console.log('成功取得meta:', meta)
          feed.title = feed.title || meta.title
          feed.description = feed.description || meta.description
        })
        stream.on('readable', function () {
          // This is where the action is!
          var stream = this; // `this` is `feedparser`, which is a stream
          var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
          var item;

          while (item = stream.read()) {
            // console.log(item)
          }
        })
        // await new Promise(async function(resolve, reject) {
        //   stream.on('error', reject)
        //   stream.on('end', resolve)
        // })
        console.log('成功构造的feed：', feed)
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
  }
}
