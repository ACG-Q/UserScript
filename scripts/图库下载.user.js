// ==UserScript==
// @name        IC千库网, 去登陆弹窗, 添加免VIP下载按钮, GIF图为无水印图
// @namespace   Violentmonkey Scripts
// @match       https://588ku.com/*
// @match       https://www.58pic.com/*
// @grant       none
// @version     1.1
// @author      六记
// @grant       GM_download
// @description 2021/9/11 下午8:21:16
// ==/UserScript==
(() => {
  const mountNode = (btns, newBtn) => {
    return new Promise((resolve, reject) => {
      if (!btns || btns.length === 0) {
        reject();
      } else {
        btns.forEach((btn) => {
          let childNodes = btn.childNodes;
          childNodes.forEach((node) => {
            console.log(node);
            btn.removeChild(node);
          });
          btn.appendChild(newBtn);
        });
        resolve();
      }
    });
  };

  const getSuffix = (string) => {
    let suffix = string.split(".");
    suffix = suffix[suffix.length - 1];
    // 解决古怪的后缀
    if (suffix.indexOf("!")) {
      // img!adasd
      suffix = string.split("!");
      suffix = suffix[0];
    }

    return suffix;
  };

  let host = window.location.host;
  let loginFrames = "";
  let btns = [];
  let inputBtn = document.createElement("a");
  inputBtn.innerText = "免VIP下载图片";
  if (host.match(/588ku/i)) {
    // 登录弹窗
    loginFrames = document.querySelectorAll(".down-limit");
    inputBtn.className = "fl Btn down-btn down-png";
    inputBtn.onclick = () => {
      let img = document.querySelector(".scaleImg");
      let imgSrc = img.src;
      let imgSuffix = getSuffix(imgSrc);
      let imgTitle = img.title;
      GM_download({
        url: imgSrc,
        name: `${imgTitle}.${imgSuffix}`,
        onload: (data) => {
          console.log(data);
          console.log(`成功下载${imgTitle}.${imgSuffix}`);
        },
        onerror: (err) => {
          console.log(err);
          console.log(`下载${imgTitle}.${imgSuffix}失败`);
        },
      });
    };
    btns = document.querySelectorAll(".clearfix .btns-box");
  } else if (host.match(/58pic/i)) {
    // 登录弹窗
    loginFrames = document.querySelectorAll(".login-model");
    inputBtn.className = "detailBtn-down download-page qtw-show-btn fl";
    inputBtn.onclick = () => {
      let img = document.querySelectorAll(".show-area-pic.loading_space_img");
      img = img[img.length - 1];
      let imgSrc = img.src;
      let imgSuffix = getSuffix(imgSrc);
      let imgTitle = img.title;
      GM_download({
        url: imgSrc,
        name: `${imgTitle}.${imgSuffix}`,
        onload: (data) => {
          console.log(data);
          console.log(`成功下载${imgTitle}.${imgSuffix}`);
        },
        onerror: (err) => {
          console.log(err);
          console.log(`下载${imgTitle}.${imgSuffix}失败`);
        },
      });
    };
    btns = document.querySelectorAll(".show-download-row");
  }
  // 去登录弹窗
  if (loginFrames) loginFrames.forEach((frame) => frame.remove());
  // 挂载按钮
  mountNode(btns, inputBtn)
    .then(() => {
      console.log("成功挂载按钮到[" + host + "]网页");
    })
    .catch(() => {
      console.log("挂载按钮失败");
    });
})();
