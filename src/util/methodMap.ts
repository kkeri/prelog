
export type ClassSpec<T> = (new (...args) => T) | null

interface Pair<A extends Object, B> {
  a: ClassSpec<A>,
  b: B,
}

export class MethodMap<A extends Object, B> {
  map?: Map<ClassSpec<A>, B>

  constructor (
    // The default case.
    public def: B,
    // An implementation case for a class.
    public casee?: Pair<A, B>,
    // The next one in the chain of dispatchers.
    public parent?: MethodMap<A, B>,
  ) { }

  // Adds a new function to the dispatcher.
  add<T extends A> (a: ClassSpec<T>, b: B): MethodMap<A, B> {
    return new MethodMap(this.def, { a, b }, this)
  }

  get<T extends A> (a: T): B {
    if (!this.map) this.map = this.buildMap()
    return this.map.get(a.constructor as unknown as ClassSpec<A>) ?? this.def
  }

  // Builds a map on demand.
  private buildMap (): Map<ClassSpec<A>, B> {
    const map: Map<ClassSpec<A>, B> = new Map()
    let next: MethodMap<A, B> | undefined = this
    while (next) {
      const casee = next.casee
      if (casee) map.set(casee.a, casee.b)
      next = next.parent
    }
    return map
  }
}
