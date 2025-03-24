// ==UserScript==
// @name         Kimi 选择性删除历史会话
// @namespace
// @version      1.3
// @description  在 Kimi 聊天记录页面为每个会话添加单选框，并提供一个美观的删除按钮，实现选择性删除历史会话。
// @author       六记
// @match        https://kimi.ai/*
// @match        https://kimi.ai/chat/*
// @match        https://kimi.moonshot.cn/*
// @match        https://kimi.moonshot.cn/chat/*
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABhCAYAAAApxKSdAAAACXBIWXMAACE4AAAhOAFFljFgAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAUUSURBVHgB7Z29bhtHFIWPHQN2J7lKqnhYpYvpIukCbJEAKQJEegLReYFIT0DrCSI9QEDqCSIDaQIEIOukiJwyza5SJWlId3FFz+HuGmuSSw6p+dlZ3g84luhdUeI9M3fmziyXgBCUe/DHYY0Wj/tgWmjV42zFcWe4MIBBPNJ6qqW0uvAbXFvQgKzQK62bQhkaCIPc10q1Zi3XH1o/IG9cwUm0RogrgDY1KmLgHYX9DvyiBvDYI77XmiD+oLlQHw7hIDoCMBOt1U9w0BsU9mOAtaUUFk3oQoIfzAQFCf5dNMEdTFCQ4NtQih1NSIGgf3ibxOJt5UrAB1gNK72vIdjiI61HWr+YnNxDXK0rJiULsV65GJeiIescLSTTeobKSutiCuojX8kU3MBx4I3WeNVBBRl4fWiCyoB8v2JAAkk9PmDwT8sH1TEghRjgC27scCx41wO43KAg+ILxTvhNaUACwTc04Z0B30LwzTzm5Rjw3sgseIG1wGMawMBPIOQcqvzrNIMHOg9Q5KK953O90/rFC+BhJRH8PQZ+fu7SjC7HAIV95yu99vjlxfvBJx8nwHd6IfNJAkccOjHg6OgIs9lsra6vr2GTNE03/k7q8HAhyJ/2gM9O65/4kT7/mwEcoZwYsPQiV3BwcABb9Ho9KKU2njccDjGdLlxx+InBBPBAAR86ydRPaIC9SASi3+8bnXd+fr78nw8NJ39uDJjXAVFPP7dp/VmWLR9g6w6Huo/IOTk5MTpvZesn/93AiP/dXCwd9SyILT9Jko3n1bZ+8s8rGPGvoVHbEXcPMM39V1dX9Qd/19PPNxta959D4HUGF0RrAFs/8/8mxuPxXLUwtfx2WX+cxdivZ3DFA0SKldZPuPTAKrikbOlMOX+9zFu/Q2iAQoSY5H7mfeb/tXCT8MdneU9wNNCuQUXZA0ynnrUznyqOcrspUY4BJunHqPU3gOgMsNr6G0B0BpgUXrG0fhKVAaaF1/HxMWIhKgNMcj9Tz82Nk6rVGdav/tJ5eraJ0Wi01XPq1r/xOS8uLkJc6XYnRTMNXdf62eIvLy+jyftVghnQ7Xahe8FW59fBTRYOzosDNI1hJdz0lBQkBflkMBjMU5iL13pXRb8fYAJrB/a2db0oFHthAOEUliaYFHE+aaUBdZsvvFhApyM0idYZwOCvW4JmIWdSzPmidQaYrAGZ7iX4oFUGnJ2dGdUCTRqMozeANQCLsE6nA10JG/0Mx4KmDMbBCjEWR2yxu8LAM98vXelmCA2ovVLCI8EMYODWbpbvCXtTBzQVMSAwYkBgxIDAtNKAXWdGIRADAiMpKDA0IIMQikx6QGDEgMCIAYGRMSAsMgaEhgbcQgjFa+kBYZnIGBCWWzEgLPNBOJ6Fk/aR8Y5ZCvktKwX/PJZ7xoVjfs+4chYU11tK2sE85qUBLyH4Zh5z6QHhGPOf6r2j+TEbcgdFP2RaHX5TrYQlDflj5RXE5Q1cG/lWnhYpReUGKdUewGnRmhvnCJbgmxey8sHiZ8iwF3AsUBBckKHI/SWLq6HsBc8huML4DiK80D6WnBqLzN68UFCmopheYJOVYgcU5FOVbAVfYUcUZGoaLPglCtITdg2+tZUFBTFh2+ArWEYh/7z0WIIQSiM43lt5AWAmWhLHylN4QmkNEXfAbGqEQKsHSfHLYwiSq8AnaAAKeaW3D8VbijwNW5nh3IN9FPI/jnpaPKZi2/SfFuJu4W3x9RqWL+N5C+7ruKpBAgLkAAAAAElFTkSuQmCC
// ==/UserScript==

(function () {
    'use strict';
    // 当前域名
    const host = location.host

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
            radio.title = '选择想要删除的对话';
            radio.type = 'checkbox';
            radio.name = 'chat-select';
            radio.classList.add('chat-select-radio');

            const chatInfo = link.querySelector('.history-chat-info');
            if (chatInfo) {
                chatInfo.appendChild(radio);

                // 阻止点击单选框时触发 a 标签的跳转
                radio.addEventListener('click', function (event) {
                    event.stopPropagation();
                });
            }
        });
    }

    /**
     * 删除选中的会话
     */
    async function deleteSelectedChats() {
        const selectedChats = document.querySelectorAll('.chat-select-radio:checked');

        if (!selectedChats || selectedChats.length === 0) {
            alert('⚠️ 请选择要删除的会话！');
            return;
        }

        const chatIds = Array.from(selectedChats).map(selectedChat =>
            selectedChat.closest('.history-chat').getAttribute('href').split('/').pop()
        );

        if (!chatIds || chatIds.length === 0) {
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
            'origin': `https://${host}`,
            'referer': `https://${host}/chat/empty`,
            'user-agent': navigator.userAgent,
            'dnt': '1'
        };

        const createDeleteFetch = async (chatId, selectedChat) => {
            try {
                const response = await fetch(`https://${host}/api/chat/${chatId}`, {
                    method: 'DELETE',
                    headers: headers
                });

                if (response.ok) {
                    console.log(`✅ 成功删除会话 ID: ${chatId}`);
                    selectedChat.closest('.history-chat').remove();
                } else {
                    console.error(`❌ 删除失败，请重试！`);
                }
            } catch (error) {
                console.error('删除会话时发生错误:', error);
                // console.error('❌ 删除会话时出现问题，请检查网络或稍后再试。');
                throw error;
            }
        }

        const deletePromises = chatIds.map(chatId => {
            const selectedChat = Array.from(selectedChats).find(selectedChat =>
                selectedChat.closest('.history-chat').getAttribute('href').split('/').pop() === chatId
            );
            return createDeleteFetch(chatId, selectedChat);
        });

        // 等待所有删除操作完成
        await Promise.all(deletePromises).then(()=>alert(`✅ 成功删除会话 IDs: ${chatIds.join(", ")}`));
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
