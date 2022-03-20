const { isExpressionStatementUsed, replaceNode, parent } = require('../utils')
const escodegen = require('escodegen')

// Convert void test() to (test(), undefined)
// This is less readable on its own, but later passes (especially commaUnwrap) can remove it
module.exports = function (node, ancestors) {
  if (node.type === 'UnaryExpression' && node.operator === 'void') {
    node.type = 'SequenceExpression'
    node.expressions = [node.argument, { type: 'Identifier', name: 'undefined' }]
    delete node.operator
    delete node.prefix
    delete node.argument
  }
}