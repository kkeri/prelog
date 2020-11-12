import { Atom } from "./model/prim-model"
import * as syntax from "../core/syntax"
import { Rank } from "./rank"

// constants are extracted here to avoid circular inter-module references

export const undef = new Atom(Rank.Bottom, new syntax.Sym('undefined'))
export const success = new Atom(Rank.Top, new syntax.Sym('success'))
export const failure = new Atom(Rank.Bottom, new syntax.Sym('failure'))
export const truth = new Atom(Rank.True, new syntax.Sym('true'))
export const falsehood = new Atom(Rank.False, new syntax.Sym('false'))
export const nil = new Atom(Rank.Neutral, new syntax.Sym('nil'))
