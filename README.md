# PIKE Blog

一个基于 Astro 的中文个人博客。新版以暖灰白底色、局部橙色（#FF6900）、白色文章区和系统无衬线字体为主。首页保留主标题、真实文章入口和必要导航，右侧用一个呼应句号的橙色图形建立视觉重点，不增加兴趣分区或装饰性文案。正文页采用浅色阅读底，不铺满高饱和橙色。

正式网址：`https://pike199761.github.io`

## 本地运行

```bash
npm install
npm run dev -- --background
```

后台开发服务可用 `npx astro dev status`、`npx astro dev logs` 和 `npx astro dev stop` 管理。

## 检查与预览

```bash
npm test
npm run preview
```

`npm test` 会先构建网站，再运行阅读时间、站内链接、基础页面语义、文章正文、旧链接跳转和草稿过滤等回归检查。`preview` 用于查看构建后的静态站点。

## 页面功能

- 首页直接展示最新文章；其他文章和个人简介通过导航进入。
- 文章列表支持按标题、简介、标签搜索，以及标签筛选；筛选条件保存在 URL 中。
- 文章页提供预计阅读时间、阅读进度及返回入口；有小标题时显示目录。
- 页面适配手机布局，支持键盘焦点提示和减少动态效果的系统偏好。
- 关闭 JavaScript 时仍可阅读文章、使用普通链接导航。

## 写新文章

在 `src/content/blog/` 新建 Markdown 文件：

```md
---
title: "文章标题"
description: "一句话简介"
pubDate: 2026-09-14
tags: ["随笔"]
draft: false
---

正文。
```

将 `draft` 设为 `true`，文章不会出现在列表、RSS 或公开文章路由中。

## 发布

推送到 GitHub 仓库 `pike199761/pike199761.github.io` 的 `main` 分支后，GitHub Actions 会自动构建并发布到 Pages。本地构建和预览不会修改线上网站。
