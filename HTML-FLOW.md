# HTML-FLOW — Step 3 渲染 + Step 4 沉淀完整流程

> Step 3 不在终端逐轮提问，而是起一个**本地服务**渲染交互 HTML。用户点保存 → 浏览器直接把结果
> POST 回服务 → 服务把 markdown 写进 Obsidian → 服务退出。**不再下载 JSON 文件。**

---

## Step 3 — HTML 交互模式（服务直存）

### 3.1 起服务 + 渲染（agent 端）

1. **抽 3 张卡**（详见 [CARDS-FORMAT.md](./CARDS-FORMAT.md#抽卡规则智能匹配非随机)）

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

4. **后台启动本地服务**（渲染 + 接住保存）：
   ```bash
   node <SKILL_DIR>/scripts/serve.mjs --data /tmp/slow-thinking-payload.json --obsidian <用户的 Obsidian 目录>
   ```
   - 用**后台方式**运行（Claude Code 用 `run_in_background` 的 Bash）
   - `--obsidian` 传 `state.mjs get` 里的 `obsidian_dir`；若该值为 `disabled` 则不传
   - 服务就绪后：stdout 打印 `URL http://127.0.0.1:<port>`，同时把 URL 写入
     `<tmpdir>/slow-thinking/serve-url.txt`

5. **打开浏览器**指向那个 URL（从 stdout 或 `serve-url.txt` 取）：
   - macOS：`open http://127.0.0.1:<port>`
   - Linux：`xdg-open <url>`／Windows：`start <url>`

6. **登记今日卡 ID**：
   ```bash
   node <SKILL_DIR>/scripts/state.mjs remember-cards <id1>,<id2>,<id3>
   ```

> 旧的 `render.mjs`（只渲染、不起服务）仍保留，用于调试或纯静态预览。日常流程一律走 `serve.mjs`。

### 3.2 用户在 HTML 中操作

- 3 张卡以**手风琴列表**纵向排列，默认展开第 1 张
- 点卡头展开/折叠；同时只展开一张（手风琴），已填内容始终保留
- 每张卡展开后 5 个区域（前 2 只读，后 3 用户填）：
  1. 📐 **底层逻辑**（只读）
  2. 🎯 **本事件解读**（只读）
  3. ❓ **三个追问** — 每题一个 textarea（随内容自增高）
  4. 💡 **这张卡的核心感悟（一句话 · 可选）** — textarea
  5. 🌱 **留给明天的钩子**（可选）— textarea
- 卡内底部有 **「← 上一张」/「下一张卡 →」** 导航，引导用户**依次走完 3 张卡**
- 每张卡头有状态徽标：`未作答` / `已答 N/3` / `✓ 已完成`
- 底部全局区：**实时进度条**「已动笔 2/3 张卡」+ 两个按钮 **「📋 复制结果」**｜**「💾 保存今日思考」**
- **一次保存收录所有动过笔的卡**（不是每卡独立保存）；所有填写项均为可选，至少填 1 处即可保存
- 支持 `Cmd/Ctrl + S` 快捷键保存
- 输入实时写入 `localStorage`，**误关页面重开可自动恢复草稿**

### 3.3 取回数据（agent 端）

用户在浏览器点 💾 → 浏览器把结果 **POST 到本地服务** → 服务调 `sediment.mjs` 把
`<date>.md` **直接写进 Obsidian**，全程不下载任何文件。HTML 上显示绿色「已存入 Obsidian」面板。

服务随后在 stdout 打印 `SAVED <obsidian_path>` 并**自行退出**：

- **后台服务进程退出 = 保存完成信号**。Claude Code 里 `run_in_background` 的 Bash 任务结束会自动通知 agent，
  agent 据此进入 Step 4，**不需要用户开口说"完成了"**。
- 服务把原始结果留一份在 `<tmpdir>/slow-thinking/result-latest.json`，供 agent 做飞书镜像。
- 用户 45 分钟内没保存 → 服务打印 `TIMEOUT` 退出，agent 据此知道本次未完成。

**兜底**：服务没起来 / 用户用 `file://` 直接打开了 HTML → 保存按钮自动回退为「下载 JSON 到
`~/Downloads/slow-thinking-<date>-<HHMMSS>.json`」。此时走老链路：用户说"完成了" → `sediment.mjs --latest`；
或用户点 HTML 的「📋 复制结果」把 JSON 粘回对话 → 存到 `/tmp/slow-thinking-result.json` → `sediment.mjs --result <该文件>`。

---

## Step 4 — 沉淀

### A. 服务模式（默认）：保存即沉淀

用户点保存的那一刻，本地服务已经做完沉淀 —— 调 `sediment.mjs` 把 markdown 写入 Obsidian `<date>.md`。
agent 在后台服务退出后只需收尾：

1. 读 `<tmpdir>/slow-thinking/result-latest.json` 拿到本次结果
2. 读 Obsidian 里的 `<date>.md` 作为总结展示给用户
3. 执行可选的飞书镜像（见 B）

### A'. 兜底模式：用户下载了 JSON

仅当走了下载兜底时，用户说"完成了"后手动跑：

```bash
node <SKILL_DIR>/scripts/sediment.mjs --latest                       # 自动取 ~/Downloads 最新
node <SKILL_DIR>/scripts/sediment.mjs --result /tmp/slow-thinking-result.json   # 复制粘贴回来的
```

`sediment.mjs` 行为：
- `--latest` 扫描 `~/Downloads` 里所有 `slow-thinking-*.json`，按修改时间取最新一份（可加日期过滤）
- **stdout** 输出完整 markdown，**stderr** 打印实际用到的文件路径
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

## 结果 payload 结构（HTML → 服务）

用户保存时，HTML POST 的 JSON 是**多卡结构**（只收录动过笔的卡）：

```json
{
  "date": "YYYY-MM-DD",
  "identity": "AI解决方案专家",
  "source": { "stories": [...] },
  "entries": [
    {
      "card": { "id", "name", "tagline", "logic", "reading", "questions": [q1,q2,q3] },
      "answers": ["答1", "答2", "答3"],
      "insight": "这张卡的一句话感悟",
      "hook": "留给明天的钩子"
    }
    // ...每张动过笔的卡一个 entry
  ],
  "saved_at": "ISO 时间戳"
}
```

> `sediment.mjs` 同时兼容旧的单卡结构（`card`/`answers`/`insight`/`hook`）。

## sediment.mjs 输出示例（节选）

```markdown
---
date: 2026-05-20
identity: AI解决方案专家
thinking_cards: [🔬 第一性原理, 🔄 逆向思维, 🎲 第二层思考]
tags: [思考跑步机, 刻意思考]
---

# 🏃 思考跑步机 · 2026-05-20

> 今日身份：**AI解决方案专家** ｜ 走过 3 张思考卡：🔬 第一性原理 / 🔄 逆向思维 / 🎲 第二层思考

## 📰 今日素材

- 🥇 Rank #1 **[Everything in C is undefined behavior](https://...)** · 84 points / 35 comments

---

## 1. 🔬 第一性原理 — *剥到不能再剥*

### 📐 底层逻辑
...
### 🎯 本事件解读（AI解决方案专家 视角）
...
### 💡 思考对话
#### Q1. ...
[用户原话]
### 🎯 这张卡的 Take-away
> [用户填的一句话]
### 🌱 留给明天的钩子
[钩子]

---

## 2. 🔄 逆向思维 — *不问怎么成，问怎么败*
...（同上结构，每张走过的卡一节）
```
