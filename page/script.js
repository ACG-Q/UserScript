// script.js
document.addEventListener('DOMContentLoaded', () => {
  const scriptList = document.getElementById('scriptList');
  const mainContent = document.getElementById('mainContent');
  const detailPage = document.getElementById('detailPage');
  const backButton = document.getElementById('backButton');
  const detailTitle = document.getElementById('detailTitle');
  const detailContent = document.getElementById('detailContent');

  // 渲染脚本列表
  function renderScriptList() {
    scriptList.innerHTML = scripts
      .map((script, index) => `
        <tr class="script-row" data-script-id="${script.id}">
          <td>${index + 1}</td>
          <td>
            ${script.icon ? `<img src="${script.icon}" alt="Icon" class="icon">` : ''}
            ${script.name}
          </td>
          <td class="description" title="${script.description}">${script.description}</td>
          <td>${script.author}</td>
          <td>${script.version}</td>
          <td><a href="${script.downloadLink}" class="download-link">Download</a></td>
        </tr>
      `)
      .join('');
  }

  // 渲染脚本详情页面
  function renderScriptDetail(scriptId) {
    const script = scripts.find(s => s.id == scriptId);
    if (script) {
      detailTitle.textContent = script.name;
      detailContent.innerHTML = `
        <p><strong>Description:</strong> ${script.description}</p>
        <p><strong>Author:</strong> ${script.author}</p>
        <p><strong>Version:</strong> ${script.version}</p>
        <p><strong>Content:</strong></p>
        <pre>${script.content}</pre>
      `;
      mainContent.classList.add('hidden');
      detailPage.classList.remove('hidden');
    }
  }

  // 初始化：渲染脚本列表
  renderScriptList();

  // 点击脚本行，进入二级页面
  scriptList.addEventListener('click', (event) => {
    const row = event.target.closest('.script-row');
    if (row) {
      const scriptId = row.getAttribute('data-script-id');
      renderScriptDetail(scriptId);
    }
  });

  // 返回首页
  backButton.addEventListener('click', () => {
    detailPage.classList.add('hidden');
    mainContent.classList.remove('hidden');
  });
});