const fs = require('fs')
const deminifier = require('./deminifier')

// Load and parse the file in the first argument
// TODO: Make sure this works when making the js file executable
if (!process.argv[2]) {
  console.error('Please provide a file to parse')
  process.exit(1)
}

const fileContent = fs.readFileSync(process.argv[2], 'utf8')
const result = deminifier.deminify(fileContent, console.log)
console.log(result)
