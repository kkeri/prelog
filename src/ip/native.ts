import * as syntax from "../core/syntax"
import { Dictionary } from "../util/types"
import { failure, falsehood, success, truth } from "./const"
import { Interpreter, Theory } from "./interpreter"
import { Model } from "./model/base-model"
import { Definition, NativeProcess, Process, SyntaxErr } from "./model/comp-model"
import { Num, Sym } from "./model/prim-model"
import { interpret } from "./rules"

type NativeDefinition = Model | ((ip: Interpreter, args: syntax.List) => [Model, syntax.List])

let nativeProgram: Model | undefined

// Returns a model that consist of all native definitions.
export function getNativeProgram (th: Theory): Model {
  if (!nativeProgram) {
    nativeProgram = th.sgn.initial
    for (const name in nativeDefs) {
      const sym = new Sym(name)
      const def = translateNativeDef(sym, nativeDefs[name])
      nativeProgram = th.sgn.append(th, nativeProgram, () => def)
    }
  }
  return nativeProgram
}

function translateNativeDef (name: Model, value: NativeDefinition): Model {
  const v = typeof value === 'function'
    ? new NativeProcess(name, value)
    : value
  return new Definition(name, v, true)
}

const nativeDefs: Dictionary<NativeDefinition> = {
  true: truth,
  false: falsehood,
  success: success,
  failure: failure,

  def (ip: Interpreter, args: syntax.List) {
    if (args instanceof syntax.Nil) {
      return [new SyntaxErr('name expected', args), args]
    }
    else if (!(args.first instanceof syntax.Sym)) {
      return [new SyntaxErr('name expected', args.first), args.rest]
    }
    const rest = args.rest
    if (rest instanceof syntax.Nil) {
      return [new SyntaxErr('value expected', rest), rest]
    }
    return [new Definition(new Sym(args.first.value), interpret(ip, rest.first)), rest.rest]
  },

  proc (ip: Interpreter, args: syntax.List) {
    if (args instanceof syntax.Nil) {
      return [new SyntaxErr('process body expected', args), args]
    }
    else {
      return [new Process(args.first), args.rest]
    }
  },

  rank (ip: Interpreter, args: syntax.List) {
    if (args instanceof syntax.Nil) {
      return [new SyntaxErr('term expected', args), args]
    }
    else {
      return [new Num(interpret(ip, args.first).rank), args.rest]
    }
  },
}
