import Cycle from '@cycle/core'
import {makeDOMDriver, div, input, ol, li, a, iframe, label, i, span} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import {Observable} from 'rx'
import {cloneDeep} from 'lodash'
import {MAPS_KEY, MAPS_EMBED_URL, DOMAIN} from './config.js'

function createRequestCitiesStream (DOM) {
  const request$ = DOM.select('.js-name-input')
    .events('input')
    .debounce(500)
    .map(e => e.target.value)
    .filter(query => query.length > 0)
    .map(query => {
      return {
        url: 'model.json',
        query: {q: query},
        category: 'geonames'
      }
    })
  return request$
}

function createSelectCityStream (DOM) {
  const selectCity$ = DOM.select('.js-result')
    .events('click')
    .map(e => cloneDeep(e.target.city)) // lot of pain without the cloneDeep
  return selectCity$
}

function createReceiveCitiesStream (HTTP) {
  const cities$ = HTTP
    .filter(res$ => res$.request.category === 'geonames')
    .flatMap(x => x)
    .filter(res => res.body && res.body.geonames)
    .map(res => res.body.geonames)
  return cities$
}

function computeSelectedCitiesStream (city$) {
  const selectedCities$ = city$
    .startWith([])
    .scan((cities, city) => cities.concat(city))
  return selectedCities$
}

function computeReturnedCitiesStream (selectedCities$, cities$, requestCities$) {
  const returnedCities = Observable.combineLatest(selectedCities$, cities$,
    (selectedCities, cities) =>
      cities.filter(city => selectedCities.every(c => c.name !== city.name))
    )
    .startWith([])
    .merge(requestCities$.map(r => null))
    .debounce(200)
  return returnedCities
}

function computeBornycentreStream (city$) {
  const bornycentre$ = city$
    .startWith({sumLat: 0, sumLng: 0, count: 0})
    .scan((bornycentre, city) => {
      const newBorn = {
        sumLat: bornycentre.sumLat + parseFloat(city.lat),
        sumLng: bornycentre.sumLng + parseFloat(city.lng),
        count: bornycentre.count + 1
      }
      return Object.assign({
        lat: newBorn.sumLat / newBorn.count,
        lng: newBorn.sumLng / newBorn.count
      }, newBorn)
    })
  return bornycentre$
}

function renderForm (returnedCities$) {
  const vtree$ = returnedCities$.map(returnedCities => {
    return (
      div('.col .s12', [
        div('.row', [
          div('.input-field .col .s6 .push-s3', [
            input('.js-name-input', {id: 'name-input', type: 'text'}),
            label({attributes: {for: 'name-input'}}, 'Add your cities')
          ])
        ]),
        div('.row', [
          div('.js-results .col .s8 .push-s2 .center-align',
            {style: {minHeight: '100px'}},
            returnedCities === null
              ? div('.progress', [div('.indeterminate')])
              : returnedCities
                  .map(city =>
                    a('.js-result .btn', {
                      style: {margin: '5px'},
                      city: city
                    },
                      `${city.name}, ${city.countryName}`
                    )
                  )
            )
        ])
      ])
    )
  })
  return vtree$
}

function renderSelectedCities (cities$) {
  const vtree$ = cities$
    .map(cities => {
      if (cities.length === 0) {
        return null
      }
      return (
        ol('.collection', cities.map(city =>
          li('.collection-item', `${city.name}, ${city.countryName}`)
        ))
      )
    })
  return vtree$
}

function renderBornycentre (bornycentre$) {
  const vtree$ = bornycentre$
    .map(bornycentre => {
      if (bornycentre.count === 0) {
        return null
      }
      const coords = `${bornycentre.lat},${bornycentre.lng}`
      const mapLink = `https://www.google.com/maps/place/${coords}`
      return (
        div('.row .center-align', [
          div('.card .col .s8 .push-s2', {style: {margin: '30px'}}, [
            div('.card-content', [
              div('.card-title', 'Yay! Easy to share 😁'),
              `Looks like that's my #Bornycentre: `,
              a('.truncate', mapLink),
              div([
                `Where's yours?! Find out `,
                a(DOMAIN)
              ])
            ]),
            div('.card-action', [
              a('.btn-large .indigo',
                {href: mapLink, target: '_blank'},
                [
                  span('.hide-on-small-and-down', 'My Bornycentre in full-width'),
                  i('.material-icons .right', 'open_in_new')
                ]
              )
            ])
          ]),
          div([
            iframe({
              src: `${MAPS_EMBED_URL}?key=${MAPS_KEY}&q=${coords}&zoom=10`,
              width: '100%',
              height: 450,
              frameborder: 0,
              style: {border: 0}
            })
          ])
        ])
      )
    })
  return vtree$
}

function wrap (...arrayVTree$) {
  const vtree$ = Observable.combineLatest(arrayVTree$,
    (...arrayVTree) => div('.row', arrayVTree)
  )
  return vtree$
}

function main (sources) {
  // intent -> action
  const requestCities$ = createRequestCitiesStream(sources.DOM)
  const receiveCities$ = createReceiveCitiesStream(sources.HTTP)
  const selectCity$ = createSelectCityStream(sources.DOM)
  // action -> state
  const selectedCities$ = computeSelectedCitiesStream(selectCity$)
  const returnedCities$ = computeReturnedCitiesStream(selectedCities$, receiveCities$, requestCities$)
  const bornycentre$ = computeBornycentreStream(selectCity$)
  // state -> view
  const formVTree$ = renderForm(returnedCities$)
  const selectedVTree$ = renderSelectedCities(selectedCities$)
  const bornycentreVTree$ = renderBornycentre(bornycentre$)
  const vtree$ = wrap(formVTree$, selectedVTree$, bornycentreVTree$)

  return {
    DOM: vtree$,
    HTTP: requestCities$
  }
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers)
