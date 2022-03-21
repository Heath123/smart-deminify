const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

// Convert if (a) b; to if (a) { b; }
// Also convert for (a = 0; a < 10; a++) b; to for (a = 0; a < 10; a++) { b; }
module.exports = function (node, ancestors) {
  if (node.type === 'IfStatement') {
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
  } else if (node.type === 'ForStatement' || node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
    if (node.body.type !== 'BlockStatement') {
      node.body = {
        type: 'BlockStatement',
        body: [node.body]
      }
    }
  }
}