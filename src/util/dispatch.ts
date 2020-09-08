
export type ClassSpec<T> = (new (...args) => T) | null

type UnaryOp<
  Ctx,
  A extends object,
  R extends object,
  > = (ctx: Ctx, a: A) => R

interface UnaryCase<
  Ctx,
  A extends object,
  R extends object,
  > {
  classA: ClassSpec<A>,
  fn: UnaryOp<Ctx, A, R>
}

type UnaryMap<
  Ctx,
  A extends object,
  R extends object,
  > = Map<ClassSpec<A>, UnaryOp<Ctx, A, R>>

export class UnaryDispatcher<Ctx, A extends object, R extends object> {
  map?: Map<ClassSpec<A>, UnaryOp<Ctx, A, R>>

  constructor (
    public def: UnaryOp<Ctx, A, R>,
    public casee?: UnaryCase<Ctx, A, R>,
    public parent?: UnaryDispatcher<Ctx, A, R>,
  ) { }

  // Adds a new function to the dispatcher.
  add<T extends A> (classA: ClassSpec<T>, fn: UnaryOp<Ctx, T, R>)
    : UnaryDispatcher<Ctx, A, R> {
    return new UnaryDispatcher(this.def, { classA, fn }, this)
  }

  apply<T extends A> (ctx: Ctx, a: T): R {
    if (!this.map) this.map = this.buildMap()
    const fnExact = this.map.get(a.constructor as unknown as ClassSpec<A>)
    if (fnExact) return fnExact(ctx, a)
    const fnAny = this.map.get(null)
    if (fnAny) return fnAny(ctx, a)
    return this.def(ctx, a)
  }

  // Builds a dispatcher map on demand.
  private buildMap (): UnaryMap<Ctx, A, R> {
    const map: UnaryMap<Ctx, A, R> = new Map()
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
  R extends object,
  > = (ctx: Ctx, a: A, b: B) => R

interface BinaryCase<
  Ctx,
  A extends object,
  B extends object,
  R extends object,
  > {
  classA: ClassSpec<A>,
  classB: ClassSpec<B>,
  fn: BinaryOp<Ctx, A, B, R>
}

type BinaryMap<
  Ctx,
  A extends object,
  B extends object,
  R extends object,
  > = Map<ClassSpec<A>, Map<ClassSpec<B>, BinaryOp<Ctx, A, B, R>>>

export class BinaryDispatcher<Ctx, A extends object, B extends object, R extends object> {
  map?: BinaryMap<Ctx, A, B, R>

  constructor (
    public def: BinaryOp<Ctx, A, B, R>,
    public casee?: BinaryCase<Ctx, A, B, R>,
    public parent?: BinaryDispatcher<Ctx, A, B, R>,
  ) { }

  // Adds a new function to the dispatcher.
  add<T extends A, U extends B,>
    (classA: ClassSpec<T>, classB: ClassSpec<U>, fn: BinaryOp<Ctx, T, U, R>)
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

  private dispatchB<T extends A, U extends B,>
    (ctx: Ctx, a: T, b: U, mapB: Map<ClassSpec<B>, BinaryOp<Ctx, A, B, R>> | undefined)
    : R | null {
    if (mapB) {
      const bExact = mapB.get(b.constructor as unknown as ClassSpec<B>)
      if (bExact) return bExact(ctx, a, b)
      const bAny = mapB.get(null)
      if (bAny) return bAny(ctx, a, b)
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
