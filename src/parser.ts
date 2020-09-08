import { join } from 'path'
import { OhmParser } from './util/ohmParser'
import * as syntax from './syntax'

export const parser = new OhmParser(join(__dirname, '../lib/recipe.js'), {

  Sequence (body) {
    const elements = body.model()
    if (elements.length === 1) {
      return elements[0]
    }
    else {
      return new syntax.Sequence(elements)
    }
  },
  Parentheses_full (_lb_, body, _comma_, _rb_) {
    const elements = body.model()
    if (elements.length === 1) {
      return elements[0]
    }
    else {
      return new syntax.Parentheses(elements)
    }
  },
  Parentheses_empty (_lb_, _rb_) {
    return new syntax.Parentheses([])
  },
  Brackets_full (_lb_, body, _comma_, _rb_) {
    return new syntax.Brackets(body.model())
  },
  Brackets_empty (_lb_, _rb_) {
    return new syntax.Brackets([])
  },
  Braces_full (_lb_, body, _sc_, _rb_) {
    return new syntax.Braces(body.model())
  },
  Braces_empty (_lb_, _rb_) {
    return new syntax.Braces([])
  },

  // lexer

  identifier (start, part) {
    return new syntax.Name(this.source.contents)
  },
  symbol (chars) {
    return new syntax.Sym(this.source.contents)
  },
  number (sign, nat, _point_, frac, exp) {
    return new syntax.Num(parseFloat(this.source.contents))
  },
  singleQuotedString (quote1, chars, quote2) {
    return new syntax.Str(chars.source.contents)
  },
  doubleQuotedString (quote1, chars, quote2) {
    return new syntax.Str(chars.source.contents)
  },

  // builtin rules

  NonemptyListOf (x, _, xs) {
    return [x.model()].concat(xs.model())
  },
  EmptyListOf () {
    return []
  },
  _terminal () {
    return this.source.contents
  }
})
