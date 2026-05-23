---
title: 'Git 入门指南'
description: '给新手朋友的版本控制简明教程'
pubDate: 2026-05-24
tags: ['Git', '教程']
---

## 什么是 Git

Git 是一个分布式版本控制系统，可以帮你跟踪代码的每一次改动。不管是一个人写项目还是团队协作，Git 都是必备技能。

## 基本操作

### 初始化仓库

```bash
git init
```

这会创建一个 `.git` 文件夹，记录所有版本信息。

### 添加与提交

```bash
git add .
git commit -m "第一次提交"
```

`add` 把改动加入暂存区，`commit` 把暂存区的改动保存为一个快照。

### 查看状态

```bash
git status
git log --oneline
```

`status` 看当前改了什么，`log` 看提交历史。

## 分支（branch）

分支是 Git 最强大的特性。你可以创建独立的分支来开发新功能，不影响主分支。

```bash
git branch feature-login
git checkout feature-login
# 或者合在一起
git checkout -b feature-login
```

## 远程仓库

把你的代码推送到 GitHub：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

## 小结

- `init` 初始化
- `add` → `commit` 保存改动
- `branch` 管理分支
- `push` / `pull` 同步远程

刚开始就记住这些，慢慢就会了！
