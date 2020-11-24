
export interface Syntax {
  // Returns true if two syntax trees of the same type are structurally equal.
  equalSyntax (other: this): boolean
}

export interface SyntaxProcessor {
  send (term: Syntax): void
}

export class Brackets implements Syntax {
  constructor (
    public body: List,
  ) { }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export class Braces implements Syntax {
  constructor (
    public body: List,
  ) { }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export class Parentheses implements Syntax {
  constructor (
    public body: List,
  ) { }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export type List = Cons | Nil

export class Cons implements Syntax {
  constructor (
    public first: Syntax,
    public rest: List,
  ) { }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.first, other.first) && equalSyntax(this.rest, other.rest)
  }
}

export class Nil implements Syntax {
  constructor (
  ) { }

  equalSyntax (other: this): boolean {
    return true
  }
}

export function isList (term: Syntax): term is List {
  return term instanceof Cons || term instanceof Nil
}

export function isNil (list: List): list is Nil {
  return list instanceof Nil
}

export class SyntaxErr implements Syntax {
  constructor (
    public descr: string,
    public syntax: Syntax,
  ) { }

  equalSyntax (other: this): boolean {
    return this.descr === other.descr && equalSyntax(this.syntax, other.syntax)
  }
}

// leaf nodes

export class Sym implements Syntax {
  constructor (
    public value: string,
  ) { }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

export class Str implements Syntax {
  constructor (
    public value: string,
  ) { }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

export class Num implements Syntax {
  constructor (
    public value: number,
  ) { }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

// helpers

export const nil = new Nil()

export function equalSyntax (a: Syntax, b: Syntax): boolean {
  return a === b || (a.constructor === b.constructor && a.equalSyntax(b))
}

export function arrayToList (items: Syntax[]): List {
  return items.reduceRight(
    (rest, next) => new Cons(next, rest),
    nil,
  )
}

export function shiftList (list: Cons): [Syntax, List] {
  return [list.first, list.rest]
}

export function listToArray (list: List): Syntax[] {
  const arr: Syntax[] = []
  while (!(list instanceof Nil)) {
    arr.push(list.first)
    list = list.rest
  }
  return arr
}
