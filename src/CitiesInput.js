import {cloneDeep} from 'lodash'
import {div, input, label, a} from '@cycle/dom'

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

function createReceiveCitiesStream (HTTP) {
  const cities$ = HTTP
    .filter(res$ => res$.request.category === 'geonames')
    .flatMap(x => x)
    .filter(res => res.body && res.body.geonames)
    .map(res => res.body.geonames)
  return cities$
}

function createSelectCityStream (DOM) {
  const selectCity$ = DOM.select('.js-result')
    .events('click')
    .map(e => cloneDeep(e.target.city)) // lot of pain without the cloneDeep
  return selectCity$
}

function computeSelectedCitiesStream (city$) {
  const selectedCities$ = city$
    .startWith([])
    .scan((cities, city) => cities.concat(city))
  return selectedCities$
}

function computeReturnedCitiesStream (cities$, selectCity$, requestCities$) {
  const returnedCities$ = cities$.withLatestFrom(
      computeSelectedCitiesStream(selectCity$),
      (cities, selectedCities) =>
        cities.filter(city => selectedCities.every(c => c.name !== city.name))
    )
    .startWith([])
    .merge(requestCities$.map(r => null))
    .debounce(200)
  return returnedCities$
}

function renderInput (returnedCities$) {
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

function CitiesInput (sources) {
  // intent -> action
  const requestCities$ = createRequestCitiesStream(sources.DOM)
  const receiveCities$ = createReceiveCitiesStream(sources.HTTP)
  const selectCity$ = createSelectCityStream(sources.DOM)
  // action -> state
  const returnedCities$ = computeReturnedCitiesStream(receiveCities$, selectCity$, requestCities$)
  // state -> view
  const vtree$ = renderInput(returnedCities$)
  // sinks
  return {
    DOM: vtree$,
    HTTP: requestCities$,
    actions: {selectCity$}
  }
}

export default CitiesInput
