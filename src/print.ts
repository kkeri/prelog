import * as syntax from './syntax'
import { ActionMap } from './util/action'
import { Sequence } from './syntax'

// Pretty-print rules for surface syntax.

export const printActions = new ActionMap().addClasses(syntax, {

  Sequence (printer, op) {
    if (op === operator.sequence) {
      // copy the sequence to avoid circularity
      printer.print(new syntax.Parentheses([new Sequence(this.body)]))
    }
    else {
      printer.naryOperation(operator.sequence, op, this.body)
    }
  },

  Parentheses (printer) {
    printer.fmt.block(this.body, (elem) => printer.print(elem), {
      open: '(',
      close: ')',
      separator: ', ',
    })
  },

  Brackets (printer) {
    printer.fmt.block(this.body, (elem) => printer.print(elem), {
      open: { value: '[' },
      close: { value: ']' },
      terminator: { value: ', ', breakValue: '' }
    })
  },

  Braces (printer) {
    printer.fmt.block(this.body, (elem) => printer.print(elem), {
      open: { value: '{' },
      close: { value: '}' },
      terminator: { value: '; ', breakValue: '' }
    })
  },

  // leaves

  Name (printer) {
    printer.id(this.value)
  },

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
