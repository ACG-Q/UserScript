const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const scriptsDir = 'scripts';
const metadataFile = 'metadata.json';

const extractMetadata = (filePath) => {
  try {
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
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    return null;
  }
};

const generateMetadata = () => {
  try {
    const files = readdirSync(scriptsDir)
      .filter((file) => file.endsWith('.user.js'))
      .map((file) => join(scriptsDir, file));

    const metadata = files.map(extractMetadata).filter(Boolean);
    const jsonString = JSON.stringify(metadata, null, 2);

    writeFileSync(metadataFile, jsonString);
    console.log(`Metadata saved to ${metadataFile}`);
  } catch (error) {
    console.error('Error generating metadata:', error);
    process.exit(1);
  }
};

generateMetadata();