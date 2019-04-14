import 'dotenv/config'
import test from 'ava'
import { ServiceBroker } from 'moleculer'
import { Job } from 'bull'
const broker = new ServiceBroker({ logger: false })
const rssService = broker.loadService('services/rss.service')

test.before(async t=>{
  await broker.start()
})


test('订阅rss', async t=>{
  let count = await rssService.get('https://rsshub.app/wechat/wasi/5b575db858e5c4583338db11')
  console.log('已经获取了', count)
  t.pass()
})
