# PIKE Blog

一个基于 Astro 的中文个人博客，走亮色、橙色、杂志 / 电影海报风。

正式网址：`https://pike199761.github.io`

## 本地运行

```bash
npm install
npm run dev
```

## 写新文章

在 `src/content/blog/` 新建 Markdown 文件：

```md
---
title: "文章标题"
description: "一句话简介"
pubDate: 2026-09-11
tags: ["随笔"]
---

正文。
```

## 发布

推送到 GitHub 仓库 `pike199761/pike199761.github.io` 的 `main` 分支后，GitHub Actions 会自动构建并发布到 Pages。
