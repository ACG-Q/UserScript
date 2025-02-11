// ==UserScript==
// @name         Steam创意工坊mod下载工具
// @namespace
// @version      1.2
// @description  在创意工坊中注入一个MOD下载按钮，用于下载MOD，支持下载合集, API来源：https://steamworkshopdownloader.io/
// @author       六记(原:极品小猫)
// @include      https://steamcommunity.com/sharedfiles/filedetails/*
// @include      https://steamcommunity.com/id/*/myworkshopfiles/*
// @include      https://steamcommunity.com/workshop/filedetails/*
// @match        https://steamworkshopdownloader.io/*
// @connect      *.steamworkshopdownloader.io
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  "use strict";

  // 控制API链接
  let urls = [
    "https://backend-01-prd.steamworkshopdownloader.io/api/details/file",
    "https://backend-02-prd.steamworkshopdownloader.io/api/details/file",
    "https://backend-03-prd.steamworkshopdownloader.io/api/details/file",
  ];
  let getUUids = [
    "https://backend-01-prd.steamworkshopdownloader.io/api/download",
    "https://backend-02-prd.steamworkshopdownloader.io/api/download",
    "https://backend-03-prd.steamworkshopdownloader.io/api/download",
  ];
  let TIMEOUT = 60; // 秒
  let startMid = "",
    collectionName = "";
  let webHost = location.host,
    webPath = location.pathname;

  if (webHost == "steamcommunity.com") {
    if (webPath.search("myworkshopfiles") > -1) {
      document
        .querySelectorAll('[id^="Subscription"]')
        .forEach(function (e, i) {
          console.log(i, e, e.id);
          let mid = e.id.replace(/^[^\d]+/i, ""),
            actionsCtn = e.querySelector(".actionsCtn");

          let down_A = document.createElement("a");
          down_A.className = "download_Mod";
          down_A.target = "_blank";
          down_A.textContent = "下载 MOD";

          let down_span = document.createElement("span");
          down_span.className = "general_btn";
          down_span.style.width = "70px";
          down_span.appendChild(down_A);

          actionsCtn.appendChild(down_span);

          down_A.addEventListener("click", function () {
            ModDownloadAjax(mid);
          });
        });
    } else {
      //workshop详细页
      let down_A = document.createElement("a");
      //down_A.href="https://t.vvwall.com/#"+publishedfileid;
      down_A.id = "download_Mod";
      down_A.target = "_blank";
      down_A.textContent = "下载 MOD";
      let down_span = document.createElement("span");
      down_span.className = "general_btn share tooltip";
      down_span.id = "download_ModBtn";
      down_span.appendChild(down_A);

      document.querySelector("#ItemControls").appendChild(down_span);
      document
        .querySelector("#download_ModBtn")
        .addEventListener("click", function () {
          startMid = publishedfileid;
          ModDownloadAjax(publishedfileid);
        });
    }

    // https://backend-01-prd.steamworkshopdownloader.io/api/details/file
    // POST []
    function ModDownloadAjax(mid, url, isCollection) {
      isCollection = isCollection ? isCollection : true;
      url = url ? url : urls[0];
      GM_xmlhttpRequest({
        url: url,
        method: "post",
        data: `[${mid}]`,
        responseType: "json",
        onload: function (e) {
          console.log(e);
          if (!e.response) {
            console.log(`获取MOD失败 启动最后的手段`);
            endModDown(
              startMid,
              `[workshop-${startMid}]${collectionName ? collectionName : ""}.zip`,
            );
            return;
          }
          let data = e.response[0],
            downloadTitle = `[workshop-${mid}]${data.title}.zip`;
          // 是否为合集
          if (data.children && isCollection) {
            collectionName = data.title;
            data.children.map((items) => {
              let mid = items.publishedfileid;
              ModDownloadAjax({ mid: mid, isCollection: false });
            });
          } else if (data.file_url) {
            GM_download({
              url: data.file_url,
              name: downloadTitle,
              saveAs: true,
              timeout: TIMEOUT * 1000,
              ontimeout: function () {
                console.log(`超时...`);
                // 将文件名设置到系统剪贴板
                GM_setClipboard(downloadTitle);
                console.log("复制完成, 打开下载链接");
                // 打开下载链接
                window.open(data.file_url);
              },
            });
          } else {
            let nextUrlIndex = urls.indexOf(url) + 1;
            if (nextUrlIndex < urls.length) {
              console.log(
                `${url} --> 获取MOD失败 正在切换至 ${urls[nextUrlIndex]} 进行尝试`,
              );
              ModDownloadAjax(mid, urls[nextUrlIndex]);
            } else {
              console.log(`${url} --> 获取MOD失败 启动最后的手段`);
              endModDown(mid, downloadTitle);
            }
          }
        },
        onerror: function (e) {
          console.error("error", e);
        },
      });
    }

    function endModDown(mid, downloadTitle, url) {
      let data = `{"publishedFileId":${mid},"collectionId":null,"extract":false,"hidden":false,"direct":false,"autodownload":false}`;
      url = url ? url : getUUids[0];
      GM_xmlhttpRequest({
        url: `${url}/request`,
        method: "post",
        data: data,
        responseType: "json",
        onload: function (e) {
          console.log(e);
          if (!e.response) {
            alert(`获取UUID失败`);
            return;
          }
          console.log(
            `获取UUID成功\nmid: ${mid}\nuuid: ${e.response.uuid}\ntitle: ${downloadTitle}`,
          );
          if (e.response.uuid) {
            console.log(`${url}/transmit?uuid=${e.response.uuid}`);
            GM_download({
              url: `${url}/transmit?uuid=${e.response.uuid}`,
              name: downloadTitle,
              saveAs: true,
              timeout: TIMEOUT * 1000,
              ontimeout: function () {
                console.log(`超时...`);
                // 将文件名设置到系统剪贴板
                GM_setClipboard(downloadTitle);
                console.log("复制完成, 打开下载链接");
                // 打开下载链接
                window.open(`${url}/transmit?uuid=${e.response.uuid}`);
              },
            });
          } else {
            let nextUrlIndex = getUUids.indexOf(url) + 1;
            if (nextUrlIndex < getUUids.length) {
              console.log(
                `${url} --> 获取UUID失败 正在切换至 ${getUUids[nextUrlIndex]} 进行尝试`,
              );
              ModDownloadAjax(mid, downloadTitle, getUUids[nextUrlIndex]);
            } else {
              alert(`${url} --> 获取UUID失败 ==> 下载MOD失败`);
            }
          }
        },
        onerror: function (e) {
          console.error("error", e);
        },
      });
    }
  }
})();
