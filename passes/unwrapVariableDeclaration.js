const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

// Convert const a = 1, b = 2, c = 3 to const a = 1; const b = 2; const c = 3
module.exports = function (node, ancestors) {
  if (node.declarations.length === 1) {
    return
  }

  // Don't do this if we're in the init section of a for loop
  // TODO: Put the other variables before the loop, but take scope into account
  if (parent(ancestors).type === 'ForStatement' && parent(ancestors).init === node) {
    return
  }

  declarations = node.declarations.map(d => {
    return {
      type: 'VariableDeclaration',
      declarations: [d],
      kind: node.kind
    }
  })

  // Replace the node with the declarations
  replaceNode(parent(ancestors), node, declarations)
}