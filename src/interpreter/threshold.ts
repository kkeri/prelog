import { And, Or, Model } from "./model"

// Threshold algebra

export enum Rank {
  MetaSuccess = 3,
  Top = 2,
  True = 1,
  Neutral = 0,
  False = -1,
  Bottom = -2,
  MetaFailure = -3,
}

export const thresholdJoin = <Ctx> (limit: Rank, join: (ctx: Ctx, a: Model, b: Model) => Model | null) =>
  (ctx: Ctx, a: Model, b: Model): Model => {
    if (a.rank >= limit) return a
    if (a.rank > b.rank) return a
    if (b.rank > a.rank) return b
    const j = join(ctx, a, b)
    if (j) return j
    return new Or(a, b, a.rank)
  }

export const thresholdMeet = <Ctx> (limit: Rank, meet: (ctx: Ctx, a: Model, b: Model) => Model | null) =>
  (ctx: Ctx, a: Model, b: Model): Model => {
    if (a.rank <= limit) return a
    if (a.rank < b.rank) return a
    if (b.rank < a.rank) return b
    const j = meet(ctx, a, b)
    if (j) return j
    return new And(a, b, a.rank)
  }

export function rankToString (rank: Rank): string {
  switch (rank) {
    case Rank.MetaSuccess: return 'MetaSuccess'
    case Rank.Top: return 'Top'
    case Rank.True: return 'True'
    case Rank.Neutral: return 'Neutral'
    case Rank.False: return 'False'
    case Rank.Bottom: return 'Bottom'
    case Rank.MetaFailure: return 'MetaFailure'
  }
}
