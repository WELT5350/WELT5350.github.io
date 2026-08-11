# WELT Blog

基于 Astro、Tailwind CSS 构建的静态个人博客，部署至 GitHub Pages。

## 本地开发

```bash
npm ci
npm run dev
```

默认访问地址为 `http://127.0.0.1:4321/`。

## 发布前检查

```bash
npm run check
npm run build
```

`check` 运行 Astro 与 TypeScript 诊断；`build` 生成 `dist/` 中的静态页面、RSS 与站点地图。

## 内容与结构

- 文章：`src/content/posts/*.md`
- 路由页面：`src/pages/`
- 全站布局与主题：`src/layouts/`、`src/styles/global.css`
- GitHub Pages 工作流：`.github/workflows/deploy.yml`

## 背景轮换

默认背景保留在 `public/bg.*`。如需增加自动轮换的背景，只需将一张 `.avif`、`.webp`、`.jpg`、`.jpeg` 或 `.png` 图片放入 `src/assets/backgrounds/`；下一次构建会自动识别。网站会按 UTC 日期在默认背景与这些图片之间选择当天背景，不显示访客设置入口，切页时保持不变。

文章 frontmatter 需要包含 `title`、`description` 与 `pubDate`，可选 `tags` 和 `draft`。推送到 `main` 后，GitHub Actions 会先执行类型检查与构建，再部署。
