import { Dictionary } from "../util/types"
import { failure, success } from "./const"
import { Theory } from "./interpreter"
import { Model } from "./model/base-model"
import { Rank } from "./rank"
import { join, meet } from "./rules"

// Generic logical operations

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

// Concrete logical operations

export const upperJoin = thresholdJoin(Rank.Top)

export const lowerJoin = thresholdJoin(Rank.Bottom + 1)

export const upperMeet = thresholdMeet(Rank.Top - 1)

export const lowerMeet = thresholdMeet(Rank.Bottom)

// Monoidal signatures for logical interpreters

export interface Signature {
  // The unit element of append.
  initial: Model
  // Appends a new term to a model.
  append: ShortcutCombinator
  // Returns true if a model cannot be changed anymore by appending to it.
  terminated (model: Model): boolean
}

export const signatures: Dictionary<Signature> = {
  lm: { initial: success, append: lowerMeet, terminated: m => m.rank <= Rank.Bottom },
  um: { initial: success, append: upperMeet, terminated: m => m.rank <= Rank.Bottom },
  lj: { initial: failure, append: lowerJoin, terminated: m => m.rank >= Rank.Top },
  uj: { initial: failure, append: upperJoin, terminated: m => m.rank >= Rank.Top },
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
