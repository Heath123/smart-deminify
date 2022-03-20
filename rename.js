const esrefactor = require('esrefactor')
const estraverse = require('estraverse')
// const esprima = require('esprima')

function getName(n) {
  return 's' + n
}

function needsRenaming (identifier) {
  return identifier.name.length === 1
}

module.exports.uniqueNames = (code) => {
  let nameCounter = 0

  while (nameCounter < 1000) {
    const ctx = new esrefactor.Context(code);

    let identifier

    estraverse.traverse(ctx._syntax, {
      enter: function (node) {
        if (node.type === "Identifier" && needsRenaming(node)) {
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
      const id = ctx.identify(identifier.range ? identifier.range[0] : identifier.start);
      // console.log(id)
      code = ctx.rename(id, getName(nameCounter));
      // console.log(code)
    // } catch (err) {
      // console.warn(err)
    // }

    nameCounter++
  }

  return code
}
