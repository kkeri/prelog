// import { Binding, Name, RankedTerm, Sequence, Sym, Term, TermBase } from "./term"
// import { ReductionContext } from "./interpreter"
// import { Dictionary } from "./util/types"

// interface StackContext extends ReductionContext {
//   stack: Term[]
// }

// class StackError extends Error {
//   constructor (
//     public code: string
//   ) {
//     super(code)
//   }
// }

// export function evalStackCode (rc: ReductionContext, code: Term): RankedTerm {
//   try {
//     const sc: StackContext = {
//       ...rc,
//       stack: [],
//     }
//     // assume right associative sequence
//     while (code instanceof Sequence) {
//       const word = code.a
//       code = code.b
//       evalWord(sc, word)
//     }
//     evalWord(sc, code)
//     return sc.sem.reduce(sc, pop(sc))
//   }
//   catch (e) {
//     if (e instanceof StackError) {
//       return rc.sem.failure(e.code, code)
//     }
//     else {
//       throw e
//     }
//   }
// }

// function evalWord (sc: StackContext, word: Term) {
//   if (word instanceof Sym || word instanceof Name && word.value.startsWith('@')) {
//     const f = symbolTable[word.value]
//     if (!f) {
//       throw new StackError('UNDEFINED_WORD')
//     }
//     f(sc)
//   }
//   else {
//     sc.stack.push(word)
//   }
// }

// type ConcreteEvalFunction = (sc: StackContext) => void

// const symbolTable: Dictionary<ConcreteEvalFunction> = {
//   // term : reduct
//   '?' (sc) {
//     const term = pop(sc)
//     const value = sc.sem.reduce(sc, term)
//     sc.stack.push(value)
//   },
//   // value name : Binding
//   'bind' (sc) {
//     const name = sc.sem.reduce(sc, pop(sc))
//     if (!(name instanceof Name)) {
//       throw new StackError(`NAME_EXPECTED_ON_STACK_TOP`)
//     }
//     const value = sc.sem.reduce(sc, pop(sc))
//     sc.stack.push(new Binding(name, value))
//   },
// }

// // If the stack is empty, throw an exception.
// function pop (sc: StackContext): Term {
//   const top = sc.stack.pop()
//   if (!top) throw new StackError('EMPTY_STACK')
//   return top
// }
