const fs = require("fs");
const path = require("path");

const directory = "out";

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(/\/_next/g, "./_next");
  fs.writeFileSync(filePath, content, "utf8");
};

const processDirectory = (dir) => {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else {
      replaceInFile(fullPath);
    }
  });
};

processDirectory(directory);
console.log("✅ Fixed `_next` paths in 'out' directory.");