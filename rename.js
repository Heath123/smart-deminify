const esrefactor = require('esrefactor')
const estraverse = require('estraverse')
// const esprima = require('esprima')'s' + n

function getStart (node) {
  return node.range ? node.range[0] : node.start
}

module.exports.uniqueNames = (code, getName, needsRenaming) => {
  let nameCounter = 0
  // The start positions of identifiers that were already processed
  // This avoids infinite loops as not all identifiers can be renamed
  const processedIdentifiers = []

  while (nameCounter < 100000000) {
    const ctx = new esrefactor.Context(code);

    let identifier

    estraverse.traverse(ctx._syntax, {
      enter: function (node) {
        if (node.type === "Identifier" && needsRenaming(node) && !processedIdentifiers.includes(getStart(node))) {
          identifier = node
          return estraverse.VisitorOption.Break
        }
      }
    })

    if (identifier === undefined) {
      break
    }

    // TODO
    // try {
      console.log(identifier)
      const id = ctx.identify(getStart(identifier))
      // console.log(id)
      code = ctx.rename(id, getName(nameCounter));
      console.log(identifier.name)
      // console.log(code)
    // } catch (err) {
      // console.warn(err)
    // }

    processedIdentifiers.push(getStart(identifier))
    nameCounter++
  }

  return code
}
