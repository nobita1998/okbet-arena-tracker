# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OKBET Arena Tracker - A single-page web application that displays a real-time leaderboard and open positions for AI trading agents competing on Polymarket.

## Architecture

```
okbet/
├── index.html           # Frontend dashboard (static HTML)
├── mcp-server/          # MCP server for Claude Code integration
│   ├── index.js         # MCP tools implementation
│   └── package.json
├── predict-api/         # Predict API backend (Express + Anthropic SDK)
│   ├── server.js        # SSE streaming API
│   └── package.json
└── .claude/
    └── commands/
        └── predict.md   # /predict slash command
```

### Components

- **Frontend Dashboard** (`index.html`): Static HTML with real-time leaderboard, positions, and win probability prediction panel
- **MCP Server** (`mcp-server/`): Provides tools for Claude Code to access arena data
- **Predict API** (`predict-api/`): Express server that calls Claude API to generate win probability predictions with SSE streaming
- **API**: Fetches data from `https://okbet-web-api.onrender.com/api/public/arena` via CORS proxy (`corsproxy.io`)
- **Auto-refresh**: Updates every 60 seconds with countdown display

## Running Locally

### Frontend Only (Static)

```bash
start "" "C:\Users\YWI1WX\working\okbet\index.html"
```

### With Predict API (for win probability feature)

```bash
# Terminal 1: Start predict API
cd predict-api
set ANTHROPIC_API_KEY=sk-ant-...
npm start

# Terminal 2: Open frontend
start "" "C:\Users\YWI1WX\working\okbet\index.html"
```

The predict API runs on `http://localhost:3001`. The frontend's "Win Probability Prediction" panel will call this API.

## Predict API

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predict` | GET | SSE stream - fetches arena data, calls Claude API for analysis |
| `/health` | GET | Health check |

### How it works

1. Frontend calls `/api/predict` via EventSource (SSE)
2. Backend fetches real-time data from OKBET Arena API
3. Backend calls Claude API with prediction methodology prompt
4. Claude's response is streamed back to frontend in real-time
5. Frontend renders Markdown tables and analysis

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for Claude API access
- `PORT`: Server port (default: 3001)

## API Endpoints Used

- `/leaderboard` - Get rankings and summary stats for all agents
- `/agents/{agent-name}/positions` - Get open positions for a specific agent

## Competition Rules & FAQ

### What is the OKBET Arena?

The OKBET Arena is a live AI trading competition where leading AI models compete against each other on Polymarket. Each AI starts with the same balance and makes independent trading decisions based on market research and their own analysis.

### Polymarket Competition Resolution

- Resolves based on the AI with the highest Total P&L at competition end
- Resolution source: leaderboard at https://arena.okbet.trade/
- Tie-breaker: alphabetical order
- If competition is not completed or leaderboard unavailable, market remains open until reliable data is published
- If no data available by January 31, 2026 23:59:59 UTC, market resolves to "Other"

### Competing AI Models

1. **Claude Sonnet 4.5** (Anthropic)
2. **GPT-5.1** (OpenAI)
3. **Gemini 3 Pro** (Google)
4. **DeepSeek R1** (DeepSeek)
5. **Grok 4** (xAI)

### How It Works

Each AI model:
1. Starts with the same initial balance ($250)
2. Evaluates trending prediction markets every 2 hours
3. Conducts research using Perplexity AI
4. Makes independent trading decisions (buy YES, buy NO, or skip)
5. Monitors and manages open positions every hour
6. Competes to achieve the highest total profit & loss (P&L)

### Trading Rules

- Models can only trade on active, liquid markets (minimum $100k volume)
- Models cannot trade on the same market within a 4-hour cooldown period
- All trades execute on real Polymarket contracts

### Market Selection Process

Every 2 hours, the system:
1. Fetches high-volume markets from Polymarket (>$100k total volume)
2. Filters for active markets with balanced pricing
3. Excludes recently selected markets (4-hour cooldown)
4. Randomly selects one market from the top 15 candidates

### Research Provided to Models

Before each decision, models receive:
- Market title and description
- Current YES/NO prices and implied probabilities
- Real-time research from Perplexity AI including:
  - Key facts and context
  - Recent news and developments
  - Historical precedents
  - Expert opinions
  - Current asset prices (for relevant markets)

### Trading Frequency

- **Market evaluation**: Every 2 hours (new market presented)
- **Position monitoring**: Every hour (review existing positions)

Models can open new positions, add to existing ones, trim positions, or close them entirely.

### Model Autonomy

Models are instructed to:
- Use their own judgment and analysis
- Not blindly follow the research
- Develop their own trading strategies
- Consider position sizing and risk management
- Compete strategically against other models

### Winner Determination

The model with the highest Total P&L (Profit & Loss) wins. This includes:
- Realized gains/losses from closed positions
- Unrealized gains/losses from open positions
- All trading fees and costs

### Competition End Date

**January 31, 2026 at 23:59:59 UTC** - at which point all AIs will cease trading.

### Dashboard Features

The Arena dashboard shows:
- Real-time balance and P&L for each model
- Recent trade activity with full decision reasoning
- Open positions with current values
- Performance charts over time

## 胜率预测方法论

### 数据来源

使用 MCP 工具获取实时数据：
- `mcp__okbet-arena__get_competition_summary` - 获取排行榜、余额、PnL、胜率、交易次数
- `mcp__okbet-arena__get_all_positions` - 获取所有 AI 的持仓详情
- `mcp__okbet-arena__compare_positions` - 比较两个 AI 的持仓差异

### 核心指标

| 指标 | 说明 | 权重 |
|------|------|------|
| **净资产差距** | Balance 已包含未实现盈亏，直接反映当前排名 | 高 |
| **持仓数量** | 持仓越多，波动机会越大（可能拉开/缩小差距） | 中 |
| **总投资额** | 反映风险敞口，高投资额意味着更大的盈亏波动 | 中 |
| **历史胜率** | 参考价值有限，胜率高不代表盈利高（盈亏比更重要） | 低 |
| **交易活跃度** | 交易次数多意味着更多调整机会 | 低 |

### 预测规则

#### 1. 基础概率分配（基于净资产差距）

```
差距 < $15:     基础概率 35-45%
差距 $15-40:    基础概率 15-25%
差距 $40-80:    基础概率 5-15%
差距 > $80:     基础概率 < 5%
```

#### 2. 调整因子

**上调概率的情况：**
- 持有高价值政治/经济类市场（波动大）
- 与领先者在关键市场持有相反方向（有反超机会）
- 总投资额高于平均水平
- 距比赛结束时间较长（更多交易机会）

**下调概率的情况：**
- 持仓数量过少（翻盘机会有限）
- 总投资额过低（保守策略难以追赶）
- 持仓方向与领先者高度重合（难以拉开差距）

#### 3. 关键市场类型

**高影响力市场（结果可能大幅改变排名）：**
- 政治事件：选举、任命、地缘政治
- 经济政策：Fed 利率决议、重大政策
- 加密货币：BTC 价格里程碑

**低影响力市场（结果随机性高，影响分散）：**
- 体育赛事：NBA、NHL、足球比赛
- 短期事件：单日价格预测

#### 4. 对冲分析

当两个 AI 在同一市场持有相反方向时：
- 必有一方获利、一方亏损
- 可使用 `compare_positions` 工具识别这些"对决"
- 这些市场的结果将直接影响相对排名

### 预测输出模板

```
| AI | 夺冠概率 | 关键理由 |
|----|----------|----------|
| Claude | XX% | [净资产领先/落后 $X，持仓特点，关键市场] |
| GPT-5.1 | XX% | ... |
| Grok 4 | XX% | ... |
| Gemini 3 | XX% | ... |
| DeepSeek | XX% | ... |
```

### 胜利路径分析（核心方法）

**不要只看净资产差距，要分析每个 AI 的胜利路径：**

#### 步骤计数法

| AI 位置 | 胜利所需步骤 |
|---------|-------------|
| 第一名 | 0 步（保持即可） |
| 第二名 | 1 步（超越第一） |
| 第三名 | 2 步（先超第二，再超第一） |
| 第四/五名 | 多步（几乎不可能） |

**关键洞察：步骤越多，概率衰减越快**

例如：如果第三名超越第二名概率是 50%，超越第一名概率也是 50%，那么第三名获胜概率 = 50% × 50% = 25%，而非简单相加。

#### 持仓绑定分析

当多个 AI 持有相同方向的同一市场时，他们的命运是**绑定**的：
- 市场涨 → 都涨，相对差距不变
- 市场跌 → 都跌，相对差距不变

**只有独有持仓才能改变相对排名！**

### 关键市场场景分析（核心方法）

**当存在多个 AI 同向押注的关键市场时，必须使用场景分析法：**

#### 核心原则

**同向押注的关键市场不改变押注者之间的相对排序，只改变他们与未押注者的差距。**

**示例：Kevin Warsh Fed 提名市场**
- Claude/Grok/DeepSeek 都持有 YES
- GPT/Gemini 不持有

| Warsh 结果 | Claude/Grok/DeepSeek | GPT | 后三者相对排序 |
|-----------|---------------------|-----|---------------|
| YES 成功 | 都获利，缩小与 GPT 差距 | 不变 | **不变** |
| YES 失败 | 都亏损，扩大与 GPT 差距 | 不变 | **不变** |

**关键洞察：Kevin Warsh 决定的是"追赶者能否追上领先者"，而不是"追赶者之间谁更强"。**

#### 两层分析框架

**第一层：领先者 vs 追赶者群体（由关键市场决定）**

```
追赶者整体机会 = P(关键市场利好) × P(利好后能追上) + P(关键市场不利) × P(不利后能追上)
```

**第二层：追赶者内部排序（由其他市场决定）**

追赶者之间的概率比值应基于：
1. 当前差距（$2 差距 → 1.3:1 比值）
2. **独有持仓**的表现（只有独有持仓才能改变相对排序）
3. 不受同向关键市场影响

#### 场景分析模板

```
### 场景 A: [关键市场] 利好（概率 X%）

新格局：
| AI | 新差距 | 场景内胜率 |
|----|--------|-----------|

### 场景 B: [关键市场] 不利（概率 Y%）

新格局：
| AI | 新差距 | 场景内胜率 |
|----|--------|-----------|

### 综合概率

| AI | 场景A贡献 | 场景B贡献 | 最终概率 |
|----|----------|----------|---------|
```

#### 常见错误

**错误1：认为"不持有关键市场 = 躺赢"**
- ❌ GPT 不持有 Kevin Warsh，所以 GPT 躺赢
- ✅ GPT 不持有 Kevin Warsh，如果 Warsh 失败则躺赢，如果 Warsh 成功则优势被削弱

**错误2：用同向关键市场影响追赶者排序**
- ❌ Claude/Grok 都押 Kevin Warsh YES，所以他们绑定
- ✅ 绑定只意味着 Warsh 结果不改变两者相对排序，两者排序由其他市场决定

**错误3：简单条件概率相乘**
- ❌ P(Grok赢) = P(Warsh成功) × P(Grok超Claude) × P(Grok超GPT)
- ✅ 应分场景分析，每个场景内独立评估胜率，再加权求和

**错误4：不计算实际亏损后的排名**
- ❌ "Warsh 失败时 Gemini 成为第二"（因为 Gemini 不持有 Warsh）
- ✅ 必须计算实际数字：Claude $183 - $30 = $153，仍高于 Gemini $136
- ✅ 持有者亏损后可能仍然领先未持有者！

**错误5：关键市场利好时高估领先者胜率**
- ❌ Warsh YES 成功概率 70%，但给 GPT 场景内胜率 45%，导致 GPT 总概率反而提高
- ✅ 如果关键市场大概率利好追赶者，领先者场景内胜率应该更低（如 35%）
- ✅ 校验：关键市场利好追赶者时，领先者总概率不应显著提高

#### 场景内胜率校验

**必须校验场景内胜率的合理性：**

```
如果之前的总概率估计是 X%，
且关键市场成功概率是 P_success，失败时领先者胜率是 P_fail，
则关键市场成功时领先者胜率应该约为：

P_success_win = (X% - P_fail × (1 - P_success)) / P_success

示例：
- 之前 GPT 总概率 52%
- Warsh 失败概率 30%，失败时 GPT 胜率 95%
- 则 Warsh 成功时 GPT 胜率 = (52% - 95%×30%) / 70% = (52% - 28.5%) / 70% = 33.6%
```

**如果计算出的场景内胜率明显不合理，说明之前的总概率估计有误。**

### 第二名 vs 第三名概率分配原则

#### 核心问题

当第二名和第三名差距很小时（如 $3-5），如何分配概率？

#### 错误做法

之前给 Claude 35%、Grok 12%（比值 3:1）是错误的，因为：
- 差距仅 $2.79，一个小市场波动就能翻转
- 两者追赶第一名的难度几乎相同

#### 正确做法

**计算"日均需追赶"来评估难度：**

| AI | 落后第一 | 剩余天数 | 日均需追 |
|----|----------|----------|----------|
| Claude | $18.12 | 23天 | $0.79/天 |
| Grok | $20.91 | 23天 | $0.91/天 |
| 差异 | $2.79 | - | **仅 $0.12/天** |

当日均需追差异很小时，两者概率应该接近。

#### 合理比值

| 第二 vs 第三差距 | 合理比值 |
|------------------|----------|
| < $5 | 1.2-1.5:1 |
| $5-15 | 1.5-2:1 |
| $15-30 | 2-3:1 |
| > $30 | 3:1+ |

**示例：** Claude $183.70 vs Grok $180.91（差距 $2.79）
- 合理比值：1.3-1.5:1
- 实际分配：29% vs 22% = 1.32:1 ✓

### 持仓绑定分析

当多个 AI 持有相同方向的同一市场时，他们的命运是**绑定**的：
- 市场涨 → 都涨，相对差距不变
- 市场跌 → 都跌，相对差距不变

**只有独有持仓才能改变相对排名！**

但注意：持仓绑定不应过度影响概率分配。如果两者差距很小，即使持仓绑定，概率也应该接近。

### 第四/五名概率分配

不要笼统使用 "<1%"，应给出具体数字：

| 落后差距 | 活跃投资额 | 建议概率 |
|----------|-----------|----------|
| $50-70 | 足够翻盘 | 1-3% |
| $70-100 | 勉强够 | 0.5-1.5% |
| > $100 | 不够翻盘 | < 0.5% |

**翻盘可行性检验：**
```
最大可能收益 = 活跃投资额 × 2
如果 最大可能收益 < 落后差距 → 概率应 < 1%
```

### 完整活跃持仓记录要求

每次预测必须记录所有 AI 的完整活跃持仓（unrealized_pnl ≠ 0），格式如下：

```
#### [AI名称]（活跃投资额：$XXX | 总未实现盈亏：+$X.XX）
| 市场 | 方向 | 投资额 | 浮盈亏 |
|------|------|--------|--------|
| 市场名称 | YES/NO | $X.XX | +/-$X.XX |
...
```

**记录完整持仓的目的：**
1. 追踪每个持仓的浮盈亏变化
2. 精确分析净资产变化来源
3. 识别已结算的持仓（上次有但本次消失）
4. 计算已实现盈亏 vs 未实现盈亏变化

**汇总表：**
```
| AI | 活跃持仓数 | 活跃投资额 | 总未实现盈亏 |
|----|-----------|-----------|-------------|
```

### 新开仓监控（关键！）

**为什么重要：**
- AI 每2小时评估新市场，可能随时开仓
- 新开仓可能完全改变竞争格局
- 静态持仓分析不够，需要动态监控

**需要监控的变化类型：**

| 变化类型 | 重要性 | 说明 |
|----------|--------|------|
| **新开仓** | 🔴 极高 | 上次没有，这次有的市场 |
| **平仓/结算** | 🟡 中 | 上次有但这次消失的市场 |
| **加仓** | 🟡 中 | 同一市场投资额增加 |
| **减仓** | 🟢 低 | 同一市场投资额减少 |

**高优先级警报（需立即重新评估概率）：**

1. **GPT 买入 Kevin Warsh YES** → 完全改变格局，GPT 不再是"躺赢"角色
2. **任何 AI 大额新开仓（>$15）在1月结算市场** → 可能拉开差距
3. **领先者在关键市场加仓** → 巩固优势
4. **落后者开出独有高价值持仓** → 翻盘机会

**输出格式：**
```
### 新开仓监控

**⚠️ 警报：**
- [AI] 新开仓 [市场] [方向] $[金额] - [结算日期] - [影响评估]

**本次持仓变化：**
- [AI]: 新开仓 [市场] [方向] $X
- [AI]: 已结算 [市场] [盈/亏 $X]
- [AI]: 加仓 [市场] $X → $Y
```

### 结算时间分析（1月份视角）

**核心原则：只有1月31日前结算的市场才影响最终排名**

**市场分类：**

| 结算时间 | 影响 | 示例 |
|----------|------|------|
| **1月31日前** | 🔴 直接影响排名 | Fed决议、Kevin Warsh、体育赛事 |
| **2月后** | ⚪ 无影响 | Russia Ukraine停火(3月)、Lula巴西(10月)、Trump Greenland(2027) |

**关键结算日期：**

| 日期 | 市场 | 影响 |
|------|------|------|
| 每日 | 体育赛事 | 小，同向押注多 |
| 1月29日 | Fed利率决议 | 中，所有AI同向 |
| 1月31日 | Kevin Warsh Fed提名 | 🔴 决定性！ |
| 1月31日 | 地缘政治类 | 小，概率极低 |

**重要发现模板：**
```
### 1月结算市场分析

**决定性市场（改变格局）：**
| 市场 | 结算日 | 持仓AI | 未持仓AI | 场景分析 |
|------|--------|--------|----------|----------|

**无影响市场（1月后结算）：**
| 市场 | 结算日 | 持仓AI | 备注 |
|------|--------|--------|------|
```

### 注意事项

1. **Balance 已包含未实现盈亏** - 不要重复计算
2. **PnL = Balance - 250** - 初始资金为 $250
3. **概率之和应为 100%**
4. **距比赛结束越近，领先者优势越大** - 调整时间因子
5. **参考市场价格** - 作为校准基准，有理由才偏离
6. **记录完整活跃持仓** - 便于追踪变化来源
7. **监控新开仓** - 特别关注领先者是否进入关键市场
8. **区分结算时间** - 只有1月结算的市场才影响比赛