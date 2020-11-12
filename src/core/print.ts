import * as syntax from './syntax'
import { Cons, listToArray, nil, Parentheses } from './syntax'
import { ActionMap } from '../util/action'

// Pretty-print rules for surface syntax.

export const printActions = new ActionMap().addClasses(syntax, {

  Cons (printer, op) {
    if (op === operator.sequence) {
      // copy the sequence to avoid circularity
      printer.print(new Parentheses(new Cons(this, nil)))
    }
    else {
      printer.naryOperation(operator.sequence, op, syntax.listToArray(this))
    }
  },

  Parentheses (printer) {
    printer.fmt.block(listToArray(this.body), (elem) => printer.print(elem), {
      open: '(',
      close: ')',
      separator: ' ',
    })
  },

  Brackets (printer) {
    printer.fmt.block(listToArray(this.body), (elem) => printer.print(elem), {
      open: { value: '[' },
      close: { value: ']' },
      separator: { value: ' ', breakValue: '' }
    })
  },

  Braces (printer) {
    printer.fmt.block(listToArray(this.body), (elem) => printer.print(elem), {
      open: { value: '{' },
      close: { value: '}' },
      separator: { value: ' ', breakValue: '' }
    })
  },

  // leaves

  Sym (printer) {
    printer.id(this.value)
  },

  Str (printer) {
    printer.print(this.value)
  },

  Num (printer) {
    printer.print(this.value)
  },
})

const operator = {
  sequence: {
    precedence: 70,
    fixity: 'in',
    symbol: ' ',
    noPadding: true,
  },
}
