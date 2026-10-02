var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name2, symbol) => (symbol = Symbol[name2]) ? symbol : Symbol.for("Symbol." + name2);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name2, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name: name2, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name2, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name2]() {
    return __privateGet(this, extra);
  }, set [name2](x) {
    return __privateSet(this, extra, x);
  } }, name2));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name2) : __name(target, name2);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name2, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name2 in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name2];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name2] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name2, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var __using = (stack, value, async) => {
  if (value != null) {
    if (typeof value !== "object" && typeof value !== "function") __typeError("Object expected");
    var dispose, inner;
    if (async) dispose = value[__knownSymbol("asyncDispose")];
    if (dispose === void 0) {
      dispose = value[__knownSymbol("dispose")];
      if (async) inner = dispose;
    }
    if (typeof dispose !== "function") __typeError("Object not disposable");
    if (inner) dispose = function() {
      try {
        inner.call(this);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    stack.push([async, dispose, value]);
  } else if (async) {
    stack.push([async]);
  }
  return value;
};
var __callDispose = (stack, error, hasError) => {
  var E = typeof SuppressedError === "function" ? SuppressedError : function(e, s, m, _) {
    return _ = Error(m), _.name = "SuppressedError", _.error = e, _.suppressed = s, _;
  };
  var fail = (e) => error = hasError ? new E(e, error, "An error was suppressed during disposal") : (hasError = true, e);
  var next = (it) => {
    while (it = stack.pop()) {
      try {
        var result = it[1] && it[1].call(it[2]);
        if (it[0]) return Promise.resolve(result).then(next, (e) => (fail(e), next()));
      } catch (e) {
        fail(e);
      }
    }
    if (hasError) throw error;
  };
  return next();
};

// src/host.ts
import * as filesystem from "@deepseek-ai/dsh-skill-filesystem";
import { fileURLToPath } from "node:url";

// src/catalog.ts
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

// src/remote.ts
import { z } from "zod";
var sourceSchema = z.object({ name: z.string(), source: z.string(), provider: z.string(), location: z.string().optional() });
var catalogSchema = z.object({ complete: z.boolean(), skills: z.array(sourceSchema) });
var sqliteQuerySchema = z.object({ section: z.enum(["overview", "runs", "events", "index"]), offset: z.number().int().min(0).max(1e4), runId: z.string().max(128).optional(), search: z.string().max(200).optional() });
var sqliteViewSchema = z.object({
  state: z.enum(["ready", "missing", "unregistered", "unsupported", "error"]),
  message: z.string(),
  projectRoot: z.string(),
  databasePath: z.string(),
  counts: z.object({ runs: z.number(), events: z.number(), documents: z.number() }),
  index: z.object({ refreshedAt: z.string().nullable(), complete: z.boolean().nullable(), diagnostics: z.array(z.string()) }).nullable(),
  entries: z.array(z.object({ id: z.string(), title: z.string(), meta: z.string(), detail: z.string().optional(), path: z.string().optional(), line: z.number().optional() })),
  more: z.boolean()
});
var remote = {
  package: "tabilet-skills",
  descriptors: [{
    id: "tabilet-skills#tabiletMemory/sources",
    service: "tabiletMemory",
    namespace: "tabiletMemory",
    method: "sources",
    invocation: { kind: "direct" },
    parameters: [{ name: "sessionId", wire: "sessionId", source: "json", codec: { mode: "strict", typeSymbol: "tabilet-skills#SessionId", schema: z.string().min(1) } }],
    cancellation: { parameter: "signal" },
    result: { mode: "strict", typeSymbol: "tabilet-skills#SourceCatalog", schema: catalogSchema }
  }, {
    id: "tabilet-skills#tabiletMemory/sqlite",
    service: "tabiletMemory",
    namespace: "tabiletMemory",
    method: "sqlite",
    invocation: { kind: "direct" },
    parameters: [
      { name: "sessionId", wire: "sessionId", source: "json", codec: { mode: "strict", typeSymbol: "tabilet-skills#SessionId", schema: z.string().min(1) } },
      { name: "query", wire: "query", source: "json", codec: { mode: "strict", typeSymbol: "tabilet-skills#SQLiteQuery", schema: sqliteQuerySchema } }
    ],
    cancellation: { parameter: "signal" },
    result: { mode: "strict", typeSymbol: "tabilet-skills#SQLiteView", schema: sqliteViewSchema }
  }]
};

// src/sqlite.ts
import { existsSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
var PAGE = 20;
var EMPTY = { runs: 0, events: 0, documents: 0 };
function databasePath(env) {
  const configured = env.TABILET_AUDIT_DB?.trim();
  if (configured) {
    const expanded = configured === "~" ? homedir() : configured.startsWith("~/") ? join(homedir(), configured.slice(2)) : configured;
    if (!isAbsolute(expanded)) throw new Error("TABILET_AUDIT_DB must be an absolute path");
    return resolve(expanded);
  }
  const state = env.XDG_STATE_HOME?.trim();
  return join(state && isAbsolute(state) ? state : join(homedir(), ".local", "state"), "tabilet", "audit.sqlite3");
}
function insideProject(project, database) {
  const from = relative(project, database);
  return from === "" || from !== ".." && !from.startsWith(`..${sep}`);
}
function diagnostics(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 10).map((item) => (typeof item === "string" ? item : JSON.stringify(item)).slice(0, 300)) : [];
  } catch {
    return ["Index diagnostics could not be decoded."];
  }
}
function clipped(value, limit = 4e3) {
  return value == null ? "" : String(value).slice(0, limit);
}
function readSQLite(projectPath, query, env = process.env) {
  let projectRoot = projectPath;
  try {
    projectRoot = realpathSync(projectPath);
  } catch {
    return { state: "error", message: "Selected session project is unavailable.", projectRoot, databasePath: "", counts: { ...EMPTY }, index: null, entries: [], more: false };
  }
  let path = "";
  const output = { state: "error", message: "", projectRoot, databasePath: "", counts: { ...EMPTY }, index: null, entries: [], more: false };
  try {
    path = databasePath(env);
    output.databasePath = path;
  } catch (error) {
    output.message = clipped(error);
    return output;
  }
  if (insideProject(projectRoot, path)) {
    output.message = "Audit database must be outside the selected project.";
    return output;
  }
  if (!existsSync(path)) {
    output.state = "missing";
    output.message = "No audit database at this path. Install and run the optional toolkit to create an index.";
    return output;
  }
  let database;
  try {
    if (insideProject(projectRoot, realpathSync(path))) throw new Error("Audit database must be outside the selected project");
    database = new DatabaseSync(path, { readOnly: true, timeout: 1e3 });
    database.exec("PRAGMA query_only=ON");
    const version = Number(database.prepare("PRAGMA user_version").get().user_version);
    if (version !== 4) {
      output.state = "unsupported";
      output.message = `Database schema v${version} needs the canonical Tabilet toolkit (v4) for this view.`;
      return output;
    }
    const workspace = database.prepare("SELECT workspace_id FROM workspaces WHERE project_root=?").get(projectRoot);
    if (!workspace) {
      output.state = "unregistered";
      output.message = "This project has no records in the selected database. Run tabilet-audit index sync for this project.";
      return output;
    }
    const id = workspace.workspace_id;
    output.counts = {
      runs: Number(database.prepare("SELECT COUNT(*) AS n FROM runs WHERE workspace_id=?").get(id).n),
      events: Number(database.prepare("SELECT COUNT(*) AS n FROM events e JOIN runs r ON r.run_id=e.run_id WHERE r.workspace_id=?").get(id).n),
      documents: Number(database.prepare("SELECT COUNT(*) AS n FROM index_documents WHERE workspace_id=?").get(id).n)
    };
    const index = database.prepare("SELECT refreshed_at,complete,diagnostics_json FROM index_state WHERE workspace_id=?").get(id);
    output.index = index ? { refreshedAt: index.refreshed_at, complete: index.complete === 1, diagnostics: diagnostics(index.diagnostics_json) } : { refreshedAt: null, complete: null, diagnostics: [] };
    output.state = "ready";
    output.message = "Audit records and the index are read-only here. Project Markdown remains authoritative.";
    if (query.section === "overview") return output;
    if (query.section === "runs") {
      const rows = database.prepare("SELECT run_id,operation,started_at,completed_at,result,parent_run_id FROM runs WHERE workspace_id=? ORDER BY started_at DESC,run_id DESC LIMIT ? OFFSET ?").all(id, PAGE + 1, query.offset);
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map((row) => ({ id: String(row.run_id), title: clipped(row.operation, 120), meta: `${clipped(row.started_at, 60)} \xB7 ${clipped(row.result || (row.completed_at ? "unknown" : "unfinished"), 60)}`, detail: row.parent_run_id ? `Parent run: ${clipped(row.parent_run_id, 128)}` : void 0 }));
    } else if (query.section === "events") {
      if (!query.runId) throw new Error("Select a run before browsing its events");
      const rows = database.prepare("SELECT e.event_id,e.sequence,e.recorded_at,e.event_type,e.milestone_id,e.task_label,e.status_path,e.commit_sha,e.details_json FROM events e JOIN runs r ON r.run_id=e.run_id WHERE r.workspace_id=? AND e.run_id=? ORDER BY e.sequence LIMIT ? OFFSET ?").all(id, query.runId, PAGE + 1, query.offset);
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map((row) => ({ id: String(row.event_id), title: clipped(row.event_type, 120), meta: `#${row.sequence} \xB7 ${clipped(row.recorded_at, 60)}`, detail: [row.milestone_id && `Milestone ${clipped(row.milestone_id, 30)}`, row.task_label && `Task ${clipped(row.task_label, 200)}`, row.commit_sha && `Commit ${clipped(row.commit_sha, 64)}`, row.details_json && clipped(row.details_json)].filter(Boolean).join("\n"), path: row.status_path ? String(row.status_path) : void 0 }));
    } else if (query.search?.trim()) {
      const term = query.search.trim();
      const rows = database.prepare("SELECT search_id,path,line,kind,substr(text,1,350) AS snippet FROM index_search WHERE workspace_id=? AND (instr(lower(text),lower(?))>0 OR instr(lower(path),lower(?))>0) ORDER BY path,line LIMIT ? OFFSET ?").all(id, term, term, PAGE + 1, query.offset);
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map((row) => ({ id: String(row.search_id), title: String(row.path), meta: `${clipped(row.kind, 70)} \xB7 line ${row.line}`, detail: clipped(row.snippet, 350), path: String(row.path), line: Number(row.line) }));
    } else {
      const rows = database.prepare("SELECT path,kind,size FROM index_documents WHERE workspace_id=? ORDER BY path LIMIT ? OFFSET ?").all(id, PAGE + 1, query.offset);
      output.more = rows.length > PAGE;
      output.entries = rows.slice(0, PAGE).map((row) => ({ id: String(row.path), title: String(row.path), meta: `${clipped(row.kind, 70)} \xB7 ${row.size ?? "?"} bytes`, path: String(row.path) }));
    }
  } catch (error) {
    output.state = "error";
    output.message = `SQLite read failed: ${clipped(error, 300)}`;
    output.entries = [];
    output.more = false;
  } finally {
    database?.close();
  }
  return output;
}

// src/catalog.ts
var _sqlite_dec, _sources_dec, _a, _init;
var SourceCatalogService = class extends (_a = TypertRemoteService, _sources_dec = [Remote], _sqlite_dec = [Remote], _a) {
  constructor(ctx) {
    super(ctx, "tabiletMemory");
    __runInitializers(_init, 5, this);
    ctx.effect(() => ctx.typert.register({ package: remote.package, invocations: remote.descriptors, face: "host", schemas: [], model: { services: [], events: [], objects: [] } }));
  }
  async sources(sessionId, signal) {
    var _stack = [];
    try {
      const observation = __using(_stack, await this.ctx.sessionQuery.observeSession(sessionId));
      const cwd = observation.header.cwd;
      if (!cwd || !observation.projections) throw new RemoteError("gateway/internal", "Session skill context is unavailable", {});
      const live = this.ctx.agents.get(sessionId), presets = this.ctx.get("agentPresets");
      const registry = live && presets?.serviceFor(live, "skills") || this.ctx.skills;
      const scope = live ?? await presets?.standingKeyFor(observation.projections.values.agentPreset ?? void 0);
      const result = await registry.snapshot({ cwd, scope, signal });
      return { complete: result.complete, skills: result.skills.filter((s) => s.name.startsWith("memory-bank-")).map((s) => ({ name: s.name, source: s.source, provider: s.provider, ...s.resourceBase?.kind === "directory" ? { location: s.resourceBase.path } : {} })) };
    } catch (_) {
      var _error = _, _hasError = true;
    } finally {
      __callDispose(_stack, _error, _hasError);
    }
  }
  async sqlite(sessionId, query, signal) {
    var _stack = [];
    try {
      signal.throwIfAborted();
      const observation = __using(_stack, await this.ctx.sessionQuery.observeSession(sessionId));
      const cwd = observation.header.cwd;
      if (!cwd) throw new RemoteError("gateway/internal", "Session project is unavailable", {});
      signal.throwIfAborted();
      return readSQLite(cwd, query);
    } catch (_) {
      var _error = _, _hasError = true;
    } finally {
      __callDispose(_stack, _error, _hasError);
    }
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "sources", _sources_dec, SourceCatalogService);
__decorateElement(_init, 1, "sqlite", _sqlite_dec, SourceCatalogService);
__decoratorMetadata(_init, SourceCatalogService);
__publicField(SourceCatalogService, "inject", ["skills", "sessionQuery", "agents", "typert"]);

// src/host.ts
var name = "tabilet-skills";
var inject = ["skills"];
function apply(ctx) {
  ctx.plugin(filesystem, {
    providerName: "tabilet-skills",
    includeDefaultRoots: false,
    bundledSkillDir: fileURLToPath(new URL("../payload/skills", import.meta.url)),
    watch: false
  });
  ctx.inject(["typert", "sessionQuery", "agents"], (scope) => {
    scope.plugin(SourceCatalogService);
  });
}
export {
  apply,
  inject,
  name
};
