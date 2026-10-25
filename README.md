# dsh-game-planner-panel

DSH Web UI 插件：在左侧栏增加 **Agent Hub / Agent 统合管理台**，动态扫描本机 `~/.dsh/subagents/` 下的所有子代理 YAML，并在主面板用可滚动网格统一管理启用状态。

![icon](./icon.svg)

## 功能

- 左侧栏入口 `Agent Hub`，位于 Plugins 与 Schedules 之间。
- 主面板标题「Agent 统合管理台」，副标题「统合管理与调度本地所有子代理」。
- **不再硬编码角色**：Host 每次读取目录并返回全部 `.yaml` / `.yml` 条目，新增文件会自动出现。
- 每张卡片显示显示名、`description`、状态胶囊和 `role="switch"` 开关；卡片由后端数组 `map` 渲染。
- 卡片区域垂直滚动，自定义细滚动条；桌面端列表较高时自动出现滚动条。
- 最后一格始终是虚线「+ 新建 Agent」卡片：点击后切回主对话，并把创建提示词填入输入框（不会自动发送）。
- 每 12 秒轮询一次；窗口重新可见时刷新；右上角也有「刷新列表」按钮。
- 开关写入 YAML 的 `enabled` 字段，`dsh-subagent-library` 热读取目录，写入后立即生效。
- 中英双语，跟随 DSH 当前语言；使用 DSH theme tokens，支持深色 / 浅色主题。

## 动态名册规则

- 目录：`~/.dsh/subagents/`（Host 侧读取，不需要配置 `entriesDir`）。
- 文件：任意 `.yaml` 或 `.yml`；以 `_` 或 `.` 开头的文件/目录被忽略。
- `id`：文件名去掉扩展名，例如 `system-designer.yaml` → `system-designer`。
- `description`：读取顶层 `description` 字段；支持单双引号、`|` / `>` 块文本。
- `enabled`：读取顶层布尔字段；缺失按 `true` 处理，与 `dsh-subagent-library` 的语义一致。
- 显示名 `name`（响应中的可选字段）按以下优先级生成：
  1. 顶层 `name` 字段；
  2. 文件首行注释，如 `# 系统策划 / System Designer`；
  3. 把 id 转成 Title Case，例如 `system-designer` → `System Designer`。

响应示例：

```json
{
  "ok": true,
  "dir": "C:\\Users\\<user>\\.dsh\\subagents",
  "entries": [
    {
      "id": "system-designer",
      "file": "system-designer.yaml",
      "name": "系统策划",
      "description": "系统策划｜拆解核心循环、规则状态与模块边界……",
      "enabled": true
    }
  ]
}
```

## 字段兼容性：`name` 与 `system_prompt`

`dsh-subagent-library` 的 YAML schema **不接受** `name` 和 `system_prompt` 字段，写入未知字段会让整个条目被拒绝。正确映射是：

| 你的概念 | 实际写法 |
| --- | --- |
| 子代理名称 / id | 文件名，例如 `system-designer.yaml` |
| 卡片显示名 | 可选顶层 `name`，或首行注释；仅用于本面板展示 |
| 职责描述 | 顶层 `description` |
| System Prompt | 顶层 `persona` |

一个可用的最小条目：

```yaml
# 系统策划 / System Designer
description: 系统策划｜拆解核心循环、规则状态与模块边界，产出可落地的系统设计文档。
persona: |
  你是一名资深系统策划。你的职责是……
  输出必须包含：系统目标、核心循环、状态机、异常处理。
maxDepth: 1
backgroundMode: one-shot
enabled: true
```

不要写 `toolFilter`：在 DSH ≥ 0.2.1 中它无法强制执行，带该字段的条目会被拒绝。

## Host / Browser 通信

自定义 Typert Remote 需要生成宿主与客户端两边的类型代码，对这个小插件过重。这里使用 DSH Web Server 上的普通 JSON 路由，由 `ctx.connection.requestRejection(req)` 做认证围栏：

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/plugins/game-planner/state` | 动态扫描目录，返回全部条目的 `id` / `file` / `name` / `description` / `enabled` |
| `POST` | `/plugins/game-planner/toggle` | body `{ "id": "system-designer", "enabled": false }`，原子改写对应 YAML 的 `enabled` |

Host 侧只接受 `id` 精确匹配文件名 stem 的请求，拒绝路径分隔符、`..`、超长 id；toggle 请求体上限 8 KB。写入采用临时文件 + `rename`，并用串行队列避免并发读改写。

浏览器侧用同源 `fetch`，请求自动携带 DSH 认证 Cookie。开关采用乐观更新：先改 UI，POST 成功后用 Host 返回的全量列表对齐；失败回滚并显示错误。

## 新建 Agent 卡片

没有公开的“向主输入框插入文本”Client Service，因此使用 DSH 自身的 DOM 行为：

1. 尝试把创建提示词复制到剪贴板；
2. 调用 `ctx.layout.selectPanel(null)` 切回主对话；
3. 轮询最多 3 秒，找到可见的 `textarea` 或 `contenteditable` 输入框；
4. 用原生 value setter / `execCommand('insertText')` 填入提示词并聚焦，**不自动发送**；
5. 找不到输入框时弹窗提示“已复制，请手动粘贴”。

指定提示词：

```text
请帮我新建一个子代理。请引导我输入它的角色名、职责描述和 System Prompt，并帮我在 ~/.dsh/subagents/ 目录下生成对应的 YAML 文件。
```

## 文件结构

```text
dsh-game-planner-panel/
├─ package.json          # bundle / client 清单
├─ cordis.patch.yml      # 向 profile 插入插件行
├─ index.js              # Host：动态扫描、认证路由、YAML enabled 写入
├─ client/
│  └─ client.js          # Browser：动态网格、滚动、开关、新建卡、slot 注册
├─ locale/
│  ├─ zh.json
│  └─ en.json
├─ icon.svg
├─ preview.png
└─ README.md
```

## 安装与更新

前置：当前 profile 已安装 `dsh-subagent-library`（本机为 `0.3.5`），它提供名册读取与 `delegate` 工具。

首次安装：

```text
plugin_manager(action="install_bundle", target="E:\\dsh-game-planner-panel")
```

更新已安装的本地插件：

1. 修改文件；
2. 在插件管理里先禁用再启用 `dsh-game-planner-panel`，或执行等价的 `setPluginEnabled(false)` → `setPluginEnabled(true)`；
3. 刷新 Web GUI。Client 模块会重新加载；Host 路由与扫描逻辑随插件重载生效。

不需要在本目录执行 `npm install`，也不需要手工改 profile 的 `package.json`。

## 验证

```powershell
Set-Location E:\dsh-game-planner-panel
node --check client/client.js
node --check index.js
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
```

安装后可检查：

```text
GET http://127.0.0.1:<port>/plugins/game-planner/state
```

应返回 `~/.dsh/subagents/` 下的全部条目。新增一个 YAML 后，点击「刷新列表」或等待 12 秒，卡片应自动出现。

## 当前范围

- 开关控制的是 YAML 的 `enabled` 字段，也就是 `dsh-subagent-library` 的启用状态。
- 关闭后条目仍会出现在名册中并标记 `enabled: false`；`delegate` 会拒绝已停用条目。
- 面板不直接创建子会话；真正调用角色时，仍使用 `delegate(library_id=...)` 或 `/subagent`。
- “新建 Agent”只负责把引导词填入主输入框，实际建文件仍由主对话中的 Agent 完成。

## License

MIT
