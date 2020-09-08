#!/usr/bin/env node

// Builds an Ohm parser recipe.
// Usage:
//  build-ohm.js <ohm-file> <recipe-file>

'use strict'

const fs = require('fs')
const ohm = require('ohm-js')

const grammarPath = process.argv[2]
const recipePath = process.argv[3]
console.log(`Compiling ohm grammar ${grammarPath}...`)
const parser = ohm.grammar(fs.readFileSync(grammarPath))
console.log(`Building parser recipe ${recipePath}...`)
const recipe = parser.toRecipe()
fs.writeFileSync(recipePath, recipe, { encoding: 'utf-8' })
console.log('Done.')
