import { Syntax } from "../../core/types"
import { Interpreter, Theory } from "../interpreter"
import { Rank } from "../rank"
import { BlockSyntaxReader } from "../reader"

export abstract class Model {
  // Plays role in operations of threshold algebra.
  rank: Rank

  // Returns true if two models of the same class are structurally equal.
  structEqual (other: this): boolean {
    throw new Error(`Method 'structEqual' is not implemented on ${this.constructor.name}`)
  }

  // Invokes the model in the current environment with the current arguments.
  apply (ip: Interpreter, args: BlockSyntaxReader): Model {
    return this
  }

  // Converts the model to a corresponding syntax form.
  reflect (): Syntax {
    throw new Error(`Method 'reflect' is not implemented on ${this.constructor.name}`)
  }

  join (other: this, th: Theory): Model | null {
    return null
  }

  meet (other: this, th: Theory): Model | null {
    return null
  }
}

// Returns true if two models are structurally equal.
export function structEqual (a: Model, b: Model): boolean {
  return a === b || (a.constructor === b.constructor && a.structEqual(b))
}
