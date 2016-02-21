import Cycle from '@cycle/core'
import {makeDOMDriver, div, input, ol, li, a, iframe, label, i} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import {Observable} from 'rx'

const MAPS_KEY = 'AIzaSyAdqiipKq9po0jxbrKKZ7p-YWzYmKQsxKU'
const MAPS_EMBED_URL = 'https://www.google.com/maps/embed/v1/place'

function main (sources) {
  const request$ = sources.DOM.select('.js-name-input').events('input')
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

  const selectCity$ = sources.DOM.select('.js-result').events('click')
    .map(e => {
      return {
        name: e.target.getAttribute('data-name'),
        country: e.target.getAttribute('data-country'),
        lat: e.target.getAttribute('data-lat'),
        lng: e.target.getAttribute('data-lng')
      }
    })

  const selectedCities$ = selectCity$
    .startWith([])
    .scan((cities, city) => cities.concat(city))

  const bornycentre$ = selectedCities$
    .filter(cities => cities.length > 0)
    .map(cities => {
      const count = cities.length
      const sumObject = cities.reduce((sum, city) => {
        return {
          lat: sum.lat + parseFloat(city.lat),
          lng: sum.lng + parseFloat(city.lng)
        }
      }, {lat: 0, lng: 0})
      return {
        lat: sumObject.lat / count,
        lng: sumObject.lng / count
      }
    })
    .startWith(null)

  const selectedVTree$ = Observable.combineLatest(selectedCities$, bornycentre$,
    (cities, bornycentre) => {
      if (cities.length === 0) {
        return null
      }
      let vContent = [ol(
        '.collection',
        cities.map(city =>
          li('.collection-item', `${city.name}, ${city.country}`)
        )
      )]
      if (bornycentre !== null) {
        const coords = `${bornycentre.lat},${bornycentre.lng}`
        vContent.push(div('.center-align', [
          a('.btn-large .indigo',
            {
              href: `https://www.google.com/maps/place/${coords}`,
              target: '_blank',
              style: {margin: '30px'}
            }, [
              'My Bornycentre',
              i('.material-icons .right', 'open_in_new')
            ]
          ),
          div([
            iframe({
              src: `${MAPS_EMBED_URL}?key=${MAPS_KEY}&q=${coords}&zoom=10`,
              width: '100%',
              height: 450,
              frameborder: 0,
              style: {border: 0}
            })
          ])
        ]))
      }
      return vContent
    }
  )

  const cities$ = sources.HTTP
    .filter(res$ => res$.request.category === 'geonames')
    .flatMap(x => x)
    .filter(res => res.body && res.body.geonames)
    .map(res => res.body.geonames)
    .startWith([])

  const nameSelectedCities$ = selectedCities$.map(cities => {
    let names = {}
    cities.forEach(city => names[city.name] = true)
    return names
  })

  const formVTree$ = Observable.combineLatest(cities$, nameSelectedCities$,
    (cities, nameSelectedCities) => {
      return cities$.map(cities =>
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
              cities
                .filter(city => !nameSelectedCities[city.name])
                .map(city =>
                  a('.js-result .btn', {
                    style: {margin: '5px'},
                    attributes: {
                      'data-name': city.name,
                      'data-country': city.countryName,
                      'data-lat': city.lat,
                      'data-lng': city.lng
                    }},
                    `${city.name}, ${city.countryName}`
                  )
                )
              )
          ])
        ])
      )
    }
  )

  const vtree$ = Observable.combineLatest(formVTree$, selectedVTree$,
    (formVTree, selectedVTree) => div('.row', [formVTree, selectedVTree])
  )

  return {
    DOM: vtree$,
    HTTP: request$
  }
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers)
