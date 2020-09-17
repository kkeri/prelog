import * as syntax from "../syntax"
import { arrayToList, equalSyntax, Syntax } from "../syntax"
import { Environment, meet, join, evaluate } from "./environment"
import { Rank } from "./threshold"

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

  join (other: this, env: Environment): Model | null {
    return null
  }

  meet (other: this, env: Environment): Model | null {
    return null
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
    return new syntax.Brackets(arrayToList(children.map(m => m.reflect())))
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
    return new syntax.Braces(arrayToList(children.map(m => m.reflect())))
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
    public a: Model,
    public b: Model,
    public native?: boolean
  ) { super() }

  structEqual (other: this): boolean {
    return this.a === other.a && structEqual(this.b, other.b)
  }

  reflect () {
    return new syntax.Sequence(arrayToList([
      new syntax.Sym('def'),
      this.a.reflect(),
      this.b.reflect(),
    ]))
  }

  join (other: this, env: Environment) {
    return this.a === other.a
      ? new Definition(this.a, join(env, this.b, other.b))
      : null
  }

  meet (other: this, env: Environment) {
    return this.a === other.a
      ? new Definition(this.a, meet(env, this.b, other.b))
      : null
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
    return new syntax.Sequence(arrayToList([
      new syntax.Sym('proc'),
      this.body,
    ]))
  }

  invoke (env: Environment): Model {
    return evaluate(env, this.body)
  }

  join (other: this) {
    return equalSyntax(this.body, other.body) ? this : null
  }

  meet (other: this) {
    return equalSyntax(this.body, other.body) ? this : null
  }
}

export class NativeProcess extends Model {
  rank = Rank.Neutral

  constructor (
    public name: Model,
    public invokeFn: (env: Environment) => Model,
  ) { super() }

  structEqual (other: this): boolean {
    return this === other
  }

  reflect () {
    return this.name.reflect()
  }

  invoke (env: Environment): Model {
    return this.invokeFn(env)
  }

  join (other: this) {
    return this === other ? this : null
  }

  meet (other: this) {
    return this === other ? this : null
  }
}

// // Marks the starting point of the parent environment in the program.
// export class ParentEnvironment extends Model {
//   rank = Rank.Neutral

//   constructor (
//     public model: Model,
//     public hidden?: boolean,
//   ) { super() }

//   structEqual (other: this): boolean {
//     return this.model === other.model
//   }

//   reflect () {
//     return this.model.reflect()
//   }

//   join (other: this) {
//     return this === other ? this : null
//   }

//   meet (other: this) {
//     return this === other ? this : null
//   }
// }

export class SyntaxErr extends Model {
  rank = Rank.Bottom

  constructor (
    public descr: string,
    public syntax: Syntax,
  ) { super() }

  structEqual (other: this): boolean {
    return this.descr === other.descr && syntax.equalSyntax(this.syntax, other.syntax)
  }

  reflect () {
    return new syntax.Sequence(arrayToList([
      new syntax.Sym('error'),
      new syntax.Str(this.descr),
      this.syntax,
    ]))
  }
}

export class SemanticsErr extends Model {
  rank = Rank.Bottom

  constructor (
    public descr: string,
    public model,
  ) { super() }

  structEqual (other: this): boolean {
    return this.descr === other.descr && structEqual(this.model, other.model)
  }

  reflect () {
    return new syntax.Sequence(arrayToList([
      new syntax.Sym('error'),
      new syntax.Str(this.descr),
      this.model.reflect(),
    ]))
  }
}


// leaf Models


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

  join (other: this) {
    return this.value === other.value ? this : null
  }

  meet (other: this) {
    return this.value === other.value ? this : null
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

  join (other: this) {
    return this.value === other.value ? this : null
  }

  meet (other: this) {
    return this.value === other.value ? this : null
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

  join (other: this) {
    return this.value === other.value ? this : null
  }

  meet (other: this) {
    return this.value === other.value ? this : null
  }
}

// An atomic Model.
export class Atom extends Model {

  constructor (
    public rank: Rank = Rank.Neutral,
    public syntax: Syntax
  ) { super() }

  structEqual (other: this): boolean {
    return this === other
  }

  reflect () {
    return this.syntax ?? new syntax.Sym('atom')
  }

  join (other: this) {
    return this === other ? this : null
  }

  meet (other: this) {
    return this === other ? this : null
  }
}

// Returns true if two models are structurally equal.
export function structEqual (a: Model, b: Model): boolean {
  return a === b || (a.constructor === b.constructor && a.structEqual(b))
}
