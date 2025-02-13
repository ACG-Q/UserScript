// ==UserScript==
// @name         文件蜈蚣 显示今日激活码
// @namespace    showActiveCode
// @match        *://filecxx.com/zh_CN/activation_code.html*
// @grant        none
// @version      1.3
// @author       六记
// @description  显示今日有效的激活码，并提供复制功能
// @icon         https://filecxx.com/favicon.ico
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

(function () {
    "use strict";

    async function copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                console.log("复制成功");
            } else {
                const textarea = document.createElement("textarea");
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            return true;
        } catch (err) {
            console.error("复制失败：", err);
            return false;
        }
    }

    function showCustomAlert(message, success = true) {
        const alertBox = $("<div>")
            .css({
                position: "fixed",
                top: "20px",
                right: "20px",
                padding: "10px 20px",
                background: success ? "#44c767" : "#e74c3c",
                color: "#fff",
                "border-radius": "5px",
                "box-shadow": "0px 0px 10px rgba(0, 0, 0, 0.1)",
                "z-index": "1000",
            })
            .text(message);

        $("body").append(alertBox);

        setTimeout(() => {
            alertBox.fadeOut(() => {
                $(this).remove();
            });
        }, 3000);
    }

    function showLoading() {
        const loadingBox = $("<div>")
            .css({
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "10px 20px",
                background: "#000",
                color: "#fff",
                "border-radius": "5px",
                "box-shadow": "0px 0px 10px rgba(0, 0, 0, 0.5)",
                "z-index": "1050",
            })
            .text("加载中...");

        $("body").append(loadingBox);

        return loadingBox;
    }

    const loadingBox = showLoading();

    function hideLoading(loadingBox) {
        loadingBox.fadeOut(() => {
            loadingBox.remove();
        });
    }

    $(document).ready(async function () {
        const codeTimes = $("#code_list > div.code_time");
        const codeTexts = $("#code_list > div.code_text");

        codeTimes.each(function (i) {
            const startTime = $(this).text().split(" - ")[0];
            const endTime = $(this).text().split(" - ")[1];
            const startf = new Date(startTime) <= new Date();
            const endf = new Date(endTime) >= new Date();

            if (!startf || !endf) {
                $(this).hide();
                $(this).next(".code_text").hide();
                return;
            }

            const copyButton = $("<button>复制</button>")
                .css({
                    padding: "5px 10px",
                    "font-size": "14px",
                    color: "#fff",
                    background: "#007bff",
                    border: "none",
                    "border-radius": "5px",
                    cursor: "pointer",
                    "margin-left": "10px",
                    transition: "background 0.3s",
                })
                .hover(
                    function () {
                        $(this).css("background", "#0056b3");
                    },
                    function () {
                        $(this).css("background", "#007bff");
                    }
                )
                .click(async function () {
                    const button = $(this);
                    button.prop("disabled", true).text("复制中...");
                    const success = await copyToClipboard(codeTexts.eq(i).text());
                    if (success) {
                        showCustomAlert("激活码已复制到剪贴板！");
                    } else {
                        showCustomAlert("复制失败，请重试！", false);
                    }
                    button.prop("disabled", false).text("复制");
                });

            $(this).append(copyButton);
        });

        // 所有操作完成后隐藏加载提示
        hideLoading(loadingBox);
    });
})(jQuery);
