const fs = require('fs');
const path = require('path');

const BASE_HREF = '/fed_assignment/';

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
  
  // Skip if base tag already exists
  if (content.includes('<base href=')) {
    return;
  }
  
  // Add base tag right after <head>
  const headRegex = /(<head[^>]*>)/i;
  if (headRegex.test(content)) {
    content = content.replace(headRegex, `$1\n    <base href="${BASE_HREF}" />`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
  }
}

const htmlFiles = [
  ...findHTMLFiles('./src'),
  './index.html'
].filter(file => fs.existsSync(file));

console.log(`Processing ${htmlFiles.length} HTML files...\n`);
htmlFiles.forEach(addBaseTag);
console.log('\n✨ Done! Base tags added for GitHub Pages deployment.');
