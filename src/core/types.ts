
export interface Syntax {
  // Returns true if two syntax trees of the same type are structurally equal.
  equalSyntax (other: this): boolean
}

export interface SyntaxProcessor {
  send (term: Syntax): void
}

export interface Language {
  // Short description of the language.
  description: string
  // Creates an interpreter that interprets this language.
  createInterpreter (next: SyntaxProcessor, exit: () => void): SyntaxProcessor
}
