#! /usr/bin/env node
console.log('Execution started...');
const xml2js = require('xml2js');
const { decode } = require('html-entities');
const fs = require('fs');
const parser = new xml2js.Parser({ attrkey: 'ATTR' });

function convert(filename) {
  let xml_string = fs.readFileSync(filename, 'utf8');
  const newFileName = filename.replace('.xml', '.json');
  parser.parseString(xml_string, function (error, result) {
    if (error === null) {
      const translations = {};
      result.resources.string.forEach((item) => {
        const str = item['_'];
        var entity = str.substring(str.indexOf('&'), str.lastIndexOf(';') + 1);
        if (entity.length) {
          const convertedEntity = decode(str);
          str.replace(entity, convertedEntity);
        }
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
