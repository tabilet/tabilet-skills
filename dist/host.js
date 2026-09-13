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
  }]
};

// src/catalog.ts
var _sources_dec, _a, _init;
var SourceCatalogService = class extends (_a = TypertRemoteService, _sources_dec = [Remote], _a) {
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
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "sources", _sources_dec, SourceCatalogService);
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
