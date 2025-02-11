# UserScript Repository

本仓库用于管理油猴脚本，通过 GitHub Actions 自动化处理脚本的格式化、元信息提取和页面生成。

## 使用方法

1. 将油猴脚本文件（`.user.js`）提交到 `scripts` 目录。
2. 提交更改后，GitHub Actions 会自动运行，完成以下步骤：
   - 格式化脚本
   - 提取元信息并生成 `metadata.json`
   - 生成管理页面 `page/index.html`
3. 访问生成的管理页面，查看脚本列表并下载脚本。