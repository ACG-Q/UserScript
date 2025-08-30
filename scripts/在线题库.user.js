// ==UserScript==
// @name         在线题库
// @match        http://cdeaa.com/UserCourse/CourseShow*
// @grant        GM_setValue
// @grant        GM_getValue
// @version      1.0
// @author       -
// @description  2025-08-27 在线题库（本地JSON版）
// ==/UserScript==

/**
 * 在线题库脚本
 * 功能：自动识别题目、查询答案并自动选择
 * 数据来源：本地JSON文件
 */

// 立即执行函数，避免全局变量污染
(function () {
  // ========== 配置和状态管理 ==========
  const ConfigManager = {
    // 配置项 - 从存储中加载或使用默认值
    config: {
      qSelector: GM_getValue('qSelector', '.topic-main'),
      oSelector: GM_getValue('oSelector', '.answer-show > .answer-item'),
      interval: GM_getValue('interval', 1500),
      retryTimes: GM_getValue('retryTimes', 3),
      timeout: GM_getValue('timeout', 5000),
      autoAnswer: GM_getValue('autoAnswer', true),
      showStatus: GM_getValue('showStatus', true),
      // 本地JSON文件的相对路径
      localJsonPath: GM_getValue('localJsonPath', 'https://gh-proxy.com/https://github.com/ACG-Q/UserScript/raw/refs/heads/main/questions1.json'),
      // 题目信息窗口位置配置
      infoWindowPosition: GM_getValue('infoWindowPosition', 'bottom-right'), // 可选值: top-left, top-right, bottom-left, bottom-right
      showInfoWindow: GM_getValue('showInfoWindow', true) // 是否显示题目信息窗口
    },

    // 状态变量
    state: {
      status: '就绪',
      lastAnswer: '',
      retryCount: 0,
      questionBank: [],
      searchPaused: false,
      lastQuestionTitle: '',
      correctAnswerObserverInitialized: false
    },

    // 保存配置到存储
    saveConfig() {
      Object.keys(this.config).forEach(key => {
        GM_setValue(key, this.config[key]);
      });
      Logger.log('配置已保存', 'success');
    }
  };

  // ========== 工具函数 ==========
  const Logger = {
    /**
     * 日志记录函数
     * @param {string} message - 日志信息
     * @param {string} type - 日志类型：info, success, error, warning
     */
    log(message, type = 'info') {
      const types = {
        info: 'color: #2196F3;',
        success: 'color: #4CAF50;',
        error: 'color: #F44336;',
        warning: 'color: #FF9800;',
        debug: 'color: #9E9E9E;'
      };
      console.log(`%c[题库脚本] ${message}`, types[type] || types.info);
    }
  };

  // ========== 题库加载和查询 ==========
  const QuestionBank = {
    /**
     * 加载本地JSON题库
     * @returns {Promise<boolean>} 是否加载成功
     */
    async load() {
      try {
        const response = await fetch(ConfigManager.config.localJsonPath);
        if (!response.ok) {
          throw new Error(`无法加载题库文件: ${response.status}`);
        }
        ConfigManager.state.questionBank = await response.json();
        Logger.log(`成功加载 ${ConfigManager.state.questionBank.length} 道题目`, 'success');
        return true;
      } catch (error) {
        Logger.log(`加载题库失败: ${error.message}`, 'error');
        // 备用方案：使用空题库
        ConfigManager.state.questionBank = [];
        Logger.log('使用空题库', 'warning');
        return false;
      }
    },

    /**
     * 计算文本相似度
     * @param {string} text1 - 文本1
     * @param {string} text2 - 文本2
     * @returns {number} 相似度分数
     */
    calculateSimilarity(text1, text2) {
      // 去除所有非中文字符和空格
      const cleanText1 = text1.replace(/[^\u4e00-\u9fa5]/g, '');
      const cleanText2 = text2.replace(/[^\u4e00-\u9fa5]/g, '');

      // 如果任一文本为空，返回0
      if (!cleanText1 || !cleanText2) return 0;

      // 使用字符交集方法计算相似度
      const set1 = new Set(cleanText1.split(''));
      const set2 = new Set(cleanText2.split(''));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);

      return intersection.size / union.size;
    },

    /**
     * 本地查询答案
     * @param {string} title - 题目名称
     * @returns {Array|null} 包含题目、选项和答案的对象数组，或null
     */
    queryAnswer(title) {
      if (!title || ConfigManager.state.questionBank.length === 0) {
        return null;
      }

      // 存储所有相似度>=0.75的匹配结果
      const matchingQuestions = [];

      // 1. 尝试精确匹配题目
      let foundQuestion = ConfigManager.state.questionBank.find(q =>
        q.title && q.title.trim() === title.trim()
      );

      if (foundQuestion) {
        // 精确匹配的相似度视为1.0
        matchingQuestions.push({ ...foundQuestion, similarity: 1.0 });
      } else {
        // 2. 进行基于相似度的模糊匹配
        ConfigManager.state.questionBank.forEach(q => {
          if (q.title) {
            const score = this.calculateSimilarity(title, q.title);
            if (score >= 0.75) {
              matchingQuestions.push({ ...q, similarity: score });
            }
          }
        });

        // 3. 如果没有模糊匹配结果，尝试关键词匹配
        if (matchingQuestions.length === 0) {
          // 提取关键词
          const keywords = title.replace(/[^一-龥a-zA-Z0-9]/g, ' ').split(' ').filter(w => w.length > 1);

          // 只有当有2个以上关键词时才进行关键词匹配
          if (keywords.length >= 2) {
            ConfigManager.state.questionBank.forEach(q => {
              if (!q.title) return;
              // 计算匹配的关键词数量
              const matchedKeywords = keywords.filter(keyword => q.title.includes(keyword));
              // 要求至少匹配2个关键词
              if (matchedKeywords.length >= 2) {
                // 关键词匹配的相似度设为0.75
                matchingQuestions.push({ ...q, similarity: 0.75 });
              }
            });
          }
        }
      }

      // 对匹配结果按相似度降序排序
      matchingQuestions.sort((a, b) => b.similarity - a.similarity);

      // 处理每个匹配结果的答案
      return matchingQuestions.map(q => {
        if (q.answer) {
          // 清理答案中的特殊字符
          let answer = q.answer.replace(/[*]+/g, '').trim();
          // 提取字母答案（A,B,C,D等）
          const letterMatch = answer.match(/[A-Za-z,]+/);
          if (letterMatch) {
            answer = letterMatch[0];
          }
          // 返回包含题目、选项、答案和相似度的完整对象
          return {
            ...q,
            answer: answer
          };
        }
        return q;
      });
    }
  };

  // ========== 题目处理 ==========
  const QuestionProcessor = {
    /**
     * 获取题目信息
     * @returns {Object|null} 包含title和opts的对象，或null
     */
    getQuestion() {
      const questionElement = document.querySelector(ConfigManager.config.qSelector);
      if (!questionElement) return null;

      // 创建元素副本以避免修改原始DOM
      const tempElement = questionElement.cloneNode(true);

      // 移除按钮容器
      const btnContainer = tempElement.querySelector(".quiz-autopilot-btn-container");
      if (btnContainer) {
        btnContainer.remove();
      }

      // 获取纯净的题目文本
      const title = tempElement.innerText.trim().replace(/[\n\r\s]+/g, '').replace("题目内容：", "");
      if (!title) return null;

      const opts = [...document.querySelectorAll(ConfigManager.config.oSelector)].map((e) =>
        e.innerText.trim()
      );

      return { title, opts };
    },

    /**
     * 选择答案
     * @param {string} ansText - 答案文本
     * @returns {boolean} 是否选择成功
     */
    choose(ansText) {
      if (!ansText) return false;

      const options = [...document.querySelectorAll(ConfigManager.config.oSelector)];
      if (options.length === 0) {
        Logger.log('未找到选项元素', 'warning');
        return false;
      }

      let success = false;
      // 根据答案是否包含逗号判断是否为多选题
      const isMultiple = ansText.includes(',');
      const answers = isMultiple ? ansText.split(',').map(a => a.trim()) : [ansText];

      answers.forEach(ans => {
        // 清理答案，只保留字母和数字
        const cleanAns = ans.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

        Logger.log(`尝试选择答案: ${ans} (清理后: ${cleanAns})`, 'debug');

        // 尝试精确匹配选项文本
        let opt = options.find(e => {
          const cleanOpt = e.innerText.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const result = cleanOpt === cleanAns || cleanOpt.endsWith(cleanAns);
          if (result) {
            Logger.log(`精确匹配成功: 选项文本包含 ${cleanAns}`, 'debug');
          }
          return result;
        });

        // 如果精确匹配失败，尝试部分匹配
        if (!opt) {
          opt = options.find(e => {
            const optText = e.innerText.toUpperCase();
            return optText.includes(cleanAns) ||
              (cleanAns.length === 1 && optText.startsWith(cleanAns + '.')) ||
              (cleanAns.length === 1 && optText.startsWith(cleanAns + '、'));
          });
        }

        // 如果是字母选项，尝试匹配选项前缀
        if (!opt && /^[A-Za-z]$/.test(ans)) {
          opt = options.find(e => e.innerText.trim().toUpperCase().startsWith(ans.toUpperCase()));
        }

        if (opt) {
          // 检查是否包含checkbox子元素
          const checkbox = opt.querySelector('input[type="checkbox"]');

          if (checkbox) {
            // 给网页看选择了什么
            checkbox.checked = true;
            checkbox.setAttribute('checked', 'checked');
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));

            // 给用户看选择了什么
            const label = opt.querySelector('label');
            if (label) {
              label.classList.add('yes');
              Logger.log(`已为选项label添加yes样式`, 'debug');
            }

            success = true;
            Logger.log(`已选择checkbox答案: ${ans}`, 'success');
          } else {
            // 使用标准的点击方法
            opt.click();
            success = true;
            Logger.log(`已选择答案: ${ans}`, 'success');
          }
        }
      });

      if (!success) {
        Logger.log(`未找到匹配的选项: ${ansText}`, 'warning');
      }
      return success;
    },

    /**
     * 自动运行主函数
     */
    async autoRun() {
      try {
        const question = this.getQuestion();
        if (!question || !question.title) {
          ConfigManager.state.status = '未检测到题目';
          UIManager.updateStatus();
          return;
        }

        // 检测题目是否变化
        if (question.title !== ConfigManager.state.lastQuestionTitle) {
          // 题目已变化，重置搜索状态
          if (ConfigManager.state.searchPaused) {
            Logger.log('检测到题目变化，重置搜索暂停状态', 'info');
            ConfigManager.state.searchPaused = false;
            ConfigManager.state.retryCount = 0;
          }
          ConfigManager.state.lastQuestionTitle = question.title;
        }

        // 如果搜索已暂停，则直接返回
        if (ConfigManager.state.searchPaused) {
          ConfigManager.state.status = '搜索已暂停（达到最大重试次数）';
          UIManager.updateStatus();
          return;
        }

        ConfigManager.state.status = '正在查询答案...';
        UIManager.updateStatus();

        // 本地查询答案
        // 本地查询答案
        const results = QuestionBank.queryAnswer(question.title);
        if (results && results.length > 0) {
          // 取相似度最高的结果
          const ans = results[0];
          ConfigManager.state.lastAnswer = ans.answer; // 存储答案字符串
          Logger.log(`查询到答案: ${ans.answer}`, 'success');
          if (ConfigManager.config.autoAnswer) {
            this.choose(ans.answer); // 传递答案字符串给choose函数
          }
          ConfigManager.state.status = '已找到答案，搜索已暂停';
          ConfigManager.state.retryCount = 0;
          ConfigManager.state.searchPaused = true;
          // 显示题目信息到窗口
          const questionWithAnswer = {
            title: question.title,
            opts: question.opts,
            options: question.opts,
            answer: ans.answer
          };
          UIManager.showQuestionInfo(questionWithAnswer);
        } else {
          ConfigManager.state.retryCount++;
          if (ConfigManager.state.retryCount <= ConfigManager.config.retryTimes) {
            ConfigManager.state.status = `未找到答案，${ConfigManager.config.retryTimes - ConfigManager.state.retryCount + 1}秒后重试(${ConfigManager.state.retryCount}/${ConfigManager.config.retryTimes})`;
            Logger.log(`未找到答案，准备重试(${ConfigManager.state.retryCount}/${ConfigManager.config.retryTimes})`, 'warning');
            // 延迟重试
            setTimeout(() => this.autoRun(), 1000);
          } else {
            ConfigManager.state.status = '未找到答案，已达到最大重试次数';
            Logger.log('未找到答案，已达到最大重试次数', 'error');
            ConfigManager.state.retryCount = 0;
            ConfigManager.state.searchPaused = true; // 暂停搜索
          }
        }
        UIManager.updateStatus();
      } catch (error) {
        ConfigManager.state.status = `发生错误: ${error.message}`;
        Logger.log(`自动答题过程中发生错误: ${error.message}`, 'error');
        UIManager.updateStatus();
      }
    },

    /**
     * 上传题目
     */
    uploadQuestion() {
      const question = this.getQuestion();
      if (!question || !question.title) {
        alert("未识别到题干！");
        return;
      }

      // 弹出输入答案对话框
      const answer = prompt("请输入正确答案：", ConfigManager.state.lastAnswer || "");
      if (answer === null) return; // 用户取消

      ConfigManager.state.status = '正在保存题目...';
      UIManager.updateStatus();

      ConfigManager.state.lastAnswer = answer;
      Logger.log(`保存答案: ${answer}`, 'success');
      if (ConfigManager.config.autoAnswer) {
        this.choose(answer);
      }
      ConfigManager.state.status = '已保存题目，搜索已暂停';
      ConfigManager.state.retryCount = 0;
      ConfigManager.state.searchPaused = true;
      // 显示题目信息到窗口
      const questionWithAnswer = {
        title: question.title,
        opts: question.opts,
        options: question.opts,
        answer: answer
      };
      UIManager.showQuestionInfo(questionWithAnswer);
    },

    /**
     * 切换自动答题状态
     */
    toggleAutoAnswer() {
      ConfigManager.config.autoAnswer = !ConfigManager.config.autoAnswer;
      GM_setValue('autoAnswer', ConfigManager.config.autoAnswer);

      const manualBtn = document.querySelector('.manual-btn');
      if (manualBtn) {
        manualBtn.textContent = ConfigManager.config.autoAnswer ? "关闭自动答题" : "开启自动答题";
        manualBtn.style.background = ConfigManager.config.autoAnswer ? '#f44336' : '#4caf50';
      }

      Logger.log(`${ConfigManager.config.autoAnswer ? '已开启' : '已关闭'}自动答题`, 'info');
    }
  };

  // ========== UI组件 ==========
  const UIManager = {
    btnContainerSelector: ".quiz-autopilot-btn-container",

    /**
     * 创建并管理题目信息窗口
     */
    createInfoWindow() {
      // 检查窗口是否已存在
      if (document.getElementById('quiz-autopilot-info-window')) return;

      const infoWindow = document.createElement('div');
      infoWindow.id = 'quiz-autopilot-info-window';
      infoWindow.style.cssText = `
        position: fixed;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 9997;
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        font-size: 12px;
        line-height: 1.4;
        display: ${ConfigManager.config.showInfoWindow ? 'block' : 'none'};
      `;

      // 设置窗口位置
      this.updateInfoWindowPosition(infoWindow);

      // 添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.onclick = () => {
        infoWindow.style.display = 'none';
      };
      infoWindow.appendChild(closeBtn);

      document.body.appendChild(infoWindow);
    },

    /**
     * 更新题目信息窗口位置
     * @param {HTMLElement} infoWindow - 信息窗口元素
     */
    updateInfoWindowPosition(infoWindow = null) {
      const windowToUpdate = infoWindow || document.getElementById('quiz-autopilot-info-window');
      if (!windowToUpdate) return;

      // 重置所有位置样式
      windowToUpdate.style.top = '';
      windowToUpdate.style.bottom = '';
      windowToUpdate.style.left = '';
      windowToUpdate.style.right = '';

      // 根据配置设置位置
      switch (ConfigManager.config.infoWindowPosition) {
        case 'top-left':
          windowToUpdate.style.top = '10px';
          windowToUpdate.style.left = '10px';
          break;
        case 'top-right':
          windowToUpdate.style.top = '10px';
          windowToUpdate.style.right = '10px';
          break;
        case 'bottom-left':
          windowToUpdate.style.bottom = '10px';
          windowToUpdate.style.left = '10px';
          break;
        case 'bottom-right':
        default:
          windowToUpdate.style.bottom = '10px';
          windowToUpdate.style.right = '10px';
          break;
      }
    },

    /**
     * 显示题目信息到窗口
     * @param {Object} question - 题目信息对象
     */
    showQuestionInfo(question) {
      if (!ConfigManager.config.showInfoWindow) return;

      this.createInfoWindow();
      const infoWindow = document.getElementById('quiz-autopilot-info-window');
      if (!infoWindow || !question || !question.title) return;

      // 创建题目信息内容
      let content = '';

      // 添加题目标题
      const displayTitle = question.title.length > 100 ? question.title.substring(0, 100) + '...' : question.title;
      content += `<div style="margin-bottom: 10px; font-weight: bold;">题目：${displayTitle}</div>`;

      // 添加搜索结果列表标题
      content += `<div style="margin-bottom: 5px; font-weight: bold; color: #2196F3;">搜索结果 (可信度 >= 0.75)：</div>`;

      // 检查是否有多个匹配结果
      const results = QuestionBank.queryAnswer(question.title);

      if (results && results.length > 0) {
        // 显示搜索结果列表
        results.forEach((result, index) => {
          if (result.answer) {
            const displayAnswer = result.answer.replace(/[*]+/g, '').trim();
            const similarityPercentage = Math.round(result.similarity * 100);

            content += `<div style="margin-bottom: 8px; padding: 5px; border: 1px solid #eee; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">`;
            content += `<div style="flex: 1;">`;
            content += `<div style="margin-bottom: 2px;"><span style="font-weight: bold;">结果 ${index + 1}：</span>${displayAnswer}</div>`;
            content += `<div style="font-size: 10px; color: #666;">可信度: ${similarityPercentage}%</div>`;
            content += `</div>`;
            // 添加切换按钮
            content += `<button class="switch-answer-btn" data-answer="${displayAnswer}" data-index="${index}" style="margin-left: 5px; padding: 3px 8px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">切换</button>`;
            content += `</div>`;
          }
        });

        // 标记当前选中的答案
        if (ConfigManager.state.lastAnswer) {
          const currentResultIndex = results.findIndex(r => r.answer && r.answer.replace(/[*]+/g, '').trim() === ConfigManager.state.lastAnswer);
          if (currentResultIndex !== -1) {
            content += `<script>document.addEventListener('DOMContentLoaded', function() {\n`;
            content += `  const buttons = document.querySelectorAll('.switch-answer-btn');\n`;
            content += `  buttons[${currentResultIndex}].style.background = '#4CAF50';\n`;
            content += `});</script>`;
          }
        }
      } else {
        content += `<div style="margin-bottom: 5px; color: #FF9800;">未找到匹配结果</div>`;
      }

      // 更新窗口内容
      infoWindow.innerHTML = ''; // 清空内容

      // 重新添加关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.onclick = () => {
        infoWindow.style.display = 'none';
      };
      infoWindow.appendChild(closeBtn);

      // 添加内容容器
      const contentContainer = document.createElement('div');
      contentContainer.style.cssText = 'margin-top: 20px;';
      contentContainer.innerHTML = content;
      infoWindow.appendChild(contentContainer);

      // 为切换按钮添加点击事件
      const switchButtons = infoWindow.querySelectorAll('.switch-answer-btn');
      switchButtons.forEach(btn => {
        btn.addEventListener('click', function () {
          const answer = this.getAttribute('data-answer');
          QuestionProcessor.choose(answer);
          ConfigManager.state.lastAnswer = answer;
          Logger.log(`已切换答案为: ${answer}`, 'success');
          // 更新当前显示的答案高亮
          switchButtons.forEach(b => {
            b.style.background = '#409eff';
          });
          this.style.background = '#4CAF50'; // 切换成功后按钮变绿色
        });
      });

      // 确保窗口可见
      infoWindow.style.display = 'block';
    },

    /**
     * 添加上传按钮
     */
    /**
     * 添加上传按钮
     */
    addUploadBtn() {
      const box = document.querySelector(ConfigManager.config.qSelector);
      if (!box || box.querySelector(".quiz-autopilot-btn")) return;

      // 创建按钮容器
      const btnContainer = document.createElement("div");
      btnContainer.className = this.btnContainerSelector.replace(".", "");
      btnContainer.style.cssText =
        "margin-top:10px;padding:5px;background:#f5f5f5;border-radius:4px;display:flex;gap:5px;";

      // 手动答题按钮
      const manualBtn = document.createElement("button");
      manualBtn.className = "quiz-autopilot-btn manual-btn";
      manualBtn.textContent = ConfigManager.config.autoAnswer ? "关闭自动答题" : "开启自动答题";
      manualBtn.style.cssText =
        `background:${ConfigManager.config.autoAnswer ? '#f44336' : '#4caf50'};color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;`;
      manualBtn.onclick = () => QuestionProcessor.toggleAutoAnswer();

      // 配置按钮
      const configBtn = document.createElement("button");
      configBtn.className = "quiz-autopilot-btn config-btn";
      configBtn.textContent = "配置";
      configBtn.style.cssText =
        "background:#ff9800;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;";
      configBtn.onclick = () => this.openConfigPanel();

      // 获取题目与选项按钮
      const getQuestionBtn = document.createElement("button");
      getQuestionBtn.className = "quiz-autopilot-btn get-question-btn";
      getQuestionBtn.textContent = "复制";
      getQuestionBtn.style.cssText =
        "background:#9c27b0;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;";
      getQuestionBtn.onclick = () => {
        const question = QuestionProcessor.getQuestion();
        if (question) {
          // 格式化题目和选项为文本
          const clipboardText = `${question.title}\n${question.opts.join('\n')}`;

          // 复制到剪贴板
          if (navigator.clipboard && navigator.clipboard.writeText) {
            // 使用 Clipboard API (现代浏览器)
            navigator.clipboard.writeText(clipboardText)
              .then(() => {
                alert("题目与选项已复制到剪贴板！");
              })
              .catch(err => {
                alert(`复制失败: ${err.message}`);
              });
          } else {
            // 回退方案: 创建临时文本区域
            const textarea = document.createElement('textarea');
            textarea.value = clipboardText;
            textarea.style.position = 'fixed'; // 避免滚动到视图外
            document.body.appendChild(textarea);
            textarea.select();

            try {
              const successful = document.execCommand('copy');
              alert(successful ? "题目与选项已复制到剪贴板！" : "复制失败，请手动复制。");
            } catch (err) {
              alert(`复制失败: ${err.message}`);
            }

            document.body.removeChild(textarea);
          }
        } else {
          alert("未检测到题目");
        }
      };

      btnContainer.appendChild(manualBtn);
      btnContainer.appendChild(configBtn);
      btnContainer.appendChild(getQuestionBtn);
      box.appendChild(btnContainer);
    },

    /**
     * 创建配置面板
     */
    createConfigPanel() {
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
      form.appendChild(this.createConfigField('localJsonPath', 'JSON文件路径:', ConfigManager.config.localJsonPath));

      // 题干选择器
      form.appendChild(this.createConfigField('qSelector', '题干选择器:', ConfigManager.config.qSelector));

      // 选项选择器
      form.appendChild(this.createConfigField('oSelector', '选项选择器:', ConfigManager.config.oSelector));

      // 检查间隔
      form.appendChild(this.createConfigField('interval', '检查间隔(ms):', ConfigManager.config.interval.toString(), 'number'));

      // 重试次数
      form.appendChild(this.createConfigField('retryTimes', '重试次数:', ConfigManager.config.retryTimes.toString(), 'number'));

      // 超时时间
      form.appendChild(this.createConfigField('timeout', '超时时间(ms):', ConfigManager.config.timeout.toString(), 'number'));

      // 显示状态
      form.appendChild(this.createConfigCheckbox('showStatus', '显示状态面板', ConfigManager.config.showStatus));

      // 显示题目信息窗口
      form.appendChild(this.createConfigCheckbox('showInfoWindow', '显示题目信息窗口', ConfigManager.config.showInfoWindow));

      // 题目信息窗口位置
      const positionContainer = document.createElement('div');
      positionContainer.style.cssText = "display:flex;flex-direction:column;";

      const positionLabel = document.createElement('label');
      positionLabel.textContent = '题目信息窗口位置:';
      positionLabel.style.cssText = "margin-bottom:5px;font-weight:bold;";

      const positionSelect = document.createElement('select');
      positionSelect.style.cssText =
        "padding:8px;border:1px solid #ddd;border-radius:4px;outline:none;";

      // 添加位置选项
      const positions = [
        { value: 'top-left', text: '左上角' },
        { value: 'top-right', text: '右上角' },
        { value: 'bottom-left', text: '左下角' },
        { value: 'bottom-right', text: '右下角' }
      ];

      positions.forEach(pos => {
        const option = document.createElement('option');
        option.value = pos.value;
        option.textContent = pos.text;
        option.selected = ConfigManager.config.infoWindowPosition === pos.value;
        positionSelect.appendChild(option);
      });

      positionSelect.onchange = function () {
        ConfigManager.config.infoWindowPosition = this.value;
        // 立即更新窗口位置
        UIManager.updateInfoWindowPosition();
      };

      positionContainer.appendChild(positionLabel);
      positionContainer.appendChild(positionSelect);
      form.appendChild(positionContainer);

      // 保存按钮
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = '保存配置';
      saveBtn.style.cssText =
        "background:#409eff;color:#fff;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;";
      saveBtn.onclick = () => {
        ConfigManager.saveConfig();
        this.updateStatusPanelVisibility();
        // 更新题目信息窗口
        if (ConfigManager.config.showInfoWindow) {
          this.createInfoWindow();
          this.updateInfoWindowPosition();
        } else {
          const infoWindow = document.getElementById('quiz-autopilot-info-window');
          if (infoWindow) {
            infoWindow.style.display = 'none';
          }
        }
        alert('配置已保存！');
        // 关闭面板
        panel.style.display = 'none';
        // 重启定时器
        App.restartTimer();
      };
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
    },

    /**
     * 创建配置字段
     * @param {string} name - 字段名
     * @param {string} labelText - 标签文本
     * @param {string} value - 初始值
     * @param {string} type - 输入类型
     * @returns {HTMLElement} 配置字段容器
     */
    createConfigField(name, labelText, value, type = 'text') {
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
      input.oninput = function () {
        // 实时更新配置预览
        if (type === 'number') {
          ConfigManager.config[name] = parseInt(this.value) || 0;
        } else {
          ConfigManager.config[name] = this.value;
        }
      };

      container.appendChild(label);
      container.appendChild(input);
      return container;
    },

    /**
     * 创建复选框配置
     * @param {string} name - 字段名
     * @param {string} labelText - 标签文本
     * @param {boolean} checked - 是否选中
     * @returns {HTMLElement} 复选框容器
     */
    createConfigCheckbox(name, labelText, checked) {
      const container = document.createElement('div');
      container.style.cssText = "display:flex;align-items:center;";

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `config-${name}`;
      input.name = name;
      input.checked = checked;
      input.onchange = function () {
        ConfigManager.config[name] = this.checked;
      };

      const label = document.createElement('label');
      label.textContent = labelText;
      label.htmlFor = `config-${name}`;
      label.style.cssText = "margin-left:5px;";

      container.appendChild(input);
      container.appendChild(label);
      return container;
    },

    /**
     * 打开配置面板
     */
    openConfigPanel() {
      this.createConfigPanel();
      const panel = document.getElementById('quiz-autopilot-config');
      panel.style.display = 'block';
    },

    /**
     * 更新状态显示
     */
    updateStatus() {
      if (!ConfigManager.config.showStatus) return;
      let statusPanel = document.getElementById('quiz-autopilot-status');
      if (!statusPanel) {
        statusPanel = document.createElement('div');
        statusPanel.id = 'quiz-autopilot-status';
        statusPanel.style.cssText =
          "position:fixed;top:10px;left:10px;background:#fff;border:1px solid #ddd;border-radius:4px;padding:8px 12px;box-shadow:0 2px 5px rgba(0,0,0,0.1);z-index:9998;";
        document.body.appendChild(statusPanel);
      }
      statusPanel.textContent = `题库脚本: ${ConfigManager.state.status}`;
    },

    /**
     * 更新状态面板可见性
     */
    updateStatusPanelVisibility() {
      const statusPanel = document.getElementById('quiz-autopilot-status');
      if (statusPanel) {
        statusPanel.style.display = ConfigManager.config.showStatus ? 'block' : 'none';
      }
    }
  };

  // ========== 事件监听 ==========
  const EventListener = {
    /**
     * 监听正确答案元素并按格式输出题目信息
     */
    monitorCorrectAnswer() {
      // 配置观察器选项
      const observerOptions = {
        childList: true,
        subtree: true
      };

      // 存储上一次处理的题目，避免重复输出
      let lastProcessedTitle = '';

      // 回调函数 - 当检测到DOM变化时执行
      const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            // 检查是否出现了正确答案元素
            const detailCnt = document.querySelector('.detail-cnt');
            const rightAnswer = document.querySelector('#right');

            if (detailCnt && rightAnswer && rightAnswer.innerText.trim() !== '') {
              // 提取正确答案
              const answer = rightAnswer.innerText.trim();

              // 获取题目信息
              const question = QuestionProcessor.getQuestion();
              if (question && question.title && question.title !== lastProcessedTitle) {
                // 构建输出对象
                const output = {
                  title: question.title,
                  options: question.opts,
                  answer: answer,
                  source: location.href
                };

                // 检查是否未搜索到题目（搜索已暂停且达到最大重试次数）
                if (ConfigManager.state.searchPaused && ConfigManager.state.retryCount === 0) {
                  // 创建弹窗
                  this.createAnswerNotFoundDialog(output);
                }

                // 打印到控制台
                console.log(JSON.stringify(output, null, 2));

                // 更新上次处理的题目
                lastProcessedTitle = question.title;
              }
            }
          }
        }
      };

      // 创建观察器实例
      const observer = new MutationObserver(observerCallback);

      // 开始观察文档根节点
      observer.observe(document.body, observerOptions);

      Logger.log('已启动正确答案监听', 'info');
      ConfigManager.state.correctAnswerObserverInitialized = true;
    },

    /**
     * 创建未找到答案的弹窗
     * @param {Object} questionInfo - 题目信息对象
     */
    createAnswerNotFoundDialog(questionInfo) {
      // 检查弹窗是否已存在
      if (document.getElementById('quiz-autopilot-not-found-dialog')) {
        return;
      }

      const dialog = document.createElement('div');
      dialog.id = 'quiz-autopilot-not-found-dialog';
      dialog.style.cssText = `
         position: fixed;
         top: 50%;
         left: 50%;
         transform: translate(-50%, -50%);
         background: #fff;
         border: 1px solid #ddd;
         border-radius: 8px;
         padding: 15px;
         box-shadow: 0 2px 20px rgba(0,0,0,0.2);
         z-index: 9999;
         width: 400px;
         max-width: 90%;
       `;

      // 弹窗标题
      const title = document.createElement('h3');
      title.textContent = '未找到题目答案';
      title.style.cssText = 'margin-top: 0; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee;';
      dialog.appendChild(title);

      // JSON内容容器
      const jsonContainer = document.createElement('div');
      jsonContainer.style.cssText = `
         background: #f5f5f5;
         padding: 10px;
         border-radius: 4px;
         margin-bottom: 15px;
         max-height: 300px;
         overflow-y: auto;
         font-family: monospace;
         white-space: pre-wrap;
         font-size: 12px;
       `;
      jsonContainer.textContent = JSON.stringify(questionInfo, null, 2);
      dialog.appendChild(jsonContainer);

      // 按钮容器
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px;';

      // 复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.textContent = '复制JSON';
      copyBtn.style.cssText = `
         background: #409eff;
         color: white;
         border: none;
         padding: 8px 15px;
         border-radius: 4px;
         cursor: pointer;
       `;
      copyBtn.onclick = () => {
        const jsonText = JSON.stringify(questionInfo, null, 2);
        navigator.clipboard && navigator.clipboard.writeText(jsonText)
          .then(() => {
            alert('JSON已复制到剪贴板！');
          })
          .catch(err => {
            alert(`复制失败: ${err.message}`);
          });
      };

      // 关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.cssText = `
         background: #f5f5f5;
         color: #333;
         border: none;
         padding: 8px 15px;
         border-radius: 4px;
         cursor: pointer;
       `;
      closeBtn.onclick = () => {
        dialog.remove();
      };

      btnContainer.appendChild(copyBtn);
      btnContainer.appendChild(closeBtn);
      dialog.appendChild(btnContainer);

      // 添加遮罩
      const overlay = document.createElement('div');
      overlay.id = 'quiz-autopilot-overlay';
      overlay.style.cssText = `
         position: fixed;
         top: 0;
         left: 0;
         right: 0;
         bottom: 0;
         background: rgba(0,0,0,0.5);
         z-index: 9998;
       `;
      overlay.onclick = () => {
        dialog.remove();
        overlay.remove();
      };

      document.body.appendChild(overlay);
      document.body.appendChild(dialog);
    }
  };

  // ========== 应用初始化 ==========
  const App = {
    /**
     * 初始化应用
     */
    async init() {
      await QuestionBank.load();
      UIManager.updateStatus();
      UIManager.updateStatusPanelVisibility();
      // 创建题目信息窗口
      if (ConfigManager.config.showInfoWindow) {
        UIManager.createInfoWindow();
      }
      // 启动正确答案监听 - 确保只初始化一次
      if (!ConfigManager.state.correctAnswerObserverInitialized) {
        EventListener.monitorCorrectAnswer();
      }
      this.restartTimer();
    },

    /**
     * 重启定时器
     */
    restartTimer() {
      // 清除当前定时器
      if (window.quizAutoPilotInterval) {
        clearInterval(window.quizAutoPilotInterval);
      }

      // 设置新的定时器
      window.quizAutoPilotInterval = setInterval(() => {
        UIManager.addUploadBtn();
        QuestionProcessor.autoRun();
      }, ConfigManager.config.interval);
    }
  };

  // 启动应用
  App.init();
})();