const { isExpressionStatementUsed, replaceNode, parent } = require('../utils')
const escodegen = require('escodegen')

// Convert a && b() to if (a) { b() } and a || b() to if (!a) { b() }
module.exports = function (node, ancestors) {
  if (!isExpressionStatementUsed(parent(ancestors), parent(ancestors, 2))) {
    // This means we may be able to unwrap && or || into an if statement
    if (node.type === 'LogicalExpression') {
      if (node.operator !== '&&' && node.operator !== '||') return;

      let ifStatement
      if (node.operator === '&&') {
        // Convert && to if
        ifStatement = {
          type: 'IfStatement',
          test: node.left,
          consequent: {
            type: 'BlockStatement',
            body: [{
              type: 'ExpressionStatement',
              expression: node.right
            }]
          }
        }
      } else if (node.operator === '||') {
        // Convert || to if
        ifStatement = {
          type: 'IfStatement',
          test: {
            type: 'UnaryExpression',
            operator: '!',
            prefix: true, // TODO: ???
            argument: node.left
          },
          consequent: {
            type: 'BlockStatement',
            body: [{
              type: 'ExpressionStatement',
              expression: node.right
            }]
          }
        }
      }

      // Replace the expression statement with the if statement
      replaceNode(parent(ancestors, 2), parent(ancestors), [ifStatement])
    }
  }
}
