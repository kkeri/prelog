import { Atom } from "./model"
import * as syntax from "../syntax"
import { Rank } from "./threshold"

// constants are extracted here to avoid circular inter-module references

export const undef = new Atom(Rank.MetaFailure, new syntax.Name('undefined'))
export const success = new Atom(Rank.Top, new syntax.Name('success'))
export const failure = new Atom(Rank.Bottom, new syntax.Name('failure'))
export const truth = new Atom(Rank.True, new syntax.Name('true'))
export const falsehood = new Atom(Rank.False, new syntax.Name('false'))
export const noLookup = new Atom(Rank.Bottom, new syntax.Name('noLookup'))
