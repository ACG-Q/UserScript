// ==UserScript==
// @name        IC千库网, 去登陆弹窗, 添加免VIP下载按钮, GIF图为无水印图
// @namespace   Violentmonkey Scripts
// @match       https://588ku.com/*
// @grant       none
// @version     1.0
// @author      六记
// @grant       GM_download
// @description 2021/9/11 下午8:21:16
// ==/UserScript==
(() => {
    // 去登录弹窗
    let loginFrames = document.querySelectorAll('.down-limit');
    loginFrames.forEach(frame => {
        frame.remove()
    })
    // 添加下载按钮
    console.log("挂载按钮")
    let btns = document.querySelectorAll('.clearfix .btns-box');
    if (btns.length >= 1) {
        let inputBtn = document.createElement('a');
        inputBtn.innerText = "免VIP下载";
        inputBtn.className = "fl Btn down-btn down-png";
        inputBtn.onclick = () => {
            let img = document.querySelector('.scaleImg');
            let imgSrc = img.src;
            let imgSuffix = imgSrc.split('.');
            imgSuffix = imgSuffix[imgSuffix.length - 1]
            let imgTitle = img.title;
            GM_download({
                url: imgSrc,
                name: `${imgTitle}.${imgSuffix}`,
                onload: (data) => {
                    console.log(data)
                    console.log(`成功下载${imgTitle}.${imgSuffix}`)
                }
            })
        }
        btns.forEach(btn => {
            btn.childNodes.forEach(node => {
                console.log(node)
                btn.removeChild(node)
            })
            btn.appendChild(inputBtn)
        })
        console.log("挂载按钮成功")
    } else {
        console.log("挂载按钮失败")
    }

})();