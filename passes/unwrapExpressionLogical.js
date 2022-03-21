const { isExpressionStatementUsed, replaceNode, parent, canSpliceBefore } = require('../utils')
const escodegen = require('escodegen')

let varId = 0

// Converts return test() || test2() to const result = test(); if (result) { return result; } return test2();
// Also convert return test() && test2() to const result = test(); if (!result) { return result; } return test2();
// Do it with conditionals too - return x ? y : z => if (x) { return y; } else { return z; }
// Sometimes this helps with readability, but maybe not always
// TODO: Only do this when the values are complex and are likely to be unwrapped later
// Doing this for simple values may make it harder to read
module.exports = function (node, ancestors) {
  /* if (!parent(ancestors).type === 'ReturnStatement') {
    // Not implemented yet
    return
  } */

  if (!(parent(ancestors).type === 'ReturnStatement' || parent(ancestors).type === 'AssignmentExpression')) {
    return
  }

  const isAssignment = parent(ancestors).type === 'AssignmentExpression'
  const isReturn = parent(ancestors).type === 'ReturnStatement'

  if (isAssignment && isExpressionStatementUsed(parent(ancestors, 2), parent(ancestors, 3))) {
    return
  }

  const newStatements = []
  
  if (node.type === 'ConditionalExpression') {
    let consequent
    let alternate
    if (isReturn) {
      consequent = {
        type: 'ReturnStatement',
        argument: node.consequent
      }
      alternate = {
        type: 'ReturnStatement',
        argument: node.alternate
      }
    } else if (isAssignment) {
      consequent = {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: parent(ancestors).operator,
          left: parent(ancestors).left,
          right: node.consequent
        }
      }
      alternate = {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: parent(ancestors).operator,
          left: parent(ancestors).left,
          right: node.alternate
        }
      }
    } else {
      throw new Error('Unsupported node type - this shouled not be possible')
    }

    // Convert return x ? y : z to if (x) { return y; } else { return z; }
    newStatements.push({
      type: 'IfStatement',
      test: node.test,
      consequent: {
        type: 'BlockStatement',
        body: [consequent]
      },
      alternate: {
        type: 'BlockStatement',
        body: [alternate]
      }
    })
  } else if (node.type === 'LogicalExpression') {
    if (node.operator !== '||' && node.operator !== '&&') {
      return
    }

    const varName = '__temp_' + varId++

    // Store the left side of the operator to a variable

    newStatements.push({
      type: 'VariableDeclaration',
      kind: 'const',
      declarations: [{
        type: 'VariableDeclarator',
        id: {
          type: 'Identifier',
          name: varName
        },
        init: node.left
      }]
    })

    // Return the result if it is truthy for || or falsey for &&, otherwise return the right side of the operator

    let consequent
    let alternate
    if (isReturn) {
      consequent = {
        type: 'ReturnStatement',
        argument: {
          type: 'Identifier',
          name: varName
        }
      }
      alternate = {
        type: 'ReturnStatement',
        argument: node.right
      }
    } else if (isAssignment) {
      consequent = {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: parent(ancestors).operator,
          left: parent(ancestors).left,
          right: {
            type: 'Identifier',
            name: varName
          }
        }
      }
      alternate = {
        type: 'ExpressionStatement',
        expression: {
          type: 'AssignmentExpression',
          operator: parent(ancestors).operator,
          left: parent(ancestors).left,
          right: node.right
        }
      }
    } else {
      throw new Error('Unsupported node type - this shouled not be possible')
    }

    newStatements.push({
      type: 'IfStatement',
      test: node.operator === '&&' ? {
        type: 'UnaryExpression',
        operator: '!',
        argument: {
          type: 'Identifier',
          name: varName
        }
      } : {
        type: 'Identifier',
        name: varName
      },
      consequent: {
        type: 'BlockStatement',
        body: [consequent]
      },
      alternate: isReturn ? null : {
        type: 'BlockStatement',
        body: [alternate]
      }
    })

    if (isReturn) {
      newStatements.push(alternate)
    }
  }

  // Replace the return statement with the new statements
  if (!isAssignment) {
    replaceNode(parent(ancestors, 2), parent(ancestors), newStatements)
  } else {
    // Assignments are wrapped in an ExpressionStatement
    replaceNode(parent(ancestors, 3), parent(ancestors, 2), newStatements)
  }
}