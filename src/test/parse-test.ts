import { test } from 'tap'
import { parse } from './fixture/parse'

test('basic', (t) => {
  t.ok(parse(''))
  t.ok(parse('\r\n'))

  t.end()
})
