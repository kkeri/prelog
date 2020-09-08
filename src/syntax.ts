
export class Syntax {
  // Returns true if two syntax trees of the same type are structurally equal.
  structEqual (other: this): boolean {
    return this === other
  }
}

export class Program extends Syntax {
  constructor (
    public body: Syntax[],
  ) { super() }

  structEqual (other: this): boolean {
    return equalArrays(this.body, other.body)
  }
}

export class Sequence extends Syntax {
  constructor (
    public body: Syntax[],
  ) { super() }

  structEqual (other: this): boolean {
    return equalArrays(this.body, other.body)
  }
}

export class Brackets extends Syntax {
  constructor (
    public body: Syntax[],
  ) { super() }

  structEqual (other: this): boolean {
    return equalArrays(this.body, other.body)
  }
}

export class Braces extends Syntax {
  constructor (
    public body: Syntax[],
  ) { super() }

  structEqual (other: this): boolean {
    return equalArrays(this.body, other.body)
  }
}

export class Parentheses extends Syntax {
  constructor (
    public body: Syntax[],
  ) { super() }

  structEqual (other: this): boolean {
    return equalArrays(this.body, other.body)
  }
}

// leaf nodes

export class Name extends Syntax {
  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }
}

export class Sym extends Syntax {
  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }
}

export class Str extends Syntax {
  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }
}

export class Num extends Syntax {
  constructor (
    public value: number,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }
}

// helpers

export function equalSyntax (a: Syntax, b: Syntax): boolean {
  return a.constructor === b.constructor && a.structEqual(b)
}

function equalArrays (a: Syntax[], b: Syntax[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!a[i].structEqual(b[i])) return false
  }
  return true
}
