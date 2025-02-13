// ==UserScript==
// @icon         https://p1-tt.byteimg.com/origin/novel-static/a3621391ca2e537045168afda6722ee9
// @name         番茄免费小说 - 允许复制以及字体解密
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  解密番茄免费小说的字体
// @author       六记
// @match        https://fanqienovel.com/reader/*
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @resource     charset https://github.com/ying-ck/fanqienovel-downloader/raw/refs/heads/main/src/charset.json
// ==/UserScript==

(function() {
  'use strict';

  // 取消禁止选中
  const noSelectElements = document.querySelectorAll('.noselect');
  noSelectElements.forEach((element) => {
    element.classList.remove('noselect');
  });

  // 创建并初始化字符映射表
  let charset = GM_getValue('charset');

  if (!charset) {
    const charsetResource = GM_getResourceText('charset');
    charset = JSON.parse(charsetResource);
    GM_setValue('charset', charset);
  }

  // 解密内容函数
  function decryptContent(content, debug = false) {
    let result = '';

    for (const char of content) {
      const uni = char.charCodeAt(0);
      const hexUni = `0x${uni.toString(16).toUpperCase()}`;
      let decryptedChar = char;

      const codeRanges = [
        [58344, 58715],
        [58345, 58716],
      ];

      for (let mode = 0; mode < codeRanges.length; mode++) {
        const [start, end] = codeRanges[mode];
        if (uni >= start && uni <= end) {
          const bias = uni - start;
          if (bias >= 0 && bias < charset[mode].length && charset[mode][bias] !== '?') {
            decryptedChar = charset[mode][bias];
            if (debug) console.log(`解密字符：${char} (${hexUni}) -> ${charset[mode][bias]} - ${mode} - ${bias}`);
            break;
          } else if (debug) {
            console.log(`未找到映射：${char} (${hexUni})`);
          }
        }
      }

      result += decryptedChar;
    }

    return result;
  }

  // 更新页面内容
  const paragraphElements = document.querySelectorAll('.muye-reader-content p');
  paragraphElements.forEach((pElement) => {
    const originalContent = pElement.textContent;
    const decryptedContent = decryptContent(originalContent, false);

    // 更新内容
    pElement.textContent = decryptedContent;
  });

  console.log('内容已解密');
})();
