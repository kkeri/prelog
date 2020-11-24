import { ModelPrinter } from "../util/printer"
import { Syntax, SyntaxProcessor } from "./syntax"

export class PrintStream implements SyntaxProcessor {
  constructor (
    public printer: ModelPrinter,
  ) { }

  send (term: Syntax) {
    this.printer.print(term).br()
  }
}
