import * as syntax from "../syntax"
import { Syntax } from '../syntax'
import { InputStream, Interpreter, OutputStream } from '../types'
import { Dictionary } from '../util/types'
import { Environment } from './environment'
import { getNativeEnvironment } from './native'
import { Semantics } from "./semantics"

// A native, non-extendable interpreter based on resolution.

export class NativeInterpreter implements Interpreter {
  env: Environment

  constructor ({ sem, inputs, outputs, args = new syntax.EmptyList() }: {
    sem: Semantics
    inputs: Dictionary<InputStream>
    outputs: Dictionary<OutputStream>
    args?: syntax.List
  }) {
    const nativeEnv = getNativeEnvironment(sem)
    this.env = new Environment(sem, nativeEnv.program, inputs, outputs, args)
  }

  extend (syntax: Syntax): Syntax {
    return this.env.extend(syntax).reflect()
  }

  current (): Syntax {
    return this.env.program.reflect()
  }
}
