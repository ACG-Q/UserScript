const { readdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const SCRIPTS_DIR = 'scripts'; // Userscripts directory
const METADATA_FILE = 'metadata.json'; // Metadata output file

/**
 * Extract metadata from a userscript file.
 * @param {string} filePath - Path to the userscript file
 * @returns {object|null} - Extracted metadata or null if an error occurs
 */
const extractMetadata = (filePath) => {
  try {
    // Normalize file path
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const content = readFileSync(normalizedFilePath, 'utf-8'); // Read file content

    // Extract metadata block
    const metaBlockRegex = /\/\/ ==UserScript==\s*(.*?)\s*\/\/ ==\/UserScript==/s;
    const match = metaBlockRegex.exec(content);
    if (!match) {
      console.error(`No metadata block found in file ${filePath}.`);
      return null;
    }

    const metadataText = match[1].trim();
    const metadataLines = metadataText.split('\n'); // Split into lines

    const metadata = {};

    metadataLines.forEach((line) => {
      const trimmedLine = line.trim(); // Trim whitespace

      if (!trimmedLine.startsWith('// @')) return; // Skip non-metadata lines

      // Extract key and value
      const metaLineRegex = /^\/\/ @([\w:]+)(?:\s*([^\s]+(?:\s+[^\s]+)*))?$/;
      const keyMatch = metaLineRegex.exec(trimmedLine);
      if (keyMatch) {
        let key = keyMatch[1].trim();
        let value = keyMatch[2] ? keyMatch[2].trim() : '';

        // Handle internationalization (e.g., @name:de)
        if (key.includes(':')) {
          const parts = key.split(':');
          key = parts[0];
          const locale = parts[1];

          if (!metadata[key]) metadata[key] = {}; // Initialize locale object

          metadata[key][locale] = value; // Save localized metadata
        } else {
          // Handle regular keys with multiple values
          if (metadata[key]) {
            if (typeof metadata[key] === 'string') metadata[key] = [metadata[key]]; // Convert to array
            metadata[key].push(value); // Append new value
          } else {
            metadata[key] = value; // Set initial value
          }
        }
      }
    });

    return {
      ...metadata,
      id: normalizedFilePath.replace('.user.js', ''), // Script ID
      filePath: normalizedFilePath, // File path
    };
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error);
    return null;
  }
};

/**
 * Generate metadata for all userscripts in the scripts directory.
 */
const generateMetadata = () => {
  try {
    const scriptFiles = readdirSync(SCRIPTS_DIR)
      .filter((file) => file.endsWith('.user.js'))
      .map((file) => join(SCRIPTS_DIR, file)); // Get all .user.js files

    const metadataList = scriptFiles
      .map((file) => extractMetadata(file)) // Extract metadata
      .filter((metadata) => metadata !== null); // Filter out nulls

    writeFileSync(METADATA_FILE, JSON.stringify(metadataList, null, 2)); // Save metadata

    console.log(`Metadata saved to ${METADATA_FILE}`);
  } catch (error) {
    console.error('Error generating metadata:', error);
    process.exit(1);
  }
};

// Run metadata generation
generateMetadata();