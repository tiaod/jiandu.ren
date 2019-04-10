import 'dotenv/config'
import test from 'ava'
import { ServiceBroker } from 'moleculer'
const broker = new ServiceBroker()
const rssService = broker.loadService('services/rss.service')

test.before(async t=>{
  await broker.start()
})



test.cb('订阅rss', t=>{
  rssService.createJob('fetch', {
    url: 'www.baidu.com'
  })
  setTimeout(t.end, 3000)
})
