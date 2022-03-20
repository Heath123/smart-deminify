const { isExpressionStatementUsed, replaceNode, parent } = require('../utils')
const escodegen = require('escodegen')

// Some other passes create code that looks like this:
// if (test) { a() } else { if (test2) { b() } }
// This is more readable when converted to:
// if (test) { a() } else if (test2) { b() }
// We can do this by detecting if the alternative is a block with a single if statement and removing the block
module.exports = function (node, ancestors) {
  if (!node.alternate ||
    node.alternate.type !== 'BlockStatement' ||
    node.alternate.body.length !== 1 ||
    node.alternate.body[0].type !== 'IfStatement') {

    return
  }

  // Remove the block
  node.alternate = node.alternate.body[0]
}