import express from 'express'
import request from 'request'

let app = express()

app.get('/model.json', (req, res) => {
  const params = {
    username: process.env.GEO_USERNAME,
    maxRows: 5,
    q: req.query.q
  }
  const GEO_URL = 'http://api.geonames.org/searchJSON'
  request({url: GEO_URL, qs: params}, (error, response, body) => {
    if (error) {
      // TODO: send down the error so the UI can reflect it
      return console.log(error)
    }
    // TODO: send just what we need
    res.send(JSON.parse(body))
  })
})

app.use(express.static('dist'))

app.listen(process.env.PORT || 3000)
