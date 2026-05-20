# PLATFORMS — 跨平台说明 / 状态存储 / 安装

> 本 skill 同时支持 **Claude Code**、**Codex**、**OpenClaw**。所有平台耦合封装在 `scripts/` 下的 Node 脚本里。

---

## 安装

一行命令搞定（idempotent，重复跑也安全）：

```bash
bash <SKILL_DIR>/install.sh
```

行为：
- 检测 `~/.claude/skills/` 存在 → symlink 主 skill 和 `setup-slow-thinking`
- 检测 `~/.codex/skills/` 存在 → symlink 同上
- 检测 `~/.claude/workspace/MEMORY.md`（OpenClaw 标志）→ 提示将走 OpenClaw 存储
- 检查 Node.js 18+

**装完后必须跑一次 `/setup-slow-thinking` 做首次配置**。

---

## `<SKILL_DIR>` 是什么？

= 本 SKILL.md 所在目录的绝对路径（symlink 解析后）。

- Claude Code/Codex 里通常 = `~/.claude/skills/slow-thinking` 或 `~/.codex/skills/slow-thinking`（symlink 后真实路径会是源仓库）
- 脚本内部用 `import.meta.url` + `path.resolve` 自动算出，agent 不用手动传

如果 agent 不知道路径，让用户跑：
```bash
readlink -f ~/.claude/skills/slow-thinking
```

---

## 状态存储（scripts/state.mjs 的双层策略）

| 字段 | 含义 | 写在哪 |
|------|------|--------|
| `identity` | 当前/默认身份 | OpenClaw MEMORY.md（如有）+ 本地 state.json |
| `last_cards` | 上次抽过的 3 张卡 ID | 本地 state.json |
| `feishu_doc_token` | 飞书镜像文档 token | OpenClaw MEMORY.md（如有）+ 本地 state.json |
| `obsidian_dir` | Obsidian 同步路径 | 本地 state.json |
| `feishu` | 飞书镜像开关 (`enabled`/`disabled`) | 本地 state.json |

读取优先级：**OpenClaw MEMORY.md > 本地 state.json**。

### 用法

```bash
node <SKILL_DIR>/scripts/state.mjs get
# → { identity: "...", last_cards: [...], openclaw: true/false, ... }

node <SKILL_DIR>/scripts/state.mjs set identity "AI解决方案专家"
node <SKILL_DIR>/scripts/state.mjs set obsidian_dir "/Users/foo/Obsidian/思考跑步机"
node <SKILL_DIR>/scripts/state.mjs set feishu disabled
node <SKILL_DIR>/scripts/state.mjs remember-cards first-principles,inversion,contrarian
```

### OpenClaw 模式下的 MEMORY.md 行格式

在 `~/.claude/workspace/MEMORY.md` 里加这几行（setup-slow-thinking 自动处理）：

```markdown
slow_thinking_identity: AI解决方案专家
slow_thinking_feishu_doc_token: doxcnXXXXXXXXXX
```

---

## Step 2 素材源（三选一）

### A. 用户粘贴链接

用 agent 自带的 web fetch 工具：
- Claude Code → `WebFetch`
- Codex → `shell` 跑 `curl` 或调 mcp 浏览器
- 微信公众号 → 优先用本机的 wechat-reader skill（如果安装了）

抓到正文后**不写 300 字总结**，只提：
- 3 个关键事实
- 1 个核心论点
- 1 个反直觉点

### B. Hacker News Top 3（默认）

```bash
node <SKILL_DIR>/scripts/fetch-hn.mjs
```

返回 3 条 JSON：
- 🥇 `dimension: "rank"` — 首页第 1 位
- 🔥 `dimension: "points"` — 点数最高且不与上一条相同
- 💬 `dimension: "comments"` — 评论最多且不与前两条相同

对每条点进 `url` 抓正文 → 100 字中文简述（保留关键数据 / 论点 / 反直觉点）。

`--raw` 选项可输出前 30 条原始数据用于自定义筛选。

### C. 行业情报模式

用 agent 自带 web search，按身份关键词检 3 条今日相关情报。关键词在身份 context 文件 (`identity/<id>.md`) 里写明。

---

## 平台差异速查表

| 能力 | Claude Code | Codex | OpenClaw |
|------|-------------|-------|----------|
| Skill 自动加载 | ✅ | ✅ | ✅（基于 Claude Code）|
| WebFetch 内建 | ✅ | ❌（用 shell curl）| ✅ |
| MEMORY.md 状态 | 可选 | 无 | ✅ 必走 |
| 飞书镜像 (lark-doc) | ✅ 如装了 | ⚠️ 可装 lark-cli | ✅ 如装了 |
| HTML 浏览器打开 | ✅ open | ✅ open | ✅ open |
| 节点脚本 | ✅ node | ✅ node | ✅ node |

---

## 故障排查

| 症状 | 检查 |
|------|------|
| `state.mjs get` 返回空 | 跑 `/setup-slow-thinking` |
| `fetch-hn.mjs` 报错 | Node 版本 ≥18？网络能访问 `news.ycombinator.com`？ |
| HTML 渲染后浏览器没打开 | 在终端手动 `open <最后一行的路径>` |
| `~/Downloads/slow-thinking-*.json` 不存在 | 浏览器下载路径是否被改？用户是否点了保存？ |
| 飞书同步失败 | `lark-cli auth login` 是否过期？`state.mjs set feishu disabled` 临时关掉 |
