// ==UserScript==
// @name         Kimi 选择性删除历史会话
// @namespace    
// @version      1.1
// @description  在 Kimi 聊天记录页面为每个会话添加单选框，并提供一个美观的删除按钮，实现选择性删除历史会话。
// @author       六记
// @match        https://kimi.ai/chat/*
// @icon         https://kimi.ai/favicon.ico
// ==/UserScript==

(function () {
    'use strict';

    /**
     *  添加单选框到历史会话
     */
    function addRadioButtonsToChatLinks() {
        const chatLinks = document.querySelectorAll('.history-chat');

        if (chatLinks.length === 0) {
            return;
        }

        chatLinks.forEach(link => {
            if (link.querySelector('.chat-select-radio')) return; // 防止重复添加

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'chat-select';
            radio.classList.add('chat-select-radio');

            // 创建标签（可选）
            const label = document.createElement('label');
            label.textContent = ' 选择';
            label.style.marginLeft = '5px';
            label.style.color = '#999';
            label.style.fontSize = '14px';

            const chatInfo = link.querySelector('.history-chat-info');
            if (chatInfo) {
                chatInfo.appendChild(radio);
                chatInfo.appendChild(label);

                // 阻止点击单选框时触发 a 标签的跳转
                radio.addEventListener('click', function (event) {
                    event.stopPropagation();
                });
            }
        });

        console.log("注入成功....")
    }

    /**
     * 删除选中的会话
     */
    async function deleteSelectedChats() {
        const selectedChat = document.querySelector('.chat-select-radio:checked');

        if (!selectedChat) {
            alert('⚠️ 请选择要删除的会话！');
            return;
        }

        const chatId = selectedChat.closest('.history-chat').getAttribute('href').split('/').pop();
        if (!chatId) {
            alert('❌ 未能获取会话 ID，删除失败！');
            return;
        }

        // 获取授权信息
        const authHeader = localStorage.getItem('access_token');
        if (!authHeader) {
            alert('⚠️ 无法获取授权信息，请确保已登录 Kimi');
            return;
        }

        const headers = {
            'accept': 'application/json, text/plain, */*',
            'authorization': `Bearer ${authHeader}`,
            'x-msh-platform': 'web',
            'x-language': 'zh-CN',
            'origin': 'https://kimi.ai',
            'referer': 'https://kimi.ai/chat/empty',
            'user-agent': navigator.userAgent,
            'dnt': '1'
        };

        // 删除请求
        try {
            const response = await fetch(`https://kimi.ai/api/chat/${chatId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                alert(`✅ 成功删除会话 ID: ${chatId}`);
                selectedChat.closest('.history-chat').remove();
            } else {
                alert(`❌ 删除失败，请重试！`);
            }
        } catch (error) {
            console.error('删除会话时发生错误:', error);
            alert('❌ 删除会话时出现问题，请检查网络或稍后再试。');
        }
    }

    /**
     * 创建并添加删除按钮
     */
    function createDeleteButton() {
        const existingButton = document.getElementById('delete-selected-chat-btn');
        if (existingButton) return; // 防止重复添加

        const button = document.createElement('button');
        button.id = 'delete-selected-chat-btn';
        button.textContent = '🗑️ 删除选中的会话';
        button.style.position = 'fixed';
        button.style.bottom = '30px'; // 增加底部间距
        button.style.right = '30px'; // 增加右侧间距
        button.style.background = 'linear-gradient(145deg, #ff4d4f, #d9363e)'; // 渐变背景
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '12px 18px';
        button.style.borderRadius = '12px';
        button.style.fontSize = '16px';
        button.style.fontWeight = 'bold';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        button.style.transition = 'background 0.3s ease, transform 0.2s ease';
        button.style.zIndex = '9999';
        button.style.display = 'none';

        button.onmouseover = () => {
            button.style.background = 'linear-gradient(145deg, #d9363e, #ff4d4f)';
            button.style.transform = 'scale(1.05)';
        };
        button.onmouseout = () => {
            button.style.background = 'linear-gradient(145deg, #ff4d4f, #d9363e)';
            button.style.transform = 'scale(1)';
        };

        button.addEventListener('click', deleteSelectedChats);
        document.body.appendChild(button);

        // 监听 history-modal-container 是否显示
        const observer = new MutationObserver(() => {
            const modals = document.getElementsByClassName("history-modal-container")
            if (modals && modals.length > 0 && getComputedStyle(modals[0]).display !== 'none') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * 页面加载时运行
     */
    function init() {
        addRadioButtonsToChatLinks();
        createDeleteButton();

        // 监听动态加载（适用于 AJAX 渲染）
        const observer = new MutationObserver(() => {
            addRadioButtonsToChatLinks();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // 延迟 1 秒初始化，确保页面加载完成
    setTimeout(init, 1000);
})();
