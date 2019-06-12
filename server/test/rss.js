import 'dotenv/config'
import test from 'ava'
import { ServiceBroker } from 'moleculer'
import { Job } from 'bull'
const broker = new ServiceBroker({ logger: true })
const managerService = broker.loadService('services/manager.service')
const feedService = broker.loadService('services/feed.service')

test.before(async t=>{
  await broker.start()
})

test('创建feed', async t=> {
  let feed = await managerService.actions.createFeed({
    url: `https://www.feedforall.com/sample.xml?t=${Date.now()}`
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
