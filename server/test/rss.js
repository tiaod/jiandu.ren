import 'dotenv/config'
import test from 'ava'
import { ServiceBroker } from 'moleculer'
import { Job } from 'bull'
const broker = new ServiceBroker({ logger: false })
const feedService = broker.loadService('services/feed.service')

test.before(async t=>{
  await broker.start()
})

test('创建feed', async t=> {
  let feed = await feedService.actions.create({
    url: 'https://rsshub.app/wechat/wasi/5b575db858e5c4583338db11'
  }, {
    meta: {
      user: {
        name: 'tiaod',
        roles: []
      }
    }
  })
  t.pass()
})

// test('测试rss服务的get方法', async t=>{
//   let count = await rssService.actions.fetch({
//     feedUrl: 'https://rsshub.app/wechat/wasi/5b575db858e5c4583338db11'
//   })
//   console.log('已经获取了', count)
//   t.pass()
// })
