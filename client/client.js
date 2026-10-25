window.__ModuleLoader__.load({
  id: 'dsh-game-planner-panel',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'game-planner';
    const API_STATE = '/plugins/game-planner/state';
    const API_TOGGLE = '/plugins/game-planner/toggle';

    const ROLES = [
      {
        id: 'system',
        glyph: '系',
        code: 'SYS',
        nameKey: 'role.system.name',
        descKey: 'role.system.desc',
      },
      {
        id: 'combat',
        glyph: '战',
        code: 'CBT',
        nameKey: 'role.combat.name',
        descKey: 'role.combat.desc',
      },
      {
        id: 'level',
        glyph: '关',
        code: 'LVL',
        nameKey: 'role.level.name',
        descKey: 'role.level.desc',
      },
      {
        id: 'numeric',
        glyph: '数',
        code: 'NUM',
        nameKey: 'role.numeric.name',
        descKey: 'role.numeric.desc',
      },
      {
        id: 'economy',
        glyph: '经',
        code: 'ECO',
        nameKey: 'role.economy.name',
        descKey: 'role.economy.desc',
      },
      {
        id: 'narrative',
        glyph: '叙',
        code: 'NAR',
        nameKey: 'role.narrative.name',
        descKey: 'role.narrative.desc',
      },
      {
        id: 'engineering',
        glyph: '程',
        code: 'TEC',
        nameKey: 'role.engineering.name',
        descKey: 'role.engineering.desc',
      },
      {
        id: 'art',
        glyph: '美',
        code: 'ART',
        nameKey: 'role.art.name',
        descKey: 'role.art.desc',
      },
    ];

    const DEFAULT_ENABLED = Object.fromEntries(ROLES.map((role) => [role.id, true]));

    const ZH = {
      'nav.label': '策划中台',
      'page.eyebrow': 'GAME PLANNER · SUBAGENT ROSTER',
      'page.title': '游戏研发策划中台',
      'page.subtitle':
        '把 8 位策划子代理收进同一张工作台，按需启用，让系统、战斗、内容与表现从同一个视角协同推进。',
      'page.activeUnit': '已启用',
      'page.saved': '开关状态实时写入 DSH 子代理库（~/.dsh/subagents）。',
      'page.loading': '正在读取 DSH 子代理库…',
      'page.error': '同步失败，已回滚：',
      'status.on': '已启用',
      'status.off': '已禁用',
      'card.ready': '参与策划',
      'card.paused': '暂未参与',
      'card.enable': '启用',
      'card.disable': '禁用',
      'role.system.name': '系统策划',
      'role.system.desc': '拆解核心循环与系统边界，定义规则、状态和模块之间的协作方式。',
      'role.combat.name': '战斗策划',
      'role.combat.desc': '设计战斗节奏、技能与反馈，让每一次交锋都有清晰的决策与手感。',
      'role.level.name': '关卡策划',
      'role.level.desc': '规划空间、敌人与事件节奏，把玩法目标编织成可体验的关卡流程。',
      'role.numeric.name': '数值策划',
      'role.numeric.desc': '搭建成长、掉落与难度曲线，用数据校准玩家的投入与回报。',
      'role.economy.name': '经济策划',
      'role.economy.desc': '设计资源产出与消耗闭环，维持长期经济稳定与付费体验的平衡。',
      'role.narrative.name': '叙事策划',
      'role.narrative.desc': '构建世界观、角色与任务文本，让故事自然嵌入玩家的行动路径。',
      'role.engineering.name': '程序解析',
      'role.engineering.desc': '从工程视角拆解需求与系统实现，评估技术方案、依赖与落地风险。',
      'role.art.name': '美术解析',
      'role.art.desc': '梳理视觉风格、资产与动效需求，确保美术表达服务玩法与叙事。',
    };

    const EN = {
      'nav.label': 'Planning Desk',
      'page.eyebrow': 'GAME PLANNER · SUBAGENT ROSTER',
      'page.title': 'Game Development Planning Desk',
      'page.subtitle':
        'Eight planning subagents in one workspace. Enable the disciplines you need and keep systems, combat, content and presentation moving together.',
      'page.activeUnit': 'active',
      'page.saved': 'Switch states are written to the DSH subagent roster (~/.dsh/subagents).',
      'page.loading': 'Reading the DSH subagent roster…',
      'page.error': 'Sync failed; reverted: ',
      'status.on': 'Enabled',
      'status.off': 'Disabled',
      'card.ready': 'On the team',
      'card.paused': 'Sitting out',
      'card.enable': 'Enable ',
      'card.disable': 'Disable ',
      'role.system.name': 'Systems Design',
      'role.system.desc':
        'Breaks down the core loop and system boundaries into rules, states and clean module contracts.',
      'role.combat.name': 'Combat Design',
      'role.combat.desc':
        'Shapes combat pacing, abilities and feedback so every encounter offers a clear decision and feel.',
      'role.level.name': 'Level Design',
      'role.level.desc':
        'Plans space, enemies and event pacing to turn gameplay goals into a playable level flow.',
      'role.numeric.name': 'Numeric Design',
      'role.numeric.desc':
        'Builds progression, drop and difficulty curves that keep player investment and reward in balance.',
      'role.economy.name': 'Economy Design',
      'role.economy.desc':
        'Designs resource sinks and sources that keep the long-term economy stable and monetization fair.',
      'role.narrative.name': 'Narrative Design',
      'role.narrative.desc':
        'Builds the world, characters and quest text so the story sits naturally inside player action.',
      'role.engineering.name': 'Engineering Review',
      'role.engineering.desc':
        'Reviews requirements and system implementation for technical risk, dependencies and delivery cost.',
      'role.art.name': 'Art Review',
      'role.art.desc':
        'Maps visual style, asset and motion needs so art direction serves both gameplay and narrative.',
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
        width: 100%;
        min-height: 100%;
        overflow: auto;
        padding: clamp(26px, 4.2vw, 56px) clamp(20px, 4.2vw, 56px) 46px;
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
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
      }

      .gp-hero {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 26px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--gp-border);
      }

      .gp-hero-main {
        min-width: 0;
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
        margin: 11px 0 0;
        color: var(--gp-muted);
        font-size: 13.5px;
        line-height: 1.75;
        text-wrap: pretty;
      }

      .gp-summary {
        display: inline-flex;
        flex: none;
        align-items: center;
        gap: 9px;
        padding: 9px 13px;
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

      .gp-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(238px, 1fr));
        gap: 14px;
      }

      .gp-card {
        position: relative;
        display: flex;
        min-width: 0;
        min-height: 208px;
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
        border-color: var(--gp-border-strong);
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
        margin-top: 3px;
        color: var(--gp-faint);
        font-size: 9px;
        font-weight: 650;
        line-height: 1.3;
        letter-spacing: 0.17em;
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
        flex: 1;
        margin: 13px 0 0;
        color: var(--gp-muted);
        font-size: 12.25px;
        line-height: 1.72;
        text-wrap: pretty;
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
        margin-top: 15px;
        padding-top: 12px;
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

      .gp-footnote {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 18px 2px 0;
        color: var(--gp-faint);
        font-size: 10.5px;
        line-height: 1.5;
      }

      .gp-footnote::before {
        content: '';
        width: 3px;
        height: 3px;
        border-radius: 50%;
        background: var(--gp-border-strong);
      }

      .gp-footnote.is-error {
        color: var(--gp-danger);
      }

      .gp-footnote.is-error::before {
        background: var(--gp-danger);
      }

      .gp-switch:disabled {
        cursor: progress;
        opacity: 0.55;
      }

      @media (max-width: 760px) {
        .gp-hero {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .gp-summary {
          align-self: flex-start;
        }
      }

      @media (max-width: 520px) {
        .gp-page {
          padding-top: 24px;
        }

        .gp-grid {
          grid-template-columns: 1fr;
        }

        .gp-card {
          min-height: 0;
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
        .gp-thumb {
          transition: none;
        }

        .gp-card:hover {
          transform: none;
        }
      }
    `;

    function rosterFromEntries(entries) {
      const next = { ...DEFAULT_ENABLED };
      for (const role of ROLES) next[role.id] = false;
      for (const entry of entries) {
        if (entry && typeof entry.id === 'string' && typeof entry.enabled === 'boolean') {
          next[entry.id] = entry.enabled;
        }
      }
      return next;
    }

    async function requestRoster(signal) {
      const response = await fetch(API_STATE, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        signal,
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || `HTTP ${response.status}`);
      }
      const payload = JSON.parse(text);
      if (!payload || payload.ok !== true || !Array.isArray(payload.entries)) {
        throw new Error('Host returned an invalid roster payload.');
      }
      return rosterFromEntries(payload.entries);
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
      const text = await response.text();
      if (!response.ok) {
        let message = text;
        try {
          const payload = JSON.parse(text);
          if (payload && typeof payload.error === 'string') message = payload.error;
        } catch {
          // Keep the raw response text when the Host did not send JSON.
        }
        throw new Error(message || `HTTP ${response.status}`);
      }
      const payload = JSON.parse(text);
      if (!payload || payload.ok !== true) {
        throw new Error(payload?.error || 'Host rejected the switch update.');
      }
      return payload;
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

    function RoleCard({ role, enabled, pending, onToggle, t }) {
      const name = t(role.nameKey);
      const titleId = `gp-role-${role.id}`;

      return h(
        'article',
        {
          className: `gp-card ${enabled ? 'is-on' : 'is-off'}`,
          'aria-labelledby': titleId,
        },
        h(
          'div',
          { className: 'gp-card-head' },
          h('div', { className: 'gp-avatar', 'aria-hidden': true }, role.glyph),
          h(
            'div',
            { className: 'gp-heading' },
            h('h2', { id: titleId, className: 'gp-name' }, name),
            h('span', { className: 'gp-code' }, role.code),
          ),
          h(
            'span',
            { className: `gp-state ${enabled ? 'is-on' : ''}` },
            h('span', { className: 'gp-state-dot', 'aria-hidden': true }),
            enabled ? t('status.on') : t('status.off'),
          ),
        ),
        h('p', { className: 'gp-desc' }, t(role.descKey)),
        h(
          'div',
          { className: 'gp-foot' },
          h('span', { className: 'gp-ready' }, enabled ? t('card.ready') : t('card.paused')),
          h(RoleSwitch, {
            checked: enabled,
            label: `${enabled ? t('card.disable') : t('card.enable')}${name}`,
            disabled: Boolean(pending),
            onChange: () => onToggle(role.id),
          }),
        ),
      );
    }

    function GamePlannerPanel({ locale }) {
      useLocaleSnapshot(locale);
      const t = locale.bind(NS);
      const [enabled, setEnabled] = React.useState(() => ({ ...DEFAULT_ENABLED }));
      const [pending, setPending] = React.useState({});
      const [phase, setPhase] = React.useState('loading');
      const [error, setError] = React.useState('');
      const enabledCount = ROLES.reduce((count, role) => count + (enabled[role.id] ? 1 : 0), 0);

      React.useEffect(() => {
        const controller = new AbortController();
        let alive = true;
        requestRoster(controller.signal)
          .then((next) => {
            if (!alive) return;
            setEnabled(next);
            setPhase('ready');
            setError('');
          })
          .catch((reason) => {
            if (!alive || reason?.name === 'AbortError') return;
            setPhase('error');
            setError(String(reason?.message ?? reason));
          });
        return () => {
          alive = false;
          controller.abort();
        };
      }, []);

      const toggleRole = React.useCallback(
        async (id) => {
          if (pending[id] || phase === 'loading') return;
          const next = !enabled[id];

          setEnabled((current) => ({ ...current, [id]: next }));
          setPending((current) => ({ ...current, [id]: true }));
          setError('');

          try {
            const payload = await requestToggle(id, next);
            if (Array.isArray(payload.entries)) {
              setEnabled(rosterFromEntries(payload.entries));
            }
            setPhase('ready');
          } catch (reason) {
            setEnabled((current) => ({ ...current, [id]: !next }));
            setPhase('error');
            setError(String(reason?.message ?? reason));
          } finally {
            setPending((current) => {
              const updated = { ...current };
              delete updated[id];
              return updated;
            });
          }
        },
        [enabled, pending, phase],
      );

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
                {
                  className: `gp-summary ${enabledCount === 0 ? 'is-idle' : ''}`,
                  'aria-live': 'polite',
                },
                h('span', { className: 'gp-pulse', 'aria-hidden': true }),
                h(
                  'span',
                  null,
                  h('strong', null, String(enabledCount)),
                  ` / ${ROLES.length} `,
                  t('page.activeUnit'),
                ),
              ),
            ),
            h(
              'section',
              { className: 'gp-grid', 'aria-label': t('page.title') },
              ROLES.map((role) =>
                h(RoleCard, {
                  key: role.id,
                  role,
                  enabled: Boolean(enabled[role.id]),
                  pending: Boolean(pending[role.id]),
                  onToggle: toggleRole,
                  t,
                }),
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
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind(NS);

        ctx.effect(() => ctx.locale.register(NS, 'zh', ZH));
        ctx.effect(() => ctx.locale.register(NS, 'en', EN));

        const Panel = () => h(GamePlannerPanel, { locale: ctx.locale });

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
