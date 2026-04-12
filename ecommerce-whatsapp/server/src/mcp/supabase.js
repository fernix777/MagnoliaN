import axios from 'axios'

// MCP-based Supabase connector
const MCP_URL = process.env.MCP_SUPABASE_MCP_URL || 'https://mcp.supabase.com/mcp?project_ref=coadlejoezzjvqwhbuqc'
const MCP_TOKEN = process.env.MCP_SUPABASE_TOKEN

export async function connectToMCP() {
  const headers = MCP_TOKEN ? { Authorization: `Bearer ${MCP_TOKEN}` } : {}
  try {
    const res = await axios.get(MCP_URL, { headers })
    return res.data
  } catch (err) {
    throw err
  }
}
