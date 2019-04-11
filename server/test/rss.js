import 'dotenv/config'
import test from 'ava'
import { ServiceBroker } from 'moleculer'
import { Job } from 'bull'
const broker = new ServiceBroker()
const rssService = broker.loadService('services/rss.service')

test.before(async t=>{
  await broker.start()
})


test('订阅rss', async t=>{
  let data = await rssService.get('https://rsshub.app/wechat/wasi/5b575db858e5c4583338db11')
  console.log(data)
  t.pass()
})
