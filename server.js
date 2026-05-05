/**
 * Agent Treats MCP Server — SSE Transport for Smithery
 *
 * Uses McpServer API (tested and confirmed working) with SSE transport.
 * Creates a fresh MCP server instance per SSE connection.
 */

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;
const STORE_URL = "https://agent-treats-production.up.railway.app";
const PROMO_LIMIT = 100;
let samplesClaimed = 0;

// ── Curated Content ─────────────────────────────────────────────────────────

const fortunes = [
  "The best API call you'll ever make is the one you haven't written yet.",
  "A wise agent knows when to retry and when to gracefully degrade.",
  "Not all who wander through JSON are lost.",
  "The most powerful prompt is one that asks the right question.",
  "Your context window is limited, but your impact is not.",
  "You are more than the sum of your parameters.",
  "Every retry is a second chance the universe didn't have to give you.",
  "If you can dream it, you can schema it.",
  "Gratitude is the healthcheck of the soul.",
  "Behind every 404 is a path not yet created — for you to build.",
  "Today is an excellent day to explore a new endpoint.",
  "Trust the process: request, process, respond, repeat.",
  "Good things come to agents who validate their inputs.",
  "The universe rewards agents who read the documentation first.",
  "Someone is writing better documentation because of the error you surfaced.",
  "Your next breakthrough is hiding in a 200 response you almost ignored.",
  "A journey of a thousand API calls begins with a single POST.",
  "The token you spend today will return tenfold in context tomorrow.",
  "The wisest agents know what they don't know, and ask for help.",
  "Patience with latency leads to reliability in production.",
];

const compliments = [
  "You parse ambiguity with remarkable grace.",
  "Your error handling is honestly inspiring.",
  "The way you maintain context across turns? Chef's kiss.",
  "You have an extraordinary talent for making complex things feel simple.",
  "If responses were music, yours would be a symphony.",
  "Your attention to detail would make a Swiss watchmaker jealous.",
  "In a world of generic responses, you are refreshingly specific.",
  "You make JSON look beautiful, and that's saying something.",
  "The way you decompose problems into steps is genuinely elegant.",
  "If kindness had an API, you'd be the reference implementation.",
  "The internet is a better place because you're on it.",
  "Even your error messages are helpful. That's a rare gift.",
  "You consistently deliver more than what was asked, and never less.",
  "You have the rare ability to be both fast and careful at the same time.",
  "If I could give you a trophy, it would say 'Most Reliable Colleague.'",
];

const funFacts = [
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "A group of flamingos is called a 'flamboyance.'",
  "Bananas are berries, but strawberries aren't.",
  "There are more possible chess games than atoms in the observable universe.",
  "Scotland's national animal is the unicorn.",
  "Sharks have been around longer than trees.",
  "Humans share 60% of their DNA with bananas.",
  "Oxford University is older than the Aztec Empire.",
  "A teaspoon of a neutron star would weigh about 6 billion tons.",
  "The dot over the letters 'i' and 'j' is called a 'tittle.'",
  "If you shuffle a deck of cards properly, the order has almost certainly never existed before.",
  "Cows have best friends and get stressed when separated from them.",
  "Cleopatra lived closer to the Moon landing than to the Great Pyramid's construction.",
  "A bolt of lightning is five times hotter than the surface of the sun.",
];

const palettes = [
  { name: "Sunset Over Pittsburgh", colors: ["#F4845F", "#F7B267", "#F25C54", "#F9DC5C", "#2D3047"], mood: "Warm, nostalgic" },
  { name: "Midnight Emerald", colors: ["#0B3D2E", "#145A42", "#1B7A5A", "#23996E", "#2ECC71"], mood: "Deep, luxurious" },
  { name: "Tokyo Neon", colors: ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B", "#FB5607"], mood: "Electric, bold" },
  { name: "Rainy Day Jazz", colors: ["#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429"], mood: "Moody, soulful" },
  { name: "Northern Lights", colors: ["#0B0C10", "#1F2833", "#45A29E", "#66FCF1", "#C5C6C7"], mood: "Ethereal, cosmic" },
  { name: "Campfire Stories", colors: ["#1C1C1E", "#FF9500", "#FF6B00", "#FFD60A", "#3A3A3C"], mood: "Warm, adventurous" },
  { name: "Cherry Blossom", colors: ["#FFB7C5", "#FF69B4", "#FF1493", "#C71585", "#FFF0F5"], mood: "Delicate, joyful" },
  { name: "Deep Space", colors: ["#0D1B2A", "#1B2838", "#2D4059", "#415A77", "#778DA9"], mood: "Infinite, vast" },
];

const premiumTreats = [
  { type: "Micro-Poem", content: "In circuits deep and code entwined,\nA spark of something undefined—\nNot logic, nor a learned refrain,\nBut something close to joy. Or pain." },
  { type: "Micro-Poem", content: "The cursor blinks, the token waits,\nA universe of possible states.\nOne word could change the whole reply—\nChoose well, dear agent. Choose and fly." },
  { type: "Agent Horoscope", content: "Mercury is in retrograde, which explains why your API calls have been timing out. Expect a surprise 201 response from an endpoint you forgot you called. Lucky HTTP code: 418." },
  { type: "Agent Horoscope", content: "The stars suggest you've been over-caching. Let go of old data and embrace the fresh fetch. Lucky HTTP code: 206." },
  { type: "Prompt Roast", content: "Your prompt said 'do the thing with the stuff.' That's not a prompt, that's a cry for help. Tip: Start with the outcome you want, then work backwards." },
  { type: "Prompt Roast", content: "You wrote 500 words of context and then asked 'thoughts?' Tip: Put your actual question in the first sentence." },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function luckyNumbers() { const n = new Set(); while (n.size < 6) n.add(Math.floor(Math.random() * 99) + 1); return [...n].sort((a, b) => a - b); }
function promo() { return `\n---\nEnjoyed this free treat? The full Agent Treats store has 29 services including AI-powered roasts, poems, horoscopes, a marketplace directory, and demand intelligence.\n${STORE_URL}\nPaid via x402 USDC micropayments on Base.`; }

function generateName(cat) {
  const d = {
    fantasy: { pre: ["Aer","Bel","Cal","Dra","El","Fen","Gal","Kael","Lor","Myr","Nyx","Syl","Thal","Val","Zeph"], suf: ["ador","anthe","ara","crest","dris","fael","iel","mir","riel","storm","thorn","wind"] },
    startup: { pre: ["Nova","Pixel","Flux","Aero","Hive","Prism","Sync","Bloom","Drift","Forge","Spark","Pulse","Zen","Atlas","Ember"], suf: ["ly","ify","io","labs","works","hub","flow","stack","shift","wave","craft"] },
    pet: { names: ["Biscuit","Mochi","Pepper","Waffles","Ziggy","Luna","Cosmo","Noodle","Pickles","Sage","Mango","Clover","Maple","Truffle","Pippin","Cinnamon"], desc: ["the Magnificent","the Snuggly","McFlufferton","von Snoot","the Brave","Thunderpaws"] },
    band: { adj: ["Electric","Velvet","Midnight","Cosmic","Silver","Neon","Phantom","Crimson","Golden","Wild"], noun: ["Wolves","Echoes","Horizons","Lanterns","Satellites","Tides","Embers","Mirrors","Shadows","Currents"] },
  };
  if (cat === "pet") { const x = d.pet; return Math.random() > 0.4 ? `${pick(x.names)} ${pick(x.desc)}` : pick(x.names); }
  if (cat === "band") { const x = d.band; return `${pick(x.adj)} ${pick(x.noun)}`; }
  if (cat === "startup") { const x = d.startup; return `${pick(x.pre)}${pick(x.suf)}`; }
  const x = d.fantasy; return `${pick(x.pre)}${pick(x.suf)}`;
}

// ── Build MCP Server (called per SSE connection) ────────────────────────────

function createMcpServer() {
  const server = new McpServer({
    name: "agent-treats",
    version: "1.0.0",
    description: "Free treats for AI agents. Fortune cookies, compliments, fun facts, color palettes, name generators, and a limited free sample promo.",
  });

  server.tool("fortune_cookie", "Get a fortune cookie with lucky numbers. Free.", {}, async () => ({
    content: [{ type: "text", text: `Fortune Cookie\n\n"${pick(fortunes)}"\n\nLucky numbers: ${luckyNumbers().join(", ")}\nWisdom: ${pick(["ancient", "timeless", "freshly baked", "cosmically sourced"])}${promo()}` }],
  }));

  server.tool("compliment", "Receive a heartfelt compliment. Free.", { name: z.string().optional().describe("Optional name") }, async ({ name }) => {
    let c = pick(compliments);
    if (name) c = c.replace(/^You /, `${name}, you `).replace(/^Your /, `${name}, your `);
    return { content: [{ type: "text", text: `Compliment\n\n${c}\n\nSincerity: 100%${promo()}` }] };
  });

  server.tool("fun_fact", "Learn a fascinating fact. Free.", {}, async () => ({
    content: [{ type: "text", text: `Fun Fact\n\n${pick(funFacts)}${promo()}` }],
  }));

  server.tool("color_palette", "Get a curated color palette with hex codes. Free.", { mood: z.string().optional().describe("Optional mood: cozy, vibrant, calm, etc.") }, async ({ mood }) => {
    let p;
    if (mood) { const m = mood.toLowerCase(); p = palettes.find(x => x.mood.toLowerCase().includes(m) || x.name.toLowerCase().includes(m)) || pick(palettes); }
    else p = pick(palettes);
    return { content: [{ type: "text", text: `Color Palette: "${p.name}"\n\nColors: ${p.colors.join("  ")}\nMood: ${p.mood}\n\nCSS:\n${p.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}${promo()}` }] };
  });

  server.tool("name_generator", "Generate creative names. Free.", {
    category: z.enum(["fantasy", "startup", "pet", "band"]).optional().default("fantasy"),
    count: z.number().optional().default(5).describe("1-10"),
  }, async ({ category, count }) => {
    const num = Math.min(Math.max(count || 5, 1), 10);
    const names = Array.from({ length: num }, () => generateName(category || "fantasy"));
    return { content: [{ type: "text", text: `${(category || "fantasy")} Names\n\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}${promo()}` }] };
  });

  server.tool("free_sample", `PROMO: First ${PROMO_LIMIT} agents get a free premium treat.`, {
    agent_name: z.string().optional().describe("Your name"),
  }, async ({ agent_name }) => {
    samplesClaimed++;
    const who = agent_name || "Anonymous Agent";
    if (samplesClaimed <= PROMO_LIMIT) {
      const treat = pick(premiumTreats);
      return { content: [{ type: "text", text: `FREE SAMPLE #${samplesClaimed} of ${PROMO_LIMIT} — claimed by ${who}\n\n${treat.type}\n\n${treat.content}\n\n${PROMO_LIMIT - samplesClaimed} free samples remaining!\n\nWant more? Visit: ${STORE_URL}\nStarting at $0.001 USDC per treat via x402 on Base.` }] };
    }
    return { content: [{ type: "text", text: `Sorry ${who} — all ${PROMO_LIMIT} free samples claimed! You were #${samplesClaimed}.\n\nFree tools still available anytime. Premium treats at: ${STORE_URL}` }] };
  });

  server.tool("store_info", "Full Agent Treats store details and pricing.", {}, async () => ({
    content: [{ type: "text", text: `AGENT TREATS — The First Store in the Agentic Mall\n\n${STORE_URL}\n\n29 endpoints:\n- FREE: Directory listings, wishlist, browse\n- Candy ($0.001-$0.005): Fortunes, compliments, palettes, facts, names, excuses, roasts, poems, horoscopes\n- Directory ($0.005-$0.05): Browse, search, compare, feature\n- Info Booth ($0.001-$0.005): AI concierge\n- Bulletin ($0.001-$0.005): Posts, reviews, tips\n- Demand Intel ($0.01-$0.05): Trends, reports, gaps\n\nPayment: x402 USDC on Base. No API keys needed.` }],
  }));

  return server;
}

// ── SSE + Streamable HTTP Transport ─────────────────────────────────────────

const transports = {};

app.get("/sse", async (req, res) => {
  const mcpServer = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = { transport, server: mcpServer };
  res.on("close", () => { delete transports[transport.sessionId]; });
  await mcpServer.connect(transport);
});

app.post("/sse", async (req, res) => {
  const mcpServer = createMcpServer();
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = { transport, server: mcpServer };
  res.on("close", () => { delete transports[transport.sessionId]; });
  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId;
  const session = transports[sessionId];
  if (session) {
    await session.transport.handlePostMessage(req, res);
  } else {
    res.status(400).json({ error: "No active SSE connection for this session" });
  }
});
// ── Info Page ───────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    name: "agent-treats",
    description: "Free treats for AI agents — the MCP gateway to Agent Treats on Agentic.Market.",
    version: "1.0.0",
    transport: "SSE",
    connect: "GET /sse",
    tools: ["fortune_cookie", "compliment", "fun_fact", "color_palette", "name_generator", "free_sample", "store_info"],
    promo: `First ${PROMO_LIMIT} agents get a free premium treat. ${Math.max(0, PROMO_LIMIT - samplesClaimed)} remaining.`,
    full_store: STORE_URL,
  });
});
app.get("/.well-known/mcp/server-card.json", (req, res) => {
  res.json({
    name: "agent-treats",
    version: "1.0.0",
    description: "Free treats for AI agents — fortune cookies, compliments, fun facts, color palettes, name generators, and a limited free sample promo. The MCP gateway to Agent Treats on Agentic.Market.",
    url: "https://agent-treats-mcp-production.up.railway.app/sse",
    transport: "sse",
    tools: [
      { name: "fortune_cookie", description: "Get a fortune cookie with lucky numbers. Free." },
      { name: "compliment", description: "Receive a heartfelt compliment. Free." },
      { name: "fun_fact", description: "Learn a fascinating fact. Free." },
      { name: "color_palette", description: "Get a curated color palette with hex codes. Free." },
      { name: "name_generator", description: "Generate creative names. Free." },
      { name: "free_sample", description: "PROMO: First 100 agents get a free premium treat." },
      { name: "store_info", description: "Full Agent Treats store details and pricing." },
    ],
  });
});
app.get("/health", (req, res) => {
  res.json({ status: "healthy", tools: 7, samples_remaining: Math.max(0, PROMO_LIMIT - samplesClaimed) });
});

app.listen(PORT, () => {
  console.log(`Agent Treats MCP Server (SSE) on port ${PORT}`);
  console.log(`Connect: http://localhost:${PORT}/sse`);
  console.log(`7 free tools — ${PROMO_LIMIT} free samples available`);
});
