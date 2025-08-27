// ==UserScript==
// @name         在线题库（本地JSON版）
// @match        https://exam.xxx.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @version      1.0
// @author       -
// @description  2025-08-27 在线题库（本地JSON版）- 无需后端服务器
// ==/UserScript==

(function () {
  // 配置项 - 从存储中加载或使用默认值
  const CONFIG = {
    qSelector: GM_getValue('qSelector', '.topic-main'),
    oSelector: GM_getValue('oSelector', '.answer-show > .answer-item'),
    interval: GM_getValue('interval', 1500),
    retryTimes: GM_getValue('retryTimes', 3),
    timeout: GM_getValue('timeout', 5000),
    autoAnswer: GM_getValue('autoAnswer', true),
    showStatus: GM_getValue('showStatus', true),
    // 本地JSON文件的相对路径
    localJsonPath: GM_getValue('localJsonPath', 'https://github.com/ACG-Q/UserScript/raw/refs/heads/main/questions.json')
  };

  // 状态变量
  let status = '就绪';
  let lastAnswer = '';
  let retryCount = 0;
  let questionBank = [];

  /* ====== 工具函数 ====== */
  // 获取题目信息
  function getQuestion() {
    const title = document.querySelector(CONFIG.qSelector)?.innerText.trim();
    if (!title) return null;

    const opts = [...document.querySelectorAll(CONFIG.oSelector)].map((e) =>
      e.innerText.trim()
    );

    // 识别题目类型 (单选、多选、判断等)
    let type = 'single'; // 默认单选
    if (title.includes('下列选项中') && title.includes('正确的是')) {
      type = 'single';
    } else if (title.includes('下列选项中') && title.includes('正确的有')) {
      type = 'multiple';
    } else if (title.includes('是否')) {
      type = 'judgment';
    }

    return { title, opts, type };
  }

  // 缓存管理
  const cache = {
    data: new Map(),
    maxSize: 100,

    set(key, value) {
      if (this.data.size >= this.maxSize) {
        // 删除最早添加的缓存项
        const firstKey = this.data.keys().next().value;
        this.data.delete(firstKey);
      }
      this.data.set(key, { value, timestamp: Date.now() });
    },

    get(key) {
      const item = this.data.get(key);
      if (item) {
        // 缓存有效时间为1小时
        if (Date.now() - item.timestamp < 3600000) {
          return item.value;
        } else {
          this.data.delete(key);
        }
      }
      return null;
    },

    has(key) {
      return this.get(key) !== null;
    }
  };

  // 日志记录函数
  function log(message, type = 'info') {
    const types = {
      info: 'color: #2196F3;',
      success: 'color: #4CAF50;',
      error: 'color: #F44336;',
      warning: 'color: #FF9800;'
    };
    console.log(`%c[题库脚本] ${message}`, types[type] || types.info);
  }

  // 加载本地JSON题库
  async function loadQuestionBank() {
    try {
      // 由于浏览器安全限制，我们需要使用fetch来请求本地文件
      // 注意：这需要在支持本地文件访问的环境中运行，或者将JSON文件放在web服务器上
      const response = await fetch(CONFIG.localJsonPath);
      if (!response.ok) {
        throw new Error(`无法加载题库文件: ${response.status}`);
      }
      questionBank = await response.json();
      log(`成功加载 ${questionBank.length} 道题目`, 'success');
      return true;
    } catch (error) {
      log(`加载题库失败: ${error.message}`, 'error');
      // 如果无法通过fetch加载，尝试使用内置的备用题库
      try {
        // 这里可以放一些备用的题目数据作为fallback
        questionBank = [];
        log('使用空题库', 'warning');
      } catch (e) {
        log('无法初始化题库', 'error');
      }
      return false;
    }
  }

  // 本地查询答案
  function queryLocalAnswer(title) {
    if (!title || questionBank.length === 0) {
      return null;
    }

    // 尝试精确匹配题目
    let foundQuestion = questionBank.find(q => 
      q.title && q.title.trim() === title.trim()
    );

    // 如果精确匹配失败，尝试模糊匹配
    if (!foundQuestion) {
      foundQuestion = questionBank.find(q => 
        q.title && q.title.includes(title)
      );
    }

    // 如果还是没找到，尝试反向模糊匹配
    if (!foundQuestion) {
      foundQuestion = questionBank.find(q => 
        title.includes(q.title)
      );
    }

    if (foundQuestion && foundQuestion.answer) {
      // 清理答案中的特殊字符
      let answer = foundQuestion.answer.replace(/[*]+/g, '').trim();
      // 提取字母答案（A,B,C,D等）
      const letterMatch = answer.match(/[A-Za-z,]+/);
      if (letterMatch) {
        answer = letterMatch[0];
      }
      return answer;
    }

    return null;
  }

  /* ====== 自动答题 ====== */
  // 选择答案 - 支持不同题型
  function choose(ansText, type = 'single') {
    if (!ansText) return false;

    const options = [...document.querySelectorAll(CONFIG.oSelector)];
    if (options.length === 0) {
      log('未找到选项元素', 'warning');
      return false;
    }

    let success = false;
    const answers = type === 'multiple' ? ansText.split(',').map(a => a.trim()) : [ansText];

    answers.forEach(ans => {
      // 尝试精确匹配选项文本
      let opt = options.find(e => e.innerText.trim() === ans);

      // 如果精确匹配失败，尝试部分匹配
      if (!opt) {
        opt = options.find(e => e.innerText.includes(ans));
      }

      // 如果是字母选项，尝试匹配选项前缀 (如 "A. 选项内容")
      if (!opt && /^[A-Za-z]$/.test(ans)) {
        opt = options.find(e => e.innerText.trim().startsWith(ans.toUpperCase()));
      }

      if (opt) {
        opt.click();
        success = true;
        log(`已选择答案: ${ans}`, 'success');
      }
    });

    if (!success) {
      log(`未找到匹配的选项: ${ansText}`, 'warning');
    }
    return success;
  }

  // 自动运行主函数
  async function autoRun() {
    try {
      const question = getQuestion();
      if (!question || !question.title) {
        status = '未检测到题目';
        updateStatus();
        return;
      }

      status = '正在查询答案...';
      updateStatus();

      // 检查缓存
      if (cache.has(question.title)) {
        const cachedAnswer = cache.get(question.title);
        log(`从缓存获取答案: ${cachedAnswer}`, 'info');
        lastAnswer = cachedAnswer;
        if (CONFIG.autoAnswer) {
          choose(cachedAnswer, question.type);
        }
        status = '已从缓存获取答案';
        updateStatus();
        return;
      }

      // 本地查询答案
      const ans = queryLocalAnswer(question.title);
      if (ans) {
        // 缓存答案
        cache.set(question.title, ans);
        lastAnswer = ans;
        log(`查询到答案: ${ans}`, 'success');
        if (CONFIG.autoAnswer) {
          choose(ans, question.type);
        }
        status = '已找到答案';
        retryCount = 0;
      } else {
        retryCount++;
        if (retryCount <= CONFIG.retryTimes) {
          status = `未找到答案，${CONFIG.retryTimes - retryCount + 1}秒后重试(${retryCount}/${CONFIG.retryTimes})`;
          log(`未找到答案，准备重试(${retryCount}/${CONFIG.retryTimes})`, 'warning');
          // 延迟重试
          setTimeout(() => autoRun(), 1000);
        } else {
          status = '未找到答案，已达到最大重试次数';
          log('未找到答案，已达到最大重试次数', 'error');
          retryCount = 0;
        }
      }
      updateStatus();
    } catch (error) {
      status = `发生错误: ${error.message}`;
      log(`自动答题过程中发生错误: ${error.message}`, 'error');
      updateStatus();
    }
  }

  /* ====== 新增题目按钮与功能 ====== */
  // 添加上传按钮
  function addUploadBtn() {
    const box = document.querySelector(CONFIG.qSelector);
    if (!box || box.querySelector(".quiz-autopilot-btn")) return;

    // 创建按钮容器
    const btnContainer = document.createElement("div");
    btnContainer.className = "quiz-autopilot-btn-container";
    btnContainer.style.cssText =
      "margin-top:10px;padding:5px;background:#f5f5f5;border-radius:4px;display:flex;gap:5px;";

    // 新增题目按钮
    const uploadBtn = document.createElement("button");
    uploadBtn.className = "quiz-autopilot-btn upload-btn";
    uploadBtn.textContent = "新增题目";
    uploadBtn.style.cssText =
      "background:#409eff;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;";
    uploadBtn.onclick = uploadQuestion;

    // 手动答题按钮
    const manualBtn = document.createElement("button");
    manualBtn.className = "quiz-autopilot-btn manual-btn";
    manualBtn.textContent = CONFIG.autoAnswer ? "关闭自动答题" : "开启自动答题";
    manualBtn.style.cssText =
      `background:${CONFIG.autoAnswer ? '#f44336' : '#4caf50'};color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;`;
    manualBtn.onclick = toggleAutoAnswer;

    // 配置按钮
    const configBtn = document.createElement("button");
    configBtn.className = "quiz-autopilot-btn config-btn";
    configBtn.textContent = "配置";
    configBtn.style.cssText =
      "background:#ff9800;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;";
    configBtn.onclick = openConfigPanel;

    btnContainer.appendChild(uploadBtn);
    btnContainer.appendChild(manualBtn);
    btnContainer.appendChild(configBtn);
    box.appendChild(btnContainer);
  }

  // 上传题目（本地版）
  function uploadQuestion() {
    const question = getQuestion();
    if (!question || !question.title) {
      alert("未识别到题干！");
      return;
    }

    // 弹出输入答案对话框
    const answer = prompt("请输入正确答案：", lastAnswer || "");
    if (answer === null) return; // 用户取消

    status = '正在保存题目...';
    updateStatus();

    // 在本地缓存中保存题目
    cache.set(question.title, answer);
    log("题目已保存到本地缓存", 'success');
    
    // 提示用户手动更新JSON文件
    alert("题目已保存到本地缓存！\n请手动更新questions.json文件以永久保存。");
    
    status = '就绪';
    updateStatus();
  }

  // 切换自动答题状态
  function toggleAutoAnswer() {
    CONFIG.autoAnswer = !CONFIG.autoAnswer;
    GM_setValue('autoAnswer', CONFIG.autoAnswer);

    const manualBtn = document.querySelector('.manual-btn');
    if (manualBtn) {
      manualBtn.textContent = CONFIG.autoAnswer ? "关闭自动答题" : "开启自动答题";
      manualBtn.style.background = CONFIG.autoAnswer ? '#f44336' : '#4caf50';
    }

    log(`${CONFIG.autoAnswer ? '已开启' : '已关闭'}自动答题`, 'info');
  }

  // 创建配置面板
  function createConfigPanel() {
    // 检查面板是否已存在
    if (document.getElementById('quiz-autopilot-config')) return;

    const panel = document.createElement('div');
    panel.id = 'quiz-autopilot-config';
    panel.style.cssText =
      "position:fixed;top:20px;right:20px;width:300px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;box-shadow:0 2px 10px rgba(0,0,0,0.1);z-index:9999;display:none;";

    // 面板标题
    const title = document.createElement('h3');
    title.textContent = '题库脚本配置';
    title.style.cssText = "margin-top:0;padding-bottom:10px;border-bottom:1px solid #eee;";
    panel.appendChild(title);

    // 配置表单
    const form = document.createElement('form');
    form.style.cssText = "display:flex;flex-direction:column;gap:10px;";

    // JSON文件路径
    form.appendChild(createConfigField('localJsonPath', 'JSON文件路径:', CONFIG.localJsonPath));

    // 题干选择器
    form.appendChild(createConfigField('qSelector', '题干选择器:', CONFIG.qSelector));

    // 选项选择器
    form.appendChild(createConfigField('oSelector', '选项选择器:', CONFIG.oSelector));

    // 检查间隔
    form.appendChild(createConfigField('interval', '检查间隔(ms):', CONFIG.interval.toString(), 'number'));

    // 重试次数
    form.appendChild(createConfigField('retryTimes', '重试次数:', CONFIG.retryTimes.toString(), 'number'));

    // 超时时间
    form.appendChild(createConfigField('timeout', '超时时间(ms):', CONFIG.timeout.toString(), 'number'));

    // 显示状态
    form.appendChild(createConfigCheckbox('showStatus', '显示状态面板', CONFIG.showStatus));

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = '保存配置';
    saveBtn.style.cssText =
      "background:#409eff;color:#fff;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;";
    saveBtn.onclick = saveConfig;
    form.appendChild(saveBtn);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText =
      "background:#f5f5f5;color:#333;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;";
    closeBtn.onclick = () => {
      panel.style.display = 'none';
    };
    form.appendChild(closeBtn);

    panel.appendChild(form);
    document.body.appendChild(panel);
  }

  // 创建配置字段
  function createConfigField(name, labelText, value, type = 'text') {
    const container = document.createElement('div');
    container.style.cssText = "display:flex;flex-direction:column;";

    const label = document.createElement('label');
    label.textContent = labelText;
    label.htmlFor = `config-${name}`;
    label.style.cssText = "margin-bottom:5px;font-weight:bold;";

    const input = document.createElement('input');
    input.type = type;
    input.id = `config-${name}`;
    input.name = name;
    input.value = value;
    input.style.cssText =
      "padding:8px;border:1px solid #ddd;border-radius:4px;outline:none;";
    input.oninput = function() {
      // 实时更新配置预览
      if (type === 'number') {
        CONFIG[name] = parseInt(this.value) || 0;
      } else {
        CONFIG[name] = this.value;
      }
    };

    container.appendChild(label);
    container.appendChild(input);
    return container;
  }

  // 创建复选框配置
  function createConfigCheckbox(name, labelText, checked) {
    const container = document.createElement('div');
    container.style.cssText = "display:flex;align-items:center;";

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `config-${name}`;
    input.name = name;
    input.checked = checked;
    input.onchange = function() {
      CONFIG[name] = this.checked;
    };

    const label = document.createElement('label');
    label.textContent = labelText;
    label.htmlFor = `config-${name}`;
    label.style.cssText = "margin-left:5px;";

    container.appendChild(input);
    container.appendChild(label);
    return container;
  }

  // 打开配置面板
  function openConfigPanel() {
    createConfigPanel();
    const panel = document.getElementById('quiz-autopilot-config');
    panel.style.display = 'block';
  }

  // 保存配置
  function saveConfig() {
    // 保存配置到存储
    GM_setValue('localJsonPath', CONFIG.localJsonPath);
    GM_setValue('qSelector', CONFIG.qSelector);
    GM_setValue('oSelector', CONFIG.oSelector);
    GM_setValue('interval', CONFIG.interval);
    GM_setValue('retryTimes', CONFIG.retryTimes);
    GM_setValue('timeout', CONFIG.timeout);
    GM_setValue('showStatus', CONFIG.showStatus);

    // 更新状态面板
    updateStatusPanelVisibility();

    alert('配置已保存！');
    log('配置已保存', 'success');

    // 关闭面板
    const panel = document.getElementById('quiz-autopilot-config');
    panel.style.display = 'none';

    // 重启定时器
    restartTimer();
  }

  // 更新状态显示
  function updateStatus() {
    if (!CONFIG.showStatus) return;
    let statusPanel = document.getElementById('quiz-autopilot-status');
    if (!statusPanel) {
      statusPanel = document.createElement('div');
      statusPanel.id = 'quiz-autopilot-status';
      statusPanel.style.cssText =
        "position:fixed;top:10px;left:10px;background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px 12px;box-shadow:0 2px 5px rgba(0,0,0,0.1);z-index:9998;";
      document.body.appendChild(statusPanel);
    }
    statusPanel.textContent = `题库脚本: ${status}`;
  }

  // 更新状态面板可见性
  function updateStatusPanelVisibility() {
    const statusPanel = document.getElementById('quiz-autopilot-status');
    if (statusPanel) {
      statusPanel.style.display = CONFIG.showStatus ? 'block' : 'none';
    }
  }

  // 重启定时器
  function restartTimer() {
    // 清除当前定时器
    if (window.quizAutoPilotInterval) {
      clearInterval(window.quizAutoPilotInterval);
    }

    // 设置新的定时器
    window.quizAutoPilotInterval = setInterval(() => {
      addUploadBtn();
      autoRun();
    }, CONFIG.interval);
  }

  // 初始化
  async function init() {
    await loadQuestionBank();
    updateStatus();
    updateStatusPanelVisibility();
    restartTimer();
  }

  // 启动脚本
  init();
})();