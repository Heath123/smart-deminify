const esrefactor = require('esrefactor')
const estraverse = require('estraverse')
// const esprima = require('esprima')'s' + n

function getStart (node) {
  return node.range ? node.range[0] : node.start
}

module.exports.uniqueNames = (code, getName, needsRenaming) => {
  let nameCounter = 0
  const identifiers = []

  estraverse.traverse(code, {
    enter: function (node) {
      if (node.type === "Identifier" && needsRenaming(node) ) {
        identifiers.push(node)
      }
    }
  })

  const ctx = new esrefactor.Context(code)

  for (const identifier of identifiers) {
    if (!needsRenaming(identifier)) {
      continue
    }

    console.log('renaming', identifier)

    const id = ctx.identify(getStart(identifier))
    code = ctx.rename(id, getName(nameCounter))
    nameCounter++
  }

  return code
}
