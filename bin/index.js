#! /usr/bin/env node
console.log('Execution started...');
const xml2js = require('xml2js');
const { decode } = require('html-entities');
const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: 'ATTR' });

function findAndReplace(
  string,
  search,
  count = 0,
  replacement,
  checkLastIndex = false
) {
  let index = checkLastIndex
    ? string.lastIndexOf(search)
    : string.indexOf(search);
  let newStr = string;
  if (checkLastIndex) {
    newStr =
      string.substring(0, index) + replacement + string.substring(index + 1);
  } else if (index >= 0) {
    const term = string.slice(index, index + count);
    newStr = string.replace(term, replacement);
  }
  return newStr;
}

function convert(filename) {
  let xml_string = fs.readFileSync(filename, 'utf8');
  const newFileName = filename.replace('.xml', '.json');
  parser.parseString(xml_string, function (error, result) {
    if (error === null) {
      const translations = {};
      result.resources.string.forEach((item) => {
        let str = item['_'];
        var entity = str.substring(str.indexOf('&'), str.lastIndexOf(';') + 1);
        if (entity.length) {
          const convertedEntity = decode(str);
          str = str.replace(entity, convertedEntity);
        }

        // Replace %2$d / s
        str = findAndReplace(str, '%2', 4, '{{arg1}}');
        // Replace %1$s / d
        str = findAndReplace(str, '%1', 4, '{{arg0}}');
        // Replace space character
        //str = findAndReplace(str, '\u0020', 6, ' ', true);
        str = str.replace(/\\u0020+/g, ' ').trim();
        //Replace string argument
        str = findAndReplace(str, '%s', 2, '{{arg0}}');
        str = findAndReplace(str, '%s', 2, '{{arg1}}');
        str = str.replace(/\\'+/g, "'").trim();
        const trans = { [item['ATTR'].name]: str };
        Object.assign(translations, trans);
      });
      fs.writeFileSync(newFileName, JSON.stringify(translations));
    } else {
      console.log(error);
    }
  });
  console.log(`Created file ${newFileName} successfully...`);
}

const directoryPath = process.cwd();
fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  let count = 0;
  files.forEach(function (file) {
    if (file.endsWith('.xml')) {
      count += 1;
      convert(file);
    }
  });
  console.log(`${count} files created`);
});
