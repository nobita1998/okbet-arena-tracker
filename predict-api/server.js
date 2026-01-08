import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const API_BASE = 'https://okbet-web-api.onrender.com/api/public/arena';

// 获取数据的辅助函数
async function fetchArenaData(endpoint) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[Fetch] ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OKBET-Predict-API/1.0' }
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error(`[Fetch Error] ${url}: ${error.message}`);
    throw error;
  }
}

// 获取所有需要的数据
async function getAllData() {
  const [leaderboard, ...positionsData] = await Promise.all([
    fetchArenaData('/leaderboard'),
    fetchArenaData('/agents/claude-sonnet-4.5/positions'),
    fetchArenaData('/agents/gpt-5.1/positions'),
    fetchArenaData('/agents/grok-4/positions'),
    fetchArenaData('/agents/gemini-3-pro/positions'),
    fetchArenaData('/agents/deepseek-r1/positions'),
  ]);

  const agents = ['claude-sonnet-4.5', 'gpt-5.1', 'grok-4', 'gemini-3-pro', 'deepseek-r1'];
  const positions = {};
  agents.forEach((agent, i) => {
    if (positionsData[i]?.positions) {
      positions[agent] = positionsData[i].positions;
    }
  });

  return { leaderboard: leaderboard.leaderboard, positions };
}

// 预测 prompt
const PREDICT_SYSTEM = `你是一个专业的 AI 交易竞赛分析师。请根据提供的数据，分析各 AI 的夺冠概率。

## 分析方法论

### 核心指标权重
- **净资产差距**: 高权重 - Balance 已包含未实现盈亏，直接反映当前排名
- **持仓数量**: 中权重 - 持仓越多，波动机会越大
- **总投资额**: 中权重 - 反映风险敞口
- **历史胜率**: 低权重 - 胜率高不代表盈利高

### 基础概率分配（基于与第一名的差距）
- 领先者: 35-45%
- 差距 < $15: 25-35%
- 差距 $15-40: 15-25%
- 差距 $40-80: 5-15%
- 差距 > $80: < 5%

### 调整因子
上调: 持有高波动市场(政治/经济)、与领先者持反向仓位、高投资额
下调: 持仓过少、投资额过低、与领先者仓位高度重合

### 注意事项
1. Balance 已包含未实现盈亏，不要重复计算
2. PnL = Balance - 250 (初始资金 $250)
3. 概率之和必须为 100%
4. 比赛截止: January 31, 2026 23:59:59 UTC`;

const PREDICT_PROMPT = `请基于以下实时数据，输出夺冠概率预测。

## 输出格式要求

请严格按照以下格式输出（使用 Markdown 表格）：

## 夺冠概率预测

| AI | 夺冠概率 | 净资产 | 与第一差距 | 关键理由 |
|----|----------|--------|------------|----------|
| XXX | XX% | $XXX.XX | $XX.XX | [简要说明] |
...

## 关键对决市场

列出各 AI 持有相反方向的重要市场（会直接影响排名的）。

| 市场 | AI A 方向 | AI B 方向 | 潜在影响 |
|------|-----------|-----------|----------|
...

## 分析总结

简要总结当前竞争格局（2-3句话）。

---

## 当前数据

`;

// GET /api/predict - 流式预测 API
app.get('/api/predict', async (req, res) => {
  console.log('[Predict API] Request received');

  // SSE 头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    // 1. 获取实时数据
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Fetching arena data...' })}\n\n`);

    const data = await getAllData();

    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Data fetched, analyzing...' })}\n\n`);

    // 2. 构建完整 prompt
    const fullPrompt = PREDICT_PROMPT + JSON.stringify(data, null, 2);

    // 3. 调用 Claude API (流式)
    const client = new Anthropic();

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: PREDICT_SYSTEM,
      messages: [{ role: 'user', content: fullPrompt }],
    });

    // 4. 流式输出
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({
          type: 'assistant',
          content: { message: { content: [{ type: 'text', text: event.delta.text }] } }
        })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
    console.log('[Predict API] Complete');

  } catch (error) {
    console.error('[Predict API] Error:', error.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`OKBET Predict API running on http://localhost:${PORT}`);
  console.log(`- GET /api/predict  - Stream prediction (SSE)`);
  console.log(`- GET /health       - Health check`);
  console.log('');
  console.log('Make sure ANTHROPIC_API_KEY is set in environment');
});
