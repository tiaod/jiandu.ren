const nano = require('nano')({
  url:process.env.COUCHDB_URL,
  requestDefaults:{
    jar: true
  }
})


module.exports = nano
