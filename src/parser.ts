import { join } from 'path'
import { OhmParser } from './util/ohmParser'
import { Sequence, Parentheses, EmptyList, Brackets, Braces, Name, Sym, Num, Str, Cons, List } from './syntax'

export const parser = new OhmParser(join(__dirname, '../lib/recipe.js'), {

  Sequence (body) {
    const elements = body.model()
    if (elements instanceof Cons && elements.rest instanceof EmptyList) {
      return elements.next
    }
    else {
      return new Sequence(elements)
    }
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

  // lexer

  identifier (start, part) {
    return new Name(this.source.contents)
  },
  symbol (chars) {
    return new Sym(this.source.contents)
  },
  number (sign, nat, _point_, frac, exp) {
    return new Num(parseFloat(this.source.contents))
  },
  singleQuotedString (quote1, chars, quote2) {
    return new Str(chars.source.contents)
  },
  doubleQuotedString (quote1, chars, quote2) {
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
