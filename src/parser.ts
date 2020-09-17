import { join } from 'path'
import { Braces, Brackets, Cons, EmptyList, List, Num, Parentheses, Sequence, Str, Sym } from './syntax'
import { OhmParser } from './util/ohmParser'

export const parser = new OhmParser(join(__dirname, '../lib/recipe.js'), {

  Sequence (body) {
    return new Sequence(body.model())
  },
  Parentheses_full (_lb_, body, _comma_, _rb_) {
    const elements = body.model()
    if (elements instanceof Cons && elements.rest instanceof EmptyList) {
      return elements.next
    }
    else {
      return new Parentheses(elements)
    }
  },
  Parentheses_empty (_lb_, _rb_) {
    return new Parentheses(new EmptyList())
  },
  Brackets_full (_lb_, body, _comma_, _rb_) {
    return new Brackets(body.model())
  },
  Brackets_empty (_lb_, _rb_) {
    return new Brackets(new EmptyList())
  },
  Braces_full (_lb_, body, _sc_, _rb_) {
    return new Braces(body.model())
  },
  Braces_empty (_lb_, _rb_) {
    return new Braces(new EmptyList())
  },
  Symbol (sym) {
    return new Sym(this.source.contents)
  },

  // lexer

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
      new EmptyList(),
    )
    return new Cons(x.model(), list)
  },
  EmptyListOf () {
    return new EmptyList
  },
  _terminal () {
    return this.source.contents
  }
})
