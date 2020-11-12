import * as syntax from "../../core/syntax"
import { arrayToList, equalSyntax } from "../../core/syntax"
import { Syntax } from "../../core/types"
import { meet, join, Interpreter, translate, resolve, Theory } from "../interpreter"
import { Rank } from "../rank"
import { BlockSyntaxReader } from "../reader"
import { Model, structEqual } from "./base-model"

// Compound models

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

  join (other: this) {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b) ? this : null
  }

  meet (other: this) {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b) ? this : null
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

  join (other: this) {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b) ? this : null
  }

  meet (other: this) {
    return structEqual(this.a, other.a) && structEqual(this.b, other.b) ? this : null
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
    return arrayToList([
      new syntax.Sym('def'),
      this.a.reflect(),
      this.b.reflect(),
    ])
  }

  join (other: this, th: Theory) {
    return this.a === other.a
      ? new Definition(this.a, join(th, this.b, other.b))
      : null
  }

  meet (other: this, th: Theory) {
    return this.a === other.a
      ? new Definition(this.a, meet(th, this.b, other.b))
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
    return arrayToList([
      new syntax.Sym('proc'),
      this.body,
    ])
  }

  apply (ip: Interpreter, args: BlockSyntaxReader): Model {
    const childIp: Interpreter = {
      ...ip,
      args,
    }
    const reader = new BlockSyntaxReader(this.body)
    return resolve(childIp, ip.program, translate(childIp, reader))
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
    public nativeFn: (ip: Interpreter, reader: BlockSyntaxReader) => Model,
  ) { super() }

  structEqual (other: this): boolean {
    return this === other
  }

  reflect () {
    return this.name.reflect()
  }

  apply (ip: Interpreter, reader: BlockSyntaxReader): Model {
    return this.nativeFn(ip, reader)
  }

  join (other: this) {
    return this === other ? this : null
  }

  meet (other: this) {
    return this === other ? this : null
  }
}

export class Block extends Model {
  rank = Rank.Neutral

  constructor (
    public body: Model,
  ) { super() }

  structEqual (other: this): boolean {
    return structEqual(this.body, other.body)
  }

  reflect () {
    return this.body.reflect()
  }

  join (other: this, th: Theory) {
    return new Block(join(th, this.body, other.body))
  }

  meet (other: this, th: Theory) {
    return new Block(meet(th, this.body, other.body))
  }
}

export class Ref extends Model {
  rank = Rank.Neutral

  constructor (
    public value: Model,
  ) { super() }

  structEqual (other: this): boolean {
    return this === other
  }

  reflect () {
    return arrayToList([
      new syntax.Sym('ref'),
      this.value.reflect(),
    ])
  }

  join (other: this) {
    return this === other ? this : null
  }

  meet (other: this) {
    return this === other ? this : null
  }
}

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
    return arrayToList([
      new syntax.Sym('error'),
      new syntax.Str(this.descr),
      this.syntax,
    ])
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
    return arrayToList([
      new syntax.Sym('error'),
      new syntax.Str(this.descr),
      this.model.reflect(),
    ])
  }
}
