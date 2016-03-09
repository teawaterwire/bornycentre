import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {makeHTTPDriver} from '@cycle/http'
import {wrapIn} from './src/utils.js'
import CitiesInput from './src/CitiesInput.js'
import SelectedCities from './src/SelectedCities.js'
import Bornycentre from './src/Bornycentre.js'

function main (sources) {
  const citiesInput = CitiesInput(sources)
  const selectCity$ = citiesInput.actions.selectCity$
  const bornycentre = Bornycentre({DOM: sources.DOM, actions: {selectCity$}})
  const selectedCities = SelectedCities({actions: {selectCity$}})
  const vtree$ = wrapIn('.row', citiesInput.DOM, selectedCities.DOM, bornycentre.DOM)
  return {
    DOM: vtree$,
    HTTP: citiesInput.HTTP
  }
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers)
