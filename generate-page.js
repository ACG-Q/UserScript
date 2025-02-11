const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const metadata = require('./metadata.json');
const ejs = require('ejs');

const template = readFileSync(resolve('page', 'index.ejs'), 'utf-8');

function urlResolve(baseUrl, filePath) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanFilePath = filePath.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanFilePath}`;
}

const renderPage = (metadata) => {
  try {
    const scripts = metadata.map((script) => ({
      name: script.name,
      description: script.description,
      author: script.author,
      version: script.version,
      downloadLink: urlResolve(process.env.GITHUB_RAW_URL || "", script.filePath),
    }));

    return ejs.render(template, { scripts });
  } catch (error) {
    console.error('Error rendering page:', error);
    process.exit(1);
  }
};

try {
  const indexHtml = renderPage(metadata);
  writeFileSync(resolve('page', 'index.html'), indexHtml);
  console.log('Index page generated');
} catch (error) {
  console.error('Error generating index page:', error);
  process.exit(1);
}