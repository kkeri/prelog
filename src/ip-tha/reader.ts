import { arrayToList, Braces, Brackets, Cons, List, Nil, nil, Parentheses, Sym, SyntaxErr } from "../core/syntax"
import { Syntax } from "../core/types"

// Reads items of a sequence.
export interface Reader<T> {
  // Reads the next item.
  read (): T
  // Returns true if there are more items to read.
  hasNext (): boolean
  // Returns a new reader that is identical to but is independent from this one.
  fork (): Reader<T>
  // Overrides the state of this reader with another one. 
  join (reader: this): void
}

// Reads blocked terms from a list of tokens.
export class BlockSyntaxReader implements Reader<Syntax>  {
  constructor (
    public tokens: List,
  ) { }

  read (): Syntax {
    if (this.tokens instanceof Nil) return nil
    const next = this.tokens.first
    this.tokens = this.tokens.rest
    if (next instanceof Sym) {
      if (next.value === '(') return new Parentheses(this.readBlock(')'))
      if (next.value === '{') return new Braces(this.readBlock('}'))
      if (next.value === '[') return new Brackets(this.readBlock(']'))
    }
    return next
  }

  hasNext () {
    return this.tokens instanceof Cons
  }

  fork () {
    return new BlockSyntaxReader(this.tokens)
  }

  join (reader: BlockSyntaxReader) {
    this.tokens = reader.tokens
  }

  readBlock (close: string): List {
    const items: Syntax[] = []
    while (true) {
      const item = this.read()
      if (item instanceof Nil) {
        return new SyntaxErr(`expected '${close}'`, item)
      }
      if (item instanceof Sym && item.value === close) {
        return arrayToList(items)
      }
      items.push(item)
    }
  }
}
