# WELT Blog

基于 Astro、Tailwind CSS 构建的静态个人博客，部署至 GitHub Pages。

https://welt5350.github.io/

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

背景库位于 `src/assets/backgrounds/`，其中 `welt-default.avif` 是当前默认背景。如需增加自动轮换的背景，只需将一张 `.avif`、`.webp`、`.jpg`、`.jpeg` 或 `.png` 图片放入同一目录；下一次构建会自动识别。构建时会将每张背景自动压缩为宽 1920px、质量 72 的 WebP，原图只作为素材保留，因此不需要为大图手动处理。每次完整刷新会随机选择一张背景，并避免在同一标签页连续重复；站内切页则保持当前背景，不显示访客设置入口。文件名含 `dream` 的背景是梦境层专用，**不参与首页轮换**。

## 梦境层（互动解谜）

首页的夜间星标 ✦（仅暗色模式下亮起、可点击）是梦境层的入口，通往 `/dream` 梦境之门，再进入线性房间串 `/dream/[slug]`：解开当前房间才能解锁下一间。全部为静态实现——玩家进度存于访客浏览器 localStorage（键 `welt-dream-state`），无后端、无账号、无同步。

### 新增一个谜题房间

1. 在 `src/content/dream/` 新建 Markdown，frontmatter 需包含：
   - `order`：房间顺序（线性推进依据）
   - `title` / `description`：房间标题与简介
   - `answerHash`：答案的 SHA-256，用 `node scripts/hash-answer.mjs "答案"` 生成（客户端会忽略大小写、首尾空格与全半角差异）
   - `hints`：可选，渐进提示数组，每个提示对应一个提示按钮
2. 正文即剧情文本。保存后 `astro dev` 会自动生成新房间页面，无需改路由。

### 梦境氛围

- **背景**：`src/assets/backgrounds/` 中文件名含 `dream` 的图片会被自动用作梦境专用背景（且不参与首页轮换）；没有则回退到背景库最后一张。切换背景会自动换图并保持到离开梦境。
- **BGM**：`src/scripts/dream-bgm.ts` 顶部的 `SONG_ID` 是网易云曲目 ID，改它即可换曲。BGM 通过 `transition:persist` 在房间之间导航时保持播放不中断。

### 试运行房间

`room-1`（看门人）与 `room-2`（夜空）是占位试运行剧情，用于验证线性链、存档、门锁与氛围切换（答案：`welt` / `star`）。真正的序章写好后，直接替换正文或按 `order` 插入新房间即可。

文章 frontmatter 需要包含 `title`、`description` 与 `pubDate`，可选 `tags` 和 `draft`。推送到 `main` 后，GitHub Actions 会先执行类型检查与构建，再部署。

## Background workflow

Keep original wallpaper files in `src/assets/backgrounds-source/` (this folder is local-only and ignored by Git). Then run:

```bash
npm run backgrounds:prepare
```

The command produces a tracked WebP in `src/assets/backgrounds/`, preserving the source filename, limiting the longest edge to 3840px and using quality 86. It fails if a generated file exceeds 5 MiB. Review and commit only the generated WebP; the rotating background component automatically discovers it on the next build.
