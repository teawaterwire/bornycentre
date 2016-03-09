import {Observable} from 'rx'
import {div} from '@cycle/dom'

export function wrapIn (className, ...arrayVTree$) {
  const vtree$ = Observable.combineLatest(arrayVTree$,
    (...arrayVTree) => div(className, arrayVTree)
  )
  return vtree$
}
