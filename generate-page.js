const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { resolve, dirname } = require('path');
const metadata = require('./metadata.json');
const ejs = require('ejs');

// 确保输出目录存在
const pageDir = resolve('page');
if (!existsSync(pageDir)) {
  mkdirSync(pageDir, { recursive: true });
}

const indexTemplate = readFileSync(resolve('page-template', 'index.ejs'), 'utf-8');
const detailTemplate = readFileSync(resolve('page-template', 'detail.ejs'), 'utf-8');

/**
 * 解析URL路径
 * @param {string} baseUrl - 基础URL
 * @param {string} filePath - 文件路径
 * @returns {string} 解析后的完整URL
 */
function urlResolve(baseUrl, filePath) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const cleanFilePath = filePath.replace(/^\//, '');
  return `${cleanBaseUrl}/${cleanFilePath}`;
}

/**
 * 将字符串转换为UUID
 * @param {string} str - 输入字符串
 * @returns {string} UUID格式的字符串
 */
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

/**
 * 渲染EJS模板
 * @param {string} template - EJS模板内容
 * @param {object} data - 模板数据
 * @returns {string} 渲染后的HTML内容
 */
const renderPage = (template, data) => {
  try {
    return ejs.render(template, data);
  } catch (error) {
    console.error('渲染页面时出错:', error);
    process.exit(1);
  }
};

/**
 * 预处理脚本数据
 * @param {array} metadata - 原始元数据
 * @returns {array} 处理后的脚本数据
 */
function processScripts(metadata) {
  const baseUrl = process.env.GITHUB_RAW_URL || '';
  
  return metadata.map((script) => ({
    ...script,
    // 生成统一格式的URL
    url: script.url || urlResolve(baseUrl, script.filePath),
    // 确保每个脚本都有唯一ID
    id: stringToUUID(script.id || script.name || script.filePath),
    // 使用默认图标或保留原始图标
    icon: script.icon || null,
    // 处理空的描述
    description: script.description || '暂无描述',
    // 添加处理日期
    processedAt: new Date().toISOString()
  }));
}

/**
 * 保存元数据到page目录供前端使用
 * @param {array} scripts - 处理后的脚本数据
 */
function saveMetadata(scripts) {
  const metadataPath = resolve('page', 'metadata.json');
  try {
    writeFileSync(metadataPath, JSON.stringify(scripts, null, 2), 'utf-8');
    console.log('元数据已保存到', metadataPath);
  } catch (error) {
    console.error('保存元数据时出错:', error);
    process.exit(1);
  }
}

try {
  console.log('开始生成页面...');
  
  // 预处理脚本数据
  const scripts = processScripts(metadata);
  
  // 保存元数据供前端JavaScript使用
  saveMetadata(scripts);
  
  // 生成首页
  const indexHtml = renderPage(indexTemplate, {
    scripts,
    // 提供一些统计数据给模板
    stats: {
      totalScripts: scripts.length,
      categories: [...new Set(scripts.map(s => s.category || '未分类'))].length
    }
  });
  
  writeFileSync(resolve('page', 'index.html'), indexHtml);
  console.log('首页已生成');
  
  // 生成通用的详情页模板（单页应用模式）
  const detailHtml = renderPage(detailTemplate, {
    // 详情页主要逻辑由JavaScript处理
    scriptsCount: scripts.length
  });
  
  writeFileSync(resolve('page', 'detail.html'), detailHtml);
  console.log('详情页模板已生成');
  
  // 复制必要的静态资源
  const staticFiles = [
    { src: resolve('page', 'style.css'), dest: resolve('page', 'style.css') },
    { src: resolve('page', 'script.js'), dest: resolve('page', 'script.js') }
  ];
  
  staticFiles.forEach(({ src, dest }) => {
    if (existsSync(src)) {
      writeFileSync(dest, readFileSync(src, 'utf-8'), 'utf-8');
      console.log('已复制静态资源:', dest);
    }
  });
  
  console.log('页面生成完成！');
  
} catch (error) {
  console.error('生成页面时出错:', error);
  process.exit(1);
}