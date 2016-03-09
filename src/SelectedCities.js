import {div, ol, li, h5, i, a} from '@cycle/dom'

function computeSelectedCitiesStream (city$) {
  const selectedCities$ = city$
    .startWith([])
    .scan((cities, city) => cities.concat(city))
  return selectedCities$
}

function renderSelectedCities (cities$) {
  const vtree$ = cities$
    .map(cities => {
      if (cities.length === 0) {
        return null
      }
      return (
        div([
          ol('.collection', cities.map(city =>
            li('.collection-item', `${city.name}, ${city.countryName}`)
          )),
          h5({style: {display: 'inline-block', 'vertical-align': 'middle'}}, '👉 Add more cities or'),
          a('.btn .brown .js-generate-borny', {style: {'margin-left': '8px'}}, [
            'generate your Bornycentre',
            i('.material-icons .right', 'child_care')
          ])
        ])
      )
    })
  return vtree$
}

function SelectedCities ({actions}) {
  const selectedCities$ = computeSelectedCitiesStream(actions.selectCity$)
  const vtree$ = renderSelectedCities(selectedCities$)
  return {
    DOM: vtree$
  }
}

export default SelectedCities
