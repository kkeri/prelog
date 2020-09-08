import * as syntax from "../syntax"
import { Syntax, equalSyntax } from "../syntax"
import { Rank } from "./threshold"
import { Environment, evaluate, undef, join, meet } from "./interpreter"

export abstract class Model implements Model {
  // Plays role in operations of threshold algebra.
  rank: Rank

  // Returns true if two models of the same class are structurally equal.
  structEqual (other: this): boolean {
    throw new Error(`Method 'structEqual' is not implemented on ${this.constructor.name}`)
  }

  // Invokes the model in the current environment with the current arguments.
  invoke (env: Environment): Model {
    return this
  }

  // Converts the model to a corresponding syntax form.
  reflect (): Syntax {
    throw new Error(`Method 'reflect' is not implemented on ${this.constructor.name}`)
  }

  join (other: this, env: Environment): Model {
    return undef
  }

  meet (other: this, env: Environment): Model {
    return undef
  }
}

// The disjunction of two unrelated models.
export class Or extends Model implements Model {
  constructor (
    public a: Model,
    public b: Model,
    public rank: Rank,
  ) { super() }

  structEqual (other: this): boolean {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b)
  }

  reflect () {
    const children = Array.from(this)
    return new syntax.Brackets(children.map(m => m.reflect()))
  }

  *[Symbol.iterator] (): IterableIterator<Model> {
    yield* Or.tree(this.a)
    yield* Or.tree(this.b)
  }

  static *tree (model): IterableIterator<Model> {
    if (model instanceof Or) yield* model; else yield model
  }
}

// The conjunction of two unrelated models.
export class And extends Model implements Model {
  constructor (
    public a: Model,
    public b: Model,
    public rank: Rank,
  ) { super() }

  structEqual (other: this): boolean {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b)
  }

  reflect () {
    const children = Array.from(this)
    return new syntax.Braces(children.map(m => m.reflect()))
  }

  *[Symbol.iterator] (): IterableIterator<Model> {
    yield* And.tree(this.a)
    yield* And.tree(this.b)
  }

  static *tree (model): IterableIterator<Model> {
    if (model instanceof And) yield* model; else yield model
  }
}

export class Definition extends Model {
  rank = Rank.Neutral

  constructor (
    public a: Name,
    public b: Model,
  ) { super() }

  structEqual (other: this): boolean {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b)
  }

  reflect () {
    return new syntax.Sequence([
      new syntax.Name('def'),
      this.a.reflect(),
      this.b.reflect(),
    ])
  }

  join (other: this, env: Environment): Model {
    return structEqual(this.a, other.a)
      ? new Definition(this.a, join(env, this.b, other.b))
      : undef
  }

  meet (other: this, env: Environment): Model {
    return structEqual(this.a, other.a)
      ? new Definition(this.a, meet(env, this.b, other.b))
      : undef
  }
}

export class Process extends Model {
  rank = Rank.Neutral

  constructor (
    public body: Syntax,
  ) { super() }

  structEqual (other: this): boolean {
    return syntax.equalSyntax(this.body, other.body)
  }

  reflect () {
    return new syntax.Sequence([
      new syntax.Name('proc'),
      this.body,
    ])
  }

  invoke (env: Environment): Model {
    return evaluate(env, this.body)
  }

  join (other: this): Model {
    return equalSyntax(this.body, other.body) ? this : undef
  }

  meet (other: this): Model {
    return equalSyntax(this.body, other.body) ? this : undef
  }
}

export class SyntaxError extends Model {
  rank = Rank.Bottom

  constructor (
    public descr: string,
    public syntax: Syntax,
  ) { super() }

  structEqual (other: this): boolean {
    return this.descr === other.descr && syntax.equalSyntax(this.syntax, other.syntax)
  }

  reflect () {
    return new syntax.Sequence([
      new syntax.Name('error'),
      new syntax.Str(this.descr),
      this.syntax,
    ])
  }
}

export class SemanticsError extends Model {
  rank = Rank.Bottom

  constructor (
    public descr: string,
    public model,
  ) { super() }

  structEqual (other: this): boolean {
    return this.descr === other.descr && structEqual(this.model, other.model)
  }

  reflect () {
    return new syntax.Sequence([
      new syntax.Name('error'),
      new syntax.Str(this.descr),
      this.model.reflect(),
    ])
  }
}


// leaf Models


export class Name extends Model {
  rank = Rank.Neutral

  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }

  reflect () {
    return new syntax.Name(this.value)
  }

  join (other: this): Model {
    return this.value === other.value ? this : undef
  }

  meet (other: this): Model {
    return this.value === other.value ? this : undef
  }
}

export class Sym extends Model {
  rank = Rank.Neutral

  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }

  reflect () {
    return new syntax.Sym(this.value)
  }

  join (other: this): Model {
    return this.value === other.value ? this : undef
  }

  meet (other: this): Model {
    return this.value === other.value ? this : undef
  }
}

export class Str extends Model {
  rank = Rank.Neutral

  constructor (
    public value: string,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }

  reflect () {
    return new syntax.Str(this.value)
  }

  join (other: this): Model {
    return this.value === other.value ? this : undef
  }

  meet (other: this): Model {
    return this.value === other.value ? this : undef
  }
}

export class Num extends Model {
  rank = Rank.Neutral

  constructor (
    public value: number,
  ) { super() }

  structEqual (other: this): boolean {
    return this.value === other.value
  }

  reflect () {
    return new syntax.Num(this.value)
  }

  join (other: this): Model {
    return this.value === other.value ? this : undef
  }

  meet (other: this): Model {
    return this.value === other.value ? this : undef
  }
}

// An atomic Model.
export class Atom extends Model {

  constructor (
    public rank: Rank = Rank.Neutral,
    public syntax?: Syntax
  ) { super() }

  structEqual (other: this): boolean {
    return this === other
  }

  reflect () {
    return this.syntax ?? new syntax.Name('atom')
  }

  join (other: this): Model {
    return this === other ? this : undef
  }

  meet (other: this): Model {
    return this === other ? this : undef
  }
}

// Returns true if two models are structurally equal.
export function structEqual (a: Model, b: Model): boolean {
  return (a.constructor === b.constructor) && a.structEqual(b)
}
