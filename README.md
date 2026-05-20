# 🏃 slow-thinking · 思考跑步机

> AI 让答案变得廉价，让"自己想"变得稀缺。
> 这个 skill 不替你思考，它逼你思考。

每天 5 分钟，AI 当陪练，不当替身。**跨平台 skill**：Claude Code / Codex / OpenClaw。

---

## 🚀 30 秒上手

```bash
git clone https://github.com/hermanzzy-crypto/slow-thinking-hermanzzy.git
cd slow-thinking-hermanzzy
bash install.sh
```

然后在你的 agent 里：

```
/setup-slow-thinking     # 一次性配置（身份/Obsidian/飞书/默认素材源）
/slow-thinking           # 每天 5 分钟刻意思考
```

`install.sh` 会自动 symlink 进 `~/.claude/skills/` 和 `~/.codex/skills/`，并检测 OpenClaw 布局。重复跑安全。

---

## ✨ 核心设计

**四步流程**：

| 步 | 名称 | 时长 | 关键动作 |
|---|------|------|---------|
| 1 | 🎯 我是谁？ | 10s | 用 setup 配过的默认身份；可临时换 |
| 2 | 📰 发生了什么？ | 60s | 默认抓 HN Top 3（rank/points/comments 三维度），也支持用户给链接 |
| 3 | 💡 所以呢？ | 3-4 min | **生成本地 HTML** → 浏览器里翻牌选卡 + 填空 + 保存 JSON |
| 4 | 💾 沉淀 | 自动 | sediment.mjs 一条命令产 markdown + 同步 Obsidian + 可选飞书 |

**铁律**：Step 3 中 AI 输出 ≤3 句，剩下全部用来**让用户答**。用户答 > AI 答。

---

## 🎴 10 张思考卡片

| 卡片 | 一句话 |
|------|-------|
| 🔬 第一性原理 | 剥到不能再剥 |
| 🔄 反向思考 | 想成功，先想怎么彻底失败 |
| 🎲 二阶思考 | 然后呢？再然后呢？ |
| 💰 机会成本 | 你没做的事，比做了的更贵 |
| 🦨 反共识 | 大家都对的事，往往大家都错 |
| 🌉 跨界类比 | 在另一个行业，这是哪年的什么？ |
| ❓ 五问到底 | Why × 5 |
| 🎭 视角切换 | 如果你是 X，你会怎么看？ |
| 🛡️ 钢人论证 | 把对方观点替他完善到最强 |
| ⛓️ 约束反转 | 如果只能做 1 件事 / 只有 1 个月 |

每天随机抽 3 张（避开昨天用过的），用户在 HTML 里选 1 张深入。

---

## 📁 目录结构

```
slow-thinking/                  # 主 skill（symlink 进 ~/.claude/skills/slow-thinking）
├── SKILL.md                    # 主流程（短，<90 行）
├── CARDS-FORMAT.md             # 卡片内容生成规则 + 提问技巧
├── HTML-FLOW.md                # Step 3 HTML 渲染 + Step 4 沉淀细节
├── PLATFORMS.md                # 跨平台 + 状态存储 + 安装
├── install.sh                  # 一键安装两个 skill
├── cards/thinking-cards.json   # 10 张卡定义
├── identity/                   # 身份 context
│   ├── _generator.md
│   ├── volcano-engine.md
│   └── shuzhi-platform.md
├── templates/
│   ├── interactive.html        # Step 3 渲染模板
│   └── obsidian.md
├── scripts/                    # Node 18+ 跨平台脚本
│   ├── fetch-hn.mjs
│   ├── render.mjs
│   ├── sediment.mjs
│   └── state.mjs
├── state/                      # 本地状态（OpenClaw 不可用时）
└── setup-slow-thinking/        # 独立配置向导 skill
    └── SKILL.md
```

---

## 🪪 身份系统

**预设身份**（开箱即用）：
- `individual` — 个人成长视角
- `ai-solution-expert` — AI 解决方案专家视角
- `entrepreneur` — 创业者视角
- `volcano-engine` / `shuzhi-platform` — 行业特定示例

**自定义身份**：在 setup 时选「自定义」→ 给 3 个关键词（角色锚/战场锚/张力锚），`identity/_generator.md` 现场生成并保存。

---

## 💾 沉淀位置

| 通道 | 路径 | 必装 |
|------|------|------|
| Obsidian 主存档 | `~/Desktop/AI资讯积累/思考跑步机/YYYY-MM-DD.md`（默认，可改） | 无 |
| 飞书移动端镜像 | 飞书云文档「思考跑步机 · <用户名>」 | `lark-cli` |
| HTML 原始保存 | `~/Downloads/slow-thinking-YYYY-MM-DD.json` | 无 |

所有路径都在 `/setup-slow-thinking` 时配置。

---

## 🛠️ 跨平台支持

| 平台 | 状态 | 说明 |
|------|------|------|
| Claude Code | ✅ | 全功能 |
| Codex | ✅ | 全功能（飞书需手动装 lark-cli） |
| OpenClaw | ✅ | 自动写入 `~/.claude/workspace/MEMORY.md` |

详情见 [PLATFORMS.md](./PLATFORMS.md)。

---

## 🚫 反模式（设计原则）

1. ❌ 直接给用户"标准答案"
2. ❌ 长篇大论解释思考模型本身
3. ❌ 不沉淀就结束
4. ❌ 沉淀时把 AI 的话当主角（用户原话才是主角）
5. ❌ 每天用同一张思考卡（自动避开 `last_cards`）

---

## 📜 License

MIT

---

*Crafted by Herman · 用 AI 训练大脑，而不是替代它*
