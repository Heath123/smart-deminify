const escodegen = require('escodegen')

// Function to find if the value of an ExpressionStatement may be used
module.exports.isExpressionStatementUsed = function (node, parent) {
  if (node.type !== 'ExpressionStatement') {
    return true;
  }

  // If the expression is a standalone line of code, the result is not used
  // Check the parent node to see if it is a block statement, program or switch statement
  // If it is not, the expression may be used
  if (parent.type === 'BlockStatement' || parent.type === 'Program' || parent.type === 'SwitchCase') {
    return false
  } /*else if (parent.type === 'SwitchStatement') {
    // TODO: The test/discriminant never seem to actually be an ExpressionStatement, is this needed?
    return node === parent.discriminant || node === parent.test
  }*/ else {
    return true
  }
}

// Replace the specified node in the parent with the specified replacement(s) by searching for the node in the parent's body
module.exports.replaceNode = function (parent, node, replacementArray) {
  // Loop over all the fields in the parent that contain an array of nodes or a single node
  for (const field of Object.keys(parent)) {
    // If the field is not an object, continue
    if (typeof parent[field] !== 'object') {
      continue
    }
    // If it's null, continue
    if (parent[field] === null) {
      continue
    }
    // Check whether it's either an array of nodes or a single node
    // All nodes have a type property
    // If not, continue
    if (!((Array.isArray(parent[field]) && parent[field].every(n => n.type)) || parent[field].type)) {
      continue
    }
    if (node === parent[field]) {
      // Replace it with a block statement
      parent[field] = {
        type: 'BlockStatement',
        body: replacementArray
      }
      return
    }
    if (!Array.isArray(parent[field])) {
      console.warn('Could not replace node in parent', parent, node, replacementArray)
      console.log(escodegen.generate(parent))
      // continue
      throw new Error('Could not replace node in parent')
    }
    // Find the index of the node in the parent's body
    const index = parent[field].indexOf(node)
    if (index === -1) {
      continue
    }
    // Replace the node in the parent's body by splicing the array
    parent[field].splice(index, 1, ...replacementArray)
    return
  }
  throw new Error('Node not found in parent body')
}

module.exports.parent = function (ancestors, up) {
  if (up === undefined) {
    up = 1
  }
  let result = ancestors[ancestors.length - (up + 1)]
  // If the result is a SwitchStatement, return the specific SwitchCase
  if (result.type === 'SwitchStatement') {
    // Find the SwitchCase that contains the node
    const found = result.cases.find(c => c.consequent.includes(module.exports.parent(ancestors, up - 1)))
    result = found === undefined ? result : found
  }
  return result
}

// For now just hardcode all the known safe cases
// TODO: Rename to canMove? Add more cases
module.exports.canSpliceBefore = function (node) {
  return node.type === 'ReturnStatement' || node.type === 'IfStatement' || node.type === 'SwitchStatement';
}
