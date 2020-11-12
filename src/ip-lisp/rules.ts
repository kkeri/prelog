import { Cons, List, Nil, Num, Parentheses, Str, Sym } from "../core/syntax"
import { Syntax } from "../core/types"
import { UnaryDispatcher } from "../util/dispatch"
import { ListReader } from "../util/list"
import { mnil, MNum, MStr, MNativeFunction } from "./model"
import { Environment, EvalContext, Model } from "./types"

export class EvalError extends Error {
  constructor (
    public term: Syntax,
    descr: string,
  ) {
    super(descr)
  }
}

export function evaluate (ec: EvalContext, term: Syntax): Model {
  return evalRules.apply(ec, term)
}

export function apply (ec: EvalContext, fn: Model, args: List): Model {
  return applyRules.apply(ec, fn, args)
}

export const evalRules = new UnaryDispatcher<EvalContext, Syntax, Model>(
  // default case
  (ec, t) => { throw new EvalError(t, 'cannot interpret syntax') })

  // top level sequence
  .add(Cons,
    (ec, term) => {
      let list: List = term
      let result = mnil
      while (list instanceof Cons) {
        result = evaluate(ec, list.first)
        list = list.rest
      }
      return result
    })

  .add(Nil,
    (ec, term) => {
      return mnil
    })

  // form
  .add(Parentheses,
    (ec, term) => {
      const list = term.body
      if (list instanceof Nil) throw new EvalError(term, `empty form`)
      const fn = evaluate(ec, list.first)
      return apply(ec, fn, list.rest)
    })

  // variable lookup
  .add(Sym,
    (ec, term) => lookup(ec, term.value))

  .add(Num,
    (ec, term) => new MNum(term.value))

  .add(Str,
    (ec, term) => new MStr(term.value))


export const applyRules = new UnaryDispatcher<EvalContext, Model, Model, List>(
  // default case
  (ec, m) => { throw new EvalError(m.reflect(), `term is not applicable`) })

  .add(MNativeFunction,
    (ec, m, args) => {
      return m.fn(ec, new ListReader(args))
    })


export function lookup (ec: EvalContext, sym: string): Model {
  let env: Environment | undefined = ec.env
  while (env) {
    const value = env.bindings[sym]
    if (value) return value
    env = env.parent
  }
  throw new EvalError(new Sym(sym), `variable not found`)
}
