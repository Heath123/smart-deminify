const acorn = require('acorn')
const walk = require("acorn-walk")
const escodegen = require('escodegen')
const fs = require('fs')
const path = require('path')

const { isExpressionStatementUsed, replaceNode, parent } = require('./utils')

// Load and parse test.js
const test = fs.readFileSync(path.join(__dirname, '..', 'test.js'), 'utf8')
// Parse very leniently because this is designed to parse any kind of code with little context required
const ast = acorn.parse(test, {
  ecmaVersion: "latest",
  allowReserved: true,
  allowReturnOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowHashBang: true,
  allowAwaitOutsideFunction: true,
  allowSuperOutsideMethod: true
})

// Import passes
const logicalToIf = require('./passes/logicalToIf')
const ifStatementToBlock = require('./passes/ifStatementToBlock')
const commaUnwrap = require('./passes/commaUnwrap')
const conditionalToIf = require('./passes/conditionalToIf')
const unwrapReturnLogical = require('./passes/unwrapReturnLogical')
const voidToComma = require('./passes/voidToComma')
const createElseIf = require('./passes/createElseIf')

const replaceShorthandLiterals = require('./passes/replaceShorthandLiterals')

walk.ancestor(ast, { UnaryExpression: replaceShorthandLiterals })

// Apply each pass 3 times because some rely on others in somewhat complex ways
for (let i = 0; i < 3; i++) { 
  // Run these first as some other passes rely on them
  walk.ancestor(ast, { IfStatement: ifStatementToBlock })
  walk.ancestor(ast, { UnaryExpression: voidToComma })

  walk.ancestor(ast, { SequenceExpression: commaUnwrap })
  walk.ancestor(ast, { LogicalExpression: logicalToIf })
  walk.ancestor(ast, { ConditionalExpression: conditionalToIf })
  walk.ancestor(ast, { ReturnStatement: unwrapReturnLogical })
  walk.ancestor(ast, { IfStatement: createElseIf })

  // console.log(escodegen.generate(ast))
}

const swapEqualityComparision = require('./passes/swapEqualityComparision')
const unwrapVariableDeclaration = require('./passes/unwrapVariableDeclaration')

walk.ancestor(ast, { BinaryExpression: swapEqualityComparision })
walk.ancestor(ast, { VariableDeclaration: unwrapVariableDeclaration })

/* const rename = require('./rename')

// Recursively walk the AST and replace { start: x, end: y } with { range: [x, y] }
// This makes it compatible with esprima
function replaceRange(node) {
  if (node.start !== undefined && node.end !== undefined) {
    node.range = [node.start, node.end]
    delete node.start
    delete node.end
  }
  // Call on all children
  for (let key in node) {
    if (node.hasOwnProperty(key) && typeof node[key] === "object" && node[key] !== null) {
      replaceRange(node[key])
    }
  }
}

replaceRange(ast)

console.log(rename.uniqueNames(ast)) */

console.log(escodegen.generate(ast))
