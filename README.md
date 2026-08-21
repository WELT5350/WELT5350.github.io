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

背景库位于 `src/assets/backgrounds/`，其中 `welt-default.avif` 是当前默认背景。如需增加自动轮换的背景，只需将一张 `.avif`、`.webp`、`.jpg`、`.jpeg` 或 `.png` 图片放入同一目录；下一次构建会自动识别。构建时会将每张背景自动压缩为宽 1920px、质量 72 的 WebP，原图只作为素材保留，因此不需要为大图手动处理。每次完整刷新会随机选择一张背景，并避免在同一标签页连续重复；站内切页则保持当前背景，不显示访客设置入口。

文章 frontmatter 需要包含 `title`、`description` 与 `pubDate`，可选 `tags` 和 `draft`。推送到 `main` 后，GitHub Actions 会先执行类型检查与构建，再部署。

## Background workflow

Keep original wallpaper files in `src/assets/backgrounds-source/` (this folder is local-only and ignored by Git). Then run:

```bash
npm run backgrounds:prepare
```

The command produces a tracked WebP in `src/assets/backgrounds/`, preserving the source filename, limiting the longest edge to 3840px and using quality 86. It fails if a generated file exceeds 5 MiB. Review and commit only the generated WebP; the rotating background component automatically discovers it on the next build.
