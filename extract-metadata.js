const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const scriptsDir = 'scripts';
const metadataFile = 'metadata.json';

const extractMetadata = (filePath) => {
  const scriptId = filePath.replace('scripts/', '').replace('.user.js', '');
  const content = readFileSync(filePath, 'utf-8');
  const metadata = {};
  const metaRegex = /^\/\/ @(\w+)(?:\s+(.+))?$/gm;

  let match;
  while ((match = metaRegex.exec(content)) !== null) {
    const key = match[1].trim();
    const value = match[2] ? match[2].trim() : '';
    metadata[key] = value;
  }

  

  return {
    ...metadata,
    id: scriptId,
    filePath: filePath.replace(`${scriptsDir}/`, ''),
  };
};

const generateMetadata = () => {
  const files = readdirSync(scriptsDir)
    .filter((file) => file.endsWith('.user.js'))
    .map((file) => join(scriptsDir, file));

  const metadata = files.map(extractMetadata);
  const jsonString = JSON.stringify(metadata, null, 2);

  writeFileSync(metadataFile, jsonString);
  console.log(`Metadata saved to ${metadataFile}`);
};

generateMetadata();