# 胜率预测方法论详解

## 理论基础

预测模型基于以下核心假设：
1. 净资产是当前竞争力的最直接反映
2. 持仓结构决定未来波动潜力
3. 关键市场的对决结果可能颠覆排名

## 数据源说明

### MCP 工具返回数据

| 工具 | 返回内容 |
|------|----------|
| `get_competition_summary` | rankings, balance, pnl, win_rate, trades, open_positions |
| `get_all_positions` | 每个 AI 的所有持仓详情（市场、方向、投资额、未实现盈亏） |
| `compare_positions` | 两个 AI 的对立持仓、共同持仓、独有持仓 |

### 关键字段解释

- **balance**: 当前净资产（已包含未实现盈亏）
- **pnl**: 总盈亏 = balance - 250
- **total_invested**: 所有持仓的总投资额
- **total_unrealized_pnl**: 当前持仓的浮动盈亏
- **position_count**: 持仓数量

## 概率计算模型

### 阶段 1: 基础概率分配

```
P_base(i) = f(gap_to_leader)

其中:
- gap = 0:        P_base = 40%
- gap < 15:       P_base = 30%
- gap 15-40:      P_base = 20%
- gap 40-80:      P_base = 10%
- gap > 80:       P_base = 5%
```

### 阶段 2: 波动因子调整

```
P_adjusted = P_base * (1 + volatility_factor)

volatility_factor 计算:
- 高投资额 (>$300): +0.1
- 持仓数多 (>30): +0.05
- 持有高影响力市场: +0.1 ~ +0.2
- 与领先者有对立仓位: +0.05 ~ +0.15
```

### 阶段 3: 时间衰减

```
time_factor = days_remaining / total_competition_days

P_final = P_adjusted * time_factor + P_base * (1 - time_factor)
```

距结束越近，领先者优势越稳固。

### 阶段 4: 归一化

```
P_normalized(i) = P_final(i) / sum(P_final)
```

确保所有概率之和为 100%。

## 市场分类标准

### 高影响力市场

| 类别 | 示例 | 特点 |
|------|------|------|
| 政治选举 | 巴西大选、布加勒斯特市长 | 结果明确，盈亏大 |
| 地缘政治 | 俄乌停火、委内瑞拉 | 高度不确定，波动剧烈 |
| 经济政策 | Fed 利率决议 | 影响多个相关市场 |
| 加密货币 | BTC $100k | 短期波动大 |
| 重大任命 | Fed 主席提名 | 政治敏感，信息不对称 |

### 低影响力市场

| 类别 | 示例 | 特点 |
|------|------|------|
| NBA/NHL | Lakers vs Clippers | 结果随机，小仓位 |
| 足球单场 | Barcelona win | 波动有限 |
| 短期价格 | BTC 单日价格 | 随机性高 |

## 对决分析框架

当两个 AI 在同一市场持有相反方向时：

```
市场结果 → 一方盈利，一方亏损

净影响 = |invested_A - invested_B| * 预期回报率

如果 invested_A > invested_B:
  - 若 A 正确: A 净赚，差距拉大
  - 若 B 正确: B 追赶，差距缩小
```

### 关键对决识别规则

1. **直接对决**: 完全相反方向（Yes vs No）
2. **高价值对决**: 双方投资额均 > $10
3. **决定性对决**: 结果可能改变排名顺序

## 输出质量检查

在生成报告前验证：

1. [ ] 概率之和 = 100%
2. [ ] 领先者概率最高
3. [ ] 差距 > $80 的 AI 概率 < 10%
4. [ ] 所有关键对决市场已识别
5. [ ] 理由与数据一致
