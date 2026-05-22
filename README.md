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
| 3 | 💡 所以呢？ | 3-4 min | 本地服务渲染 HTML → 浏览器里依次走过 3 张卡 + 填空 |
| 4 | 💾 沉淀 | 自动 | 点保存即直写 Obsidian（本地服务完成）+ 可选飞书镜像 |

**铁律**：Step 3 中 AI 输出 ≤3 句，剩下全部用来**让用户答**。用户答 > AI 答。

---

## 🎴 12 个思维模型（v2.0）

按 AI 解决方案专家的五步工作流组织：

| 阶段 | 卡片（一句话） |
|------|--------------|
| ① 信息过滤 | 🧩 5W2H · 把通稿剥成硬变量 ／ 📡 信号噪音 · 事实是信号观点是噪音 ／ 🧠 认知偏差 · 给大脑装杀毒软件 |
| ② 深度分析 | 🔬 第一性原理 · 剥到物理/数学事实 ／ 🔄 逆向思维 · 不问怎么成问怎么败 ／ 📈 Gartner曲线 · 现在处于周期哪段 |
| ③ 商业推演 | 🎲 第二层思考 · 找非共识与预期差 ／ 🔗 价值链 · 利润在哪层聚集 ／ 🌉 类比 · 像历史哪一幕 ／ 🎯 贝叶斯更新 · 用新证据改写旧信念 |
| ④ 表达输出 | 🏛️ SCQA · 情景-冲突-疑问-回答 |
| ⑤ 供需验证 | ⚖️ 供需框架 · 技术可行≠市场成立 |

每天按今日素材的**事件类型智能匹配** 3 张（避开昨天用过的），用户在 HTML 里**依次走过这 3 张**、每张换一个角度作答，最后统一保存。匹配规则见 [CARDS-FORMAT.md](./CARDS-FORMAT.md#抽卡规则智能匹配非随机)。

---

## 📁 目录结构

```
slow-thinking/                  # 主 skill（symlink 进 ~/.claude/skills/slow-thinking）
├── SKILL.md                    # 主流程（短，<90 行）
├── CARDS-FORMAT.md             # 卡片内容生成规则 + 提问技巧
├── HTML-FLOW.md                # Step 3 HTML 渲染 + Step 4 沉淀细节
├── PLATFORMS.md                # 跨平台 + 状态存储 + 安装
├── install.sh                  # 一键安装两个 skill
├── cards/thinking-cards.json   # 12 个思维模型定义（v2.0）
├── identity/                   # 身份 context
│   ├── _generator.md
│   ├── volcano-engine.md
│   └── shuzhi-platform.md
├── templates/
│   ├── interactive.html        # Step 3 渲染模板
│   └── obsidian.md
├── scripts/                    # Node 18+ 跨平台脚本
│   ├── fetch-hn.mjs            # Step 2 抓 HN Top 3
│   ├── serve.mjs              # Step 3 本地服务：渲染 HTML + 保存直写 Obsidian
│   ├── render.mjs             # 仅渲染 HTML（调试 / 静态预览备用）
│   ├── sediment.mjs           # 结果 → markdown + 写 Obsidian
│   └── state.mjs              # 状态读写
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
| 兜底 JSON | `~/Downloads/slow-thinking-*.json`（仅在本地服务不可用时下载） | 无 |

正常流程下用户点保存即由本地服务**直写 Obsidian**，不产生下载文件。所有路径都在 `/setup-slow-thinking` 时配置。

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
