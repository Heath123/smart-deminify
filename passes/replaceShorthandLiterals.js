const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

// Replace void 0 with undefined (or void followed by any literal)
// Also replace !0 with true and !1 with false
module.exports = function (node, ancestors) {
  if (node.operator === '!' && node.argument.type === 'Literal') {
    if (node.argument.value === 0 || node.argument.value === 1) {
      node.type = 'Literal'
      node.value = !node.argument.value
      node.raw = node.value.toString()

      delete node.operator
      delete node.argument
      delete node.prefix
    }
  }

  if (node.operator === 'void' && node.argument.type === 'Literal') {
    node.type = 'Identifier'
    node.name = 'undefined'

    delete node.operator
    delete node.argument
    delete node.prefix
  }
}