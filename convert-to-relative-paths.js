const fs = require("fs");
const path = require("path");

function findHTMLFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findHTMLFiles(filePath, fileList);
    } else if (file.endsWith(".html")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function getRelativePath(fromFile, toPath) {
  // Get directory of the HTML file
  const fromDir = path.dirname(fromFile);
  
  // Convert to forward slashes for consistency
  const from = fromDir.replace(/\\/g, '/');
  
  // Calculate relative path from HTML file's directory to root
  const relativeParts = path.relative(from, '.').replace(/\\/g, '/');
  
  // If we're at root, no prefix needed
  if (!relativeParts || relativeParts === '.') {
    return toPath.substring(1); // Remove leading slash
  }
  
  // Build relative path
  return relativeParts + toPath;
}

function convertAbsoluteToRelative(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Find all absolute paths to /static/ and /src/
  const pathPatterns = [
    /(?:href|src)="(\/(?:static|src)[^"]*)"/g,
    /url\(&quot;(\/(?:static|src)[^"]*)&quot;\)/g,
  ];

  pathPatterns.forEach((pattern) => {
    content = content.replace(pattern, (match, absolutePath) => {
      const relativePath = getRelativePath(filePath, absolutePath);
      modified = true;
      
      // Preserve the original format (href/src or url())
      if (match.includes("url(")) {
        return `url(&quot;${relativePath}&quot;)`;
      } else if (match.includes('href=')) {
        return `href="${relativePath}"`;
      } else {
        return `src="${relativePath}"`;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Converted paths in ${filePath}`);
  } else {
    console.log(`⏭️  No absolute paths in ${filePath}`);
  }
}

// Find and convert all HTML files
const htmlFiles = [...findHTMLFiles("./src"), "./index.html"].filter((file) =>
  fs.existsSync(file)
);

console.log(`Found ${htmlFiles.length} HTML files\n`);

htmlFiles.forEach(convertAbsoluteToRelative);

console.log("\n✨ Done!");
console.log("📝 All absolute paths converted to relative paths");
console.log("🚀 Your site will now work on GitHub Pages without any build steps!");
