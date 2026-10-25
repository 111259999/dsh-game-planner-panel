window.__ModuleLoader__.load({
  id: 'dsh-game-planner-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'game-planner';
    const API_STATE = '/plugins/game-planner/state';
    const API_TOGGLE = '/plugins/game-planner/toggle';
    const POLL_MS = 12_000;
    const NEW_AGENT_PROMPT =
      '请帮我新建一个子代理。请引导我输入它的角色名、职责描述和 System Prompt，并帮我在 ~/.dsh/subagents/ 目录下生成对应的 YAML 文件。';

    const ZH = {
      'nav.label': 'Agent Hub',
      'page.eyebrow': 'AGENT HUB · LOCAL ROSTER',
      'page.title': 'Agent 统合管理台',
      'page.subtitle': '统合管理与调度本地所有子代理',
      'page.activeUnit': '已启用',
      'page.saved': '开关状态实时写入 DSH 子代理库，列表每 12 秒自动刷新。',
      'page.loading': '正在扫描 DSH 子代理库…',
      'page.error': '同步失败：',
      'page.empty': '还没有子代理，点击下方卡片创建第一个。',
      'page.refresh': '刷新列表',
      'page.refreshing': '刷新中…',
      'status.on': '已启用',
      'status.off': '已禁用',
      'card.ready': '参与调度',
      'card.paused': '暂未启用',
      'card.enable': '启用 ',
      'card.disable': '禁用 ',
      'card.noDescription': '暂无描述',
      'card.newTitle': '新建 Agent',
      'card.newDesc': '打开主对话，按引导填写角色名、职责与 System Prompt。',
    };

    const EN = {
      'nav.label': 'Agent Hub',
      'page.eyebrow': 'AGENT HUB · LOCAL ROSTER',
      'page.title': 'Agent Hub',
      'page.subtitle': 'Unified management and dispatch for every local subagent.',
      'page.activeUnit': 'active',
      'page.saved': 'Switches write directly to the DSH subagent roster; the list refreshes every 12 seconds.',
      'page.loading': 'Scanning the DSH subagent roster…',
      'page.error': 'Sync failed: ',
      'page.empty': 'No subagents yet. Use the card below to create the first one.',
      'page.refresh': 'Refresh',
      'page.refreshing': 'Refreshing…',
      'status.on': 'Enabled',
      'status.off': 'Disabled',
      'card.ready': 'On dispatch',
      'card.paused': 'Not enabled',
      'card.enable': 'Enable ',
      'card.disable': 'Disable ',
      'card.noDescription': 'No description',
      'card.newTitle': 'New Agent',
      'card.newDesc': 'Open the main chat and follow the prompt to define its role and System Prompt.',
    };

    const CSS = `
      .gp-page {
        --gp-bg: var(--dsw-alias-bg-base);
        --gp-surface: var(--dsw-alias-bg-layer-1);
        --gp-surface-2: var(--dsw-alias-bg-layer-2);
        --gp-border: var(--dsw-alias-border-l1);
        --gp-border-strong: var(--dsw-alias-border-l2);
        --gp-text: var(--dsw-alias-label-primary);
        --gp-muted: var(--dsw-alias-label-secondary);
        --gp-faint: var(--dsw-alias-label-tertiary);
        --gp-brand: var(--dsw-alias-brand-primary);
        --gp-success: var(--dsw-alias-state-success-primary);
        --gp-idle: var(--dsw-alias-state-idle-primary);
        --gp-danger: var(--dsw-alias-state-error-primary);

        box-sizing: border-box;
        display: flex;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
        padding: clamp(24px, 3.8vw, 48px) clamp(20px, 4vw, 56px) 28px;
        color: var(--gp-text);
        background-color: var(--gp-bg);
        background-image: radial-gradient(
          760px 380px at 92% -12%,
          color-mix(in srgb, var(--gp-brand) 10%, transparent),
          transparent 70%
        );
        font-family: inherit;
        -webkit-font-smoothing: antialiased;
      }

      .gp-page *,
      .gp-page *::before,
      .gp-page *::after {
        box-sizing: border-box;
      }

      .gp-shell {
        display: flex;
        width: 100%;
        max-width: 1180px;
        min-height: 0;
        flex: 1;
        flex-direction: column;
        margin: 0 auto;
      }

      .gp-hero {
        display: flex;
        flex: none;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 22px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--gp-border);
      }

      .gp-hero-main {
        min-width: 0;
      }

      .gp-hero-side {
        display: flex;
        flex: none;
        flex-direction: column;
        align-items: flex-end;
        gap: 9px;
      }

      .gp-eyebrow {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 10px;
        color: var(--gp-muted);
        font-size: 10.5px;
        font-weight: 650;
        line-height: 1.4;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .gp-eyebrow::before {
        content: '';
        width: 24px;
        height: 1px;
        background: var(--gp-brand);
        opacity: 0.8;
      }

      .gp-title {
        margin: 0;
        font-size: clamp(28px, 3.4vw, 42px);
        font-weight: 650;
        line-height: 1.14;
        letter-spacing: -0.035em;
        text-wrap: balance;
      }

      .gp-subtitle {
        max-width: 660px;
        margin: 10px 0 0;
        color: var(--gp-muted);
        font-size: 13.5px;
        line-height: 1.7;
        text-wrap: pretty;
      }

      .gp-summary {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 8px 12px;
        border: 1px solid var(--gp-border);
        border-radius: 999px;
        color: var(--gp-muted);
        background: var(--gp-surface);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.03);
        font-size: 11.5px;
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
        white-space: nowrap;
      }

      .gp-summary strong {
        color: var(--gp-text);
        font-size: 13px;
        font-weight: 650;
      }

      .gp-pulse {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--gp-success);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--gp-success) 16%, transparent);
      }

      .gp-summary.is-idle .gp-pulse {
        background: var(--gp-idle);
        box-shadow: none;
      }

      .gp-refresh {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 9px;
        border: 1px solid var(--gp-border);
        border-radius: 8px;
        color: var(--gp-faint);
        background: transparent;
        font: inherit;
        font-size: 10.5px;
        line-height: 1.3;
        cursor: pointer;
        transition:
          color 160ms ease,
          border-color 160ms ease,
          background 160ms ease;
      }

      .gp-refresh:hover:not(:disabled) {
        color: var(--gp-text);
        border-color: var(--gp-border-strong);
        background: var(--gp-surface-2);
      }

      .gp-refresh:focus-visible,
      .gp-add:focus-visible {
        outline: 2px solid var(--gp-brand);
        outline-offset: 3px;
      }

      .gp-refresh:disabled {
        cursor: progress;
        opacity: 0.6;
      }

      .gp-refresh svg {
        animation: gp-spin 900ms linear infinite;
      }

      .gp-refresh:not(.is-busy) svg {
        animation: none;
      }

      @keyframes gp-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .gp-empty {
        flex: none;
        margin: 0 2px 12px;
        color: var(--gp-faint);
        font-size: 11.5px;
        line-height: 1.5;
      }

      .gp-scroll {
        min-height: 180px;
        max-height: clamp(290px, 54vh, 590px);
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 2px 8px 10px 2px;
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--gp-brand) 38%, var(--gp-border-strong)) transparent;
      }

      .gp-scroll::-webkit-scrollbar {
        width: 8px;
      }

      .gp-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .gp-scroll::-webkit-scrollbar-thumb {
        border: 2px solid var(--gp-bg);
        border-radius: 999px;
        background: color-mix(in srgb, var(--gp-brand) 34%, var(--gp-border-strong));
      }

      .gp-scroll::-webkit-scrollbar-thumb:hover {
        background: color-mix(in srgb, var(--gp-brand) 62%, var(--gp-border-strong));
      }

      .gp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(238px, 1fr));
        gap: 14px;
      }

      .gp-card {
        position: relative;
        display: flex;
        min-width: 0;
        min-height: 202px;
        flex-direction: column;
        overflow: hidden;
        padding: 17px;
        border: 1px solid var(--gp-border);
        border-radius: 16px;
        background: var(--gp-surface);
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.025);
        transition:
          transform 180ms ease,
          border-color 180ms ease,
          box-shadow 180ms ease;
      }

      .gp-card::after {
        content: '';
        position: absolute;
        inset: 0 0 auto;
        height: 2px;
        background: linear-gradient(90deg, var(--gp-brand), transparent 70%);
        opacity: 0;
        transition: opacity 180ms ease;
      }

      .gp-card:hover {
        transform: translateY(-2px);
        border-color: color-mix(in srgb, var(--gp-brand) 38%, var(--gp-border));
        box-shadow: 0 12px 32px -20px rgb(0 0 0 / 0.32);
      }

      .gp-card:hover::after,
      .gp-card.is-on::after {
        opacity: 0.72;
      }

      .gp-card.is-off::after {
        background: var(--gp-border-strong);
        opacity: 0;
      }

      .gp-card-head {
        display: flex;
        align-items: flex-start;
        gap: 11px;
      }

      .gp-avatar {
        display: grid;
        width: 42px;
        height: 42px;
        flex: none;
        place-items: center;
        border: 1px solid var(--gp-border);
        border-radius: 12px;
        color: var(--gp-brand);
        background: color-mix(in srgb, var(--gp-brand) 9%, var(--gp-surface-2));
        font-size: 16px;
        font-weight: 650;
        line-height: 1;
        transition:
          color 180ms ease,
          background 180ms ease;
      }

      .gp-card.is-off .gp-avatar {
        color: var(--gp-faint);
        background: var(--gp-surface-2);
      }

      .gp-heading {
        min-width: 0;
        flex: 1;
        padding-top: 2px;
      }

      .gp-name {
        overflow: hidden;
        margin: 0;
        font-size: 15px;
        font-weight: 650;
        line-height: 1.35;
        letter-spacing: -0.012em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .gp-code {
        display: block;
        overflow: hidden;
        margin-top: 3px;
        color: var(--gp-faint);
        font-size: 9px;
        font-weight: 650;
        line-height: 1.3;
        letter-spacing: 0.17em;
        text-overflow: ellipsis;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .gp-state {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 5px;
        margin-top: 2px;
        padding: 3px 7px;
        border: 1px solid var(--gp-border);
        border-radius: 999px;
        color: var(--gp-faint);
        background: var(--gp-surface-2);
        font-size: 10px;
        line-height: 1.45;
        white-space: nowrap;
        transition:
          color 180ms ease,
          background 180ms ease,
          border-color 180ms ease;
      }

      .gp-state.is-on {
        color: var(--gp-success);
        border-color: color-mix(in srgb, var(--gp-success) 26%, var(--gp-border));
        background: color-mix(in srgb, var(--gp-success) 9%, var(--gp-surface-2));
      }

      .gp-state-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }

      .gp-desc {
        display: -webkit-box;
        min-height: 3.2em;
        flex: 1;
        overflow: hidden;
        margin: 13px 0 0;
        color: var(--gp-muted);
        font-size: 12.25px;
        line-height: 1.6;
        text-wrap: pretty;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        transition: color 180ms ease;
      }

      .gp-card.is-off .gp-desc {
        color: var(--gp-faint);
      }

      .gp-foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 13px;
        padding-top: 11px;
        border-top: 1px solid var(--gp-border);
      }

      .gp-ready {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--gp-faint);
        font-size: 10.5px;
        line-height: 1.4;
      }

      .gp-ready::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--gp-idle);
        transition: background 180ms ease;
      }

      .gp-card.is-on .gp-ready::before {
        background: var(--gp-success);
      }

      .gp-switch {
        position: relative;
        width: 42px;
        height: 24px;
        flex: none;
        padding: 0;
        border: 1px solid var(--gp-border-strong);
        border-radius: 999px;
        outline: none;
        background: var(--gp-surface-2);
        cursor: pointer;
        transition:
          background 180ms ease,
          border-color 180ms ease;
      }

      .gp-switch:hover {
        border-color: color-mix(in srgb, var(--gp-brand) 45%, var(--gp-border-strong));
      }

      .gp-switch[aria-checked='true'] {
        border-color: var(--gp-brand);
        background: var(--gp-brand);
      }

      .gp-switch:focus-visible {
        outline: 2px solid var(--gp-brand);
        outline-offset: 3px;
      }

      .gp-thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border: 1px solid color-mix(in srgb, var(--gp-text) 10%, transparent);
        border-radius: 50%;
        background: var(--gp-surface);
        box-shadow: 0 1px 3px rgb(0 0 0 / 0.24);
        transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .gp-switch[aria-checked='true'] .gp-thumb {
        transform: translateX(18px);
      }

      .gp-switch:disabled {
        cursor: progress;
        opacity: 0.55;
      }

      .gp-add {
        grid-column: 1 / -1;
        min-height: 86px;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        gap: 13px;
        padding: 14px 18px;
        border-style: dashed;
        border-color: var(--gp-border-strong);
        color: var(--gp-muted);
        background: transparent;
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      .gp-add::after {
        display: none;
      }

      .gp-add:hover {
        border-color: color-mix(in srgb, var(--gp-brand) 64%, var(--gp-border-strong));
        color: var(--gp-text);
        background: color-mix(in srgb, var(--gp-brand) 5%, transparent);
      }

      .gp-add-plus {
        display: grid;
        width: 38px;
        height: 38px;
        flex: none;
        place-items: center;
        margin-bottom: 0;
        border: 1px dashed color-mix(in srgb, var(--gp-brand) 44%, var(--gp-border-strong));
        border-radius: 12px;
        color: var(--gp-brand);
        font-size: 21px;
        font-weight: 300;
        line-height: 1;
        transition:
          border-color 180ms ease,
          background 180ms ease;
      }

      .gp-add:hover .gp-add-plus {
        border-color: var(--gp-brand);
        background: color-mix(in srgb, var(--gp-brand) 8%, transparent);
      }

      .gp-add-copy {
        display: flex;
        min-width: 0;
        flex-direction: column;
        gap: 3px;
      }

      .gp-add-title {
        font-size: 14px;
        font-weight: 650;
        line-height: 1.4;
      }

      .gp-add-desc {
        max-width: 720px;
        color: var(--gp-faint);
        font-size: 10.5px;
        line-height: 1.55;
        text-wrap: pretty;
      }

      .gp-footnote {
        display: flex;
        flex: none;
        align-items: center;
        gap: 8px;
        margin: 14px 2px 0;
        color: var(--gp-faint);
        font-size: 10.5px;
        line-height: 1.5;
      }

      .gp-footnote::before {
        content: '';
        width: 3px;
        height: 3px;
        flex: none;
        border-radius: 50%;
        background: var(--gp-border-strong);
      }

      .gp-footnote.is-error {
        color: var(--gp-danger);
      }

      .gp-footnote.is-error::before {
        background: var(--gp-danger);
      }

      @media (max-width: 760px) {
        .gp-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .gp-hero-side {
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
        }

        .gp-scroll {
          max-height: none;
        }
      }

      @media (max-width: 520px) {
        .gp-page {
          padding-top: 22px;
        }

        .gp-grid {
          grid-template-columns: 1fr;
        }

        .gp-card {
          min-height: 0;
        }

        .gp-add {
          min-height: 86px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .gp-card,
        .gp-card::after,
        .gp-avatar,
        .gp-state,
        .gp-desc,
        .gp-ready::before,
        .gp-switch,
        .gp-thumb,
        .gp-refresh,
        .gp-add-plus {
          transition: none;
        }

        .gp-card:hover {
          transform: none;
        }

        .gp-refresh svg {
          animation: none;
        }
      }
    `;

    function humanizeId(id) {
      return (
        id
          .split(/[-_]+/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ') || id
      );
    }

    function normalizeEntries(payload) {
      if (!payload || payload.ok !== true || !Array.isArray(payload.entries)) {
        throw new Error('Host returned an invalid roster payload.');
      }
      return payload.entries
        .filter((entry) => entry && typeof entry.id === 'string' && entry.id.length > 0)
        .map((entry) => ({
          id: entry.id,
          name:
            typeof entry.name === 'string' && entry.name.trim().length > 0
              ? entry.name.trim()
              : humanizeId(entry.id),
          description:
            typeof entry.description === 'string' && entry.description.trim().length > 0
              ? entry.description.trim()
              : '',
          enabled: entry.enabled !== false,
        }));
    }

    async function readJsonResponse(response) {
      const text = await response.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = undefined;
      }
      if (!response.ok) {
        throw new Error(
          (payload && typeof payload.error === 'string' && payload.error) || text || `HTTP ${response.status}`,
        );
      }
      return payload;
    }

    async function requestRoster(signal) {
      const response = await fetch(API_STATE, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        signal,
      });
      return normalizeEntries(await readJsonResponse(response));
    }

    async function requestToggle(id, enabled) {
      const response = await fetch(API_TOGGLE, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ id, enabled }),
      });
      const payload = await readJsonResponse(response);
      if (!payload || payload.ok !== true) {
        throw new Error(payload?.error || 'Host rejected the switch update.');
      }
      return normalizeEntries(payload);
    }

    function useLocaleSnapshot(locale) {
      const subscribe = React.useCallback((callback) => locale.subscribe(callback), [locale]);
      const getSnapshot = React.useCallback(() => locale.getSnapshot(), [locale]);
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }

    function PlannerIcon({ size = 22, active = false }) {
      const cells = [
        [3.5, 3.5],
        [13.5, 3.5],
        [3.5, 13.5],
        [13.5, 13.5],
      ];

      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          'aria-hidden': true,
          style: { display: 'block' },
        },
        cells.map(([x, y], index) =>
          h('rect', {
            key: index,
            x,
            y,
            width: 7,
            height: 7,
            rx: 1.8,
            fill: 'currentColor',
            fillOpacity: active ? 0.16 : 0,
            stroke: 'currentColor',
            strokeWidth: 1.55,
          }),
        ),
        h('circle', {
          cx: 12,
          cy: 12,
          r: 1.25,
          fill: 'currentColor',
          fillOpacity: active ? 0.9 : 0.5,
        }),
      );
    }

    function RefreshIcon() {
      return h(
        'svg',
        {
          width: 12,
          height: 12,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': true,
        },
        h('path', {
          d: 'M13.2 6.4A5.5 5.5 0 1 0 13.5 9',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: 'M13.6 2.9v3.7H9.9',
          stroke: 'currentColor',
          strokeWidth: 1.4,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      );
    }

    function RoleSwitch({ checked, label, disabled, onChange }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          className: 'gp-switch',
          'aria-checked': checked,
          'aria-label': label,
          disabled,
          onClick: onChange,
        },
        h('span', { className: 'gp-thumb', 'aria-hidden': true }),
      );
    }

    function RoleCard({ agent, pending, onToggle, t }) {
      const titleId = `gp-role-${agent.id}`;
      const name = agent.name || humanizeId(agent.id);
      const description = agent.description || t('card.noDescription');
      const glyph = Array.from(name)[0] || 'A';
      const code = agent.id.replace(/[^a-z0-9]/gi, '').slice(0, 3) || 'AGT';

      return h(
        'article',
        {
          className: `gp-card ${agent.enabled ? 'is-on' : 'is-off'}`,
          'aria-labelledby': titleId,
        },
        h(
          'div',
          { className: 'gp-card-head' },
          h('div', { className: 'gp-avatar', 'aria-hidden': true }, glyph.toUpperCase()),
          h(
            'div',
            { className: 'gp-heading' },
            h('h2', { id: titleId, className: 'gp-name', title: name }, name),
            h('span', { className: 'gp-code', title: agent.id }, code),
          ),
          h(
            'span',
            { className: `gp-state ${agent.enabled ? 'is-on' : ''}` },
            h('span', { className: 'gp-state-dot', 'aria-hidden': true }),
            agent.enabled ? t('status.on') : t('status.off'),
          ),
        ),
        h('p', { className: 'gp-desc', title: description }, description),
        h(
          'div',
          { className: 'gp-foot' },
          h('span', { className: 'gp-ready' }, agent.enabled ? t('card.ready') : t('card.paused')),
          h(RoleSwitch, {
            checked: agent.enabled,
            label: `${agent.enabled ? t('card.disable') : t('card.enable')}${name}`,
            disabled: Boolean(pending),
            onChange: () => onToggle(agent.id),
          }),
        ),
      );
    }

    function AddAgentCard({ onClick, t }) {
      return h(
        'button',
        {
          type: 'button',
          className: 'gp-card gp-add',
          onClick,
          'aria-label': t('card.newTitle'),
        },
        h('span', { className: 'gp-add-plus', 'aria-hidden': true }, '+'),
        h(
          'span',
          { className: 'gp-add-copy' },
          h('span', { className: 'gp-add-title' }, t('card.newTitle')),
          h('span', { className: 'gp-add-desc' }, t('card.newDesc')),
        ),
      );
    }

    function isVisible(element) {
      if (!element || element.closest('.gp-page')) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 18) return false;
      const style = window.getComputedStyle(element);
      return style.visibility !== 'hidden' && style.display !== 'none';
    }

    function findComposer() {
      const textareas = Array.from(document.querySelectorAll('textarea')).filter(isVisible);
      if (textareas.length > 0) {
        return textareas.sort((left, right) => right.getBoundingClientRect().width - left.getBoundingClientRect().width)[0];
      }
      const editables = Array.from(
        document.querySelectorAll('[contenteditable="true"], [contenteditable="plaintext-only"], [role="textbox"]'),
      ).filter(isVisible);
      return editables[0] || null;
    }

    function waitForComposer(timeout = 3000) {
      return new Promise((resolve) => {
        const started = Date.now();
        const poll = () => {
          const composer = findComposer();
          if (composer) {
            resolve(composer);
            return;
          }
          if (Date.now() - started >= timeout) {
            resolve(null);
            return;
          }
          window.setTimeout(poll, 80);
        };
        poll();
      });
    }

    function setComposerValue(element, value) {
      if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
        const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (setter) setter.call(element, value);
        else element.value = value;

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof element.setSelectionRange === 'function') {
          element.setSelectionRange(value.length, value.length);
        }
        return;
      }

      element.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);
      const inserted = document.execCommand('insertText', false, value);
      if (!inserted) {
        element.textContent = value;
        element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      }
    }

    async function startCreateAgent(layout) {
      try {
        await navigator.clipboard?.writeText(NEW_AGENT_PROMPT);
      } catch {
        // Clipboard is a fallback only; the composer fill is the primary path.
      }

      layout.selectPanel(null);
      const composer = await waitForComposer();
      if (!composer) {
        window.alert(`未找到主输入框。创建提示词已尝试复制到剪贴板，请直接粘贴发送：\n\n${NEW_AGENT_PROMPT}`);
        return;
      }

      composer.focus();
      setComposerValue(composer, NEW_AGENT_PROMPT);
    }

    function AgentHubPanel({ locale, layout }) {
      useLocaleSnapshot(locale);
      const t = locale.bind(NS);
      const [agents, setAgents] = React.useState([]);
      const [pending, setPending] = React.useState({});
      const [phase, setPhase] = React.useState('loading');
      const [error, setError] = React.useState('');
      const [refreshing, setRefreshing] = React.useState(false);
      const [reloadToken, setReloadToken] = React.useState(0);
      const createLock = React.useRef(false);

      React.useEffect(() => {
        let active = true;
        let timer;
        const controller = new AbortController();

        const load = async (background) => {
          if (!background) setRefreshing(true);
          try {
            const next = await requestRoster(controller.signal);
            if (!active) return;
            setAgents(next);
            setPhase('ready');
            setError('');
          } catch (reason) {
            if (!active || reason?.name === 'AbortError') return;
            setPhase('error');
            setError(String(reason?.message ?? reason));
          } finally {
            if (active && !background) setRefreshing(false);
          }
        };

        load(false);
        timer = window.setInterval(() => {
          if (document.visibilityState === 'visible') load(true);
        }, POLL_MS);

        const onVisibility = () => {
          if (document.visibilityState === 'visible') load(true);
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
          active = false;
          controller.abort();
          window.clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisibility);
        };
      }, [reloadToken]);

      const enabledCount = agents.reduce((count, agent) => count + (agent.enabled ? 1 : 0), 0);

      const toggleAgent = React.useCallback(
        async (id) => {
          if (pending[id]) return;
          const current = agents.find((agent) => agent.id === id);
          if (!current) return;
          const nextEnabled = !current.enabled;

          setAgents((list) =>
            list.map((agent) => (agent.id === id ? { ...agent, enabled: nextEnabled } : agent)),
          );
          setPending((currentPending) => ({ ...currentPending, [id]: true }));
          setError('');

          try {
            const next = await requestToggle(id, nextEnabled);
            setAgents(next);
            setPhase('ready');
          } catch (reason) {
            setAgents((list) =>
              list.map((agent) => (agent.id === id ? { ...agent, enabled: current.enabled } : agent)),
            );
            setPhase('error');
            setError(String(reason?.message ?? reason));
          } finally {
            setPending((currentPending) => {
              const updated = { ...currentPending };
              delete updated[id];
              return updated;
            });
          }
        },
        [agents, pending],
      );

      const createAgent = React.useCallback(async () => {
        if (createLock.current) return;
        createLock.current = true;
        try {
          await startCreateAgent(layout);
        } catch (reason) {
          window.alert(`无法打开主输入框：${String(reason?.message ?? reason)}`);
        } finally {
          window.setTimeout(() => {
            createLock.current = false;
          }, 800);
        }
      }, [layout]);

      const footnote = error
        ? `${t('page.error')}${error}`
        : phase === 'loading'
          ? t('page.loading')
          : t('page.saved');

      return h(
        React.Fragment,
        null,
        h('style', { 'data-dsh-game-planner': true }, CSS),
        h(
          'div',
          { className: 'gp-page' },
          h(
            'div',
            { className: 'gp-shell' },
            h(
              'header',
              { className: 'gp-hero' },
              h(
                'div',
                { className: 'gp-hero-main' },
                h('div', { className: 'gp-eyebrow' }, t('page.eyebrow')),
                h('h1', { className: 'gp-title' }, t('page.title')),
                h('p', { className: 'gp-subtitle' }, t('page.subtitle')),
              ),
              h(
                'div',
                { className: 'gp-hero-side' },
                h(
                  'div',
                  {
                    className: `gp-summary ${enabledCount === 0 ? 'is-idle' : ''}`,
                    'aria-live': 'polite',
                  },
                  h('span', { className: 'gp-pulse', 'aria-hidden': true }),
                  h(
                    'span',
                    null,
                    h('strong', null, String(enabledCount)),
                    ` / ${agents.length} `,
                    t('page.activeUnit'),
                  ),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: `gp-refresh ${refreshing ? 'is-busy' : ''}`,
                    onClick: () => setReloadToken((value) => value + 1),
                    disabled: refreshing,
                    'aria-label': t('page.refresh'),
                  },
                  h(RefreshIcon),
                  refreshing ? t('page.refreshing') : t('page.refresh'),
                ),
              ),
            ),
            phase === 'ready' && agents.length === 0
              ? h('p', { className: 'gp-empty' }, t('page.empty'))
              : null,
            h(
              'div',
              { className: 'gp-scroll' },
              h(
                'section',
                { className: 'gp-grid', 'aria-label': t('page.title') },
                agents.map((agent) =>
                  h(RoleCard, {
                    key: agent.id,
                    agent,
                    pending: Boolean(pending[agent.id]),
                    onToggle: toggleAgent,
                    t,
                  }),
                ),
                h(AddAgentCard, { onClick: createAgent, t }),
              ),
            ),
            h(
              'p',
              {
                className: `gp-footnote ${error ? 'is-error' : ''}`,
                role: error ? 'alert' : undefined,
              },
              footnote,
            ),
          ),
        ),
      );
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);

        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH));
        ctx.effect(() => ctx.locale.register(NS, 'en', EN));

        const Panel = () => h(AgentHubPanel, { locale: ctx.locale, layout: ctx.layout });

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'game-planner',
              order: 5,
              label: () => t('nav.label'),
            },
            PlannerIcon,
          ),
        );

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: 'game-planner',
            },
            Panel,
          ),
        );
      },
    };
  },
});
