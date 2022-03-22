const espree = require('espree')
const walk = require("acorn-walk")
const escodegen = require('escodegen')
const fs = require('fs')
const path = require('path')

const { isExpressionStatementUsed, replaceNode, parent } = require('./utils')

// Load and parse the file in the first argument
// TODO: Make sure this works when making the js file executable
if (!process.argv[2]) {
  console.error('Please provide a file to parse')
  process.exit(1)
}
const test = fs.readFileSync(process.argv[2], 'utf8')

console.log('Parsing file...')

// Parse very leniently because this is designed to parse any kind of code with little context required
const ast = espree.parse(test, {
  ecmaVersion: "latest",
  ecmaFeatures: {
    globalReturn: true
  },
  range: true,
  tokens: true, 
  comment: true
})
escodegen.attachComments(ast, ast.comments, ast.tokens)

console.log('Improving readability - 0/4...')

// Import passes
const logicalToIf = require('./passes/logicalToIf')
const statementToBlock = require('./passes/statementToBlock')
const commaUnwrap = require('./passes/commaUnwrap')
const conditionalToIf = require('./passes/conditionalToIf')
const unwrapExpressionLogical = require('./passes/unwrapExpressionLogical')
const voidToComma = require('./passes/voidToComma')
const createElseIf = require('./passes/createElseIf')

const replaceShorthandLiterals = require('./passes/replaceShorthandLiterals')

walk.ancestor(ast, { UnaryExpression: replaceShorthandLiterals })

// Apply each pass 3 times because some rely on others in somewhat complex ways
for (let i = 0; i < 3; i++) { 
  // Run these first as some other passes rely on them
  walk.ancestor(ast, {
    IfStatement: statementToBlock,
    ForStatement: statementToBlock,
    ForInStatement: statementToBlock,
    ForOfStatement: statementToBlock
  })
  walk.ancestor(ast, { UnaryExpression: voidToComma })

  walk.ancestor(ast, { SequenceExpression: commaUnwrap })
  walk.ancestor(ast, { LogicalExpression: logicalToIf }) // TODO: Replace with unwrapExpressionLogical
  walk.ancestor(ast, { ConditionalExpression: conditionalToIf })
  walk.ancestor(ast, { LogicalExpression: unwrapExpressionLogical, ConditionalExpression: unwrapExpressionLogical })
  walk.ancestor(ast, { IfStatement: createElseIf })

  console.log('Improving readability - ' + (i + 1) + '/4...')
}

const swapEqualityComparision = require('./passes/swapEqualityComparision')
const unwrapVariableDeclaration = require('./passes/unwrapVariableDeclaration')

console.log('Improving readability - 4/4...')

walk.ancestor(ast, { BinaryExpression: swapEqualityComparision })
walk.ancestor(ast, { VariableDeclaration: unwrapVariableDeclaration })

console.log("Renaming symbols - 0%...")

const rename = require('./rename')

let uniqueFakeRange = 1

// Recursively walk the AST and add fake range info if it doesn't have real range info
function replaceRange(node) {
  if (node.type !== undefined) {
    if (node.start === undefined && node.end === undefined) {
      // Fake range to act as a unique identifier for the renaming logic
      // Extremely hacky, but it works
      node.range = [uniqueFakeRange * 10000000, uniqueFakeRange * 10000000 + 1]
      uniqueFakeRange++
    }
  }
  // Call on all children
  for (let key in node) {
    if (node.hasOwnProperty(key) && typeof node[key] === "object" && node[key] !== null) {
      replaceRange(node[key])
    }
  }
}

replaceRange(ast)

rename.uniqueNames(ast, name => `s${name}`, i => (i.name.length === 1 || i.name.startsWith('__temp_')))

console.log(escodegen.generate(ast, { comment: true }))

// console.log(JSON.stringify(ast, null, 2))