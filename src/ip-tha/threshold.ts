import { Model } from "./model/base-model"
import { Dictionary } from "../util/types"
import { success, failure } from "./const"
import { Theory, join, meet } from "./interpreter"
import { Rank } from "./rank"

// Generic operations

export type ShortcutCombinator =
  (th: Theory, a: Model, bf: () => Model) => Model

export const thresholdJoin = (threshold: Rank) =>
  (th: Theory, a: Model, bf: () => Model): Model => {
    if (a.rank >= threshold) return a
    const b = bf()
    if (a.rank > b.rank) return a
    if (b.rank > a.rank) return b
    return join(th, a, b)
  }

export const thresholdMeet = (threshold: Rank) =>
  (th: Theory, a: Model, bf: () => Model): Model => {
    if (a.rank <= threshold) return a
    const b = bf()
    if (a.rank < b.rank) return a
    if (b.rank < a.rank) return b
    return meet(th, a, b)
  }

// Concrete logical connectives

export const upperJoin = thresholdJoin(Rank.Top)

export const lowerJoin = thresholdJoin(Rank.Bottom + 1)

export const upperMeet = thresholdMeet(Rank.Top - 1)

export const lowerMeet = thresholdMeet(Rank.Bottom)

// Monoidal signatures for logical interpreters

export interface Signature {
  // The unit element of append.
  unit: Model
  // Appends a new term to a model.
  append: ShortcutCombinator
  // Returns true if a model can't be changed essentially by appendng to it.
  saturated (model: Model): boolean
}

export const signatures: Dictionary<Signature> = {
  lm: { unit: success, append: lowerMeet, saturated: m => m.rank <= Rank.Bottom },
  uj: { unit: failure, append: upperJoin, saturated: m => m.rank >= Rank.Top },
  um: { unit: success, append: upperMeet, saturated: m => m.rank <= Rank.Bottom },
  lj: { unit: failure, append: lowerJoin, saturated: m => m.rank >= Rank.Top },
}

// Helpers

export function rankToString (rank: Rank): string {
  switch (rank) {
    case Rank.Top: return 'Top'
    case Rank.True: return 'True'
    case Rank.Neutral: return 'Neutral'
    case Rank.False: return 'False'
    case Rank.Bottom: return 'Bottom'
  }
}
