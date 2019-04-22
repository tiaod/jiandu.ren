

module.exports = async function fetch(url, params){
  console.log('请求url:', url)
  let res = await axios.get(url, { params, responseType:'stream' })
  console.log(res.data)
  let feedparser = new FeedParser({
    feedurl:url
  })
  res.data.pipe(feedparser)
  return feedparser
}
