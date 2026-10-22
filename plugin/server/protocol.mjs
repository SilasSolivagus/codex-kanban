export const PROTOCOL_VERSION = '2025-06-18'
const SUPPORTED = new Set(['2024-11-05', '2025-03-26', '2025-06-18'])

const INSTRUCTIONS = `Kanban board for this repository, stored in .kanban/board.json.

Start with kanban_board to see Needs you, Running, Backlog and Done.
Create work with kanban_task_create; read a task before writing so you pass its current version.
Use kanban_task_ask for decisions, kanban_task_block for missing external work.
Never approve or reject on your own: those tools require as:"user" after an explicit human decision.`

export function rpcError(id, code, message, data) {
  const error = { code, message }
  if (data !== undefined) error.data = data
  return { jsonrpc: '2.0', id, error }
}

export function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result }
}

export function createProtocol({ tools, callTool, serverInfo = { name: 'codex-kanban', version: '0.1.0' } }) {
  const toolNames = new Set(tools.map((tool) => tool.name))

  function initialize(params = {}) {
    const requested = params.protocolVersion
    const protocolVersion = SUPPORTED.has(requested) ? requested : PROTOCOL_VERSION
    return {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo,
      instructions: INSTRUCTIONS,
    }
  }

  async function handle(message) {
    if (!message || typeof message !== 'object') {
      return rpcError(null, -32700, 'parse error')
    }
    const { id, method, params } = message
    const isNotification = id === undefined || id === null

    if (typeof method !== 'string') {
      return isNotification ? null : rpcError(id, -32600, 'invalid request')
    }

    if (method.startsWith('notifications/')) return null

    try {
      switch (method) {
        case 'initialize':
          return isNotification ? null : rpcResult(id, initialize(params))
        case 'ping':
          return isNotification ? null : rpcResult(id, {})
        case 'tools/list':
          return isNotification ? null : rpcResult(id, { tools })
        case 'tools/call': {
          if (!params || typeof params.name !== 'string') {
            return rpcError(id, -32602, 'tools/call requires a tool name')
          }
          if (!toolNames.has(params.name)) {
            return rpcError(id, -32602, `unknown tool: ${params.name}`)
          }
          const result = await callTool(params.name, params.arguments ?? {})
          return isNotification ? null : rpcResult(id, result)
        }
        case 'resources/list':
          return isNotification ? null : rpcResult(id, { resources: [] })
        case 'prompts/list':
          return isNotification ? null : rpcResult(id, { prompts: [] })
        default:
          return isNotification ? null : rpcError(id, -32601, `method not found: ${method}`)
      }
    } catch (error) {
      const code = error.code === 'KANBAN_ERROR' ? -32603 : -32603
      return isNotification ? null : rpcError(id, code, error.message || 'internal error')
    }
  }

  return { handle, toolNames }
}
