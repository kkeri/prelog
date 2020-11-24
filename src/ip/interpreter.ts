import * as syntax from "../core/syntax"
import { isList, isNil, Syntax, SyntaxProcessor } from "../core/syntax"
import { BinaryDispatcher, UnaryDispatcher } from "../util/dispatch"
import { evalMetaCommand } from "./meta"
import { Model } from "./model/base-model"
import { Sym } from "./model/prim-model"
import { getNativeProgram } from "./native"
import { getRules, interpret, resolve } from "./rules"
import { Signature, signatures } from "./threshold"

export interface Rules {
  translateRules: UnaryDispatcher<Interpreter, Syntax, Model>
  resolveRules: BinaryDispatcher<Theory, Model, Model, Model>
  joinRules: BinaryDispatcher<Theory, Model, Model, Model>
  meetRules: BinaryDispatcher<Theory, Model, Model, Model>
  lookupRules: BinaryDispatcher<Theory, Model, Sym, Model>
}

export interface Theory {
  rules: Rules
  sgn: Signature
}

export interface Interpreter extends Theory {
  parent?: Interpreter
  program: Model
  args: syntax.List
  writer: SyntaxProcessor
  exit: (value: Syntax) => void
}

// Interprets a list of terms in the current interpreting environment.
export function interpretList (ip: Interpreter, input: syntax.List): Model {
  while (!ip.sgn.terminated(ip.program) && !isNil(input)) {
    const [model, rest] = interpretPrefix(ip, input)
    const newProg = resolve(ip, model, ip.program)
    ip.program = ip.sgn.append(ip, newProg, () => model)
    input = rest
  }
  return ip.program
}

// Interprets the prefix of a list.
// Returns a model and the suffix of the list.
export function interpretPrefix (ip: Interpreter, input: syntax.Cons): [Model, syntax.List] {
  let model = interpret(ip, input.first)
  let rest = input.rest
  while (true) {
    let parent: Interpreter | undefined = ip
    while (parent) {
      model = resolve(parent, parent.program, model)
      parent = parent.parent
    }
    const [newModel, newRest] = model.apply(ip, rest)
    if (newModel === model) return [model, rest]
    model = newModel
    rest = newRest
  }
}

const th = {
  rules: getRules(),
  sgn: signatures.lm,
}

export function createInterpreter (next: SyntaxProcessor, exit: () => never) {
  const nativeIp: Interpreter = {
    ...th,
    program: getNativeProgram(th),
    args: syntax.nil, // command line arguments are not supported
    writer: next,
    exit,
  }
  const ip: Interpreter = {
    ...nativeIp,
    program: th.sgn.initial,
    parent: nativeIp,
  }
  return {
    send (term: Syntax) {
      let input = isList(term) ? term : new syntax.Cons(term, syntax.nil)
      if (evalMetaCommand(ip, input)) return
      while (!th.sgn.terminated(ip.program) && !isNil(input)) {
        const [model, rest] = interpretPrefix(ip, input)
        const newProg = resolve(ip, model, ip.program)
        ip.program = ip.sgn.append(ip, newProg, () => model)
        input = rest
        if (model !== ip.sgn.initial) ip.writer.send(model.reflect())
      }
    }
  }
}
