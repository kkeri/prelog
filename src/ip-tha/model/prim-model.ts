import * as syntax from "../../core/syntax"
import { Syntax } from "../../core/types"
import { Rank } from "../rank"
import { Model } from "./base-model"

// Primitive models

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
