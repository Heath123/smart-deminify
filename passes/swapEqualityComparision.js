const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

function literalOrSimiliar(node) {
  if (node.type === 'Literal') return true;
  // Allow negatives
  if (node.type === 'UnaryExpression' && node.operator === '-') return literalOrSimiliar(node.argument);
  // Allow undefined as this should be treated as a literal in this case
  if (node.type === 'Identifier' && node.name === 'undefined') return true;
}

// Convert "abc" === test to test === "abc" i.e. make sure literal values are on the right
// This is really a matter of preference, but it's usually more readable this way
module.exports = function (node, ancestors) {
  if (node.type === 'BinaryExpression' &&
    (node.operator === '==' || node.operator === '!=' || node.operator === '===' || node.operator === '!==') &&
    literalOrSimiliar(node.left) && !literalOrSimiliar(node.right)) {

    const temp = node.left
    node.left = node.right
    node.right = temp
  }
}