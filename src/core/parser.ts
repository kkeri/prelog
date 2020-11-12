import { join } from 'path'
import { Braces, Brackets, Cons, List, nil, Nil, Num, Parentheses, Str, Sym } from './syntax'
import { OhmParser } from '../util/ohmParser'

export const parser = new OhmParser(join(__dirname, '../../lib/recipe.js'), {

  Sequence (body) {
    return body.model()
  },
  Parentheses (_lb_, body, _rb_) {
    return new Parentheses(body.model())
  },
  Brackets (_lb_, body, _rb_) {
    return new Brackets(body.model())
  },
  Braces (_lb_, body, _rb_) {
    return new Braces(body.model())
  },

  // lexer

  identifier (start, parts) {
    return new Sym(this.source.contents)
  },
  operator (chars) {
    return new Sym(this.source.contents)
  },
  delimiter (chars) {
    return new Sym(this.source.contents)
  },
  number (sign, nat, _point_, frac, exp) {
    return new Num(parseFloat(this.source.contents))
  },
  string (quote1, chars, quote2) {
    return new Str(chars.source.contents)
  },

  // builtin rules

  NonemptyListOf (x, _, xs) {
    const list: List = xs.model().reduceRight(
      (rest, next) => new Cons(next, rest),
      nil,
    )
    return new Cons(x.model(), list)
  },
  EmptyListOf () {
    return new Nil
  },
  _terminal () {
    return this.source.contents
  }
})
