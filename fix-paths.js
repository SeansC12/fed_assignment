const fs = require('fs');
const path = require('path');

const BASE_PATH = process.env.BASE_PATH || '/fed_assignment/';

function findHTMLFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHTMLFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function addBaseTag(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<base href=')) {
    console.log(`Skipping ${filePath} (base tag exists)`);
    return;
  }
  
  // Add base tag after <head>
  const headRegex = /(<head[^>]*>)/i;
  if (headRegex.test(content)) {
    content = content.replace(headRegex, `$1\n    <base href="${BASE_PATH}">`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`No <head> tag found in ${filePath}`);
  }
}

// Find and update all HTML files
const htmlFiles = findHTMLFiles('./src');
console.log(`Found ${htmlFiles.length} HTML files\n`);

htmlFiles.forEach(addBaseTag);

console.log('\nDone! All HTML files updated with base tag.');
console.log(`Base path set to: ${BASE_PATH}`);
