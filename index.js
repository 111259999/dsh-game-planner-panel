/**
 * Host half of dsh-game-planner-panel.
 *
 * The panel is a generic Agent Hub. This half scans every YAML file under
 * `~/.dsh/subagents/` and exposes the roster to the browser through two
 * authenticated JSON endpoints. It never hard-codes role ids: adding a YAML
 * file is enough for the card to appear after the next refresh.
 *
 * `dsh-subagent-library` reads the same directory on every tool call, so
 * rewriting one file's `enabled` flag enables or disables that agent without
 * restarting DSH.
 */
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const name = 'dsh-game-planner-panel';

/** The web carrier and the authenticated-request fence. */
export const inject = ['webServer', 'connection'];

const BASE_PATH = '/plugins/game-planner';
const MAX_BODY_BYTES = 8 * 1024;
const YAML_FILE = /\.ya?ml$/i;

function rosterDir() {
  return join(homedir(), '.dsh', 'subagents');
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

function humanizeId(id) {
  return id
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function unquote(raw) {
  const value = raw.trim();
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

/**
 * Minimal top-level YAML reader for the two display fields we need. It handles
 * inline strings, quoted strings and `|` / `>` block scalars. The whole file is
 * still owned by dsh-subagent-library; this is deliberately not a YAML parser.
 */
function parseTextValue(text, key) {
  const lines = text.split(/\r?\n/);
  const prefix = `${key}:`;
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith(prefix)) {
      start = index;
      break;
    }
  }
  if (start === -1) return '';

  const inline = lines[start].slice(prefix.length).trim();
  if (inline && !/^[|>][+-]?$/.test(inline)) {
    return unquote(inline);
  }
  if (!/^[|>]/.test(inline)) return '';

  const block = [];
  let minIndent = Number.POSITIVE_INFINITY;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) {
      block.push({ text: '', indent: 0 });
      continue;
    }
    const indent = /^ */.exec(line)[0].length;
    if (indent === 0) break;
    minIndent = Math.min(minIndent, indent);
    block.push({ text: line, indent });
  }

  if (block.length === 0) return '';
  const body = block
    .map(({ text: line }) => (line ? line.slice(Number.isFinite(minIndent) ? minIndent : 0) : ''))
    .join('\n');

  if (!inline.startsWith('>')) return body.trim();
  return body
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' '),
    )
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function parseDisplayName(text, id) {
  const explicit = parseTextValue(text, 'name');
  if (explicit) return explicit;

  const comment = /^#\s*(.+?)\s*$/m.exec(text)?.[1];
  if (comment) {
    const candidate = comment.split(/\s+[/·|]\s+/)[0].trim();
    if (candidate && candidate.length <= 64) return candidate;
  }
  return humanizeId(id);
}

async function listRosterFiles() {
  try {
    const dirents = await readdir(rosterDir(), { withFileTypes: true });
    return dirents
      .filter(
        (dirent) =>
          dirent.isFile() && YAML_FILE.test(dirent.name) && !dirent.name.startsWith('_') && !dirent.name.startsWith('.'),
      )
      .map((dirent) => dirent.name)
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function readRoster() {
  const dir = rosterDir();
  const files = await listRosterFiles();
  const entries = [];

  for (const file of files) {
    try {
      const text = await readFile(join(dir, file), 'utf8');
      const id = file.replace(YAML_FILE, '');
      entries.push({
        id,
        file,
        name: parseDisplayName(text, id),
        description: parseTextValue(text, 'description') || '—',
        enabled: parseEnabled(text),
      });
    } catch {
      // A single unreadable file must not take down the entire roster.
    }
  }

  return { ok: true, dir, entries };
}

/** Resolve an id by matching the file stem, never by joining user input. */
async function findRosterFile(id) {
  if (typeof id !== 'string' || id.length === 0 || id.length > 128 || /[\\/]/.test(id)) return undefined;
  const files = await listRosterFiles();
  return files.find((file) => file.replace(YAML_FILE, '') === id);
}

/** Serialize writes so two rapid clicks cannot interleave read-modify-write. */
let writeChain = Promise.resolve();
function enqueueWrite(operation) {
  const run = writeChain.then(operation, operation);
  writeChain = run.catch(() => {});
  return run;
}

async function setEnabled(id, enabled) {
  const file = await findRosterFile(id);
  if (!file) {
    const error = new Error(`subagent YAML not found: ${id}`);
    error.statusCode = 404;
    throw error;
  }

  const path = join(rosterDir(), file);
  let text;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      const missing = new Error(`subagent YAML not found: ${path}`);
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
            ctx.logger?.warn?.(`game-planner: failed to scan roster: ${String(error)}`);
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
