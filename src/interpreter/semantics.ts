import * as syntax from "../syntax"
import { Syntax } from "../syntax"
import { BinaryDispatcher, UnaryDispatcher } from "../util/dispatch"
import { failure, success, undef } from "./const"
import { Environment, inheritEnv, lookup, derive, resolve, evaluate } from "./environment"
import { And, Definition, Model, Num, Or, SemanticsErr, Str, structEqual, Sym, SyntaxErr } from "./model"
import { evalSpecialSymbol } from "./special"
import { lowerJoin, lowerMeet, upperJoin } from "./threshold"

export interface Semantics {
  evaluationRules: UnaryDispatcher<Environment, Syntax, Model>
  lookupRules: BinaryDispatcher<Environment, Model, Sym, Model>
  derivationRules: BinaryDispatcher<Environment, Model, Model, Model>
  resolutionRules: BinaryDispatcher<Environment, Model, Model, Model>
  joinRules: BinaryDispatcher<Environment, Model, Model, Model>
  meetRules: BinaryDispatcher<Environment, Model, Model, Model>
}

// Standard semantics

export const stdSemantics = {
  evaluationRules: new UnaryDispatcher<Environment, Syntax, Model>(
    // default case
    (env, t) => new SyntaxErr('cannot interpret syntax', t))

    .add(syntax.Sequence,
      (env, t) => {
        try {
          const childEnv = inheritEnv(env, t.body)
          const head = evaluate(env, childEnv.next())
          return head.invoke(childEnv)
        }
        catch (e) {
          return new SyntaxErr(e.message, t)
        }
      })
    .add(syntax.Parentheses,
      (env, t) => {
        const list = t.body
        if (list instanceof syntax.Cons && list.rest instanceof syntax.EmptyList) {
          return evaluate(env, list.next)
        }
        else {
          return null
        }
      })
    .add(syntax.Brackets,
      (env, t) => {
        let args = t.body
        let program: Model = failure
        while (args instanceof syntax.Cons) {
          const arg = args.next
          const childEnv = inheritEnv(env)
          program = upperJoin(childEnv, program, () => evaluate(childEnv, arg))
          args = args.rest
        }
        return program
      })
    .add(syntax.Braces,
      (env, t) => {
        const childEnv = inheritEnv(env, t.body)
        while (childEnv.peek()) childEnv.extend(childEnv.next())
        return childEnv.current()
      })
    .add(syntax.Sym,
      (env, t) => {
        const spec = evalSpecialSymbol(env, t.value)
        if (spec) return spec
        const sym = new Sym(t.value)
        return lookup(env, env.program, sym)
      })
    .add(syntax.Str,
      (env, t) => new Str(t.value))
    .add(syntax.Num,
      (env, t) => new Num(t.value))
  ,

  lookupRules: new BinaryDispatcher<Environment, Model, Sym, Model>(
    // default case
    (env) => undef)

    // structural rules
    .add(Or, null,
      (env, a, b) => lowerMeet(env, lookup(env, a.a, b), () => lookup(env, a.b, b)))
    .add(And, null,
      (env, a, b) => lowerJoin(env, lookup(env, a.b, b), () => lookup(env, a.a, b)))

    // specific rules
    .add(Definition, Sym,
      (env, a, b) => structEqual(a.a, b) ? a.b : undef)
  ,

  derivationRules: new BinaryDispatcher<Environment, Model, Model, Model>(
    // default case
    (env, a, b) => b)

    // structural rules
    .add(Or, null,
      (env, a, b) => lowerMeet(env, derive(env, a.a, b), () => derive(env, a.b, b)))
    .add(And, null,
      (env, a, b) => upperJoin(env, derive(env, a.b, b), () => derive(env, a.a, b)))

    // specific rules
    .add(Definition, null,
      (env, a, b) => structEqual(a.a, b) ? a.b : b)
    .add(Definition, Definition,
      (env, a, b) => structEqual(a.a, b.a)
        ? structEqual(a.b, b.b)
          ? success
          : new SemanticsErr('conflicting definition', b)
        : b)
  ,

  resolutionRules: new BinaryDispatcher<Environment, Model, Model, Model>(
    // default case
    (env, a, b) => a)

    // structural rules
    .add(Or, null,
      (env, a, b) => upperJoin(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))
    .add(And, null,
      (env, a, b) => lowerMeet(env, resolve(env, a.a, b), () => resolve(env, a.b, b)))

    // specific rules
    .add(null, Definition,
      (env, a, b) => structEqual(a, b.a) ? b.b : a)
    .add(Definition, Definition,
      (env, a, b) => new Definition(resolve(env, a.a, b.a), resolve(env, a.b, b.b)))
  ,

  joinRules: new BinaryDispatcher<Environment, Model, Model, Model>(
    // default case
    (env, a, b) => a.constructor === b.constructor && a.join(b, env)
      || new Or(a, b, a.rank))
  ,

  meetRules: new BinaryDispatcher<Environment, Model, Model, Model>(
    // default case
    (env, a, b) => a.constructor === b.constructor && a.meet(b, env)
      || new And(a, b, a.rank))
}

