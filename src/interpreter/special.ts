import { Environment } from "./environment";
import { Model } from "./model"
import { printEnvironment } from "./native"
import { DummyOutputStream } from "../stream"
import { success } from "./const"

export function evalSpecialSymbol (env: Environment, name: string): Model | null {
  switch (name) {
    case '@l': {
      printEnvironment(env.program, env.outputs.stdout ?? new DummyOutputStream())
      return success
    }
    default: return null
  }
}
