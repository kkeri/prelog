import stream = require('stream')

export interface PrettyFormatterOptions {
  indentSize?: number
  lineBreak?: string
  breakLimit?: number
}

// Low level output formatter.
export class PrettyFormatter {
  options: PrettyFormatterOptions
  lineLength = 0
  needBreak = false

  constructor (
    // The output stream.
    public output: stream.Writable,
    // Initial indentation depth.
    public depth: number = 0,
    options: PrettyFormatterOptions = {}
  ) {
    this.options = Object.assign({}, defaultOptions, options)
  }

  /**
   * Starts a new empty line if the current line is not empty.
   * @returns the formatter.
   */
  br (): this {
    this.needBreak = false
    if (this.lineLength) {
      this.output.write(this.options.lineBreak)
      this.lineLength = 0
    }
    return this
  }

  /**
   * Increments indentation level beginning with the next line.
   * @returns the formatter.
   */
  indent (): this {
    this.depth++
    return this.emit('')
  }

  /**
   * Decrements indentation level beginning with the next line.
   * @returns the formatter.
   */
  unindent (): this {
    this.depth--
    return this.emit('')
  }

  /**
   * Emits an indented block.
   * @param {iterable} items - elements inside the block
   * @param {function} itemCb - function that emits an item
   * @param {Object} format - Block descriptor
   * @param {(string|Object)} format.open - The block opening token
   * @param {(string|Object)} format.close - The block closing token
   * @param {(string|Object)} [format.beforeFirst]- Written before the first item
   * @param {(string|Object)} [format.afterLast]- Written after the last item
   * @param {string} format.terminator - A token that is written after each item
   * @param {string} format.separator - A token that is written between each item
   * @returns the formatter.
   */
  block (items, itemCb, format): this {
    let hasItems
    if (format.open) this.emit(format.open)
    for (var item of items) {
      if (!hasItems) {
        hasItems = true
        this.depth++
        if (format.beforeFirst) this.emit(format.beforeFirst)
      } else if (format.separator) {
        this.emit(format.separator)
      }
      itemCb(item, this)
      if (format.terminator) this.emit(format.terminator)
    }
    if (hasItems) {
      this.depth--
      if (format.afterLast) this.emit(format.afterLast)
    }
    if (format.close) this.emit(format.close)
    return this
  }

  /**
   * Writes a string or a token object to the output.
   * If `token` is a string it is written directly to the output.
   * If `token` is an object, it must have the following properties:
   *
   * - {string} text - text to be emitted
   * - {string} [breakValue] - text to be emitted when the token is at the
   *                         end of a line
   *
   * The fundamental difference is that the line may be broken after an
   * object token while it will never be broken after a string token.
   *
   * @param {(string|Object)} token - A string or a token object.
   * @returns the formatter.
   */
  emit (token, style?: Function): this {
    if (this.needBreak) {
      this.br()
    }
    if (typeof token === 'object' && token !== null) {
      var o = token
      token = String(o.value)
      this.needBreak = this.lineLength + token.length >= (this.options.breakLimit || 0)
      if (this.needBreak && o.breakValue != null) {
        token = String(o.breakValue)
      }
    } else {
      token = String(token)
    }
    if (this.needBreak) {
      token = trimRight(token)
    }
    if (token.length > 0) {
      // indent on demand
      if (this.lineLength === 0) {
        token = trimLeft(token)
        this.lineLength = (this.options.indentSize || 2) * this.depth
        if (this.lineLength) this.output.write(' '.repeat(this.lineLength))
      }
      this.lineLength += token.length
      this.output.write(style ? style(token) : token)
    }
    return this
  }
}

const defaultOptions = {
  indentSize: 2,
  breakLimit: 78,
  lineBreak: '\n'
}

/**
 * Trims spaces from the left side of a string.
 * @param {string} str - String to trim.
 */
function trimLeft (str) {
  var i = 0
  for (; i < str.length; ++i) {
    if (str[i] !== ' ') {
      break
    }
  }
  return str.substring(i)
}

/**
 * Trims spaces from the right side of a string.
 * @param {string} str - String to trim.
 */
function trimRight (str) {
  var i = str.length
  while (i-- >= 0) {
    if (str[i] !== ' ') {
      break
    }
  }
  return str.substring(0, i + 1)
}
