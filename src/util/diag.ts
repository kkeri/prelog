
export class Diagnostics {
  hasProblem = false
  hasError = false

  constructor (
    public messages: any[] = []
  ) {
  }

  info (model, code, msg) {
    this.messages.push({ code, message: msg, severity: 'info' })
  }

  warning (model, code, msg) {
    this.messages.push({ code, message: msg, severity: 'warning' })
    this.hasProblem = true
  }

  error (model, code, msg) {
    this.messages.push({ code, message: msg, severity: 'error' })
    this.hasError = true
    this.hasProblem = true
  }

  fatal (model, code, msg) {
    this.messages.push({ code, message: msg, severity: 'error', fatal: true })
    this.hasError = true
    this.hasProblem = true
  }

  appendTo (other) {
    other.messages = other.messages.concat(this.messages)
    other.hasError = other.hasError || this.hasError
    other.hasProblem = other.hasProblem || this.hasProblem
  }

  toString () {
    return this.messages.reduce((acc, msg) => acc + msg.message + '\n', '')
  }
}
