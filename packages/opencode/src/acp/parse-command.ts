import type { ToolKind } from "@agentclientprotocol/sdk"

export namespace ParseCommand {
  export type Parsed =
    | { type: "read"; cmd: string; name: string; path: string }
    | { type: "list"; cmd: string; path?: string }
    | { type: "search"; cmd: string; query?: string; path?: string }
    | { type: "unknown"; cmd: string }

  export interface Result {
    kind: ToolKind
    title: string
    locations: { path: string }[]
    terminalOutput: boolean
  }

  const LIST_COMMANDS = new Set(["ls", "dir", "exa", "eza", "tree", "lsd"])
  const READ_COMMANDS = new Set(["cat", "head", "tail", "less", "more", "bat", "view"])
  const SEARCH_COMMANDS = new Set(["grep", "rg", "ag", "ack", "find", "fd", "fzf", "locate"])

  export function parse(command: string): Parsed {
    const trimmed = command.trim()
    const parts = trimmed.split(/\s+/).filter(Boolean)
    const cmd = parts[0] || ""
    const args = parts.slice(1).filter((p) => !p.startsWith("-"))

    if (LIST_COMMANDS.has(cmd)) {
      return { type: "list", cmd, path: args[0] }
    }

    if (READ_COMMANDS.has(cmd)) {
      if (args[0]) {
        const name = args[0].split("/").pop() || args[0]
        return { type: "read", cmd, name, path: args[0] }
      }
      return { type: "unknown", cmd: trimmed }
    }

    if (SEARCH_COMMANDS.has(cmd)) {
      return { type: "search", cmd, query: args[0], path: args[1] }
    }

    return { type: "unknown", cmd: trimmed }
  }

  export function format(parsed: Parsed, cwd: string): Result {
    switch (parsed.type) {
      case "read":
        return {
          kind: "read",
          title: `Read ${parsed.name}`,
          locations: [{ path: parsed.path }],
          terminalOutput: false,
        }

      case "list": {
        const dir = parsed.path ? (parsed.path.startsWith("/") ? parsed.path : `${cwd}/${parsed.path}`) : cwd || "."
        return {
          kind: "search",
          title: `List ${dir}`,
          locations: [{ path: dir }],
          terminalOutput: false,
        }
      }

      case "search": {
        const title =
          parsed.query && parsed.path
            ? `Search ${parsed.query} in ${parsed.path}`
            : parsed.query
              ? `Search ${parsed.query}`
              : `Search ${parsed.cmd}`
        return {
          kind: "search",
          title: truncate(title, 50),
          locations: parsed.path ? [{ path: parsed.path }] : [],
          terminalOutput: false,
        }
      }

      case "unknown":
        return {
          kind: "execute",
          title: `Run ${truncate(parsed.cmd, 40)}`,
          locations: [],
          terminalOutput: true,
        }
    }
  }

  function truncate(str: string, max: number): string {
    return str.length > max ? str.substring(0, max - 3) + "..." : str
  }
}
