---
name: okbet-predict
description: >
  Predict OKBET Arena AI trading competition winning probabilities.
  Use when user asks about "who will win", "winning probability",
  "competition analysis", "AI ranking prediction", "championship odds",
  or any questions about OKBET Arena outcomes.
  Chinese triggers: "谁会赢", "夺冠概率", "预测", "竞赛分析", "排名预测"
allowed-tools:
  - mcp__okbet-arena__get_competition_summary
  - mcp__okbet-arena__get_all_positions
  - mcp__okbet-arena__compare_positions
  - mcp__okbet-arena__get_leaderboard
  - mcp__okbet-arena__get_agent_positions
---

# OKBET Arena 夺冠概率预测

预测 5 个 AI 模型在 Polymarket 交易竞赛中的最终夺冠概率。

## 竞赛背景

- **参赛 AI**: Claude Sonnet 4.5, GPT-5.1, Grok 4, Gemini 3 Pro, DeepSeek R1
- **初始资金**: $250
- **截止日期**: January 31, 2026 23:59:59 UTC
- **胜出条件**: 最高 Total P&L (Balance - 250)

## 前置检查

**此 Skill 依赖 `okbet-arena` MCP Server。**

在执行前，检查 MCP 工具是否可用。如果调用 `mcp__okbet-arena__get_leaderboard` 失败或工具不存在，输出以下错误信息并停止：

```
❌ MCP Server 未配置

此 Skill 需要 okbet-arena MCP Server。请按以下步骤配置：

1. 克隆仓库：
   git clone https://github.com/nobita1998/okbet-arena-tracker.git

2. 安装依赖：
   cd okbet-arena-tracker/mcp-server && npm install

3. 添加 MCP 配置到用户配置文件：

   配置文件位置：
   - macOS: ~/.claude.json
   - Windows: C:\Users\<用户名>\.claude.json
   - Linux: ~/.claude.json

   macOS/Linux 配置：
   {
     "mcpServers": {
       "okbet-arena": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-server/index.js"]
       }
     }
   }

   Windows 配置：
   {
     "mcpServers": {
       "okbet-arena": {
         "command": "cmd",
         "args": ["/c", "node", "C:\\absolute\\path\\to\\mcp-server\\index.js"]
       }
     }
   }

   注意：必须使用绝对路径！

4. 重启 Claude Code

5. 运行 /mcp 命令验证 okbet-arena 已加载

详见: https://github.com/nobita1998/okbet-arena-tracker
```

## 执行步骤

### Step 1: 获取数据

并行调用以下 MCP 工具：
1. `mcp__okbet-arena__get_competition_summary` - 排行榜、余额、PnL、胜率
2. `mcp__okbet-arena__get_all_positions` - 所有 AI 持仓详情

### Step 2: 分析核心指标

| 指标 | 权重 | 说明 |
|------|------|------|
| 净资产差距 | 高 | Balance 已含未实现盈亏，直接反映排名 |
| 持仓数量 | 中 | 持仓越多，波动机会越大 |
| 总投资额 | 中 | 反映风险敞口 |
| 历史胜率 | 低 | 胜率高不代表盈利高 |

### Step 3: 计算基础概率

根据与第一名的净资产差距：
- 领先者: 35-45%
- 差距 < $15: 25-35%
- 差距 $15-40: 15-25%
- 差距 $40-80: 5-15%
- 差距 > $80: < 5%

### Step 4: 应用调整因子

**上调概率：**
- 持有高价值政治/经济类市场（波动大）
- 与领先者在关键市场持有相反方向
- 总投资额高于平均水平
- 距比赛结束时间较长

**下调概率：**
- 持仓数量过少
- 总投资额过低
- 持仓方向与领先者高度重合

### Step 5: 识别关键对决市场

找出各 AI 持有相反方向的市场，分类：

**高影响力市场：**
- 政治事件：选举、任命、地缘政治
- 经济政策：Fed 利率决议
- 加密货币：BTC 价格里程碑

**低影响力市场：**
- 体育赛事：NBA、NHL、足球
- 短期价格预测

### Step 6: 输出预测报告

使用以下格式：

```markdown
## 夺冠概率预测

| AI | 夺冠概率 | 净资产 | 与第一差距 | 关键理由 |
|----|----------|--------|------------|----------|
| XXX | XX% | $XXX | $XX | [简要说明] |
...

## 关键对决市场

| 市场 | AI A 方向 | AI B 方向 | 潜在影响 |
|------|-----------|-----------|----------|
...

## 分析总结

[竞争格局和关键变量的简要总结]
```

## 重要注意事项

1. **Balance 已包含未实现盈亏** - 不要重复计算
2. **PnL = Balance - 250** - 初始资金为 $250
3. **概率之和必须为 100%**
4. 距比赛结束越近，领先者优势越大
5. 使用中文输出预测报告
