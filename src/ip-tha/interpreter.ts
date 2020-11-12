import * as syntax from "../core/syntax"
import { isList } from "../core/syntax"
import { Language, Syntax, SyntaxProcessor } from "../core/types"
import { BinaryDispatcher, UnaryDispatcher } from "../util/dispatch"
import { Dictionary } from "../util/types"
import { evalMetaCommand } from "./meta"
import { Model } from "./model/base-model"
import { getNativeProgram } from "./native"
import { BlockSyntaxReader, Reader } from "./reader"
import { getRules } from "./rules"
import { Signature, signatures } from "./threshold"

export interface Rules {
  translateRules: UnaryDispatcher<Interpreter, Syntax, Model, Reader<Syntax>>
  resolveRules: BinaryDispatcher<Theory, Model, Model, Model>
  joinRules: BinaryDispatcher<Theory, Model, Model, Model>
  meetRules: BinaryDispatcher<Theory, Model, Model, Model>
}

export interface Theory {
  rules: Rules
  sgn: Signature
}

export interface Interpreter extends Theory {
  parent?: Interpreter
  program: Model
  args: Reader<Syntax>
  writer: SyntaxProcessor
  exit: (value: Syntax) => void
}

// Translates a prefix of the input syntax, returns a semantic model.
// Implicitly returns the untranslated suffix of the input by mutating the reader.
export function translate (ip: Interpreter, reader: Reader<Syntax>): Model {
  return ip.rules.translateRules.apply(ip, reader.read(), reader)
}

export function resolve (th: Theory, a: Model, b: Model): Model {
  return th.rules.resolveRules.apply(th, a, b)
}

export function join (th: Theory, a: Model, b: Model): Model {
  return th.rules.joinRules.apply(th, a, b)
}

export function meet (th: Theory, a: Model, b: Model): Model {
  return th.rules.meetRules.apply(th, a, b)
}

export function interpretAll (ip: Interpreter, reader: Reader<Syntax>): Model {
  while (!ip.sgn.saturated(ip.program) && reader.hasNext()) {
    interpretNext(ip, reader)
  }
  return ip.program
}

export function interpretNext (ip: Interpreter, reader: Reader<Syntax>): Model {
  // the initial reader
  let value = translate(ip, reader)
  let parent: Interpreter | undefined = ip
  while (parent) {
    value = resolve(parent, parent.program, value)
    parent = parent.parent
  }
  const newProg = resolve(ip, value, ip.program)
  ip.program = ip.sgn.append(ip, newProg, () => value)
  return value
}

const th = {
  rules: getRules(),
  sgn: signatures.lm,
}

function createInterpreter (next, exit) {
  const nativeIp: Interpreter = {
    ...th,
    program: getNativeProgram(th),
    args: new BlockSyntaxReader(syntax.nil),
    writer: next,
    exit,
  }
  const ip: Interpreter = {
    ...nativeIp,
    program: th.sgn.unit,
  }
  return {
    send (term: Syntax) {
      const list = isList(term) ? term : new syntax.Cons(term, syntax.nil)
      const reader = new BlockSyntaxReader(list)
      if (evalMetaCommand(ip, reader)) return
      while (!th.sgn.saturated(ip.program) && reader.hasNext()) {
        const value = interpretNext(ip, reader)
        if (value !== ip.sgn.unit) ip.writer.send(value.reflect())
      }
    }
  }
}

export const thaLanguages: Dictionary<Language> = {
  prop: {
    description: 'logical programming language based on shortcut combinators',
    createInterpreter,
  },
}
