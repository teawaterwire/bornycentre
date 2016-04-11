import {div, h5, iframe} from '@cycle/dom'
import {assign} from 'lodash'
import {MAPS_KEY, MAPS_EMBED_URL, DOMAIN} from '../config.js'

function createRevealBornycentreStream (DOM) {
  const revealBornycentre$ = DOM.select('.js-generate-borny')
    .events('click')
    .do(() => setTimeout(() => window.$('#bornycard').velocity('scroll'), 300))
    .map(() => true)
  return revealBornycentre$
}

function computeSelectedCitiesStream (city$) {
  const selectedCities$ = city$
    .startWith([])
    .scan((cities, city) => cities.concat(city))
  return selectedCities$
}

function computeBornycentreStream (city$, reveal$) {
  const bornycentre$ = city$
    .scan((bornycentre, city) => {
      const newBorn = {
        sumLat: bornycentre.sumLat + parseFloat(city.lat),
        sumLng: bornycentre.sumLng + parseFloat(city.lng),
        count: bornycentre.count + 1
      }
      return assign({
        lat: newBorn.sumLat / newBorn.count,
        lng: newBorn.sumLng / newBorn.count
      }, newBorn)
    }, {sumLat: 0, sumLng: 0, count: 0})
    .pausableBuffered(reveal$)
    .startWith(null)

  return bornycentre$
}

function renderBornycentre (bornycentre$, selectedCities$) {
  const vtree$ = bornycentre$.withLatestFrom(selectedCities$,
    (bornycentre, selectedCities) => {
      if (bornycentre === null) {
        return null
      }
      const coords = `${bornycentre.lat},${bornycentre.lng}`
      const cityNames = selectedCities.map(c => c.name).join(', ')
      const mapLink = `https://www.google.com/maps/place/${coords}`
      const encodedText = encodeURIComponent(`📍 ${cityNames}. Looks like that's my #Bornycentre: ${mapLink}
Find yours`)
      let twitterIframeUrl = 'https://platform.twitter.com/widgets/tweet_button.html?'
      twitterIframeUrl += 'size=l'
      twitterIframeUrl += `&url=${DOMAIN}`
      twitterIframeUrl += `&text=${encodedText}`
      return (
        div('.row .center-align', [
          div('#bornycard .card .col .s8 .push-s2', {style: {margin: '30px 0'}}, [
            div('.card-content', {style: {'font-size': '20px'}}, [
              iframe({
                src: `${MAPS_EMBED_URL}?key=${MAPS_KEY}&q=${coords}&zoom=9`,
                width: '100%',
                height: 450,
                frameborder: 0,
                style: {border: 0}
              })
            ]),
            div('.card-action', [
              h5('Yay! Easy to share 😁'),
              iframe({src: twitterIframeUrl, scrolling: 'no', width: 80, height: 30, style: {border: 0}})
            ])
          ])
        ])
      )
    })
  return vtree$
}

function Bornycentre ({DOM, actions}) {
  // intent -> action
  const revealBornycentre$ = createRevealBornycentreStream(DOM)
  // action -> state
  const selectedCities$ = computeSelectedCitiesStream(actions.selectCity$)
  const bornycentre$ = computeBornycentreStream(actions.selectCity$, revealBornycentre$)
  // state -> view
  const vtree$ = renderBornycentre(bornycentre$, selectedCities$)
  return {
    DOM: vtree$
  }
}

export default Bornycentre
