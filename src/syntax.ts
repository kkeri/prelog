
export class Syntax {
  // Returns true if two syntax trees of the same type are structurally equal.
  equalSyntax (other: this): boolean {
    return this === other
  }
}

export class Sequence extends Syntax {
  constructor (
    public body: List,
  ) { super() }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export class Brackets extends Syntax {
  constructor (
    public body: List,
  ) { super() }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export class Braces extends Syntax {
  constructor (
    public body: List,
  ) { super() }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export class Parentheses extends Syntax {
  constructor (
    public body: List,
  ) { super() }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.body, other.body)
  }
}

export type List = Cons | EmptyList

export class Cons extends Syntax {
  constructor (
    public next: Syntax,
    public rest: List,
  ) { super() }

  equalSyntax (other: this): boolean {
    return equalSyntax(this.next, other.next) && equalSyntax(this.rest, other.rest)
  }
}

export class EmptyList extends Syntax {
  constructor (
  ) { super() }

  equalSyntax (other: this): boolean {
    return true
  }
}

// leaf nodes

export class Sym extends Syntax {
  constructor (
    public value: string,
  ) { super() }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

export class Str extends Syntax {
  constructor (
    public value: string,
  ) { super() }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

export class Num extends Syntax {
  constructor (
    public value: number,
  ) { super() }

  equalSyntax (other: this): boolean {
    return this.value === other.value
  }
}

export function equalSyntax (a: Syntax, b: Syntax): boolean {
  return a === b || (a.constructor === b.constructor && a.equalSyntax(b))
}

// helpers

export function arrayToList (items: Syntax[]): List {
  return items.reduceRight(
    (rest, next) => new Cons(next, rest),
    new EmptyList,
  )
}

export function listToArray (list: List): Syntax[] {
  const arr: Syntax[] = []
  while (!(list instanceof EmptyList)) {
    arr.push(list.next)
    list = list.rest
  }
  return arr
}
