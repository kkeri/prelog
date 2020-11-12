import { List } from "../core/syntax"
import { Syntax } from "../core/types"
import { UnaryDispatcher } from "../util/dispatch"
import { Dictionary } from "../util/types"

export interface EvalContext {
  env: Environment
  evalRules: UnaryDispatcher<EvalContext, Syntax, Model>
  applyRules: UnaryDispatcher<EvalContext, Model, Model, List>
}

export interface Environment {
  bindings: Dictionary<Model>
  parent?: Environment
}

export interface Model {
  // Converts the model to a corresponding syntax form.
  reflect (): Syntax
}
