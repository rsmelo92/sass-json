const fs = require('fs')
const path = require('path');
const sass = require('node-sass');

console.log(process.argv);

function handleVariables(variables) {
  return variables.reduce((acc, line) => {
    const [key, value] = line.replace(/ /g, '').split(':');
    if(!!key && !!value) {
      const ignoreMap = value.indexOf('(') === -1;
      const ignoreImport = value.indexOf('@') === -1;
      const ignoreRule = value.indexOf('!') === -1;
      if(ignoreMap && ignoreImport && ignoreRule) { 
        return { ...acc, [key]: value };
      }
    }
    return acc;
  }, {});
}

function getFileContent(file) {
  const splittedFile = file.split("/");
  const fileName = splittedFile[splittedFile.length - 1].replace('_', ''). replace('.scss', '');

  try {
    const data = fs.readFileSync(file, 'utf8')
    // Remove comments, space and newlines from file
    const cleaned = data.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'').replace(/\r?\n|\r/g,'').replace( /\s\s+/g, ' ' );
   
    const variablesJson = handleVariables(cleaned.split('$'));

    return { [fileName]: variablesJson };

  } catch (err) {
    console.error(err)
  }
}

const fileName = '_variables'; // TODO: Receive file name as argument and handle each
const filePath = path.resolve(__dirname, `../scss/_${fileName}.scss`);
const outputPath = path.resolve(__dirname, '../dist/json');

const { stats: { includedFiles } } = sass.renderSync({ file: filePath });
const content = includedFiles.map(getFileContent).reduce((acc, obj) => ({...acc, ...obj}), {})

fs.mkdirSync(outputPath);
fs.writeFileSync(`${outputPath}/${fileName}.json`, JSON.stringify(content));

console.log("Done! Compiled json to: ", outputPath);
