import { Syntax } from "./syntax"

export interface Interpreter {
  // Extends the object program with a new syntax.
  // Returns the evaluated syntax.
  extend (syntax: Syntax): Syntax
  // Returns the current object program.
  current (): Syntax
}
