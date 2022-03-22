const esrefactor = require('esrefactor')
const estraverse = require('estraverse')

function getStart (node) {
  return node.range ? node.range[0] : node.start
}

module.exports.uniqueNames = (code, getName, needsRenaming, progressCallback) => {
  let nameCounter = 0
  const identifiers = []

  estraverse.traverse(code, {
    enter: function (node) {
      if (node.type === "Identifier" && needsRenaming(node)) {
        identifiers.push(node)
      }
    }
  })

  const count = identifiers.length
  
  const ctx = new esrefactor.Context(code)

  for (const identifier of identifiers) {
    if (!needsRenaming(identifier)) {
      continue
    }

    // console.log(identifier.name)

    const id = ctx.identify(getStart(identifier))
    if (!id) {
      continue
    }
    code = ctx.rename(id, getName(nameCounter, id.func))
    nameCounter++

    if (nameCounter % 1000 === 0) {
      progressCallback(Math.round('Renaming symbols - ' + (nameCounter / count) * 10000) / 100 + '%...')
    }
  }

  progressCallback('Renaming symbols - 100%...')

  return code
}
