import * as syntax from './syntax'
import { ActionMap } from './util/action'
import { Sequence } from './syntax'

// Pretty-print rules for surface syntax.

export const printActions = new ActionMap().addClasses(syntax, {

  // surface syntax

  Program (printer) {
    for (const decl of this.declarations) printer.print(decl).br()
  },

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
    printer.fmt.block(this.body, (elem) => printer.print(elem, operator.parenList), {
      open: '(',
      close: ')',
      separator: ', ',
    })
  },

  Brackets (printer) {
    printer.fmt.block(this.body, (elem) => printer.print(elem, operator.bracketList), {
      open: { value: '[' },
      close: { value: ']' },
      terminator: { value: ', ', breakValue: '' }
    })
  },

  Braces (printer) {
    printer.fmt.block(this.body, (elem) => printer.print(elem, operator.braceList), {
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
  parenList: {
    precedence: 70,
    fixity: 'in',
    symbol: ',',
  },
  bracketList: {
    precedence: 70,
    fixity: 'in',
    symbol: ',',
  },
  braceList: {
    precedence: 70,
    fixity: 'in',
    symbol: ';',
  },
  sequence: {
    precedence: 70,
    fixity: 'in',
    symbol: ' ',
    noPadding: true,
  },
}
