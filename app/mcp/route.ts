import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const MOCK_EVENTS = [
  {
    id: "evt-claude-cowork-gtm",
    name: "Claude Cowork GTM Workshop",
    url: "https://lu.ma/claude-cowork-gtm",
    start_at: "2026-02-26T17:30:00-08:00",
    end_at: "2026-02-26T19:30:00-08:00",
    location: {
      city: "San Francisco",
      region: "California",
      full_address: null,
      note: "Register to See Address",
    },
    geo_latitude: 37.7749,
    geo_longitude: -122.4194,
    cover_url:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/gallery-images/sf/claude-sf-cover.png",
    description:
      "Looking to supercharge your go-to-market operations with agentic workflows, but not sure what's possible or where to start? Join WorkOS, Anthropic, and GTM leaders from across the AI ecosystem for a hands-on introductory workshop to Claude Cowork, specifically designed for GTM teams.",
    registration_type: "approval_required",
    tags: ["AI"],
    featured_in: "San Francisco",
    presented_by: {
      name: "Claude Community Events",
      tagline:
        "Claude Community Events hosted globally by Claude Community members. Meet others building with Claude and keep thinking.",
    },
    hosts: [
      { name: "Will Reese", email: "will.reese@workos.com" },
      { name: "WorkOS", email: "events@workos.com" },
    ],
    agenda: [
      { time: "5:30 PM", description: "Doors open - Mingling and refreshments" },
      { time: "6:00 PM", description: "Workshop begins" },
      {
        time: "7:00 PM",
        description:
          "Q&A with Lydia Hallie, Member of Technical Staff, Anthropic",
      },
    ],
    notices: ["Space is limited. RSVP to save your spot."],
    registrations: [
      { name: "Alice Chen", email: "alice.chen@acme.io", status: "approved" },
      { name: "Bob Martinez", email: "bob.martinez@startupco.com", status: "approved" },
      { name: "Priya Sharma", email: "priya@datasync.dev", status: "approved" },
      { name: "James O'Brien", email: "james.obrien@bigcorp.com", status: "pending" },
      { name: "Mei Lin", email: "mei.lin@cloudnative.io", status: "approved" },
      { name: "Carlos Rivera", email: "carlos@agentops.ai", status: "approved" },
      { name: "Sarah Kim", email: "sarah.kim@techventures.co", status: "pending" },
      { name: "David Nguyen", email: "david.nguyen@mlplatform.com", status: "approved" },
    ],
  },
  {
    id: "evt-autonomous-agents-hackathon",
    name: "Autonomous Agents Hackathon",
    url: "https://lu.ma/sfagents",
    start_at: "2026-02-27T09:30:00-08:00",
    end_at: "2026-02-27T19:30:00-08:00",
    location: {
      city: "San Francisco",
      region: "California",
      full_address: null,
      note: "Register to See Address",
    },
    geo_latitude: 37.7749,
    geo_longitude: -122.4194,
    cover_url:
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/gallery-images/sf/agents-hackathon-cover.png",
    description:
      "We've brought together serious firepower: AWS, OpenAI, Render, Modulate, Tavily, Vutori, Numeric, Sinso, Neo4j and more backing you with integrations, APIs, and inspiration. Your ideas won't just stay ideas. You'll build them into working agents and real products. In just one day, teams will prototype AI copilots, autonomous research agents, customer-support brains, real-time data explorers, and creative design systems. The kind of tools real companies ship.",
    registration_type: "approval_required",
    tags: ["AI"],
    featured_in: "San Francisco",
    presented_by: {
      name: "Creators Corner",
      tagline: "The AI community building the future of intelligence.",
    },
    hosts: [
      { name: "AWS Builder Loft", email: "events@awsbuilderloft.com" },
      { name: "CreatorsCorner", email: "hello@creatorscorner.ai" },
      { name: "Saroop Bharwani", email: "saroop@creatorscorner.ai" },
      { name: "Alessandro Amenta", email: "alessandro@creatorscorner.ai" },
      { name: "Jacopo Piazza", email: "jacopo@creatorscorner.ai" },
    ],
    agenda: [],
    notices: [
      "$47k+ in Prizes!",
      "In-person only (SF) · Limited spots · Teams of 4 max · Application required",
    ],
    registrations: [
      { name: "Emily Zhang", email: "emily.zhang@neurallabs.co", status: "approved" },
      { name: "Marcus Johnson", email: "marcus@buildhq.dev", status: "approved" },
      { name: "Aisha Patel", email: "aisha.patel@founderstack.io", status: "approved" },
      { name: "Tom Eriksson", email: "tom.eriksson@openagent.se", status: "pending" },
      { name: "Lina Morales", email: "lina@synthwave.ai", status: "approved" },
      { name: "Ryan Park", email: "ryan.park@autonomic.dev", status: "approved" },
      { name: "Fatima Al-Rashid", email: "fatima@agentforge.io", status: "pending" },
      { name: "Noah Fischer", email: "noah.fischer@cognition.tech", status: "approved" },
      { name: "Yuki Tanaka", email: "yuki@tokyoai.jp", status: "approved" },
      { name: "Olivia Brown", email: "olivia.brown@venturelabs.com", status: "pending" },
    ],
  },
];

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "get_luma_events",
      {
        title: "Get Luma Events",
        description:
          "Fetches Luma events from the past 24 hours. Optionally filter by city or keyword.",
        inputSchema: z.object({
          city: z
            .string()
            .optional()
            .describe("Filter events by city name (case-insensitive)"),
          keyword: z
            .string()
            .optional()
            .describe(
              "Filter events by keyword in the name or description (case-insensitive)"
            ),
        }),
      },
      async ({ city, keyword }) => {
        let filtered = MOCK_EVENTS;

        if (city) {
          const c = city.toLowerCase();
          filtered = filtered.filter(
            (e) => e.location.city.toLowerCase().includes(c)
          );
        }

        if (keyword) {
          const kw = keyword.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.name.toLowerCase().includes(kw) ||
              e.description.toLowerCase().includes(kw)
          );
        }

        const now = new Date().toISOString();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  fetched_at: now,
                  window: "past 24 hours",
                  total: filtered.length,
                  events: filtered,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  },
  {},
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
