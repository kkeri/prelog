import { test } from 'tap'
import { parse } from './fixture/parse'

test('basic', (t) => {
  t.ok(parse(''))
  t.ok(parse(';'))
  t.notOk(parse('a'))

  t.end()
})

test('typedef', (t) => {
  t.ok(parse('a = type'))
  t.ok(parse('a = b'))

  t.end()
})

test('keyword', (t) => {
  t.ok(parse('a = type'))
  t.notOk(parse('type = a'))

  t.end()
})

test('multiple', (t) => {
  t.ok(parse('a = type; b = type'))
  t.ok(parse('a = type\nb = type'))
  t.ok(parse('a = type\rb = type'))
  t.ok(parse('a = type;\rb = type'))

  t.end()
})

test('record', (t) => {
  t.ok(parse('a = {}'))
  t.ok(parse('a = { ; }'))
  t.ok(parse('a = { x: type }'))
  t.ok(parse('a = { x: type; }'))
  t.ok(parse('a = { x: type; y: type }'))

  t.end()
})

test('annotation', (t) => {
  t.ok(parse('a = type @ {}'))
  t.ok(parse('a = type @ { x: a }'))
  t.ok(parse('a = type @ { x: { y: type } }'))
  t.ok(parse('a = type @ { x: { y: type } @ { z: type } }'))

  t.end()
})

test('comment', (t) => {
  t.ok(parse('a = type // comment'))
  t.ok(parse('a = type // comment\n b = type'))
  t.ok(parse('a = /**/ type'))
  t.notOk(parse('a = type // comment\n b'))
  t.ok(parse('a = type /* comment\n */'))
  t.ok(parse('a = type /* comment\n */; b = type'))
  t.notOk(parse('a = type /* comment\n */ b = type'))
  t.notOk(parse('a = type /* comment\n */ b'))

  t.end()
})
