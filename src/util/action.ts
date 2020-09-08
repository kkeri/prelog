import * as assert from 'assert'

// An extendable action map.
export class ActionMap {
  map = new Map()

  constructor () {
  }

  // Adds new action assignments.
  add (actions) {
    if (Array.isArray(actions)) {
      for (let item of actions) this.map.set(item[0], item[1])
    } else if (actions instanceof ActionMap) {
      for (let [k, v] of actions.map) this.map.set(k, v)
    } else if (actions instanceof Map) {
      for (let [k, v] of actions) this.map.set(k, v)
    } else if (typeof actions === 'object') {
      for (let name in actions) this.map.set(name, actions[name])
    }
    return this
  }

  // Associates classes with actions.
  addClasses (ctors, actions) {
    for (let name in actions) {
      let ctor = ctors[name]
      assert(ctor, `constructor ${name} is not found`)
      this.map.set(ctors[name].prototype, actions[name])
    }
    return this
  }

  // Retrieves the action for the specified object, if it is registered.
  get (key) {
    if (typeof key === 'object') {
      return this.map.get(Object.getPrototypeOf(key))
    } else {
      return this.map.get(typeof key)
    }
  }
}
