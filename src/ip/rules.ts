import * as syntax from "../core/syntax"
import { Syntax } from "../core/syntax"
import { BinaryDispatcher, UnaryDispatcher } from "../util/dispatch"
import { nil, undef } from "./const"
import { Interpreter, interpretList, interpretPrefix, Rules, Theory } from "./interpreter"
import { Model, structEqual } from "./model/base-model"
import { And, Definition, Or, SyntaxErr } from "./model/comp-model"
import { Num, Str, Sym } from "./model/prim-model"
import { lowerJoin, lowerMeet, signatures, upperJoin } from "./threshold"

// Interprets a prefix of the input syntax, returns a semantic model.
// Implicitly returns the untranslated suffix of the input by mutating the reader.
export function interpret (ip: Interpreter, term: Syntax): Model {
  return ip.rules.translateRules.apply(ip, term)
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

export function lookup (th: Theory, a: Model, name: Sym): Model {
  return th.rules.lookupRules.apply(th, a, name)
}

let rules: Rules | undefined

// deferred initialization to avoid import order issues
export function getRules () {
  if (!rules) rules = initRules()
  return rules
}

function initRules (): Rules {
  return {
    translateRules: new UnaryDispatcher<Interpreter, Syntax, Model>(
      // default case
      (ip, t) => new SyntaxErr('cannot interpret syntax', t))

      .add(syntax.Cons,
        (ip, t) => {
          return interpretList(ip, t)
        })

      // interprets the first term inside ()
      .add(syntax.Parentheses,
        (ip, t) => {
          const [model] = t.body instanceof syntax.Cons
            ? interpretPrefix(ip, t.body)
            : [nil]
          return model
        })

      // disjunction
      .add(syntax.Brackets,
        (ip, t) => {
          const sgn = signatures.uj
          const childIp: Interpreter = {
            ...ip,
            parent: ip,
            sgn,
            program: sgn.initial,
          }
          return interpretList(childIp, t.body)
        })

      // conjunction
      .add(syntax.Braces,
        (ip, t) => {
          const sgn = signatures.lm
          const childIp: Interpreter = {
            ...ip,
            parent: ip,
            sgn,
            program: sgn.initial,
          }
          return interpretList(childIp, t.body)
        })

      .add(syntax.Sym,
        (ip, t) => {
          const sym = new Sym(t.value)
          let parent: Interpreter | undefined = ip
          while (parent) {
            const value = lookup(parent, parent.program, sym)
            if (value !== undef) return value
            parent = parent.parent
          }
          return sym
        })

      .add(syntax.Str,
        (ip, t) => new Str(t.value))
      .add(syntax.Num,
        (ip, t) => new Num(t.value))
      .add(syntax.Nil,
        (ip, t) => nil)
    ,

    resolveRules: new BinaryDispatcher<Theory, Model, Model, Model>(
      // default case
      (th, a, b) => structEqual(a, b) ? th.sgn.initial : b)

      // structural rules
      .add(Or, null,
        (th, a, b) => lowerMeet(th, resolve(th, a.a, b), () => resolve(th, a.b, b)))
      .add(And, null,
        (th, a, b) => upperJoin(th, resolve(th, a.a, b), () => resolve(th, a.b, b)))
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
    ,

    lookupRules: new BinaryDispatcher<Theory, Model, Sym, Model>(
      // default case
      (th, a) => undef)

      .add(Definition, Sym,
        (th, a, b) => structEqual(a.a, b) ? a.b : undef)
      .add(Or, Sym,
        (th, a, b) => upperJoin(th, lookup(th, a.a, b), () => lookup(th, a.b, b)))
      .add(And, Sym,
        (th, a, b) => lowerJoin(th, lookup(th, a.b, b), () => lookup(th, a.a, b)))
  }
}

