// ==UserScript==
// @name         Discuz 论坛快捷评论脚本
// @namespace    Violentmonkey Scripts
// @version      1.4.1
// @author       六记
// @description  Discuz 论坛快捷评论脚本，支持一键获取随机一言、彩虹屁和肯德基疯狂星期四语句，优化 UI 和请求逻辑。
// @match        http://www.pcmoe.net/thread-*.html
// @match        https://www.52pojie.cn/thread-*.html
// @match        https://forum.h3dhub.com/thread-*.html
// @match        http://www.pcmoe.net/forum.php*
// @match        http://www.9damaogames.com/forum.php*
// @match        https://laowang.vip/forum.php*
// @match        http://www.9damaogames.com/thread-*.html
// @icon         data:image/webp;base64,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
// @license      MIT
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // 通用请求函数
  function fetchQuote(url, callback) {
    fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    })
      .then((response) => response.json())
      .then((data) => callback(data))
      .catch((error) => {
        console.error(`${url} 请求失败:`, error);
      });
  }

  // 获取随机一言评论
  function fetchHitokoto() {
    fetchQuote("https://v1.hitokoto.cn/", (data) => {
      updateTextarea(`${data.hitokoto} —— ${data.from}`);
    });
  }

  // 获取随机彩虹屁评论
  function fetchChp() {
    fetchQuote("https://api.shadiao.pro/chp", (data) => {
      updateTextarea(data.data.text);
    });
  }

  // 获取肯德基疯狂星期四评论
  function fetchKfc() {
    fetchQuote("https://api.shadiao.pro/kfc", (data) => {
      updateTextarea(data.data.text);
    });
  }

  // 更新文本区域内容
  function updateTextarea(text) {
    const textarea =
      document.querySelector(
        "#fastposteditor .area textarea, .mtm.mbm.pnpost textarea",
      ) ||
      document.querySelector("iframe")?.contentDocument?.querySelector("body");
    if (textarea) {
      textarea.value = text;
      textarea.innerText = text;
    }
  }

  // 创建按钮并添加到页面
  function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "random-quote-button";
    button.onclick = onClick;
    return button;
  }

  // 设置按钮样式
  function addStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
      .random-quote-button {
        margin: 5px;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        background-color: #4CAF50;
        color: white;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s ease;
      }
      .random-quote-button:hover {
        background-color: #45a049;
      }
    `;
    document.head.appendChild(style);
  }

  // 设置随机语句按钮
  function setupRandomQuoteButton() {
    const area = document.querySelector(
      "#fastposteditor .area, .mtm.mbm.pnpost",
    );
    if (!area) return;

    addStyles(); // 添加按钮样式

    const hitokotoButton = createButton("获取随机一言评论", fetchHitokoto);
    area.appendChild(hitokotoButton);

    const chpButton = createButton("获取随机彩虹屁评论", fetchChp);
    area.appendChild(chpButton);

    const kfcButton = createButton("获取肯德基疯狂星期四评论", fetchKfc);
    area.appendChild(kfcButton);
  }

  setupRandomQuoteButton();
})();
