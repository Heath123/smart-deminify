const { isExpressionStatementUsed, replaceNode, parent } = require('../utils')
const escodegen = require('escodegen')

// Convert if (a) b; to if (a) { b; }
module.exports = function (node, ancestors) {
  if (node.consequent.type !== 'BlockStatement') {
    node.consequent = {
      type: 'BlockStatement',
      body: [node.consequent]
    }
  }
  if (node.alternate && node.alternate.type !== 'BlockStatement') {
    node.alternate = {
      type: 'BlockStatement',
      body: [node.alternate]
    }
  }
}