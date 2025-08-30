// 全局变量存储脚本数据
let allScripts = [];

// 渲染脚本列表
function renderScriptList() {
  fetch('metadata.json')
    .then(response => response.json())
    .then(data => {
      allScripts = data;
      
      const scriptGrid = document.getElementById('script-grid');
      const statsContainer = document.getElementById('stats-container');
      
      // 清空现有内容
      scriptGrid.innerHTML = '';
      
      // 计算统计数据
      const totalScripts = allScripts.length;
      const categories = [...new Set(allScripts.map(script => script.category || '未分类'))];
      const totalCategories = categories.length;
      const recentScripts = allScripts.filter(script => {
        const date = new Date(script.updated || script.created);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo;
      }).length;
      
      // 渲染统计卡片
      statsContainer.innerHTML = `
        <div class="stat-card">
          <span class="stat-number">${totalScripts}</span>
          <span class="stat-label">脚本总数</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${totalCategories}</span>
          <span class="stat-label">分类数量</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${recentScripts}</span>
          <span class="stat-label">近期更新</span>
        </div>
      `;
      
      // 渲染脚本卡片
      allScripts.forEach(script => {
        const card = document.createElement('div');
        card.className = 'script-card';
        card.setAttribute('data-category', script.category || '未分类');
        
        // 格式化日期
        const date = new Date(script.updated || script.created || Date.now());
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        card.innerHTML = `
          <div class="card-header">
            ${script.icon ? 
              `<img src="${script.icon}" alt="${script.name}" class="card-icon">` : 
              `<div class="card-icon-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>`
            }
            <h3 class="card-title">${script.name}</h3>
          </div>
          <div class="card-body">
            <p class="card-description">${script.description || '暂无描述'}</p>
            <div class="card-meta">
              <div class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                ${formattedDate}
              </div>
              ${script.category ? `
                <div class="meta-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  ${script.category}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="card-footer">
            <a href="detail.html?id=${script.id}" class="detail-link">查看详情</a>
            <a href="${script.url}" class="download-link" download="">下载脚本</a>
          </div>
        `;
        
        scriptGrid.appendChild(card);
      });
      
      // 设置分类筛选
      setupCategoryFilter(categories);
      // 设置搜索功能
      setupSearch();
    })
    .catch(error => {
      console.error('加载脚本列表失败:', error);
      document.getElementById('script-grid').innerHTML = `
        <div class="script-card error-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <h3>加载失败</h3>
          <p>无法加载脚本列表，请稍后再试。</p>
        </div>
      `;
    });
}

// 渲染脚本详情
function renderScriptDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const scriptId = urlParams.get('id');
  
  if (!scriptId) {
    document.getElementById('script-detail').innerHTML = '<p>找不到脚本信息</p>';
    return;
  }
  
  fetch('metadata.json')
    .then(response => response.json())
    .then(data => {
      const script = data.find(script => script.id === scriptId);
      
      if (!script) {
        document.getElementById('script-detail').innerHTML = '<p>找不到脚本信息</p>';
        return;
      }
      
      // 设置页面标题
      document.title = `${script.name} - 脚本详情`;
      
      // 加载脚本内容
      fetch(script.url)
        .then(response => response.text())
        .then(content => {
          const scriptDetail = document.getElementById('script-detail');
          
          // 格式化日期
          const dateFormatter = (dateStr) => {
            if (!dateStr) return '未知';
            const date = new Date(dateStr);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          };
          
          scriptDetail.innerHTML = `
            <div class="script-header">
              <div class="script-header-left">
                ${script.icon ? 
                  `<img src="${script.icon}" alt="${script.name}" class="script-icon">` : 
                  `<div class="script-icon-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>`
                }
                <div class="script-info">
                  <h2>${script.name}</h2>
                  <p class="script-description">${script.description || '暂无详细描述'}</p>
                </div>
              </div>
              <div class="script-actions">
                <a href="${script.url}" class="download-button" download="">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  下载脚本
                </a>
              </div>
            </div>
            
            <div class="metadata-section">
              <h3>脚本信息</h3>
              <div class="metadata-grid">
                <div class="metadata-item">
                  <span class="metadata-label">版本</span>
                  <span class="metadata-value">${script.version || '未知'}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">作者</span>
                  <span class="metadata-value">${script.author || '未知'}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">分类</span>
                  <span class="metadata-value">${script.category || '未分类'}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">更新日期</span>
                  <span class="metadata-value">${dateFormatter(script.updated)}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">创建日期</span>
                  <span class="metadata-value">${dateFormatter(script.created)}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">许可证</span>
                  <span class="metadata-value">${script.license || '未知'}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">主页</span>
                  <span class="metadata-value break-all">
                    ${script.homepage ? `<a href="${script.homepage}" target="_blank">${script.homepage}</a>` : '无'}
                  </span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">支持站点</span>
                  <span class="metadata-value break-all">
                    ${script.matches ? script.matches.join('\n') : '未知'}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="code-section">
              <div class="code-header">
                <h3>脚本代码</h3>
                <button id="copy-button" class="copy-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  复制代码
                </button>
              </div>
              <div class="code-block">
                <pre id="script-code"><code>${escapeHtml(content)}</code></pre>
              </div>
            </div>
          `;
          
          // 添加复制按钮功能
          setupCopyButton();
          // 初始化代码高亮
          initializeCodeHighlight();
        })
        .catch(error => {
          console.error('加载脚本内容失败:', error);
          const scriptDetail = document.getElementById('script-detail');
          
          scriptDetail.innerHTML = `
            <div class="script-header">
              <div class="script-header-left">
                ${script.icon ? 
                  `<img src="${script.icon}" alt="${script.name}" class="script-icon">` : 
                  `<div class="script-icon-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>`
                }
                <div class="script-info">
                  <h2>${script.name}</h2>
                  <p class="script-description">${script.description || '暂无详细描述'}</p>
                </div>
              </div>
              <div class="script-actions">
                <a href="${script.url}" class="download-button" download="">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  下载脚本
                </a>
              </div>
            </div>
            <div class="metadata-section">
              <h3>脚本信息</h3>
              <p style="color: #f43f5e; margin-top: 10px;">无法加载脚本内容，请直接下载查看。</p>
            </div>
          `;
        });
    })
    .catch(error => {
      console.error('加载脚本详情失败:', error);
      document.getElementById('script-detail').innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <p>加载脚本详情失败，请稍后再试。</p>
        </div>
      `;
    });
}

// 搜索功能
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  
  if (!searchInput) {
    return;
  }
  
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.script-card');
    
    if (!searchTerm) {
      // 搜索框为空时，显示所有卡片
      cards.forEach(card => {
        card.style.display = 'block';
      });
      return;
    }
    
    cards.forEach(card => {
      const title = card.querySelector('.card-title').textContent.toLowerCase();
      const description = card.querySelector('.card-description').textContent.toLowerCase();
      const category = card.getAttribute('data-category').toLowerCase();
      
      if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}

// 分类筛选功能
function setupCategoryFilter(categories) {
  const filterSelect = document.getElementById('category-filter');
  
  if (!filterSelect || !categories || categories.length === 0) {
    return;
  }
  
  // 添加所有分类选项
  filterSelect.innerHTML = '<option value="all">全部分类</option>';
  
  categories.forEach(category => {
    if (category && category.trim()) {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      filterSelect.appendChild(option);
    }
  });
  
  // 添加筛选事件
  filterSelect.addEventListener('change', function() {
    const selectedCategory = this.value;
    const cards = document.querySelectorAll('.script-card');
    
    if (selectedCategory === 'all') {
      // 显示所有卡片
      cards.forEach(card => {
        card.style.display = 'block';
      });
    } else {
      // 根据分类筛选
      cards.forEach(card => {
        if (card.getAttribute('data-category') === selectedCategory) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  });
}

// 复制按钮功能
function setupCopyButton() {
  const copyButton = document.getElementById('copy-button');
  const codeBlock = document.getElementById('script-code');
  
  if (!copyButton || !codeBlock) {
    return;
  }
  
  copyButton.addEventListener('click', function() {
    const textToCopy = codeBlock.textContent;
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // 显示复制成功提示
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          复制成功
        `;
        copyButton.classList.add('copied');
        
        // 3秒后恢复原状
        setTimeout(() => {
          copyButton.innerHTML = originalText;
          copyButton.classList.remove('copied');
        }, 3000);
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  });
}

// 初始化代码高亮
function initializeCodeHighlight() {
  // 如果页面已加载Prism.js，则初始化代码高亮
  if (window.Prism && document.querySelector('.code-block pre code')) {
    Prism.highlightAll();
  }
}

// HTML转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 返回首页功能
function setupBackButton() {
  const backButton = document.getElementById('back-button');
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      window.location.href = 'index.html';
    });
  }
}

// 页面加载时执行
window.addEventListener('DOMContentLoaded', function() {
  // 设置返回按钮功能
  setupBackButton();
  
  // 渲染脚本列表或详情页
  if (document.getElementById('script-grid')) {
    renderScriptList();
  } else if (document.getElementById('script-detail')) {
    renderScriptDetail();
  }
});