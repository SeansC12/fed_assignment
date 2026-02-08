const fs = require('fs');
const path = require('path');

// Get environment from command line argument
const environment = process.argv[2] || "production";
const BASE_PATH = environment === "production" ? "/fed_assignment/" : "/";

console.log(`Environment: ${environment}`);
console.log(`Base path: ${BASE_PATH}\n`);

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
  
  // Remove existing base tag first
  content = content.replace(/\s*<base href="[^"]*">\n?/gi, '');
  
  // Add base tag after <head> (only if not local root path)
  if (BASE_PATH !== '/') {
    const headRegex = /(<head[^>]*>)/i;
    if (headRegex.test(content)) {
      content = content.replace(headRegex, `$1\n    <base href="${BASE_PATH}">`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️  No <head> tag found in ${filePath}`);
    }
  } else {
    // For local, just remove base tag (already done above)
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Removed base tag from ${filePath}`);
  }
}

const htmlFiles = [
  ...findHTMLFiles('./src'),
  './index.html'
].filter(file => fs.existsSync(file));

console.log(`Found ${htmlFiles.length} HTML files\n`);

htmlFiles.forEach(addBaseTag);

console.log('\n✨ Done!');
if (BASE_PATH === '/') {
  console.log('📝 Base tags removed for local development');
} else {
  console.log(`📝 Base tags set to: ${BASE_PATH}`);
  console.log('🚀 Ready for GitHub Pages deployment!');
}
