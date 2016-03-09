import {div, a, iframe, i} from '@cycle/dom'
import {assign} from 'lodash'
import {MAPS_KEY, MAPS_EMBED_URL, DOMAIN} from '../config.js'

function createRevealBornycentreStream (DOM) {
  const revealBornycentre$ = DOM.select('.js-generate-borny')
    .events('click')
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
      const mapLink = `https://www.google.com/maps/place/${coords}`
      return (
        div('.row .center-align', [
          div('.card .col .s8 .push-s2', {style: {margin: '30px 0'}}, [
            div('.card-content', {style: {'font-size': '20px'}}, [
              '📍',
              selectedCities.map(c => c.name).join(', '),
              `. Looks like that's my #Bornycentre: `,
              a('.truncate', mapLink),
              div([`Find yours `, a(DOMAIN)])
            ]),
            div('.card-action', '( Yay! Easy to copy, paste and share 😁)')
          ]),
          div('.col .s12', [
            iframe({
              src: `${MAPS_EMBED_URL}?key=${MAPS_KEY}&q=${coords}&zoom=10`,
              width: '100%',
              height: 450,
              frameborder: 0,
              style: {border: 0}
            }),
            a('.btn-large .indigo .left', {href: mapLink, target: '_blank'}, [
              'Open in GMaps', i('.material-icons .right', 'open_in_new')
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
