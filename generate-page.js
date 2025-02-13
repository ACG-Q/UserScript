const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');
const metadata = require('./metadata.json');
const ejs = require('ejs');

const indexTemplate = readFileSync(resolve('page-template', 'index.ejs'), 'utf-8');
const detailTemplate = readFileSync(resolve('page-template', 'detail.ejs'), 'utf-8');

function urlResolve(baseUrl, filePath) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanFilePath = filePath.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanFilePath}`;
}

function stringToUUID(str) {
  let hash = [...str].reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (hash + Math.random() * 16) % 16 | 0;
    hash = Math.floor(hash / 16);
    return c === 'x' ? r.toString(16) : (r & 0x3 | 0x8).toString(16);
  });
}

const renderPage = (template, data) => {
  try {
    return ejs.render(template, data);
  } catch (error) {
    console.error('Error rendering page:', error);
    process.exit(1);
  }
};

try {
  // 生成首页
  const scripts = metadata.map((script, index) => ({
    ...script,
    downloadLink: urlResolve(process.env.GITHUB_RAW_URL || "", script.filePath),
    icon: script.icon || null,
    id: stringToUUID(script.id)
  }));

  const indexHtml = renderPage(indexTemplate, { scripts });
  writeFileSync(resolve('page', 'index.html'), indexHtml);
  console.log('Index page generated');

  // 生成每个脚本的详情页
  scripts.forEach((script) => {
    const scriptContent = readFileSync(script.filePath, 'utf-8');
    const detailHtml = renderPage(detailTemplate, { script: { ...script, content: scriptContent } });
    writeFileSync(resolve('page', `detail-${script.id}.html`), detailHtml);
    console.log(`Detail page for script ${script.id} generated`);
  });
} catch (error) {
  console.error('Error generating pages:', error);
  process.exit(1);
}