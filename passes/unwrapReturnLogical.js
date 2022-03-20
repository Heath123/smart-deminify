const { isExpressionStatementUsed, replaceNode, parent } = require('../utils')
const escodegen = require('escodegen')

// Converts return test() || test2() to const result = test(); if (result) { return result; } return test2();
// Also convert return test() && test2() to const result = test(); if (!result) { return result; } return test2();
// Do it with conditionals too - return x ? y : z => if (x) { return y; } else { return z; }
// Sometimes this helps with readability, but maybe not always
// TODO: Only do this when the values are complex and are likely to be unwrapped later
// Doing this for simple values may make it harder to read
module.exports = function (node, ancestors) {
  if (node.argument.type === 'ConditionalExpression') {
    // Convert return x ? y : z to if (x) { return y; } else { return z; }
    const ifStatement = {
      type: 'IfStatement',
      test: node.argument.test,
      consequent: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: node.argument.consequent
        }]
      },
      alternate: {
        type: 'BlockStatement',
        body: [{
          type: 'ReturnStatement',
          argument: node.argument.alternate
        }]
      }
    }
    replaceNode(parent(ancestors), node, [ifStatement])
  } else if (node.argument.type === 'LogicalExpression') {
    if (node.argument.operator !== '||' && node.argument.operator !== '&&') {
      return
    }

    const newStatements = []

    // Store the left side of the || to a variable
    // TODO: dynamic name

    newStatements.push({
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: 'result'
        },
        init: node.argument.left
      }]
    })

    // Return the result if it is truthy

    newStatements.push({
      type: 'IfStatement',
      test: node.argument.operator === '&&' ? {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'Identifier',
          name: 'result'
        }
      } : {
        type: 'Identifier',
        name: 'result'
      },
      consequent: {
        type: 'ReturnStatement',
        argument: {
          type: 'Identifier',
          name: 'result'
        }
      },
      alternate: null
    })

    // Otherwise return the right side of the ||

    newStatements.push({
      type: 'ReturnStatement',
      argument: node.argument.right
    })

    // Replace the return statement with the new statements
    replaceNode(parent(ancestors), node, newStatements)
  }
}