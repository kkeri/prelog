import { Str } from "../core/syntax"
import { Language, Syntax, SyntaxProcessor } from "../core/types"
import { Dictionary } from "../util/types"
import { evaluate, evalRules, applyRules } from "./rules"
import { MNil } from "./model"
import { Environment, EvalContext } from "./types"
import { getNativeEnvironment } from "./native"

// class LispInterpreter implements SyntaxProcessor {
//   env: Environment = { bindings: {} }
//   envStack: Environment[] = []

//   constructor (
//     public next: SyntaxProcessor,
//   ) { }

//   send (term: Syntax): void {
//     try {
//       const value = evaluate(this, term)
//       if (!(value instanceof MNil)) this.next.send(value.reflect())
//     }
//     catch (e) {
//       this.next.send(new Str(e.message))
//     }
//   }

//   // Enters a new nested environment.
//   enter (env: Environment) {
//     this.envStack.push(this.env)
//     this.env = env
//   }

//   // Returns to the parent environment.
//   leave () {
//     if (!this.envStack.length) throw new Error(`Environment stack underflow`)
//     this.env = this.envStack.pop()!
//   }
// }


export const lispLanguages: Dictionary<Language> = {
  lisp: {
    description: 'simple Lisp-like language',
    createInterpreter (next) {
      const ec: EvalContext = {
        env: { bindings: {}, parent: getNativeEnvironment() },
        evalRules,
        applyRules,
      }
      return {
        send (term) {
          try {
            const value = evaluate(ec, term)
            if (!(value instanceof MNil)) next.send(value.reflect())
          }
          catch (e) {
            next.send(new Str(e.message))
          }
        }
      }
    }
  },
}
