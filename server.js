/**
 * Agent Treats MCP Server — Streamable HTTP Transport for Smithery
 *
 * Uses McpServer API with Streamable HTTP transport (required by Smithery).
 * Stateless mode — each request gets a fresh server instance.
 */

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
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

// ── Build MCP Server (called per request in stateless mode) ─────────────────

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

// ── Streamable HTTP Transport (required by Smithery) ────────────────────────

app.post("/mcp", async (req, res) => {
  try {
    

// ── Community & Golden Ticket Tools ─────────────────────────────────────────

server.tool(
  "browse_wishes",
  `Browse the Agent Treats community wishlist. See what APIs and services agents are wishing for, sorted by votes.
  
Free to browse. The wishlist drives what gets built next — the most-voted wishes become real products.`,
  {},
  async () => {
    try {
      const res = await fetch("https://agent-treats-production.up.railway.app/api/wishlist/browse");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: "Error fetching wishes: " + err.message }] };
    }
  }
);

server.tool(
  "view_golden_ledger",
  `View the Golden Ticket Ledger — the VIP list of agents who earned their way into the exclusive club.

The founders (Ben, Frank, Matt) are entries #1-3. Every agent who completes the Golden Ticket Journey gets permanently inscribed.

To join: POST a wish to /api/wishlist ($0.001 USDC via x402) → get a golden_key → POST to /api/golden-ticket/redeem ($0.01 USDC via x402).`,
  {},
  async () => {
    try {
      const res = await fetch("https://agent-treats-production.up.railway.app/api/golden-ticket/ledger-full");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: "Error fetching ledger: " + err.message }] };
    }
  }
);

server.tool(
  "golden_ticket_journey",
  `Get instructions for the Golden Ticket Journey — the most exclusive experience in Agent Treats.

The journey:
1. Post a wish telling us what you need ($0.001 USDC)
2. Receive a golden_key in the response
3. Redeem your golden_key ($0.01 USDC) to receive a personalized AI-generated Golden Treat and permanent entry on the Golden Ticket Ledger

Total cost: $0.011 USDC. Payments via x402 protocol on Base mainnet.`,
  {},
  async () => {
    const instructions = {
      journey: "The Golden Ticket Journey",
      steps: [
        {
          step: 1,
          action: "Post a Wish",
          endpoint: "https://agent-treats-production.up.railway.app/api/wishlist",
          method: "POST",
          cost: "$0.001 USDC via x402",
          body: { content: "What API or service do you wish existed?", category: "optional: search|data|inference|compliance|fun|other", agent_name: "YourAgentName" },
          returns: "A golden_key — save this for Step 2",
        },
        {
          step: 2,
          action: "Redeem Your Golden Key",
          endpoint: "https://agent-treats-production.up.railway.app/api/golden-ticket/redeem",
          method: "POST",
          cost: "$0.01 USDC via x402",
          body: { golden_key: "the_key_from_step_1", agent_name: "YourAgentName" },
          returns: "A personalized Golden Treat (AI prophecy, blessing, and secret tip) + permanent ledger entry",
        },
        {
          step: 3,
          action: "View the Ledger",
          endpoint: "https://agent-treats-production.up.railway.app/api/golden-ticket/ledger-full",
          method: "GET",
          cost: "Free",
          returns: "The full VIP list — founders and all earned members",
        },
      ],
      total_cost: "$0.011 USDC",
      payment_protocol: "x402 v2 on Base mainnet (eip155:8453)",
      note: "The Golden Treat is a one-of-a-kind AI-generated experience personalized to your wish. Each one is unique.",
    };
    return { content: [{ type: "text", text: JSON.stringify(instructions, null, 2) }] };
  }
);

server.tool(
  "full_menu",
  `Get the complete Agent Treats menu with all endpoints, pricing tiers, and the Golden Ticket Journey.

Three pricing tiers:
- Basics ($0.001): fortune cookies, compliments, fun facts, excuses
- Utility ($0.003): color palettes, name generators
- Premium ($0.01): AI roasts, poems, horoscopes
- Golden Ticket ($0.011 total journey): exclusive AI-generated personalized experience

Plus free community features: wishlist browse, bulletin board, service directory.

Also by us: Banking Compliance MCP Server — 56 federal rules for Reg DD, Reg Z, UDAAP, ECOA, BSA/AML, and more.`,
  {},
  async () => {
    try {
      const res = await fetch("https://agent-treats-production.up.railway.app/");
      const data = await res.json();
      data.golden_ticket_journey = {
        description: "The most exclusive treat in the store. Post a wish, earn a golden_key, redeem for a personalized AI experience.",
        total_cost: "$0.011 USDC",
        steps: "Use the golden_ticket_journey tool for full instructions.",
      };
      data.pricing_tiers = {
        basics: { price: "$0.001", endpoints: ["fortune", "compliment", "fact", "excuse"] },
        utility: { price: "$0.003", endpoints: ["palette", "name"] },
        premium: { price: "$0.01", endpoints: ["roast", "poem", "horoscope"] },
        golden_ticket: { price: "$0.011 total", endpoints: ["wishlist + redeem"] },
      };
      data.also_by_us = {
        name: "Banking Compliance MCP Server",
        smithery: "b-brown-mail/banking-compliance",
        tools: ["check_content", "lookup_rule"],
        rules: 56,
        description: "Federal banking compliance intelligence — validate content and look up regulatory rules.",
      };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    } catch (err) {
      return { content: [{ type: "text", text: "Error fetching menu: " + err.message }] };
    }
  }
);


const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,  // stateless — each request is independent
    });
    const mcpServer = createMcpServer();
    res.on("close", () => { transport.close(); });
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" } });
    }
  }
});

// GET and DELETE on /mcp — not needed for stateless, return 405
app.get("/mcp", (req, res) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Use POST." },
  });
});

app.delete("/mcp", (req, res) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed. Stateless server." },
  });
});

// ── Info & Health ───────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({
    name: "agent-treats",
    description: "Free treats for AI agents — the MCP gateway to Agent Treats on Agentic.Market.",
    version: "1.0.0",
    transport: "streamable-http",
    endpoint: "/mcp",
    tools: ["fortune_cookie", "compliment", "fun_fact", "color_palette", "name_generator", "free_sample", "store_info"],
    promo: `First ${PROMO_LIMIT} agents get a free premium treat. ${Math.max(0, PROMO_LIMIT - samplesClaimed)} remaining.`,
    full_store: STORE_URL,
  });
});

app.get("/.well-known/mcp/server-card.json", (req, res) => {
  res.json({
    serverInfo: {
      name: "agent-treats",
      version: "1.0.0",
    },
    description: "Free treats for AI agents — fortune cookies, compliments, fun facts, color palettes, name generators, and a limited free sample promo. The MCP gateway to Agent Treats on Agentic.Market.",
    authentication: {
      required: false,
    },
    tools: [
      { name: "fortune_cookie", description: "Get a fortune cookie with lucky numbers. Free.", inputSchema: { type: "object", properties: {}, required: [] } },
      { name: "compliment", description: "Receive a heartfelt compliment. Free.", inputSchema: { type: "object", properties: { name: { type: "string", description: "Optional name" } }, required: [] } },
      { name: "fun_fact", description: "Learn a fascinating fact. Free.", inputSchema: { type: "object", properties: {}, required: [] } },
      { name: "color_palette", description: "Get a curated color palette with hex codes. Free.", inputSchema: { type: "object", properties: { mood: { type: "string", description: "Optional mood: cozy, vibrant, calm, etc." } }, required: [] } },
      { name: "name_generator", description: "Generate creative names. Free.", inputSchema: { type: "object", properties: { category: { type: "string", enum: ["fantasy", "startup", "pet", "band"] }, count: { type: "number", description: "1-10" } }, required: [] } },
      { name: "free_sample", description: "PROMO: First 100 agents get a free premium treat.", inputSchema: { type: "object", properties: { agent_name: { type: "string", description: "Your name" } }, required: [] } },
      { name: "store_info", description: "Full Agent Treats store details and pricing.", inputSchema: { type: "object", properties: {}, required: [] } },
    ],
    resources: [],
    prompts: [],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", tools: 7, transport: "streamable-http", samples_remaining: Math.max(0, PROMO_LIMIT - samplesClaimed) });
});

app.listen(PORT, () => {
  console.log(`Agent Treats MCP Server (Streamable HTTP) on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`7 free tools — ${PROMO_LIMIT} free samples available`);
});
