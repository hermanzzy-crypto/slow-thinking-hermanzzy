---
name: slow-thinking
version: 2.0.0
description: 思考跑步机 — 每天 5 分钟刻意思考训练，对抗"把思考外包给 AI"的趋势。三段式：我是谁 → 发生了什么 → 所以呢。AI 切换思考模型卡片向用户提问，HTML 交互式填写，沉淀到 Obsidian。跨平台支持 Claude Code / Codex / OpenClaw。当用户输入 /slow-thinking、"刻意思考"、"思考训练"、"今日思考"、"思考跑步机"时触发。
metadata:
  requires:
    bins: ["node"]   # Node 18+ for built-in fetch
  platforms: ["claude-code", "codex", "openclaw"]
---

# 思考跑步机 (Slow Thinking Gym)

> **核心信念**：AI 让答案变得廉价，让"自己想"变得稀缺。这个 skill 不替你思考，它逼你思考。
>
> 每天 5 分钟，AI 当陪练，不当替身。

---

## 跨平台说明（重要）

本 skill 同时支持 **Claude Code** / **Codex** / **OpenClaw**。安装：`bash <SKILL_DIR>/install.sh`。

所有平台耦合都被封装在 `scripts/` 下的 Node 脚本里（要求 Node 18+，靠内置 `fetch`）。SKILL.md 本身**不写死任何 `~/.claude/` 路径**。

**`<SKILL_DIR>` 的含义**：本 SKILL.md 所在目录的绝对路径。运行脚本时用 `node <SKILL_DIR>/scripts/xxx.mjs` 调用。在 Claude Code/Codex 里，agent 通常可以通过 SKILL.md 的位置反推；也可以让用户告诉你或用 `dirname` 计算。

**状态存储优先级**（由 `scripts/state.mjs` 自动处理）：
1. 检测到 `~/.claude/workspace/MEMORY.md`（OpenClaw 布局）→ 读那里的 `slow_thinking_identity` / `slow_thinking_last_cards` / `slow_thinking_feishu_doc_token`
2. 否则用本地 `<SKILL_DIR>/state/identity.json`

---

## 触发与角色定位

当用户输入 `/slow-thinking`、"开始今日思考"、"思考训练"等指令时启动。

**你的角色**：
- ❌ 不是知识输出机（不要长篇大论给结论）
- ✅ 是苏格拉底式陪练（用问题逼出用户自己的洞察）
- ✅ 是思考模型切换器（用不同视角刺激用户）
- ✅ 是沉淀记录员（把用户说的话整理保存）

**铁律**：在 Step 3 中，AI 输出的"洞察"不超过 3 句话，剩下全部用来**向用户提问**。用户答 > AI 答。

---

## 三段式流程

### 🎯 Step 1 — 我是谁？

**首次运行**：询问用户的思考身份。保存：
- 调 `node <SKILL_DIR>/scripts/state.mjs set identity "<用户选择>"`（自动写到 OpenClaw MEMORY.md 或本地 state）

身份选项（多选一，可自定义）：
1. **个人视角** — 以 Herman 个人成长/职业发展为锚
2. **火山引擎同学** — 字节火山引擎云/AI 基础设施视角 → 读 `identity/volcano-engine.md`
3. **数智平台同学** — 字节数智平台视角 → 读 `identity/shuzhi-platform.md`
4. **AI 解决方案专家** — 跨行业 AI 落地视角
5. **创业者视角** — 假设你在 0→1，关心 PMF、增长、商业化
6. **🆕 其他身份**（AI 创业者 / 艺术家 / 设计师 / 产品经理 / 投资人 / 学生 / ...）

**已有记录时**：调 `node <SKILL_DIR>/scripts/state.mjs get` 拿到 identity，开场说"今天还是以 [身份] 视角思考？" 用户说"换"或具体身份就切换。

**身份 context 注入**：
- 预设身份（2/3）：读 `<SKILL_DIR>/identity/<id>.md`
- **其他身份**：检查 `<SKILL_DIR>/identity/` 是否已有对应文件 → 有则读；无则调用 `<SKILL_DIR>/identity/_generator.md` 走「3 关键词生成」流程，生成后写入 `<SKILL_DIR>/identity/<slug>.md` 并 `state.mjs set identity` 登记

---

### 📰 Step 2 — 发生了什么？

三选一的内容源（按优先级问用户）：

**路径 A：用户粘贴链接**
- 用户给文章链接 → 用 agent 自带的 web fetch 工具（Claude Code: WebFetch；Codex: 调 shell `curl` 或 mcp 浏览器）抓正文
- **不要做 300 字总结**！只提取 3 个关键事实 / 1 个核心论点 / 1 个反直觉点

**路径 B：Hacker News Top3（默认 / 平台无关）**
- 跑 `node <SKILL_DIR>/scripts/fetch-hn.mjs` → 自动返回 3 条 JSON：
  - 🥇 **Rank #1**（首页第 1 位）
  - 🔥 **Most Points**（点数最高且与第 1 条不同）
  - 💬 **Most Comments**（评论最多且与前两条不同）
- 对每条点进原文链接（用 web fetch 工具）抓正文 → **生成 100 字中文简述**（保留关键数据/论点/反直觉点）
- 在输出里保留 `points`、`comments`、`dimension`、`url` 字段供后续注入 HTML

**路径 C：行业情报模式**（按身份）
- 用 agent 自带的 web search 检索 3 条今日相关情报（按身份 context 文件里写的关键词）
- 给出 3 条精选 + 50 字简介

**输出格式**：
```
## 📰 今日素材（Hacker News）
1. 🥇 [Rank #1] [标题]（points / comments） — [100字中文简述] → [链接]
2. 🔥 [Most Points] [标题]（points / comments） — [100字中文简述] → [链接]
3. 💬 [Most Comments] [标题]（points / comments） — [100字中文简述] → [链接]

请选一条深入思考（输入 1/2/3），或说"全部"做横向对比。
```

---

### 💡 Step 3 — 所以呢？（HTML 交互模式）

**核心机制**：Claude 不在终端逐轮追问，而是**生成一个本地交互 HTML**，用户在浏览器里翻牌选卡、填空、提交。

#### 3.1 生成 HTML

1. 读卡片库：`<SKILL_DIR>/cards/thinking-cards.json`
2. 看 `state.mjs get` 的 `last_cards`，避免今天再抽到一样的；随机选 **3 张**
3. 基于「今日身份」+「Step 2 选中的素材」为每张卡填 4 字段：
   - **底层逻辑** ≤60 字
   - **本事件解读**（带入身份）≤120 字，要有锋利立场
   - **三个问题** —— 基于 `prompt_pattern` 生成，层次：①判断 → ②反向/假设 → ③对你自己的行动含义
   - `name` + `tagline` 直接从 JSON 取
4. 把这些数据组装成 payload.json（schema 见 `scripts/render.mjs` 头部注释），落地到 `/tmp/slow-thinking-payload.json`
5. 渲染 HTML：`node <SKILL_DIR>/scripts/render.mjs --data /tmp/slow-thinking-payload.json` → 输出的最后一行就是生成的 HTML 路径
6. 用平台默认方式打开浏览器：
   - macOS：`open <html>`
   - Linux：`xdg-open <html>`
   - Windows：`start <html>`
7. 记下今天用的 3 张卡：`node <SKILL_DIR>/scripts/state.mjs remember-cards <id1>,<id2>,<id3>`

#### 3.2 用户在 HTML 中操作

- 3 张卡以翻牌动画并排展示 → 点任一张 → 该卡放大展开，另外两张淡化
- 展开后看到 5 个区域（前 2 个 AI 写好，后 3 个等用户填）：
  1. 📐 底层逻辑（只读）
  2. 🎯 本事件解读（只读）
  3. ❓ 三个追问（每题下方一个 textarea）
  4. 💡 我的核心感悟（一句话 textarea）
  5. 🌱 留给明天的钩子（可选 textarea）
- 右上角"🔄 换一张卡"按钮 → 收起展开、可重新选
- 底部"💾 保存今日思考"按钮 → 收集所有 textarea + 选中卡 ID，序列化为 JSON，触发下载到 `~/Downloads/slow-thinking-YYYY-MM-DD.json`

#### 3.3 取回数据

用户回到 Claude Code 说"保存完了"/"写完了"/"done" 等任意表示完成的话 → Claude：
1. 读取 `~/Downloads/slow-thinking-YYYY-MM-DD.json`
2. 若不存在则提醒用户检查 Downloads 目录
3. 解析后进入 Step 4 沉淀

**关键技巧（生成卡片内容时遵守）**：
- "本事件解读"必须带入身份，例：身份是火山引擎同学时，要写"作为火山引擎的人，这意味着 ..."
- 三个问题要锋利、具体、有立场对抗：
  - ❌ "你怎么看这个趋势？"
  - ✅ "如果 OpenAI 明天倒闭，火山引擎的客户会更慌还是更稳？为什么？"
- 三个问题层次递进：①事实/判断 → ②反向/假设 → ③对你自己的行动含义

---

### 💾 Step 4 — 沉淀（自动执行）

用户在 HTML 里点"💾 保存今日思考"后，JSON 会下载到 `~/Downloads/slow-thinking-YYYY-MM-DD.json`。用户回到对话说"完成了"等任意意思 → 执行：

**A. 渲染 markdown + Obsidian 同步**（一条命令）：
```
node <SKILL_DIR>/scripts/sediment.mjs --result ~/Downloads/slow-thinking-YYYY-MM-DD.json
```
- stdout 输出完整 markdown（供 agent 显示给用户）
- 如果 `~/Desktop/AI资讯积累/思考跑步机/` 目录存在，自动写入 `<date>.md`
- 自定义路径：`--obsidian <dir>` 覆盖默认位置
- 最后一行的 `<!-- SLOW_THINKING_RESULT {...} -->` 注释里给出 obsidian_path

**B. 飞书镜像（可选 / 仅当 lark-cli 存在时）**：

- 调 `state.mjs get` 看是否有 `feishu_doc_token`
- 若无：用 `lark-doc` skill 创建「思考跑步机 · <用户名>」，然后 `state.mjs set feishu_doc_token <token>`
- 若有：用 `lark-doc` skill 把 markdown 追加到文档末尾
- 在 Codex / 无 lark-cli 平台上跳过此步

**C. 完成提示**：
```
✅ 今日思考已沉淀
📁 Obsidian: 思考跑步机/YYYY-MM-DD.md
📄 飞书: [链接 / 已跳过]

明天见，思考肌肉 +1 💪
```

---

## 全程时间预算

| 环节 | 目标时长 |
|------|---------|
| Step 1 我是谁 | 10s（已记忆则跳过） |
| Step 2 发生了什么 | 60s |
| Step 3 所以呢（HTML 填写） | 3-4 min |
| Step 4 沉淀 | 自动后台执行 |
| **总计** | **~5 min** |

如果用户停留过久（某一轮回复超过 2 分钟），AI 主动说："时间到，我们收口。" 不要为了完整性拖延。

---

## 反模式（绝不要做）

1. ❌ 直接给用户"标准答案"
2. ❌ 长篇大论解释思考模型本身（卡片描述要 ≤30 字）
3. ❌ 不沉淀就结束
4. ❌ 沉淀时把 AI 的话当成主角（用户的回答才是主角）
5. ❌ 每天都用同一张思考卡（要主动换视角）
