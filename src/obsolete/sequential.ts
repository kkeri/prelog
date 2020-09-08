// import { Rank } from "./rank"
// import { NormalTerm, Term, Binding, TermBase } from "./term"
// import { meet, resolve, join, equal } from "./verb"
// import { MonotonicContext } from "./types"

// // Sequential implementations of conjunction and disjunction.

// // Computes the disjunction of terms.
// export class SequentialOr extends TermBase {
//   constructor (
//     public elements: Term[],
//   ) {
//     super()
//   }

//   resolveThis (ctx: NormalTerm): NormalTerm {
//     const adder = new SequentialDisjunctiveContext(Rank.Top, ctx)
//     for (const term of this.elements) {
//       if (adder.isShortcut()) break
//       adder.extend(term)
//     }
//     return adder.snapshot()
//   }

//   structEqual (other: this): boolean {
//     if (this.elements.length !== other.elements.length) return false
//     return this.elements.every((e, i) => equal(e, other.elements[i]))
//   }
// }

// // A normal term resulting from disjunction of unrelated terms.
// export class SequentialDisjunction extends TermBase {
//   constructor (
//     public elements: NormalTerm[],
//     public rank: Rank,
//     public errorCode?: string,
//   ) {
//     super()
//   }
// }

// // Computes the conjunction of terms.
// export class SequentialAnd extends TermBase {
//   constructor (
//     public elements: Term[],
//   ) {
//     super()
//   }

//   resolveThis (ctx: MonotonicContext): NormalTerm {
//     // before normalization, try to apply distributivity
//     // to ensure a disjunctive normal form
//     const dist = this.distribute()
//     if (dist) return dist.resolveThis(ctx)

//     const multiplier = new SequentialConjunctiveContext(Rank.Bottom, ctx)
//     for (const term of this.elements) {
//       if (multiplier.isShortcut()) break
//       multiplier.extend(term)
//     }
//     return multiplier.snapshot()
//   }

//   structEqual (other: this): boolean {
//     if (this.elements.length !== other.elements.length) return false
//     return this.elements.every((e, i) => equal(e, other.elements[i]))
//   }

//   // If a union element is found, distributes all other elements over it
//   // and returns the new union, otherwise returns undefined.
//   distribute (): Term | undefined {
//     const es = this.elements
//     for (let i = 0; i < es.length; i++) {
//       const u = es[i]
//       if (u instanceof SequentialDisjunction) {
//         const fs = u.elements.map(
//           el => new SequentialAnd(es.slice(0, i).concat(el).concat(es.slice(i + 1)))
//         )
//         return new SequentialOr(fs)
//       }
//     }
//     return undefined
//   }
// }

// // A normal term resulting from intersecting unrelated terms.
// export class SequentialConjunction extends TermBase {
//   constructor (
//     public elements: NormalTerm[],
//     public rank: Rank,
//     public errorCode?: string,
//   ) {
//     super()
//   }
// }

// // Incrementally computes the disjunction of terms.
// export class SequentialDisjunctiveContext implements MonotonicContext {
//   elements: NormalTerm[]
//   rank: Rank

//   constructor (
//     public threshold: Rank,
//     public parent?: MonotonicContext,
//   ) {
//     this.reset()
//   }

//   // Extends the context with a new term, normalizing it if necessary.
//   // Unions are flatmapped.
//   extend (term: Term): this {
//     if (this.isShortcut()) return this
//     const forkedCtx = new SequentialConjunctiveContext(Rank.Bottom, this.parent)
//     const nf = resolve(term, forkedCtx)
//     if (this.rank > nf.rank) {
//       //the term is too weak
//       return this
//     }
//     if (nf.rank > this.rank) {
//       // the term is stronger
//       this.rank = nf.rank
//       this.elements = [nf]
//       return this
//     }
//     // equal strength
//     this.combine(nf)
//     return this
//   }

//   combine (nf: NormalTerm) {
//     if (nf instanceof SequentialConjunction) {
//       for (const element of nf.elements) this.combine(element)
//       return
//     }
//     let i = this.elements.length
//     while (--i >= 0) {
//       const
//         m = join(this.elements[i], nf)
//       if (m && m.rank !== this.rank) {
//         throw new Error(`Join shouldn't change rank`)
//       }
//       if (!m) {
//         // terms didn't join
//       }
//       else {
//         // replace the term
//         this.elements[i] = m
//         return
//       }
//     }
//     // couldn't join the new term with any existing one
//     this.elements.push(nf)
//   }

//   isShortcut () {
//     return this.rank >= this.threshold
//   }

//   snapshot (): SequentialDisjunction {
//     return new SequentialDisjunction(this.elements.slice(), this.rank)
//   }

//   // Looks up a variable in the context by name.
//   lookup (id: Term): NormalTerm | undefined {
//     // this is a wired lower join
//     let i = this.elements.length
//     while (--i >= 0) {
//       const term = this.elements[i]
//       if (term instanceof Binding && equal(term.a, id)) return term.b
//     }
//     if (this.parent) return this.parent.snapshot().lookup(id)
//     return undefined
//   }

//   reset () {
//     this.elements = []
//     this.rank = Rank.Bottom
//     return this
//   }
// }

// // Incrementally computes the conjunction of terms.
// export class SequentialConjunctiveContext implements MonotonicContext {
//   elements: NormalTerm[]
//   rank: Rank

//   constructor (
//     public threshold: Rank,
//     public parent?: MonotonicContext,
//   ) {
//     this.reset()
//   }

//   // Extends the context with a new term, normalizing it if necessary.
//   // Intersections are flatmapped.
//   extend (term: Term): this {
//     if (this.isShortcut()) return this
//     const nf = resolve(term, this)
//     if (this.rank < nf.rank) {
//       //the term is too weak
//       return this
//     }
//     if (nf.rank < this.rank) {
//       // the term is stronger
//       this.rank = nf.rank
//       this.elements = [nf]
//       return this
//     }
//     // equal strength
//     if (nf instanceof SequentialConjunction) {
//       for (const element of nf.elements) this.combine(element)
//     }
//     else {
//       this.combine(nf)
//     }
//     return this
//   }

//   combine (nf: NormalTerm) {
//     let i = this.elements.length
//     while (--i >= 0) {
//       const
//         m = meet(this.elements[i], nf)
//       if (m && m.rank !== this.rank) {
//         throw new Error(`Meet shouldn't change rank`)
//       }
//       if (!m) {
//         // terms didn't meet
//       }
//       else {
//         // replace the term
//         this.elements[i] = m
//         return
//       }
//     }
//     // couldn't meet the new term with any existing one
//     this.elements.push(nf)
//   }

//   isShortcut () {
//     return this.rank <= this.threshold
//   }

//   snapshot (): SequentialConjunction {
//     return new SequentialConjunction(this.elements.slice(), this.rank)
//   }

//   // Looks up a variable in the context by name.
//   lookup (id: Term): NormalTerm | undefined {
//     // this is a wired lower join
//     let i = this.elements.length
//     while (--i >= 0) {
//       const term = this.elements[i]
//       if (term instanceof Binding && equal(term.a, id)) return term.b
//     }
//     if (this.parent) return this.parent.snapshot().lookup(id)
//     return undefined
//   }

//   reset () {
//     this.elements = []
//     this.rank = Rank.Top
//     return this
//   }
// }
