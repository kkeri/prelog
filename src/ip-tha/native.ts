import * as syntax from "../core/syntax"
import { Dictionary } from "../util/types"
import { falsehood, success, truth } from "./const"
import { resolve, Interpreter, Theory, translate } from "./interpreter"
import { Model, structEqual } from "./model/base-model"
import { And, Definition, NativeProcess, Process, Ref, SemanticsErr, SyntaxErr } from "./model/comp-model"
import { Num, Sym } from "./model/prim-model"
import { BlockSyntaxReader } from "./reader"

type NativeDefinition = Model | ((ip: Interpreter, args: BlockSyntaxReader) => Model)

let nativeProgram: Model | undefined

// Returns a model that consist of all native definitions.
export function getNativeProgram (th: Theory): Model {
  if (!nativeProgram) {
    nativeProgram = th.sgn.unit
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

  def (ip: Interpreter, args: BlockSyntaxReader): Model {
    const name = args.read()
    if (!(name instanceof syntax.Sym)) {
      return new SyntaxErr('the first argument of a definition must be a name', name)
    }
    const def = new Definition(new Sym(name.value), translate(ip, args))
    return resolve(ip, ip.program, def)
  },

  proc (ip: Interpreter, args: BlockSyntaxReader): Model {
    return new Process(args.read())
  },

  rank (ip: Interpreter, args: BlockSyntaxReader): Model {
    return new Num(translate(ip, args).rank)
  },

  // Creates a mutable reference with an initial value.
  ref (ip: Interpreter, args: BlockSyntaxReader): Model {
    return new Ref(translate(ip, args))
  },

  // Assigns a new value to a mutable reference.
  set (ip: Interpreter, args: BlockSyntaxReader): Model {
    const ref = translate(ip, args)
    if (!(ref instanceof Ref)) {
      return new SemanticsErr('ref expected', ref)
    }
    ref.value = translate(ip, args)
    return success
  },

  // Reads the value to a mutable reference.
  get (ip: Interpreter, args: BlockSyntaxReader): Model {
    const ref = translate(ip, args)
    if (!(ref instanceof Ref)) {
      return new SemanticsErr('ref expected', ref)
    }
    return ref.value
  },
}

export function printEnvironment (ip: Interpreter, model: Model) {
  if (structEqual(model, ip.sgn.unit)) {
    // don't include the unit into sequences
  }
  else if (model instanceof And) {
    printEnvironment(ip, model.a)
    printEnvironment(ip, model.b)
  }
  else if (model instanceof Definition) {
    if (model.native) {
      // don't print a native definition
    }
    else {
      ip.writer.send(model.reflect())
    }
  }
  else {
    ip.writer.send(model.reflect())
  }
}
