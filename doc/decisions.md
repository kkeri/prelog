# Design decisions

## General goals

- Provide a good framework to experiment with programming language concepts.
- Adding new syntax and semantics must be as easy as possible.
- The interpreter must be dynamically extensible and alterable.
- Users can develop alternative interpreters in standalone packages.

Non-goals:

- Don't have to be computationally efficient. Efficiency, if needed, can be
  achieved later by metaprogramming and code generation.

## Syntax and parsing

- Provide only structural (or skeleton) syntax.
- Be flexible enough to be able to model the syntax of various programming languages.
- Avoid built-in keywords.
- Be as minimal as possible.
- Be consistent, don't treat some forms exceptionally.
- Make it easy for users to implement their own syntax forms.
- The parser should return surface syntax terms without forcing any semantics.

### Parsing sequences

In many functional languages, juxtaposition is interpreted as function application,
and it is left associative by the tradition stemming from lamda calculus.
In concatenative languages juxtaposition means function composition and usually
a sequence of terms is not associative at the syntax level.

Prelog doesn't presume any meaning of sequences of terms, however they can
serve as an escape hatch to define new syntax without dropping the built-in
parser. This is similar to Agda, where users can define their own
mixfix operators, but can't redefine structural forms, e.g. parentheses.

## Programs and interpreters

Prelog is an interpreted language, however it is better described as an
interpretation framework.

## Extensible programs

Prelog is not tied to any programming paradigms, but it is admittedly leaning
to logic and proof theory. In logical programming it is common to interpret
a program as a set of inference rules that act on a knowledge base.

## The standard interpreter



## Reflective towers

It is an appealing idea that the interpreter is another program similar to
the object program


## Processes

I decided to interpret sequences as *processes*. The concept is borrowed from
operating systems, where programs have a standard input stream. Similarly,
a Prelog sequence is translated to a process that executes a program written
in the metalanguage, and has access to the originating sequence

## Metalanguage

### Choosing a concatenative language

- Differs from the object language, so they don't conceptually interfere.
- Not easy for beginners. The need to learn a concatenative language
  holds back new users from diving into Prelog.
- It may be hard to read metacode because of the postfix notation.

### Choosing a sequential language

- Resembles usual programming languages, so it is easy to learn by example.
- May be confused with the object language because there is a chance that
  they are too similar.
