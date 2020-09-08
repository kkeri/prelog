import { ActionMap } from './action'
import { PrettyFormatter } from './format'
import assert = require('assert')

const idRegex = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/

export interface Operator {
  // precedence of the operator, natural number
  precedence: number
  fixity: 'in' | 'pre' | 'post'
  // the printed appearance of the operator
  symbol: string
  // if true, the operation is parenthesized even if its precedence equals
  // that of the parent operation.
  parens?: boolean
  // if true, the operator is not padded with spaces
  noPadding?: boolean
}

export interface ModelPrinterArgs {
  formatter: PrettyFormatter
  actions: ActionMap,
  styles?: { [index: string]: Function },
  annotate?: boolean
}

// High level code formatter.
// Its methods reflect typical syntax units.
// Converts a program model to text with optional syntax highlight.
export class ModelPrinter {
  fmt: PrettyFormatter
  actions: ActionMap
  styles: { [index: string]: Function }
  annotate: boolean
  busySet = new Set()

  constructor (args: ModelPrinterArgs) {
    this.fmt = args.formatter
    this.actions = args.actions
    this.styles = args.styles || {}
    this.annotate = args.annotate || false
  }

  // Prints a value with respect to its type and class.
  print (node: any, prec: number = 0): this {
    if (node === undefined) {
      this.keyword('undefined')
    } else if (node === null) {
      this.keyword('null')
    } else if (Array.isArray(node)) {
      for (let i of node) this.print(i, prec)
    } else if (typeof node === 'object') {
      if (this.busySet.has(node)) {
        this.keyword('@circular')
        return this
      }
      this.busySet.add(node)
      let action = this.actions.get(node)
      if (action) {
        action.call(node, this, prec)
      } else {
        this.fmt.emit(String(node), this.styles.error)
      }
      this.busySet.delete(node)
    } else if (typeof node === 'string') {
      // todo: escape string
      this.fmt.emit('"' + node + '"', this.styles.string)
    } else if (typeof node === 'number') {
      this.fmt.emit(node.toString(), this.styles.number)
    } else if (typeof node === 'function') {
      if (this.annotate) {
        this.keyword('@function')
        this.fmt.emit(' ')
      }
      this.id(node.name ? node.name : '<anonymous-function>')
    } else {
      // todo: add regexp
      this.fmt.emit(node.toString())
    }
    return this
  }

  // Prints a parenthesized, comma separated list of models.
  parenList (items: any[]): this {
    if (items.length === 0) {
      this.delimiter('()')
    } else {
      this.fmt.block(items, (item) => this.print(item), {
        open: '(',
        close: ')',
        separator: ','
      })
    }
    return this
  }

  // Prints a binary operation.
  //    parent - the parent operator or precedence of the parent operator
  binaryOperation (op, parent: Operator | number | undefined, a, b): this {
    let prec = (typeof parent === 'object') ? parent.precedence : parent || 0
    if (op.parens && parent !== op) prec++
    if (op.precedence < prec) this.delimiter('(')
    switch (op.fixity) {
      case 'in':
        this.print(a, op).operator(op).print(b, op)
        break
      case 'pre':
        this.operator(op).print(a, op)
        break
      case 'post':
        this.print(a, op).operator(op)
        break
    }
    if (op.precedence < prec) this.delimiter(')')
    return this
  }

  // Prints an n-ary operation.
  //    parent - the parent operator or precedence of the parent operator
  naryOperation (op, parent: Operator | number | undefined, operands): this {
    let prec = (typeof parent === 'object') ? parent.precedence : parent || 0
    if (op.parens && parent !== op) prec++
    if (op.precedence < prec) this.delimiter('(')
    if (op.fixity !== 'in') throw new Error(`infix operator expected but got '${op.symbol} which is ${op.fixity}fix`)
    let first = true
    for (const x of operands) {
      if (first) first = false; else this.operator(op)
      this.print(x, op)
    }
    if (op.precedence < prec) this.delimiter(')')
    return this
  }

  operator (op): this {
    if (op.fixity !== 'in' || op.noPadding) {
      this.fmt.emit(op.symbol, this.styles.operator)
    }
    else {
      this.ws().fmt.emit(op.symbol, this.styles.operator)
      this.ws()
    }
    return this
  }

  // Prints a chunk of text with optional style.
  text (text: string, style?: Function): this {
    this.fmt.emit(text, style)
    return this
  }

  // Prints a freshly bound key with syntax highlight.
  boundKey (key: string | number | symbol): this {
    if (typeof key === 'string' && idRegex.test(key)) {
      this.id(key)
    } else {
      this.delimiter('[').print(key).delimiter(']')
    }
    return this
  }

  // Prints an identifier with syntax highlight.
  id (key: string): this {
    this.fmt.emit(key.toString(), this.styles.name)
    return this
  }

  // Prints a reserved word with syntax highlight.
  keyword (word: string): this {
    this.fmt.emit(word, this.styles.keyword)
    return this
  }

  // Prints a delimiter with syntax highlight.
  delimiter (delimiter: string): this {
    this.fmt.emit(delimiter, this.styles.delimiter)
    return this
  }

  // Starts a new empty line if the current line is not empty.
  br (): this {
    this.fmt.br()
    return this
  }

  // Increments indentation level beginning with the next line.
  indent (): this {
    this.fmt.indent()
    return this
  }

  // Decrements indentation level beginning with the next line.
  unindent (): this {
    this.fmt.unindent()
    return this
  }

  // Prints non-breaking space.
  ws (): this {
    this.fmt.emit(' ')
    return this
  }

  // Prints breaking space.
  bs (): this {
    this.fmt.emit({ value: ' ', breakValue: '' })
    return this
  }
}
