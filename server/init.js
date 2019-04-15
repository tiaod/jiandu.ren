require('dotenv').config()
const { ServiceBroker } = require("moleculer")
const nano = require('./nano')

const broker = new ServiceBroker({ logger: false })
async function main(){
  await require('./nano/login')
  console.log('设置数据库超时时间为31536000(一年)……')
  await nano.request({ //设置登录超时时间
    method: 'put',
    path: '_node/_local/_config/couch_httpd_auth/timeout',
    body: '31536000'
  })
  console.log('启用proxy auth……')
  await nano.request({ //使用proxy auth
    method: 'put',
    path: '_node/_local/_config/chttpd/authentication_handlers',
    body: '{chttpd_auth, cookie_authentication_handler}, {chttpd_auth, proxy_authentication_handler}, {chttpd_auth, default_authentication_handler}'
  })
  console.log('proxy auth强制使用secret……')
  await nano.request({ //强制使用secret
    method: 'put',
    path: '_node/_local/_config/couch_httpd_auth/proxy_use_secret',
    body: 'true'
  })
  console.log('单线程模式启动服务，运行各项服务的初始化')
  broker.loadServices('services')
  await broker.start()
  console.log('初始化完成，正在退出……')
  await broker.stop()
  process.exit(0)
}

main().catch(e=>{
  console.error(e)
  process.exit(-1)
})
