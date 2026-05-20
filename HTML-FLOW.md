# HTML-FLOW — Step 3 渲染 + Step 4 沉淀完整流程

> Step 3 不在终端逐轮提问，而是生成一个本地交互 HTML。本文是渲染、用户操作、取回数据、沉淀的完整流程。

---

## Step 3 — HTML 交互模式

### 3.1 生成 HTML（agent 端）

1. **抽 3 张卡**（详见 [CARDS-FORMAT.md](./CARDS-FORMAT.md#抽卡规则)）

2. **填字段**（详见 [CARDS-FORMAT.md](./CARDS-FORMAT.md#输出3-张卡--4-字段)）：`logic` / `reading` / `questions[3]`

3. **组装 payload**（落到 `/tmp/slow-thinking-payload.json`）：

   ```json
   {
     "date": "YYYY-MM-DD",
     "identity": "AI解决方案专家",
     "source": { "stories": [...] },
     "source_html": "<ol>...</ol>",
     "cards": [ { id, name, tagline, logic, reading, questions } x3 ]
   }
   ```

4. **渲染**：
   ```bash
   node <SKILL_DIR>/scripts/render.mjs --data /tmp/slow-thinking-payload.json
   ```
   stdout 最后一行就是生成好的 HTML 绝对路径。

5. **打开浏览器**：
   - macOS：`open <html>`
   - Linux：`xdg-open <html>`
   - Windows：`start <html>`

6. **登记今日卡 ID**：
   ```bash
   node <SKILL_DIR>/scripts/state.mjs remember-cards <id1>,<id2>,<id3>
   ```

### 3.2 用户在 HTML 中操作

- 3 张卡以翻牌动画并排展示
- 点任一张 → 该卡占满整行，另外两张折叠消失
- 展开后 5 个区域（前 2 只读，后 3 用户填）：
  1. 📐 **底层逻辑**（只读）
  2. 🎯 **本事件解读**（只读）
  3. ❓ **三个追问** — 每题一个 textarea
  4. 💡 **我的核心感悟（一句话）** — textarea
  5. 🌱 **留给明天的钩子**（可选）— textarea
- 左下角 **「🔄 换一张卡」** 折叠当前选择
- 右下角 **「💾 保存今日思考」** 触发下载

### 3.3 取回数据（agent 端）

用户在浏览器点了 💾 → JSON 自动下载到 `~/Downloads/slow-thinking-YYYY-MM-DD.json`。

用户回到对话说"完成了"/"写完了"/"done"/"保存了" 等任意意思 → agent 立即跑 Step 4。

如果 JSON 找不到：提示用户检查 Downloads 目录（Safari/Chrome 默认路径），或问用户是否要重新保存。

---

## Step 4 — 沉淀

### A. 一条命令 = markdown + Obsidian 同步

```bash
node <SKILL_DIR>/scripts/sediment.mjs --result ~/Downloads/slow-thinking-YYYY-MM-DD.json
```

行为：
- **stdout** 输出完整 markdown（agent 直接展示给用户作为本次总结）
- 自动检测 `~/Desktop/AI资讯积累/思考跑步机/`（用户可在 setup 时改）→ 存在则写入 `<date>.md`
- 自定义路径：`--obsidian <dir>` 覆盖
- 最后一行的 `<!-- SLOW_THINKING_RESULT {...} -->` 注释里给出 `obsidian_path`

### B. 飞书镜像（可选）

仅当满足全部条件时执行：
- 当前平台是 Claude Code 且 `lark-doc` skill 可用
- `state.mjs get` 里 `feishu` 字段不是 `disabled`（setup 阶段决定）

流程：
1. 看 `feishu_doc_token` 是否已存在
2. 不存在 → 用 `lark-doc` 创建「思考跑步机 · <用户名>」，把 token 回写：`state.mjs set feishu_doc_token <token>`
3. 存在 → 用 `lark-doc` 把上一步的 markdown 追加到该文档末尾

在 Codex / 无 lark-cli / 用户在 setup 阶段关掉飞书的情况下：直接跳过本步。

### C. 完成提示

```
✅ 今日思考已沉淀
📁 Obsidian: 思考跑步机/YYYY-MM-DD.md
📄 飞书: [链接 / 已跳过]

明天见，思考肌肉 +1 💪
```

---

## sediment.mjs 输出示例（节选）

```markdown
---
date: 2026-05-20
identity: AI解决方案专家
thinking_card: 🔬 第一性原理
tags: [思考跑步机, 刻意思考]
---

# 🏃 思考跑步机 · 2026-05-20

> 今日身份：**AI解决方案专家** ｜ 思考卡片：**🔬 第一性原理** — *剥到不能再剥*

## 📰 今日素材

- 🥇 Rank #1 **[Everything in C is undefined behavior](https://...)** · 84 points / 35 comments

## 📐 底层逻辑

把现象拆到最基本的事实，再从这些事实重新推导...

## 🎯 本事件解读（AI解决方案专家 视角）

作为 AI 解决方案专家，这意味着...

## 💡 思考对话

### Q1. ...
[用户原话]

## 🎯 今日 Take-away
> [用户填的一句话]

## 🌱 留给明天的钩子
[用户填的钩子]
```
