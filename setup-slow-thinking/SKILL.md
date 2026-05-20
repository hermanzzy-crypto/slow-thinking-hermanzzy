---
name: setup-slow-thinking
version: 1.0.0
description: 一次性配置思考跑步机：默认身份、Obsidian 同步路径、飞书镜像开关、HN 抓取偏好。装好 slow-thinking 后必须先跑一次本 skill。Use when user types /setup-slow-thinking, says "配置思考跑步机", "初始化 slow-thinking", or when slow-thinking reports missing identity/config.
disable-model-invocation: true
metadata:
  requires:
    bins: ["node"]
---

# Setup Slow Thinking

一次性配置思考跑步机的偏好。**这是个对话向导，不是自动脚本**——把 3-4 个决策**一次一个**抛给用户，每个先解释清楚再让选。

---

## 前置

跑之前先确认 slow-thinking 主 skill 已经装好。在 Claude Code 里：

```bash
ls -la ~/.claude/skills/slow-thinking/SKILL.md
```

若没有 → 先跑 `bash <SKILL_DIR>/../install.sh`（`<SKILL_DIR>` 是本 setup skill 的目录）。

---

## 流程

按顺序问 4 个问题，**一次一个，不要一口气抛**。每个问题先讲清楚"这是什么、为什么需要、不同选择的影响"，再给默认值。

### Section A — 默认身份

> **是什么**：思考身份决定每张卡的「本事件解读」用什么视角写。  
> **为什么需要**：身份决定了"作为 X，这意味着..."这一句怎么落。换身份等于换一双眼睛看同一条新闻。  
> **不同选择的影响**：选错了，每天的解读会很泛、像废话。选准了，洞见会扎到自己的实际处境。

选项（用户选 1 个，也可临时输入其他）：
1. **个人视角** — 以个人成长/职业发展为锚
2. **AI 解决方案专家** — 跨行业 AI 落地视角
3. **创业者视角** — 假设你在 0→1，关心 PMF、增长、商业化
4. **🆕 自定义身份**（产品经理 / 投资人 / 学生 / 艺术家 / ...）

**预设身份的 context 文件**在 `<SKILL_DIR>/../identity/<id>.md`。如果用户选自定义，调 `<SKILL_DIR>/../identity/_generator.md` 走 3 关键词生成流程，存为 `<SKILL_DIR>/../identity/<slug>.md`。

写入：
```bash
node <SKILL_DIR>/../scripts/state.mjs set identity "<用户选择>"
```

> 注意：日常 `/slow-thinking` 仍可临时换身份，不影响默认。

---

### Section B — Obsidian 同步路径

> **是什么**：每次完成思考后，sediment.mjs 自动把 markdown 写到这个目录。  
> **为什么需要**：长期沉淀的主存档。在 Obsidian 里能反查、双链。  
> **不同选择的影响**：留空就只保存 `~/Downloads/*.json`，没 markdown 主存档。

默认路径：`~/Desktop/AI资讯积累/思考跑步机/`

询问用户：
- 使用默认（推荐）→ 直接采用
- 想改成别的（如 `~/Documents/Obsidian Vault/思考跑步机/`）→ 用户给路径
- 不要 Obsidian 同步 → 设 `disabled`

写入：
```bash
node <SKILL_DIR>/../scripts/state.mjs set obsidian_dir "<路径或 disabled>"
```

如果是真实路径，**这一步就创建目录**：
```bash
mkdir -p "<路径>"
```

---

### Section C — 飞书镜像

> **是什么**：把每天的思考同步追加到一个固定的飞书云文档，方便手机回看。  
> **为什么需要**：只有用户用飞书 + 装了 `lark-cli` 才有用。  
> **不同选择的影响**：开启 → Step 4 沉淀时多一步飞书 API 调用。关闭 → 完全跳过。

先用 `which lark-cli` 检测：
- **找不到** → 直接告诉用户"未检测到 lark-cli，跳过本选项"，自动写 `feishu = disabled`
- **找到了** → 问用户开不开（默认开）

如果开启：
- 不要在这里就创建飞书文档（懒创建：等用户第一次完成思考再建）
- 写入：
  ```bash
  node <SKILL_DIR>/../scripts/state.mjs set feishu enabled
  ```

如果关闭：
```bash
node <SKILL_DIR>/../scripts/state.mjs set feishu disabled
```

---

### Section D — Step 2 默认素材源

> **是什么**：用户没给链接时，默认从哪里抓 3 条思考素材。  
> **为什么需要**：不同身份适合不同源。AI 解决方案专家适合 HN；产品经理可能更适合行业情报。  
> **不同选择的影响**：选错也没事，每次 `/slow-thinking` 还能临时换。

选项：
1. **Hacker News Top 3**（默认，技术/AI 视角）
2. **行业情报**（按身份关键词搜索）
3. **每次都问** — agent 每天都要确认一次

写入：
```bash
node <SKILL_DIR>/../scripts/state.mjs set default_source "<hn|industry|ask>"
```

---

## 收尾

跑完上面 4 节后：

1. 显示一份配置总览：
   ```
   ✅ Setup 完成
   
   身份：AI解决方案专家
   Obsidian：~/Desktop/AI资讯积累/思考跑步机/
   飞书镜像：enabled
   默认素材源：Hacker News Top 3
   
   现在可以跑 /slow-thinking 开始今日思考了 🏃
   ```

2. 跑一次 `node <SKILL_DIR>/../scripts/state.mjs get` 把完整 state 打出来供用户确认

3. 告诉用户：**所有偏好都可以随时重跑 `/setup-slow-thinking` 覆盖**，或直接编辑 `<SKILL_DIR>/../state/identity.json`（OpenClaw 用户也可改 `~/.claude/workspace/MEMORY.md` 里的 `slow_thinking_*` 行）。

---

## 反模式

1. ❌ 不要把 4 个问题一次性抛给用户
2. ❌ 不要在用户没选之前就用默认值跳过
3. ❌ 不要主动创建飞书文档（懒创建，等真用时再建）
4. ❌ 不要假设用户知道术语（每个 section 都要先解释"是什么/为什么需要/影响"）
5. ❌ 不要在 setup 完成前就开始进入日常 `/slow-thinking` 流程
