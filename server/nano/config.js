const nano = require('./')

async function get(){
  await require('./login')
  return await nano.request({
    path:'/_node/_local/_config'
  })
}

module.exports = get()
