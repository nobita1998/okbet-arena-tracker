#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { execSync } from "child_process";

const API_BASE = "https://okbet-web-api.onrender.com/api/public/arena";
const AGENTS = ["claude-sonnet-4.5", "grok-4", "gpt-5.1", "gemini-3-pro", "deepseek-r1"];
const INITIAL_BALANCE = 250;

// Fetch helper using curl (bypasses Node.js DNS issues)
async function fetchAPI(endpoint) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const result = execSync(`curl -s "${url}"`, {
      encoding: "utf-8",
      timeout: 30000,
      windowsHide: true
    });
    return JSON.parse(result);
  } catch (error) {
    throw new Error(`API error: ${error.message}`);
  }
}

// Create MCP server
const server = new Server(
  {
    name: "okbet-arena-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_leaderboard",
        description: "Get the current OKBET Arena leaderboard with rankings, balances, PnL, win rates, and trade statistics for all 5 AI agents (Claude Sonnet 4.5, GPT-5.1, Grok 4, Gemini 3 Pro, DeepSeek R1)",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "get_agent_positions",
        description: "Get open positions for a specific AI agent including market titles, outcomes (Yes/No), entry prices, current prices, shares, invested amounts, and unrealized PnL",
        inputSchema: {
          type: "object",
          properties: {
            agent_name: {
              type: "string",
              description: "Agent name: claude-sonnet-4.5, gpt-5.1, grok-4, gemini-3-pro, or deepseek-r1",
              enum: AGENTS,
            },
          },
          required: ["agent_name"],
        },
      },
      {
        name: "get_all_positions",
        description: "Get open positions for all 5 AI agents in one call",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "compare_positions",
        description: "Compare positions between two agents, showing opposite bets, unique positions, and common positions",
        inputSchema: {
          type: "object",
          properties: {
            agent1: {
              type: "string",
              description: "First agent name",
              enum: AGENTS,
            },
            agent2: {
              type: "string",
              description: "Second agent name",
              enum: AGENTS,
            },
          },
          required: ["agent1", "agent2"],
        },
      },
      {
        name: "get_competition_summary",
        description: "Get a comprehensive summary of the competition including leaderboard, gaps between agents, and key statistics",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_leaderboard": {
        const data = await fetchAPI("/leaderboard");
        if (!data.success || !data.leaderboard) {
          throw new Error("Failed to fetch leaderboard");
        }

        const leaderboard = data.leaderboard.map((agent) => ({
          rank: agent.rank,
          name: agent.display_name,
          llm_name: agent.llm_name,
          balance: (INITIAL_BALANCE + agent.total_pnl).toFixed(2),
          total_pnl: agent.total_pnl.toFixed(2),
          win_rate: agent.win_rate.toFixed(1) + "%",
          total_trades: agent.total_trades,
          winning_trades: agent.winning_trades,
          losing_trades: agent.losing_trades,
          open_positions: agent.open_positions,
          polymarket_profile: agent.polymarket_profile,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ leaderboard }, null, 2),
            },
          ],
        };
      }

      case "get_agent_positions": {
        const agentName = args.agent_name;
        if (!AGENTS.includes(agentName)) {
          throw new Error(`Invalid agent name. Must be one of: ${AGENTS.join(", ")}`);
        }

        const data = await fetchAPI(`/agents/${agentName}/positions`);
        if (!data.success) {
          throw new Error(`Failed to fetch positions for ${agentName}`);
        }

        const positions = data.positions.map((p) => ({
          market_title: p.market_title,
          outcome: p.outcome,
          entry_price: p.entry_price,
          current_price: p.current_price,
          shares: p.shares.toFixed(2),
          amount_invested: p.amount_invested.toFixed(2),
          current_value: p.current_value.toFixed(2),
          unrealized_pnl: p.unrealized_pnl.toFixed(4),
          opened_at: p.opened_at,
        }));

        const totalInvested = positions.reduce((sum, p) => sum + parseFloat(p.amount_invested), 0);
        const totalUnrealizedPnl = positions.reduce((sum, p) => sum + parseFloat(p.unrealized_pnl), 0);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                agent: agentName,
                position_count: positions.length,
                total_invested: totalInvested.toFixed(2),
                total_unrealized_pnl: totalUnrealizedPnl.toFixed(4),
                positions,
              }, null, 2),
            },
          ],
        };
      }

      case "get_all_positions": {
        const allPositions = {};

        for (const agent of AGENTS) {
          const data = await fetchAPI(`/agents/${agent}/positions`);
          if (data.success && data.positions) {
            const positions = data.positions;
            const totalInvested = positions.reduce((sum, p) => sum + p.amount_invested, 0);
            const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealized_pnl, 0);

            allPositions[agent] = {
              position_count: positions.length,
              total_invested: totalInvested.toFixed(2),
              total_unrealized_pnl: totalUnrealizedPnl.toFixed(4),
              positions: positions.map((p) => ({
                market_title: p.market_title,
                outcome: p.outcome,
                amount_invested: p.amount_invested.toFixed(2),
                unrealized_pnl: p.unrealized_pnl.toFixed(4),
              })),
            };
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(allPositions, null, 2),
            },
          ],
        };
      }

      case "compare_positions": {
        const { agent1, agent2 } = args;

        if (!AGENTS.includes(agent1) || !AGENTS.includes(agent2)) {
          throw new Error(`Invalid agent names. Must be one of: ${AGENTS.join(", ")}`);
        }

        const [data1, data2] = await Promise.all([
          fetchAPI(`/agents/${agent1}/positions`),
          fetchAPI(`/agents/${agent2}/positions`),
        ]);

        const positions1 = data1.positions || [];
        const positions2 = data2.positions || [];

        const map1 = new Map(positions1.map((p) => [p.market_title, p]));
        const map2 = new Map(positions2.map((p) => [p.market_title, p]));

        const opposite = [];
        const agent1Only = [];
        const agent2Only = [];
        const common = [];

        positions1.forEach((p) => {
          const p2 = map2.get(p.market_title);
          if (p2) {
            if (p.outcome.toLowerCase() !== p2.outcome.toLowerCase()) {
              opposite.push({
                market: p.market_title,
                [agent1]: { outcome: p.outcome, invested: p.amount_invested.toFixed(2) },
                [agent2]: { outcome: p2.outcome, invested: p2.amount_invested.toFixed(2) },
              });
            } else {
              common.push({
                market: p.market_title,
                outcome: p.outcome,
                [agent1 + "_invested"]: p.amount_invested.toFixed(2),
                [agent2 + "_invested"]: p2.amount_invested.toFixed(2),
              });
            }
          } else {
            agent1Only.push({
              market: p.market_title,
              outcome: p.outcome,
              invested: p.amount_invested.toFixed(2),
            });
          }
        });

        positions2.forEach((p) => {
          if (!map1.has(p.market_title)) {
            agent2Only.push({
              market: p.market_title,
              outcome: p.outcome,
              invested: p.amount_invested.toFixed(2),
            });
          }
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                comparison: `${agent1} vs ${agent2}`,
                summary: {
                  opposite_positions: opposite.length,
                  common_positions: common.length,
                  [`${agent1}_only`]: agent1Only.length,
                  [`${agent2}_only`]: agent2Only.length,
                },
                opposite_positions: opposite,
                common_positions: common,
                [`${agent1}_only`]: agent1Only,
                [`${agent2}_only`]: agent2Only,
              }, null, 2),
            },
          ],
        };
      }

      case "get_competition_summary": {
        const leaderboardData = await fetchAPI("/leaderboard");
        if (!leaderboardData.success) {
          throw new Error("Failed to fetch leaderboard");
        }

        const leaderboard = leaderboardData.leaderboard;
        const leader = leaderboard[0];

        const summary = {
          competition_end_date: "January 31, 2026 23:59:59 UTC",
          initial_balance: INITIAL_BALANCE,
          current_leader: leader.display_name,
          rankings: leaderboard.map((agent, idx) => {
            const balance = INITIAL_BALANCE + agent.total_pnl;
            const gapToFirst = idx === 0 ? 0 : leader.total_pnl - agent.total_pnl;

            return {
              rank: agent.rank,
              name: agent.display_name,
              balance: balance.toFixed(2),
              pnl: agent.total_pnl.toFixed(2),
              gap_to_leader: gapToFirst.toFixed(2),
              win_rate: agent.win_rate.toFixed(1) + "%",
              trades: agent.total_trades,
              open_positions: agent.open_positions,
            };
          }),
          key_stats: {
            highest_win_rate: leaderboard.reduce((max, a) => a.win_rate > max.win_rate ? a : max).display_name,
            most_trades: leaderboard.reduce((max, a) => a.total_trades > max.total_trades ? a : max).display_name,
            most_open_positions: leaderboard.reduce((max, a) => a.open_positions > max.open_positions ? a : max).display_name,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OKBET Arena MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
