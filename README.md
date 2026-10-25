# dsh-game-planner-panel

DSH Web UI 插件：在左侧栏增加「策划中台」入口，并在主面板展示 8 位游戏策划子代理的启用面板。

![icon](./icon.svg)

## 功能

- 左侧栏入口「策划中台 / Planning Desk」，位于 Plugins 与 Schedules 之间。
- 主面板标题「游戏研发策划中台」。
- 8 张响应式网格卡片：系统、战斗、关卡、数值、经济、叙事、程序解析、美术解析。
- 每张卡片包含角色名、一句话简介、状态胶囊与 `role="switch"` 滑动开关。
- 开关通过 Host 路由写入 `~/.dsh/subagents/*.yaml` 的 `enabled` 字段；`dsh-subagent-library` 热读取目录，写入后立即生效。
- 中英双语，跟随 DSH 当前语言；支持浅色 / 深色主题、键盘焦点和减少动效偏好。

## 子代理名册

8 个角色文件位于 `~/.dsh/subagents/`：

| 面板 id | 名册文件 | 角色 |
| --- | --- | --- |
| `system` | `system-designer.yaml` | 系统策划 |
| `combat` | `combat-designer.yaml` | 战斗策划 |
| `level` | `level-designer.yaml` | 关卡策划 |
| `numeric` | `numerical-designer.yaml` | 数值策划 |
| `economy` | `economy-designer.yaml` | 经济策划 |
| `narrative` | `narrative-designer.yaml` | 叙事策划 |
| `engineering` | `programmer-reviewer.yaml` | 程序解析 |
| `art` | `artist-reviewer.yaml` | 美术解析 |

> **字段映射说明**：`dsh-subagent-library` 不接受 `name` 和 `system_prompt` 字段。
> 条目 id 来自文件名，显示名写在 `description` / 注释中，角色提示词写在 `persona`。
> 写入未知字段会让库直接拒绝整个条目。

## 关于 dsh-better-sidebar

这个插件**没有**调用 `dsh-better-sidebar` 来注册左侧栏，因为该包没有左侧栏 API。

`dsh-better-sidebar@0.28.0` 的 `ctx.betterSidebar` 只提供：

- `registerTab`：向右侧栏 / 底部工作台注册 tab；
- `registerFileViewer`：注册文件查看器。

DSH 的左侧栏入口由原生 Client Slot `sidebar.panellist` 拥有，主面板由同 key 的 `main` slot 渲染。因此本插件使用 DSH 官方 API 注册左栏，而不是伪造一个不存在的 better-sidebar 方法。这样也不需要引入一个没有实际用途的依赖。

## 文件结构

```text
dsh-game-planner-panel/
├─ package.json          # bundle / client 清单
├─ cordis.patch.yml      # 向 profile 插入插件行
├─ index.js              # Host 半边：认证路由 + YAML enabled 写入
├─ client/
│  └─ client.js          # Browser 半边：8 张卡片、开关、slot 注册、RPC 调用
├─ locale/
│  ├─ zh.json            # 中文 UI 与插件元数据
│  └─ en.json            # 英文 UI 与插件元数据
├─ icon.svg              # 原创插件图标
├─ preview.png           # 面板截图
└─ README.md
```

## Host / Browser 通信

自定义 Typert Remote 需要生成宿主与客户端两边的类型代码，对这个小插件过重。这里使用 DSH Web Server 上的普通 JSON 路由，由 `ctx.connection.requestRejection(req)` 做认证围栏：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/plugins/game-planner/state` | 读取 8 个 YAML 的 `present` / `enabled` |
| `POST` | `/plugins/game-planner/toggle` | body `{ "id": "system", "enabled": false }`，改写对应 YAML |

浏览器侧用同源 `fetch`，请求会自动携带 DSH 的认证 Cookie。开关采用乐观更新：先改 UI，POST 成功后用 Host 返回的全量状态对齐；失败会回滚，并在面板底部显示错误。

## 安装（推荐）

前置：当前 profile 需要安装 `dsh-subagent-library`（本机为 `0.3.5`）。它提供名册读取和 `list_subagents` / `delegate` 工具。

在 DSH 中让代理执行：

```text
plugin_manager(action="install_bundle", target="E:\\dsh-game-planner-panel")
```

`install_bundle` 会完成依赖链接、bundle 选择和 profile 记录，不需要在本目录执行 `npm install`，也不需要手工改 profile 的 `package.json`。

安装成功后：

1. 刷新已打开的 DSH Web GUI。
2. 左侧栏应出现「策划中台」图标。
3. 点击后看到「游戏研发策划中台」与 8 张卡片。
4. 切换任一开关；`list_subagents` 中对应条目的 `enabled` 会变化，`~/.dsh/subagents/<file>.yaml` 同步改写。

如果页面没有变化，完全退出并重新启动 DSH，再刷新页面。

## 本地开发：npm link（不推荐，仅调试）

DSH 的 bundle 生命周期由 `plugin_manager` 管理，`npm link` 只解决模块解析，不会自动把 bundle 加入 profile。手工方式会绕开管理器，可能在下次 `pnpm install` 时失效。

1. 建立全局链接：

```powershell
Set-Location E:\dsh-game-planner-panel
npm link
```

2. 链接到当前 profile：

```powershell
Set-Location $env:DSH_PROFILE_DIR
npm link dsh-game-planner-panel
```

3. 在 `$env:DSH_PROFILE_DIR\cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: dsh-game-planner-panel
      name: dsh-game-planner-panel
```

4. 完全退出并重启 DSH，然后刷新 Web GUI。

撤销时删除上面的 patch 行，并执行：

```powershell
Set-Location $env:DSH_PROFILE_DIR
npm unlink dsh-game-planner-panel
```

注意：

- profile 使用 pnpm 管理依赖，`npm link` 可能生成 `package-lock.json`，不要把它提交到 profile。
- Windows 创建符号链接可能需要开启「开发者模式」或以管理员身份运行终端。
- 手工 patch 行不会出现在「插件管理」的 bundle 列表里，功能可用但管理界面不完整。

## 验证

```powershell
Set-Location E:\dsh-game-planner-panel
node --check client/client.js
node --check index.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
```

## 当前范围

- 开关控制的是 `~/.dsh/subagents/*.yaml` 的 `enabled` 字段，也就是 `dsh-subagent-library` 的启用状态。
- 关闭后条目仍会出现在 `list_subagents` 中并标记 `enabled: false`；这是该库的语义，`delegate` 会拒绝已停用条目。
- 面板不直接创建子会话；真正调用角色时，仍使用 `delegate(library_id=...)` 或 `/subagent`。

## License

MIT
