
export type ClassSpec<T> = (new (...args) => T) | null

type UnaryOp<
  Ctx,
  A extends object,
  R,
  > = (ctx: Ctx, a: A) => R

interface UnaryCase<
  Ctx,
  A extends object,
  R,
  > {
  classA: ClassSpec<A>,
  fn: UnaryOp<Ctx, A, R>
}

type UnaryMap<
  Ctx,
  A extends object,
  R,
  > = Map<ClassSpec<A>, UnaryOp<Ctx, A, R>>

export class UnaryDispatcher<Ctx, A extends object, R extends object> {
  map?: Map<ClassSpec<A>, UnaryOp<Ctx, A, R | null>>

  constructor (
    // The default case.
    public def: UnaryOp<Ctx, A, R>,
    // An implementation case for a class.
    public casee?: UnaryCase<Ctx, A, R | null>,
    // The next one in the chain of dispatchers.
    public parent?: UnaryDispatcher<Ctx, A, R>,
  ) { }

  // Adds a new function to the dispatcher.
  add<T extends A> (classA: ClassSpec<T>, fn: UnaryOp<Ctx, T, R | null>)
    : UnaryDispatcher<Ctx, A, R> {
    return new UnaryDispatcher(this.def, { classA, fn }, this)
  }

  apply<T extends A> (ctx: Ctx, a: T): R {
    if (!this.map) this.map = this.buildMap()
    const fnExact = this.map.get(a.constructor as unknown as ClassSpec<A>)
    if (fnExact) {
      const r = fnExact(ctx, a)
      if (r !== null) return r
    }
    const fnAny = this.map.get(null)
    if (fnAny) {
      const r = fnAny(ctx, a)
      if (r !== null) return r
    }
    return this.def(ctx, a)
  }

  // Builds a dispatcher map on demand.
  private buildMap (): UnaryMap<Ctx, A, R | null> {
    const map: UnaryMap<Ctx, A, R | null> = new Map()
    let next: UnaryDispatcher<Ctx, A, R> | undefined = this
    while (next) {
      const casee = next.casee
      if (casee) map.set(casee.classA, casee.fn)
      next = next.parent
    }
    return map
  }
}

type BinaryOp<
  Ctx,
  A extends object,
  B extends object,
  R,
  > = (ctx: Ctx, a: A, b: B) => R

interface BinaryCase<
  Ctx,
  A extends object,
  B extends object,
  R,
  > {
  classA: ClassSpec<A>,
  classB: ClassSpec<B>,
  fn: BinaryOp<Ctx, A, B, R>
}

type BinaryMap<
  Ctx,
  A extends object,
  B extends object,
  R,
  > = Map<ClassSpec<A>, Map<ClassSpec<B>, BinaryOp<Ctx, A, B, R | null>>>

export class BinaryDispatcher<Ctx, A extends object, B extends object, R extends object> {
  map?: BinaryMap<Ctx, A, B, R>

  constructor (
    // The default case.
    public def: BinaryOp<Ctx, A, B, R>,
    // An implementation case for two classes.
    public casee?: BinaryCase<Ctx, A, B, R | null>,
    // The next one in the chain of dispatchers.
    public parent?: BinaryDispatcher<Ctx, A, B, R>,
  ) { }

  // Adds a new function to the dispatcher.
  add<T extends A, U extends B,>
    (classA: ClassSpec<T>, classB: ClassSpec<U>, fn: BinaryOp<Ctx, T, U, R | null>)
    : BinaryDispatcher<Ctx, A, B, R> {
    return new BinaryDispatcher(this.def, { classA, classB, fn }, this)
  }

  apply<T extends A, U extends B,>
    (ctx: Ctx, a: T, b: U)
    : R {
    if (!this.map) this.map = this.buildMap()
    return this.dispatchB(ctx, a, b, this.map.get(a.constructor as unknown as ClassSpec<A>))
      || this.dispatchB(ctx, a, b, this.map.get(null))
      || this.def(ctx, a, b)
  }

  private dispatchB<T extends A, U extends B>
    (ctx: Ctx, a: T, b: U, mapB: Map<ClassSpec<B>, BinaryOp<Ctx, A, B, R | null>> | undefined)
    : R | null {
    if (mapB) {
      const bExact = mapB.get(b.constructor as unknown as ClassSpec<B>)
      if (bExact) {
        const r = bExact(ctx, a, b)
        if (r !== null) return r
      }
      const bAny = mapB.get(null)
      if (bAny) {
        const r = bAny(ctx, a, b)
        if (r !== null) return r
      }
    }
    return null
  }

  // Builds a dispatcher map on demand.
  private buildMap (): BinaryMap<Ctx, A, B, R> {
    const map: BinaryMap<Ctx, A, B, R> = new Map()
    let next: BinaryDispatcher<Ctx, A, B, R> | undefined = this
    while (next) {
      const casee = next.casee
      if (casee) {
        let mapB = map.get(casee.classA)
        if (!mapB) {
          mapB = new Map()
          map.set(casee.classA, mapB)
        }
        mapB.set(casee.classB, casee.fn)
      }
      next = next.parent
    }
    return map
  }
}
