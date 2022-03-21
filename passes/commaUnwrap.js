const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comma_Operator
// "The comma operator (,) evaluates each of its operands (from left to right) and returns the value of the last operand."

// Convert a(), b(), c() to a(); b(); c();
// Also convert return a(), b(), c() to a(); b(); return c();
// Another example would be if (a(), b()) { c(); } => a(); if (b()) { c(); }
module.exports = function (node, ancestors) {
  // If the result is not used we don't need have to worry about making sure the last value is returned
  if (!isExpressionStatementUsed(parent(ancestors), parent(ancestors, 2))) {
    // Wrap each expression in an ExpressionStatement
    node.expressions = node.expressions.map(e => ({ type: 'ExpressionStatement', expression: e }))
    // Splice all the expressions into the body of the parent
    replaceNode(parent(ancestors, 2), parent(ancestors), node.expressions)
  }
  
  if (canSpliceBefore(parent(ancestors))) {
    // Splice all the statements except the last one into before the parent in the grandparent
    replaceNode(parent(ancestors, 2), parent(ancestors), [...node.expressions.slice(0, -1).map(e => ({ type: 'ExpressionStatement', expression: e })), parent(ancestors)])
    // Replace this node with the last expression
    const last = node.expressions[node.expressions.length - 1]
    delete node.expressions
    Object.assign(node, last)
  }
}