const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const metadata = require('./metadata.json');

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
 * 预处理脚本数据，生成适合第三方访问的格式
 * @param {array} metadata - 原始元数据
 * @returns {array} 处理后的脚本数据
 */
function processThirdPartyData(metadata) {
  const baseUrl = process.env.GITHUB_RAW_URL || '';
  
  return metadata.map((script) => ({
    // 基础信息
    id: stringToUUID(script.id || script.name || script.filePath),
    name: script.name || '未命名脚本',
    description: script.description || '暂无描述',
    // 作者信息
    author: script.author || '未知',
    version: script.version || '1.0.0',
    // 链接信息
    url: script.url || urlResolve(baseUrl, script.filePath),
    downloadUrl: script.url || urlResolve(baseUrl, script.filePath),
    homepage: script.homepage || null,
    // 分类与标签
    category: script.category || '未分类',
    tags: script.tags || [],
    // 时间信息
    createdAt: script.created || new Date().toISOString(),
    updatedAt: script.updated || new Date().toISOString(),
    // 兼容性信息
    matches: script.matches || [],
    // 其他信息
    icon: script.icon || null,
    license: script.license || 'MIT'
  }));
}

/**
 * 保存第三方数据
 * @param {array} data - 处理后的第三方数据
 * @param {string} outputPath - 输出路径
 */
function saveThirdPartyData(data, outputPath) {
  try {
    // 确保输出目录存在
    const outputDir = resolve(outputPath, '..');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log('第三方数据已保存到:', outputPath);
  } catch (error) {
    console.error('保存第三方数据时出错:', error);
    process.exit(1);
  }
}

try {
  console.log('开始生成第三方访问数据...');
  
  // 预处理数据
  const thirdPartyData = processThirdPartyData(metadata);
  
  // 保存数据到文件
  const outputPath = resolve('page', 'thirdparty-scripts.json');
  saveThirdPartyData(thirdPartyData, outputPath);
  
  // 同时保存一份到根目录，方便直接访问
  saveThirdPartyData(thirdPartyData, resolve('thirdparty-scripts.json'));
  
  console.log('第三方访问数据生成完成！');
  
} catch (error) {
  console.error('生成第三方访问数据时出错:', error);
  process.exit(1);
}