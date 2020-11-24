# Prelog

This project implements a [propositional calculus](https://en.m.wikipedia.org/wiki/Propositional_calculus)
based on [natural deduction](https://en.m.wikipedia.org/wiki/Natural_deduction). 
Currently only the positive fragment (∧, ∨) is supported.

The calculus is based on *threshold algebra*, my original research.
Beyond the standard truth values *true* and *false*, this algebra allows us to define
*success* and *failure* as well as a *neutral* truth value.

In practice I don't use standalone thruth values, but models labelled with truth values.
This idea turns a pure logical calculus into a logical backbone open to extensions.
Hopefully, this effort will work out as an expressive and composable *programming calculus* as an alternative to
programming languages which usually offer fixed syntax, semantics and feature set.

The concept of input and output is woven into the calculus with the intent
that parsing can be an inherent part of it, similar to logical formation rules.

## Getting started

After building the project, start the REPL with the command `bin/prelog`.
Enter one or more terms at the prompt and the program interprets them.
During the session you can get help on metacommands by typing `@h`.
Hit `Ctrl-C` to exit.

## Syntax

~~~
# Logical atoms
a, b, c

# Strings
"foo", "bar"

# Natural numbers
0, 1, 2

# Conjunction
{}, {a b c}

# Disjunction
[], [a b c]

# Parentheses (only the first term counts)
(), (a)

# Built-in constants
true, false, success, failure

# Getting the rank (thruth value) of a term
rank t

# Definition (name replacement)
def a 1
~~~

## Interpretation

In general, the user enters a term which is interpreted in context of the current program.
The result is appended to the program and sent to the output as well.
Note that *append* can be a non-trivial operation.

In the beginning the program is empty, which is represented by an initial term.
As terms are being appended, the program usually grows (behaves like a monoid),
but appending some terms may cause the program *terminate*, when monotonicity of the append operation breaks.

Concrete interpretation can be described in various conceptual frameworks.

- Functional: the user enters a term.
  The term is evaluated in the current environment and the result is appended to the environment.

- Logical: the user enters a formula.
  The formula is brought to a minimal normal form using the current premises
  and the normal form is appended to the premises.

- Proof theoretic: the user enters a proof.
  The proof is reduced to a minimal proof in context of the current axioms
  and the minimal proof is appended to the system as a new axiom.

The functional analogy is a bit off because not only
definitions get appended to the environment but all kinds of terms.

## Metacommands

These commands can be used at the prompt.

`@l` - List the program  
`@r` - Reset (clear) the program  
`@h` - Get help on metacommands  
`@x` - Exit the REPL  

## Threshold algebra

There are five truth values:

~~~
 2 Success
 1 True
 0 Neutral
-1 False
-2 Failure
~~~

When a truth value is assigned to a model, it is called the *rank* of the model.

In a nutshell, conjunction and disjunction is modeled after
`min` and `max` respectively, however `failure` on the left side shortcuts conjunction
and `success` on the left side shortcuts disjunction.

These operations can be extended to accept and return models as follows:
the ranks of the models are compared and the "winner" is returned.
If both operands have the same rank,
they are combined using a `meet` / `join` operation respectively.
These are partial operations. If one of them don't apply to a pair of models `a`, `b`,
a conjunctive pair or a disjunctive pair is returned instead.
On the output a conjunctive pair is reflected as `{a b}` and a disjunctive pair as `[a b]`.

## Building and running

In order to build the project, you must have node.js and npm installed.

~~~
cd prelog

# this one installs dependencies, do it only the first time
npm i

# build executable
make

# running the REPL
bin/prelog

# getting help on command line options
bin/prelog --help
~~~

## Source code

Be aware that this project is experimental and far from being complete.
The structure of the code is not yet settled,
and naming of things reflect my personal insight which may (and will) change as I move.
I also use a support lib inherited from earlier projects that makes the code base
larger than ideal.

These are the more interesting parts:

- `core/syntax`: the syntax model
- `core/print`: pretty print rules
- `ip/model`: the semantic model
- `ip/interpreter.ts`: runtime environment and interpretation functions
- `ip/rules`: operations and rules used by the interpreter
- `ip/rank.ts`, `ip/threshold.ts`: threshold algebra
