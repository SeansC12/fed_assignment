const fs = require('fs');
const path = require('path');

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

function stripLeadingSlashes(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Strip leading slashes from paths to /static/ and /src/
  const patterns = [
    { regex: /href="\/(?=(?:static|src)\/)/g, replacement: 'href="' },
    { regex: /src="\/(?=(?:static|src)\/)/g, replacement: 'src="' },
    { regex: /url\(&quot;\/(?=(?:static|src)\/)/g, replacement: 'url(&quot;' },
  ];

  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}`);
  }
}

const htmlFiles = [
  ...findHTMLFiles('./src'),
  './index.html'
].filter(file => fs.existsSync(file));

console.log(`Processing ${htmlFiles.length} HTML files...\n`);
htmlFiles.forEach(stripLeadingSlashes);
console.log('\n✨ Done! Leading slashes stripped for base tag compatibility.');
