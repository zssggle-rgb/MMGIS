# MMGIS 用户交互界面中文化设计

日期：2026-10-13（北京时间）
生成流程：office-hours，随后执行 plan-eng-review
仓库：zssggle-rgb/MMGIS；当前分支：zh-CN
状态：REVIEW_DRAFT，供工程审查；不是实施或发布批准。
用途：公司内部使用，接入自有数据源并进行二次开发。

## 已确认需求与边界

- 用户明确要求：用户交互界面全部中文化，其他内容不需要中文。
- 覆盖地图入口、二维/三维/影像面板、全部发行包内置工具、管理后台、数据配置、登录/注册/密码操作、提示、报错、参数说明以及界面内帮助。
- 默认简体中文；提供 English 切换与英文回退，便于二次开发排查和同步上游。
- 翻译显示标签，不翻译工具标识、字段键、配置枚举值、JSON 属性键、URL、接口路径、坐标参考系、代码示例和用户业务数据。
- 不翻译源代码注释、服务日志、独立开发手册、仓库全部 Markdown，也不开发新数据连接器。
- 项目是界面本地化，不是修改数据接入能力；已有接入方式作为界面验收案例。
- 用户要求停止细粒度需求问询。后续方案直接给出建议与验证依据，剩余建议在整体文档中供审阅。

## 当前状态与版本基线

2026-10-13 现场读取：现有部署应用为 4.2.34-20260328，主机系统为 Ubuntu 24.04.5 LTS。版本差异来自此前选用的官方镜像 latest 标签，不是 Ubuntu 限制。

GitHub releases/latest 返回 5.2.24，发布时间 2026-08-03。当前 zh-CN 分支继承 development 的 d7009d59d52d8d656ad1999a5a1db2a21d5a6fe8，package.json 为 5.4.4-20261009。因此不能把“Fork 已建好”视为“与已部署代码版本相同”。

建议以官方正式 tag 5.2.24（3771de600956916ab2063f964531a9b9e84280c1）建立独立实施基线分支；保留现有 zh-CN 分支及其文档，不改写远端历史。构建带精确上游版本和提交号的中文镜像。此版本选择是本次审查建议，仍以实施前整体方案确认和英文基线验证为前提。

先验证 5.2.24 英文原版的安装、配置导入和核心交互，再加入中文化。4.2.34 到 5.2.24 的数据库和配置兼容性必须在副本环境验证；不能通过换镜像后删库重建绕过升级问题。

## 源码核对与工作量依据

本设计主要依据 5.2.24 tag；development 仅用于对照上游演进。下列数量是源码表面普查，不是翻译条目数量，也不表示每个文件都要修改：

| 范围 | 5.2.24 核对结果 |
| --- | --- |
| 地图核心 | src/essence 下 52 个 .js、19 个 .jsx |
| 配置后台 | configure/src 下 89 个 .js；独立 React 17 应用 |
| 内置工具 | 11 个 core tool manifests |
| 插件组件/交互/后端 | 2 / 13 / 13 个 manifests |
| 参数配置模板 | configure/src/metaconfigs 下 16 个 JSON |
| 服务端页面 | 6 个 Pug 模板 |
| 界面内帮助 | public/helps 下 14 个 Markdown 文件 |

内置工具：Draw、Measure、Viewshed、Identifier、Sites、Layers、Animation、Curtain、Info、Legend、Sightline。Chemistry 等旧帮助文本仍随包提供，按可见帮助清单核对；不能把遗留帮助文件等同于可用工具。

关键事实：

1. Toolbar.jsx:282 的 `id={'toolButton' + tool.name}` 与 :312 的 `<Tooltip content={tool.name}>` 同时使用 name；ToolController_.js:61 用 `tool.name + 'Tool'` 查找模块。替换 name 会破坏工具加载。
2. Info/plugin.json:28-30 同时包含 `field: variables.sortAlphabetically`、显示名称和英文说明。field 必须不变，name/description 的显示层需要翻译。
3. Maker.js:1084-1087 已区分 option.value 和 option.label；:1099 写回 `e.target.value`，可复用标签和值分离模式。其他下拉分支仍直接展示字符串，需要逐类核对。
4. API/updateTools.js:144-148 生成 configure/public/toolConfigs.json，:180-186 生成 src/pre/tools.js；不能只修改生成文件，否则下次构建丢失汉化。
5. public/adminlogin.js:89 直接显示 data.message；Users/routes/users.js 包含动态错误响应。只替换静态按钮会遗漏用户可见后端反馈。
6. Help.jsx 通过 public/helps/{helpKey}.md 加载帮助，使用 DOMPurify 清理渲染 HTML；帮助属于交互界面内容。
7. 主应用是 React 18，后台是 React 17/react-scripts 5；不能照搬只支持 React 18 的订阅接口，或让后台直接 import src 外的共享源码。
8. 原 Docker 和 Playwright workflow 默认不监听 zh-CN；中文代码即使 push，也不等于中文镜像已构建或验收已执行。

以上行号均指 5.2.24 tag 的相应文件，不与当前工作区 development 的行号混用。

## 前提与替代方案

前提：保持现有功能、数据模型和技术标识；中文化由源代码与资源提供，部署不依赖在线翻译服务；完整范围可以分批交付，但全部验收完成前不得宣称“完整汉化”。

| 方案 | 做法 | 优点 | 代价与风险 | 判断 |
| --- | --- | --- | --- | --- |
| A：源码直接替换英文 | 把可见文本改成中文常量 | 最少初始基础设施；快速看到结果 | 重复翻译、无法可靠切换英文、上游合并冲突多、难以发现遗漏 | 不推荐用于长期二次开发 |
| B：共享字典和显示层适配 | i18next 统一资源与规则，React/传统 JS/Pug 分别接入 | 保持标识和数据兼容；可追踪覆盖；便于扩展插件和同步上游 | 初期需建立资源清单、构建产物及三类适配器 | 推荐 |
| C：运行时扫描 DOM 并替换文字 | 不改大部分组件，页面加载后替换英文 | 初始源码改动较少；容易演示 | 动态弹窗、属性、错误提示易漏；大地图持续扫描成本高；用户数据可能被误改 | 不作为生产方案 |

选择 B 为工程建议。它满足长期内部二次开发和界面完整中文化的目标，同时避免重写地图或后台框架。

## 建议架构

### 统一资源和三类适配器

以 `locales/en`、`locales/zh-CN` 为唯一人工维护字典源。按 common、map、tools、configure、auth、feedback 分类；帮助正文单独按 helpKey 保存。键必须按功能语义命名，不能以整句英文或数组下标作为长期稳定键。

使用 i18next 和兼容 React 17/18 的 react-i18next，不另建全局脚本加载器。构建前用一个 Node 生成器，将唯一字典源编译到 `src/i18n/generated/`、`configure/src/i18n/generated/`、`API/i18n/generated/`；每份产物包含相同资源版本和 locale 规则。两套前端分别从自己的 src 目录导入资源，i18next 各有一个文档内实例；同一页面的所有工具和弹窗共享该页面的实例。跨页面/窗口共享偏好与资源版本，不宣称共享 JavaScript 实例。

浏览器初始化接口：`ready` 为初始化 Promise；`t(key, params)` 查字典；`getSnapshot()` 返回 locale/version；`setLanguage(locale)` 只接受两种合法语言并提交一次语言切换；`subscribe(handler)` 返回注销函数。复用 i18next 初始化及事件，不另建通用状态管理服务。原生 React 界面优先使用 react-i18next 的 hook；传统工具只更新自己声明的可见文本节点及 tooltip，禁止全页面 DOM 观察与文本替换。

所有代码包含的 UI 字典随前端 bundle 本地提供，语言切换不再下载文本命名空间；引擎和字典初始化成功后才挂载界面。若构建产物缺失或语法错误，构建失败；未知 key 回退英文且被完整性检查捕获，不能以显示 key 作为正常交付。界面内帮助正文仍按需请求，单独处理加载失败。

服务端从 API/i18n/generated 读取相同字典，缓存 zh-CN/en 两套固定语言 t 函数，按请求选择；不能用全局 changeLanguage 改变不同请求共享的语言。locale 解析中间件必须在所有实际 Pug 路由/鉴权处理之前执行；函数定义所在行号不能当作路由执行顺序的证据。资源生成使用现有 Webpack/Node 构建能力，不新增翻译数据库、在线翻译服务或长期后台任务。

后台 React-scripts 的 src 限制通过生成到各自 src 的资源解决；不 eject，不手改 node_modules，也不把整份 React 18 主应用引入后台。生成物不手工维护，应由构建重现，字典及映射清单才是源代码。两个 package.json 使用同一锁定版本的 i18next/react-i18next，安装时实际核对 peerDependencies，不因汉化升级 React 主版本。

```text
locales/{en,zh-CN} + 消息键/元数据清单 + 中文帮助正文
          |
          +--> 构建检查：覆盖、占位符、标识不变、资源版本
          |
          +--> 地图 src/i18n/generated --> 文档内实例 + React/传统工具
          +--> 后台 src/i18n/generated --> 文档内实例 + Maker 显示适配
          +--> API/i18n/generated --> 请求级固定 t + Pug
          +--> 传统登录脚本构建 --> 使用相同版本的字典/locale规则
          |
          +--> 服务端固定语言 t --> Pug 首屏（按请求解析 locale）

后端 JSON --> status/message 原字段不变 + messageKey/messageParams
          --> 客户端统一反馈适配 --> 中文提示 / 英文回退
```

### 语言选择、状态与失败

- 仅支持 zh-CN、en；合法 `lang` 参数 > 用户已保存偏好 > 默认 zh-CN。服务器和浏览器必须使用同一规范化规则。
- 偏好使用非敏感 locale cookie；cookie 路径按部署子路径规范化。显式切换时同步修改当前 URL 的 lang 参数，保留 mission、视野等其他参数，避免旧 lang=en 在刷新时覆盖用户选择。客户端存储不可用时退回本页内存状态，不能阻止地图打开。
- 服务器嵌入的语言与初始浏览器字典一致，避免中文首屏变英文再变回中文。
- URL 必须由现有 ROOT_PATH/EXTERNAL_ROOT_PATH 约定生成；不得拼接当前 /configure pathname 作为资源根路径。
- 切换只更改显示文本和 html.lang；保留未保存配置、表单输入、绘图内容、选中图层、地图视野和登录状态。不得以 locale 为 React root key 或重挂载 root。Modal 等独立 createRoot 不继承主根 Provider：每个独立根显式注入同一页面实例，或在 hook 中明确传入实例。
- 传统工具定义可见节点注册/注销与更新回调，覆盖已打开弹窗、tooltip、placeholder、校验提示及插件控件；切换不 destroy/make，不改写整段含输入控件的 HTML，也不丢失焦点、光标或事件处理器。未打开面板在下次 make 时读当前语言，关闭时注销监听。
- 跨页共用 cookie；已打开多标签页用 localStorage 的 storage 事件同步偏好，每条通知携带 locale/revision/来源并防回声。收到事件只更新显示和本标签 URL，不刷新、不覆盖编辑；存储不可用时降级为各标签独立，下一次导航仍通过 cookie 读取偏好。已有显式 URL lang 在初始化时有优先级，但当前页切换或实时通知会更新它。
- 引擎与 UI 字典随构建本地提供，不依赖 CDN；本次不采用远程词库/文本命名空间请求。基础 common 同时包含两种语言的加载失败提示。帮助中文文件读取失败时显示中文提示、保留重试入口，并可展开英文帮助；正常验收不得靠英文回退掩盖缺翻译。
- 快速连续切换使用递增 revision，只有最新切换完成后发布快照；帮助请求通过 AbortController/序号防止旧语言响应覆盖新语言。每个订阅都必须注销，单页切换与帮助重开不能累积监听。

### 元数据、插件和反馈

- 复用 Maker：字段控件按插件 id + field 对应 label/description；无 field 的标题、段落、按钮和嵌套项使用显式 uiKey/labelKey/descriptionKey。软件定义枚举的标签按稳定 value 映射；用户字段和动态业务选项原样显示。
- 不全局改写原始 com.options。普通 dropdown 可复用 `{value, label}`；searchdropdown/autocomplete/objectarray/图层选择器分别使用显示标签函数、稳定原 value 和原比较函数，写回必须保留字符串/数字/布尔的原始类型。不能把标签对象保存成配置值。
- 插件 name/id/paths/js/type 保持英文技术标识；仅菜单标签、插件说明、tooltip 中文化。用户创建的任务、图层、业务字段和值按原内容展示。
- source-index 记录每个可见文本的源码位置、上下文、key 和翻译范围。JSON 数组中需要翻译的行/项赋予稳定消息键；重排顺序不能破坏映射。
- 清单校验还必须遍历实际生成的发行包插件/metaconfig，枚举插件 id + field/显式 uiKey + 枚举 value 的动态消息键；不能只扫源码里的 t 字面量。中文 E2E 收集 missing-key/英文回退事件，任何未分类事件使验收失败。动态业务选项不进入软件文案覆盖统计。
- 插件生成器透传翻译元数据；修改清单/显示适配器，不改 src/pre 和 configure/public 下的生成文件。
- 所有原生用户可见响应逐项增加可选 messageKey/messageParams；保留 status/message 的旧语义。协议：messageKey 是稳定白名单字符串；messageParams 是白名单标量参数对象，禁止把用户字符串当键或原始 HTML 参数。例：`{status:"failure", message:"Mission already exists.", messageKey:"configure.missionExists", messageParams:{mission:"example"}}`。旧 message 在该响应原来未含项目名时仍不添加项目名。
- 同样盘点 HTTP、WebSocket、前端本地校验及插件反馈入口；集中 formatFeedback 处理。已知键缺必要参数则显示中文通用提示及原始技术详情；未知键/旧响应仅对已知完整消息做兼容映射，其他情况中文概述加原始详情，不用正则猜测任意第三方错误。合同测试核对旧字段和值不变，新键合法、参数可序列化；严格对象比较的现有测试需同步采用有意的协议断言。
- 未识别的第三方错误用中文操作提示、失败分类和原始技术详情展开区表达；不伪造错误含义，不把日志全文当作翻译对象。
- React 纯文本交给 React 转义；传统节点使用 textContent/属性 API；包含格式的说明和帮助先走现有 DOMPurify。语言字典不是任意 HTML 执行入口。

### 文案和视觉

统一术语：Mission 为“项目”，Layer 为“图层”，Geodataset 为“地理数据集”，Feature 为“要素”，Viewer 为“影像视图”，Globe 为“三维视图”，Draw 为“绘制”，Sightline 为“视线分析”。技术标识在必要处括号补充原名。

保留 m/km、EPSG、GeoJSON、KML、JSON 示例和坐标数值的技术含义；用户选择的时区、实际数值、查询表达式和导出内容不能因为语言切换变化。日期/数字的说明性显示可复用 Intl，不改变存储或 API 格式。

覆盖屏幕阅读器标签、placeholder、title、空态、校验、禁用说明、确认弹窗和下载操作提示。按桌面宽屏、窄屏与移动布局检查换行和截断，不通过统一缩小字体掩盖中文溢出。

第三方嵌入控件同属可见界面：日期选择器、上传控件、JSON/Markdown 编辑器及软件自带交互 API 页的操作壳，优先使用其内置 locale 或组件可配置文案；缺少配置接口时采用有范围的组件适配，不能观察全页面 DOM。GeoJSON、STAC、EPSG 等技术名字与代码片段保留。跳转到独立上游技术文档后的正文不翻译。

## 验收与交付

1. 5.2.24 英文基线能运行，并能读取从现有环境复制的配置与代表性数据。
2. 可见文本清单逐项标注“已翻译/保留技术原文/外部业务内容”；发行包自有与嵌入第三方 UI 的操作文案及其可见反馈全部有中文，不按文件数量或截图数量宣称覆盖率。第三方组件来源不能成为跳过其可见操作文案的理由。
3. 所有 11 个内置工具的入口、工具面板、设置、正常/空态/错误/帮助路径完成中文验收；未配置可选外部服务时仍须验证对应的中文不可用提示。
4. 管理后台各页面及表单控件、登录/注册/密码页面、参数说明和界面内帮助完成中文验收。
5. 语言切换、刷新、跨页、慢网络、字典缺失、子路径、存储不可用和多标签页均有测试；切换不丢失编辑和绘图状态。
6. 任务配置、插件标识、GeoJSON 与业务数据导出在语言切换前后保持结构和值一致。旧 API 字段、值及状态语义保持兼容，仅允许白名单 messageKey/messageParams 增量；响应兼容测试与业务数据不变测试分别验证，不能对允许扩展的响应要求整对象全等。软件生成的用户报告/下载提示按显示语言翻译，但不改原始业务内容。
7. 原有英文行为和选择器保持兼容；现有测试通过 fixtures 为每个浏览器上下文显式设置 locale cookie 为 en，不依赖默认中文或浏览器 Accept-Language。新增中文上下文显式设置 zh-CN，验证两种语言，语言切换测试单独覆盖 URL 的优先级。
8. 中文镜像在干净环境中可重建并拉取，包含两套前端、Pug、字典、帮助与资源 manifest；按版本/提交/摘要记录。

构建契约：`npm ci` 与 `npm ci --prefix configure` 安装锁定依赖；`npm run i18n:prepare` 执行下面的前三步；随后根 `npm run build`、`npm run build --prefix configure`；最后 `npm run i18n:check-artifact` 生成并验证最终产物清单。两个开发启动命令同样在启动前 prepare，不依赖已提交的生成文件。prepare 应幂等，重复执行不会改变相同输入的资源索引。

1. `i18n:generate` 从 canonical 目录生成两套 src 与 API 字典。resourceVersion 由 canonical 输入及明确的源版本决定，不由最终 bundle 哈希反向决定。帮助英文源是现有 public/helps/{helpKey}.md，中文源是 locales/help/zh-CN/{helpKey}.md；本步骤输出 `public/i18n/help/{locale}/{helpKey}.<hash>.md`，兼容保留原英文帮助 URL。
2. `i18n:build-legacy` 用现有 Webpack 将传统登录入口打包到 `public/i18n/legacy.<hash>.js`；只包含 auth/common/feedback 字典与 locale 规则，不引入 React。
3. 冻结构建前 `resource-index.json`：schemaVersion=1、resourceVersion、upstreamVersion、supportedLocales、canonicalHash、帮助索引及 legacy 实际路径。将索引复制到两个前端和 API generated 目录，再开始两个前端打包。前端只嵌入这个索引，通过 ROOT_PATH 解析实际资源位置。
4. 两套前端打包完成后才生成 `API/i18n/generated/manifest.json`：记录 resourceVersion、最终文件的相对路径与 SHA-256，包括字典、前端资源、传统脚本和帮助。此 manifest 供服务端/CI 核验，不嵌入已经完成的前端 bundle，不包含自身哈希，也不改写前端 generated 输入。Pug 从服务端的构建前索引选择 legacy 路径。最终检查核对三处资源版本和镜像中的全部实际文件。

因此资源索引与最终 artifact manifest 是两种不同产物，构建依赖无环；不会出现“前端包含自己哈希”或“构建后改写前端输入再重打包”的循环。

Docker runtime 必须复制 `API/i18n/generated`（随 API 现有复制路径）、传统脚本及中文帮助目录；CI 用干净工作区检查镜像内实际文件，不以构建命令退出成功代替资源验收。

构建发布：建议新实施分支 `zh-CN-v5.2.24`、发布 tag `zh-v5.2.24.N`，此处是命名方案，不在本轮创建或改写分支。扩展现有 CI 监听该分支/匹配 tag；PR 仅检查/构建，publish 依赖全部测试与 artifact 检查成功，只在自身 Fork 的受信发布事件推送自身 GHCR。镜像 tag 使用 `5.2.24-zh.N-<commit>`，部署锁定 digest。初版平台 linux/amd64；arm64 不纳入当前服务器交付。

升级发布：盘点实际启用服务和所有挂载；主数据库做逻辑备份，Missions/ssl/部署环境与镜像 digest 做受限备份。若实际开启 STAC 等额外数据库，也必须纳入，不能只根据示例假定启用。验证备份能在新专属数据卷恢复；记录初始化前后 schema、记录数量、配置及代表性附件读回，禁止连接原卷进行副本测试。

恢复演练：旧镜像 + 恢复到全新旧版本数据卷的备份能启动并完成登录、配置读回、代表性图层读回，才算回滚可用。切换窗口先暂停写入，完成最终备份及校验后切换；初始验收完成前不开放写入。开放写入后若回滚，先暂停写入并保存新数据增量，不能静默丢弃；可兼容增量通过应用 API 回放，无法安全回放则保留副本并报告处理方案。正式切换后检查健康接口、登录、配置保存回读和普通用户交互。

## 实施顺序与估算

粗估总工程工作量：人工 8–15 人日；Codex 辅助 2–5 个工作日，包含完整文案校核、测试和版本升级验证。这是规划区间，不是已测量工时；实施前的文本清单会修正估算。

1. 冻结稳定版本，跑英文基线，建立全部可见文本清单及术语。
2. 建字典、资源引擎、locale 规则、三类显示适配器与基本测试。
3. 分批接入全部地图/工具界面、后台元数据和后台页面、认证与反馈、界面内帮助；各批在完成后单独校核，但不缩减最终覆盖。
4. 完成状态保持、英文兼容、原始配置与数据不变、异常场景、中文排版的验收。
5. 构建并发布固定版本镜像，在副本验证升级及回滚后再部署。

## 当前待验证事项

- 翻译条目总数尚未完成源码 AST/模板级提取；当前只有表面普查，不能给出准确百分比。
- 4.2.34 到 5.2.24 的数据库迁移和英文基线尚未执行。
- 字典生成和两个前端/服务端打包、缓存失配与语言状态保持需要实施验证；尚未生成或运行新代码。
- 未检验任意公司私有插件；未来私有插件可沿相同消息键协议加入，但本次对发行包自带界面负责。

本轮产出：设计与工程审查文档。当前未开始应用代码修改、镜像构建或现有服务升级。

## 独立设计审查记录

第一轮 7.5/10：发现 8 项接口及验收契约不足。已调整为构建时分发字典，补齐独立 React 根、传统工具订阅、元数据值分离、语言选择、消息协议、交付资源和恢复演练。

第二轮 8.8/10：发现 4 项表述/构建闭环不足。已明确 API 增量兼容、嵌入第三方 UI 的验收门槛、传统脚本/manifest 落点及英文测试 locale 与动态消息键检查。

第三轮 9.2/10：前四项已修正，指出 1 项最终 manifest 与前端构建的循环依赖。已按该轮具体建议拆为构建前 resource-index 与构建后 artifact manifest，核对了有向无环顺序；达到第三轮给出的进入工程审查条件。共 3 轮、13 项问题修正，第三轮限定修正由主审核对，未再增加第四轮。

撤回事项：仅因 Pug 渲染函数定义位于 cookieParser 之前，不能认定存在语言中间件顺序缺陷。实际实施需检查请求执行链，本设计不将此认定为已观察到的错误。
