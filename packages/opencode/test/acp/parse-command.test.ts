import { describe, expect, it } from "bun:test"
import { ParseCommand } from "../../src/acp/parse-command"

describe("ParseCommand", () => {
  describe("parse", () => {
    it("parses ls as list command", () => {
      const result = ParseCommand.parse("ls")
      expect(result).toEqual({ type: "list", cmd: "ls", path: undefined })
    })

    it("parses ls with path as list command", () => {
      const result = ParseCommand.parse("ls /some/path")
      expect(result).toEqual({ type: "list", cmd: "ls", path: "/some/path" })
    })

    it("parses ls with flags correctly", () => {
      const result = ParseCommand.parse("ls -la /some/path")
      expect(result).toEqual({ type: "list", cmd: "ls", path: "/some/path" })
    })

    it("parses cat as read command", () => {
      const result = ParseCommand.parse("cat file.txt")
      expect(result).toEqual({ type: "read", cmd: "cat", name: "file.txt", path: "file.txt" })
    })

    it("parses cat with path as read command", () => {
      const result = ParseCommand.parse("cat /some/path/file.txt")
      expect(result).toEqual({ type: "read", cmd: "cat", name: "file.txt", path: "/some/path/file.txt" })
    })

    it("parses grep as search command", () => {
      const result = ParseCommand.parse("grep pattern")
      expect(result).toEqual({ type: "search", cmd: "grep", query: "pattern", path: undefined })
    })

    it("parses grep with path as search command", () => {
      const result = ParseCommand.parse("grep pattern /some/path")
      expect(result).toEqual({ type: "search", cmd: "grep", query: "pattern", path: "/some/path" })
    })

    it("parses rg as search command", () => {
      const result = ParseCommand.parse("rg pattern")
      expect(result).toEqual({ type: "search", cmd: "rg", query: "pattern", path: undefined })
    })

    it("parses unknown command", () => {
      const result = ParseCommand.parse("npm install")
      expect(result).toEqual({ type: "unknown", cmd: "npm install" })
    })

    it("parses cat without args as unknown", () => {
      const result = ParseCommand.parse("cat")
      expect(result).toEqual({ type: "unknown", cmd: "cat" })
    })
  })

  describe("format", () => {
    it("formats list command with cwd", () => {
      const parsed = ParseCommand.parse("ls")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("search")
      expect(result.title).toBe("List /home/user")
      expect(result.locations).toEqual([{ path: "/home/user" }])
    })

    it("formats list command with explicit path", () => {
      const parsed = ParseCommand.parse("ls /some/path")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("search")
      expect(result.title).toBe("List /some/path")
      expect(result.locations).toEqual([{ path: "/some/path" }])
    })

    it("formats list command with relative path", () => {
      const parsed = ParseCommand.parse("ls subdir")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("search")
      expect(result.title).toBe("List /home/user/subdir")
      expect(result.locations).toEqual([{ path: "/home/user/subdir" }])
    })

    it("formats read command", () => {
      const parsed = ParseCommand.parse("cat /some/file.txt")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("read")
      expect(result.title).toBe("Read file.txt")
      expect(result.locations).toEqual([{ path: "/some/file.txt" }])
    })

    it("formats search command with query", () => {
      const parsed = ParseCommand.parse("grep pattern")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("search")
      expect(result.title).toBe("Search pattern")
    })

    it("formats search command with query and path", () => {
      const parsed = ParseCommand.parse("grep pattern /some/path")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("search")
      expect(result.title).toBe("Search pattern in /some/path")
      expect(result.locations).toEqual([{ path: "/some/path" }])
    })

    it("formats unknown command as execute", () => {
      const parsed = ParseCommand.parse("npm install")
      const result = ParseCommand.format(parsed, "/home/user")
      expect(result.kind).toBe("execute")
      expect(result.title).toBe("Run npm install")
      expect(result.terminalOutput).toBe(true)
    })
  })
})
