import { Model } from "./model"
import { Environment, meet, join } from "./environment"

// Threshold algebra

export enum Rank {
  Top = 2,
  True = 1,
  Neutral = 0,
  False = -1,
  Bottom = -2,
}


// Generic operations


export const thresholdJoin = <Ctx> (threshold: Rank) =>
  (env: Environment, a: Model, bf: () => Model): Model => {
    if (a.rank >= threshold) return a
    const b = bf()
    if (a.rank > b.rank) return a
    if (b.rank > a.rank) return b
    return join(env, a, b)
  }

export const thresholdMeet = <Ctx> (threshold: Rank) =>
  (env: Environment, a: Model, bf: () => Model): Model => {
    if (a.rank <= threshold) return a
    const b = bf()
    if (a.rank < b.rank) return a
    if (b.rank < a.rank) return b
    return meet(env, a, b)
  }

// main logical connectives

export const upperJoin = thresholdJoin(Rank.Top)

export const lowerJoin = thresholdJoin(Rank.Bottom + 1)

export const upperMeet = thresholdMeet(Rank.Top - 1)

export const lowerMeet = thresholdMeet(Rank.Bottom)


// helpers


export function rankToString (rank: Rank): string {
  switch (rank) {
    case Rank.Top: return 'Top'
    case Rank.True: return 'True'
    case Rank.Neutral: return 'Neutral'
    case Rank.False: return 'False'
    case Rank.Bottom: return 'Bottom'
  }
}
