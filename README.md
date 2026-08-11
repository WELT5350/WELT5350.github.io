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

背景库位于 `src/assets/backgrounds/`，其中 `welt-default.avif` 是当前默认背景。如需增加自动轮换的背景，只需将一张 `.avif`、`.webp`、`.jpg`、`.jpeg` 或 `.png` 图片放入同一目录；下一次构建会自动识别。构建时会将每张背景自动压缩为宽 1920px、质量 72 的 WebP，并按平均亮度与局部明暗跨度自动归类，应用对应的通用雾化和阅读层强度；原图只作为素材保留，因此不需要为大图手动处理。网站会按 UTC 日期从背景库中选择当天背景，不显示访客设置入口，切页时保持不变。`public/bg.*` 是旧版静态背景资源，不参与当前轮换。

文章 frontmatter 需要包含 `title`、`description` 与 `pubDate`，可选 `tags` 和 `draft`。推送到 `main` 后，GitHub Actions 会先执行类型检查与构建，再部署。
