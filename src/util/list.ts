import { Cons, List } from "../core/syntax"
import { Syntax } from "../core/syntax"

export class ListReader {
  constructor (
    public list: List,
  ) { }

  // Returns true if there are more list elements.
  hasNext () {
    return this.list instanceof Cons
  }

  // Returns and drops the next list element.
  // Throws Error if there are no more arguments.
  next (def?: Syntax) {
    if (this.list instanceof Cons) {
      const arg = this.list.first
      this.list = this.list.rest
      return arg
    }
    else if (def) {
      return def
    }
    else {
      throw new Error('not enough arguments')
    }
  }

  // Returns the rest of the list.
  rest () {
    return this.list
  }

  // Throws Error if there are more arguments.
  finish () {
    if (this.list instanceof Cons) {
      throw new Error('too many arguments')
    }
  }
}
