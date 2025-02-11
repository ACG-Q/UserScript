const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const metadata = require('./metadata.json');

const template = readFileSync(resolve('page', 'index.ejs'), 'utf-8');

const renderPage = (metadata) => {
  const scripts = metadata.map((script) => ({
    name: script.name,
    description: script.description,
    author: script.author,
    version: script.version,
    downloadLink: `${script.filePath}`,
  }));

  return ejs.render(template, { scripts });
};

const indexHtml = renderPage(metadata);
writeFileSync(resolve('page', 'index.html'), indexHtml);
console.log('Index page generated');