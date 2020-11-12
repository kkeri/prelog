import * as syntax from "../core/syntax"
import { Syntax } from "../core/types"
import { BinaryDispatcher, UnaryDispatcher } from "../util/dispatch"
import { resolve, interpretAll, Interpreter, Rules, Theory, translate } from "./interpreter"
import { Model, structEqual } from "./model/base-model"
import { And, Or, SyntaxErr } from "./model/comp-model"
import { Num, Str, Sym } from "./model/prim-model"
import { BlockSyntaxReader } from "./reader"
import { lowerMeet, signatures, upperJoin } from "./threshold"

let rules: Rules | undefined

export function getRules () {
  if (!rules) rules = initRules()
  return rules
}

function initRules (): Rules {
  return {
    translateRules: new UnaryDispatcher<Interpreter, Syntax, Model, BlockSyntaxReader>(
      // default case
      (ip, t) => new SyntaxErr('cannot interpret syntax', t))

      // apply the first term to the rest of the input recursively
      .add(syntax.Cons,
        (ip, t, args) => {
          const head = resolve(ip, ip.program, translate(ip, args))
          return head.apply(ip, args)
        })

      // reset precedence level - accepts exactly one term inside ()
      .add(syntax.Parentheses,
        (ip, t) => {
          const reader = new BlockSyntaxReader(t.body)
          if (!reader.hasNext()) return null
          const value = resolve(ip, ip.program, translate(ip, reader))
          if (reader.hasNext()) {
            return new SyntaxErr(`')' expected`, reader.read())
          }
          return value
        })

      // disjunction
      .add(syntax.Brackets,
        (ip, t) => {
          const sgn = signatures.uj
          const childIp: Interpreter = {
            ...ip,
            parent: ip,
            sgn,
            program: sgn.unit,
          }
          return interpretAll(childIp, new BlockSyntaxReader(t.body))
        })

      // conjunction
      .add(syntax.Braces,
        (ip, t) => {
          const sgn = signatures.lm
          const childIp: Interpreter = {
            ...ip,
            parent: ip,
            sgn,
            program: sgn.unit,
          }
          return interpretAll(childIp, new BlockSyntaxReader(t.body))
        })

      .add(syntax.Sym,
        (ip, t) => new Sym(t.value))
      .add(syntax.Str,
        (ip, t) => new Str(t.value))
      .add(syntax.Num,
        (ip, t) => new Num(t.value))
      .add(syntax.Nil,
        (ip, t) => ip.sgn.unit)
    ,

    resolveRules: new BinaryDispatcher<Theory, Model, Model, Model>(
      // default case
      (th, a, b) => structEqual(a, b) ? th.sgn.unit : b)

      // structural rules
      .add(Or, null,
        (th, a, b) => lowerMeet(th, resolve(th, a.a, b), () => resolve(th, a.b, b)))
      .add(And, null,
        (th, a, b) => upperJoin(th, resolve(th, a.b, b), () => resolve(th, a.a, b)))
      .add(null, Or,
        (th, a, b) => upperJoin(th, resolve(th, a, b.a), () => resolve(th, a, b.b)))
      .add(null, And,
        (th, a, b) => lowerMeet(th, resolve(th, a, b.a), () => resolve(th, a, b.b)))
    ,

    joinRules: new BinaryDispatcher<Theory, Model, Model, Model>(
      // default case
      (th, a, b) => a.constructor === b.constructor && a.join(b, th)
        || new Or(a, b, a.rank))
    ,

    meetRules: new BinaryDispatcher<Theory, Model, Model, Model>(
      // default case
      (th, a, b) => a.constructor === b.constructor && a.meet(b, th)
        || new And(a, b, a.rank))
  }
}

