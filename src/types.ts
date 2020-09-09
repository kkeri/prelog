import { Syntax } from "./syntax"
import { Model } from "./interpreter/model";

export interface Interpreter {
  // Extends the object program with a new syntax.
  // Returns the evaluated syntax.
  extend (syntax: Syntax): Syntax
  // Returns the current object program.
  current (): Syntax
}

export interface InputStream {
  // Reads a term from the stream.
  read (): Syntax | null
  // Returns true if the stream has finished.
  closed (): boolean
}

export interface OutputStream {
  write (term: Syntax): Model
}
