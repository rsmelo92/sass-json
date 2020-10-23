const fs = require('fs')
const path = require('path');
const sass = require('node-sass');

console.log(process.argv);

let scssFilePath
try {
  const fileIndex = process.argv.findIndex(arg => arg === '--file');
  scssFilePath = process.argv[fileIndex+1];
} catch (error) {
  console.error(error);  
}

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

function getFilename(path) {
  const splittedFile = path.split("/");
  const fileName = splittedFile[splittedFile.length - 1].replace('_', '').replace('.scss', '');
  return fileName;
}

function getFileContent(file) {
  const fileName = getFilename(file);
  try {
    const data = fs.readFileSync(file, 'utf8')
    // Remove comments, space and newlines from file
    const cleaned = data.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g,'').replace(/\r?\n|\r/g,'').replace( /\s\s+/g, ' ' );
   
    const variablesJson = handleVariables(cleaned.split('$'));

    return { [fileName]: variablesJson };

  } catch (err) {
    console.error(err.message)
  }
}

const filePath = path.resolve(scssFilePath);
const outputName = getFilename(filePath)
console.log("filePath",filePath);
const outputPath = path.resolve(__dirname);

const { stats: { includedFiles } } = sass.renderSync({ file: filePath });
const content = includedFiles.map(getFileContent).reduce((acc, obj) => ({...acc, ...obj}), {})

try {
  console.log("Creating: ", outputPath);
  fs.mkdirSync(outputPath);
} catch {
  console.log("Folder already exists, skipping...");
}

const output = `${outputPath}/${outputName}.json`;
fs.writeFileSync(output, JSON.stringify(content));

console.log("Done! Compiled json to:", output);
