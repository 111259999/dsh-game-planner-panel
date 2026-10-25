/**
 * Host half of dsh-game-planner-panel.
 *
 * The browser panel owns the roster UI. This half owns the two things the
 * browser cannot do: it exposes a small authenticated JSON endpoint on the
 * DSH web server, and it flips the `enabled` flag of the matching roster file
 * under `~/.dsh/subagents/`. `dsh-subagent-library` watches that directory,
 * so a successful write immediately adds/removes the role from its catalog.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const name = 'dsh-game-planner-panel';

/** The web carrier and the authenticated-request fence. */
export const inject = ['webServer', 'connection'];

const BASE_PATH = '/plugins/game-planner';
const MAX_BODY_BYTES = 8 * 1024;

/**
 * UI id -> roster file. The ids are also the shared vocabulary between the two
 * halves, so the Client sends exactly one of these values.
 */
const ROSTER = [
  { id: 'system', file: 'system-designer.yaml' },
  { id: 'combat', file: 'combat-designer.yaml' },
  { id: 'level', file: 'level-designer.yaml' },
  { id: 'numeric', file: 'numerical-designer.yaml' },
  { id: 'economy', file: 'economy-designer.yaml' },
  { id: 'narrative', file: 'narrative-designer.yaml' },
  { id: 'engineering', file: 'programmer-reviewer.yaml' },
  { id: 'art', file: 'artist-reviewer.yaml' },
];

const ROSTER_BY_ID = new Map(ROSTER.map((role) => [role.id, role]));

function rosterDir() {
  return join(homedir(), '.dsh', 'subagents');
}

function rosterPath(role) {
  return join(rosterDir(), role.file);
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.byteLength;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      return { tooLarge: true };
    }
    chunks.push(chunk);
  }
  try {
    return { value: JSON.parse(Buffer.concat(chunks, size).toString('utf8')) };
  } catch {
    return { invalid: true };
  }
}

function parseEnabled(text) {
  const match = /^enabled:\s*(true|false)\s*$/m.exec(text);
  return match ? match[1] === 'true' : true;
}

async function readOne(role) {
  try {
    const text = await readFile(rosterPath(role), 'utf8');
    return { id: role.id, file: role.file, present: true, enabled: parseEnabled(text) };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { id: role.id, file: role.file, present: false, enabled: false };
    }
    throw error;
  }
}

async function readRoster() {
  const entries = await Promise.all(ROSTER.map((role) => readOne(role)));
  return { ok: true, dir: rosterDir(), entries };
}

/** Serialize toggles so two rapid clicks cannot interleave read-modify-write. */
let writeChain = Promise.resolve();
function enqueueWrite(operation) {
  const run = writeChain.then(operation, operation);
  writeChain = run.catch(() => {});
  return run;
}

async function setEnabled(id, enabled) {
  const role = ROSTER_BY_ID.get(id);
  if (!role) {
    const error = new Error(`unknown role id: ${id}`);
    error.statusCode = 400;
    throw error;
  }

  const path = rosterPath(role);
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      const missing = new Error(`roster file not found: ${path}`);
      missing.statusCode = 404;
      throw missing;
    }
    throw error;
  }

  const next = /^enabled:\s*(true|false)\s*$/m.test(text)
    ? text.replace(/^enabled:\s*(true|false)\s*$/m, `enabled: ${enabled}`)
    : `${text.trimEnd()}\nenabled: ${enabled}\n`;

  await mkdir(rosterDir(), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, next, 'utf8');
  await rename(temporary, path);
}

export function apply(ctx) {
  const rejected = (req, res) => {
    const rejection = ctx.connection.requestRejection(req);
    if (rejection === undefined) return false;
    res.statusCode = rejection;
    res.end();
    return true;
  };

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: `${BASE_PATH}/state`,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'GET') {
            res.setHeader('allow', 'GET');
            sendJson(res, 405, { ok: false, error: 'method not allowed' });
            return;
          }
          try {
            sendJson(res, 200, await readRoster());
          } catch (error) {
            ctx.logger?.warn?.(`game-planner: failed to read roster: ${String(error)}`);
            sendJson(res, 500, { ok: false, error: String(error?.message ?? error) });
          }
        },
      }),
    'game-planner: GET state',
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'exact',
        path: `${BASE_PATH}/toggle`,
        handler: async (req, res) => {
          if (rejected(req, res)) return;
          if (req.method !== 'POST') {
            res.setHeader('allow', 'POST');
            sendJson(res, 405, { ok: false, error: 'method not allowed' });
            return;
          }
          if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
            sendJson(res, 415, { ok: false, error: 'content-type must be application/json' });
            return;
          }

          const body = await readJsonBody(req);
          if (body.tooLarge) {
            sendJson(res, 413, { ok: false, error: 'request body too large' });
            return;
          }
          if (body.invalid || body.value === null || typeof body.value !== 'object') {
            sendJson(res, 400, { ok: false, error: 'invalid JSON body' });
            return;
          }

          const { id, enabled } = body.value;
          if (typeof id !== 'string' || typeof enabled !== 'boolean') {
            sendJson(res, 400, { ok: false, error: 'id must be a string and enabled must be a boolean' });
            return;
          }

          try {
            await enqueueWrite(() => setEnabled(id, enabled));
            sendJson(res, 200, { ok: true, id, enabled, ...(await readRoster()) });
          } catch (error) {
            const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
            ctx.logger?.warn?.(`game-planner: failed to toggle ${id}: ${String(error)}`);
            sendJson(res, status, { ok: false, error: String(error?.message ?? error) });
          }
        },
      }),
    'game-planner: POST toggle',
  );
}

export default { name, inject, apply };
