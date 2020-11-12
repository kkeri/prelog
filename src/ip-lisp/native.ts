import { nil, Sym } from "../core/syntax"
import { ListReader } from "../util/list"
import { Dictionary } from "../util/types"
import { False, MAtom, MBool, MCons, MEnvironment, MNil, mnil, MNum, MNativeFunction, MSort, MStr, True } from "./model"
import { EvalError, evaluate, lookup } from "./rules"
import { Environment, EvalContext, Model } from "./types"


const nativeSorts = [
  MBool,
  MNum,
  MStr,
  MAtom,
  MSort,
  MCons,
  MNil,
  MNativeFunction,
]

const nativeConst: Dictionary<Model> = {
}

type PrimitiveProcedure = (ctx: EvalContext, args: ListReader) => Model

const nativeProc: Dictionary<PrimitiveProcedure> = {

  // control

  'if': (ec, args) => {
    const cond = evaluate(ec, args.next())
    const then = args.next()
    const _else = args.next(nil)
    if (cond === True) {
      return evaluate(ec, then)
    }
    else if (args.hasNext()) {
      return evaluate(ec, _else)
    }
    else {
      return mnil
    }
  },

  // test

  '=': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value === (b as any).value ? True : False
  },

  '!=': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value !== (b as any).value ? True : False
  },

  '<': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value < (b as any).value ? True : False
  },

  '>': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value > (b as any).value ? True : False
  },

  '<=': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value <= (b as any).value ? True : False
  },

  '>=': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!('value' in a)) throw new EvalError(a.reflect(), `not comparable`)
    if (!('value' in b)) throw new EvalError(b.reflect(), `not comparable`)
    return (a as any).value >= (b as any).value ? True : False
  },

  'sortof': (ec, args) => {
    const arg = evaluate(ec, args.next())
    const ctor = arg.constructor
    return new MSort(new Sym(ctor.name), ctor as (new (...args) => Model))
  },

  // arithmetics

  '+': (ec, args) => {
    let sum = 0
    while (args.hasNext()) {
      const arg = evaluate(ec, args.next())
      if (!(arg instanceof MNum)) throw new EvalError(arg.reflect(), `number expected`)
      sum = sum + arg.value
    }
    return new MNum(sum)
  },

  '-': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!(a instanceof MNum)) throw new EvalError(a.reflect(), `number expected`)
    if (!(b instanceof MNum)) throw new EvalError(b.reflect(), `number expected`)
    return new MNum(a.value - b.value)
  },

  '*': (ec, args) => {
    let sum = 1
    while (args.hasNext()) {
      const arg = evaluate(ec, args.next())
      if (!(arg instanceof MNum)) throw new EvalError(arg.reflect(), `number expected`)
      sum = sum * arg.value
    }
    return new MNum(sum)
  },

  '/': (ec, args) => {
    const a = evaluate(ec, args.next())
    const b = evaluate(ec, args.next())
    if (!(a instanceof MNum)) throw new EvalError(a.reflect(), `number expected`)
    if (!(b instanceof MNum)) throw new EvalError(b.reflect(), `number expected`)
    return new MNum(a.value / b.value)
  },

  // environment

  'define': (ec, args) => {
    const name = args.next()
    const value = args.next()
    const doc = args.next(nil)
    if (!(name instanceof Sym)) throw new EvalError(name, `variable name expected`)
    if (name.value in ec.env.bindings) throw new EvalError(name, `variable alredy defined`)
    ec.env.bindings[name.value] = evaluate(ec, value)
    return mnil
  },

  'lookup': (ec, args) => {
    const name = args.next()
    if (!(name instanceof Sym)) throw new EvalError(name, `variable name expected`)
    return lookup(ec, name.value)
  },

  'currentEnvironment': (ec) => {
    return new MEnvironment(ec.env)
  },
}

export function getNativeEnvironment (): Environment {
  const env: Environment = { bindings: {} }
  for (const sort of nativeSorts) {
    const key = sort.name
    env.bindings[key] = new MSort(new Sym(key), sort)
  }
  for (const key in nativeConst) {
    env.bindings[key] = nativeConst[key]
  }
  for (const key in nativeProc) {
    const proc = nativeProc[key]
    env.bindings[key] = new MNativeFunction(new Sym(key), proc)
  }
  return env
}
