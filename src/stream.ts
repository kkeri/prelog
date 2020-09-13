import { Syntax } from "./syntax"
import { OutputStream } from "./types"
import { ModelPrinter } from "./util/printer"

// export class StaticInputStream implements InputStream {
//   constructor (
//     public input: Syntax[],
//     public idx: number = 0,
//   ) { }

//   read (): Syntax | null {
//     return this.idx < this.input.length ? this.input[this.idx++] : null
//   }

//   closed (): boolean {
//     return this.idx >= this.input.length
//   }
// }

// export class EmptyInputStream implements InputStream {
//   constructor (
//   ) { }

//   read (): Syntax | null {
//     return null
//   }

//   closed (): boolean {
//     return true
//   }
// }

// export class EmptyInputStream implements InputStream {
//   constructor (
//   ) { }

//   read (): Syntax | null {
//     return null
//   }

//   closed (): boolean {
//     return true
//   }
// }

export class DummyOutputStream implements OutputStream {
  constructor (
  ) { }

  write () {
  }
}

export class PrintStream implements OutputStream {
  constructor (
    public printer: ModelPrinter,
  ) { }

  write (term: Syntax) {
    this.printer.print(term).br()
  }
}
