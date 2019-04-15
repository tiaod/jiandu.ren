const nano = require('./')
const debug = require('debug')('app.nano:login')
function login(){
  return nano.auth(
    process.env.COUCHDB_USER,
    process.env.COUCHDB_PASS
  )
}

module.exports = login()
