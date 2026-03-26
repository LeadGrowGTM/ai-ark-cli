# AI Ark MCP Server

**Description:** The AI Ark Model Context Protocol (MCP) server enables AI-powered code editors (Cursor, Windsurf) and Claude Desktop to interact directly with the AI Ark API and documentation.

## What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI applications to securely access external data sources and tools.

The AI Ark MCP server provides AI agents with:

- Direct API access to AI Ark functionality
- Documentation search capabilities
- Real-time data from your AI Ark account
- Lead generation and enrichment for sales and marketing teams

## Remote Server Endpoint

```
https://api.ai-ark.com/v1/mcp?token={YOUR-API-KEY}
```

Replace `{YOUR-API-KEY}` with your API key from the AI Ark dashboard.

**Generate API keys at:** https://app.ai-ark.com/settings/api-management/dashboard

## Configuration

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ai-ark": {
      "url": "https://api.ai-ark.com/v1/mcp?token={YOUR-API-KEY}"
    }
  }
}
```

### Windsurf

Follow the same configuration pattern as Cursor in Windsurf's MCP settings.

### Claude Desktop

Configure Claude Desktop to connect to the same remote MCP server endpoint with your API token.

## Testing Your Setup

1. Open your AI editor (Cursor, Windsurf, or Claude Desktop)
2. Start a new chat with the AI assistant
3. Ask about AI Ark. Example queries:
   - "Search for companies in the technology industry in New York"
   - "Find marketing managers at companies with 50-200 employees"
   - "Find software engineers at Google along with their email addresses"

## Available APIs Through MCP

- Company Search API
- People Search API
- Reverse People Lookup API
- Mobile Phone Finder API
- Personality Analysis API
- Export People with Email
- Email Finder functionality
- Credit fetching
