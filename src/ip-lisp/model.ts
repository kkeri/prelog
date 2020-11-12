import { Cons, nil, Num, Str, Sym } from "../core/syntax"
import { Syntax } from "../core/types"
import { ListReader } from "../util/list"
import { Dictionary } from "../util/types"
import { Environment, EvalContext, Model } from "./types"

export abstract class ModelBase implements Model {
  reflect (): Syntax {
    throw new Error(`Method 'reflect' is not implemented on ${this.constructor.name}`)
  }
}


// primitive models


export class MBool extends ModelBase {
  constructor (
    public value: boolean,
  ) { super() }

  reflect () {
    return new Sym(this.value ? 'true' : 'false')
  }
}

export const True = new MBool(true)
export const False = new MBool(false)

export class MStr extends ModelBase {
  constructor (
    public value: string,
  ) { super() }

  reflect () {
    return new Str(this.value)
  }
}

export class MNum extends ModelBase {
  constructor (
    public value: number,
  ) { super() }

  reflect () {
    return new Num(this.value)
  }
}

export class MAtom extends ModelBase {

  constructor (
    public syntax: Syntax
  ) { super() }

  reflect () {
    return this.syntax ?? new Sym('atom')
  }
}

export class MSort extends ModelBase {

  constructor (
    public syntax: Syntax,
    public ctor: new (...args) => Model
  ) { super() }

  reflect () {
    return this.syntax
  }
}


// compound models


export type MList = MCons | MNil

export class MCons extends ModelBase {

  constructor (
    public next: Model,
    public rest: MList,
  ) { super() }

  reflect () {
    return new Cons(this.next.reflect(), this.rest.reflect())
  }
}

export class MNil extends ModelBase {

  constructor () { super() }

  reflect () {
    return nil
  }
}

export const mnil = new MNil()

export class MNativeFunction extends ModelBase {

  constructor (
    public name: Syntax,
    public fn: (ec: EvalContext, args: ListReader) => Model
  ) { super() }

  reflect () {
    return this.name
  }
}

export class MEnvironment extends ModelBase {

  constructor (
    public env: Environment,
  ) { super() }

  reflect () {
    return new Sym('env')
  }
}
