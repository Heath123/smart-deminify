const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

// Convert a ? b : c to if (a) { b; } else { c; } as long as the result is not used
module.exports = function (node, ancestors) {
  if (!isExpressionStatementUsed(parent(ancestors), parent(ancestors, 2))) {
    ifStatement = {
      type: 'IfStatement',
      test: node.test,
      consequent: {
        type: 'BlockStatement',
        body: [{
          type: 'ExpressionStatement',
          expression: node.consequent
        }]
      },
      alternate: {
        type: 'BlockStatement',
        body: [{
          type: 'ExpressionStatement',
          expression: node.alternate
        }]
      }
    }
    replaceNode(parent(ancestors, 2), parent(ancestors), [ifStatement])
  }
}