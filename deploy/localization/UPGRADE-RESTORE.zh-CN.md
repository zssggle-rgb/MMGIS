# MMGIS 汉化版本升级与独立恢复

状态：**已按 QA skill 在 60 完成同一 5.2.24 快照的隔离备份、候选与英文基线恢复，以及部分配置和文件读回。** 原 4.2.34 数据跨版本迁移、正式切换和开放写入后回滚尚未执行，不能将本文作为完整发布验收记录；本轮不替换当前使用环境。

## 已核实的环境边界

2026-10-13 只读盘点了容器镜像、挂载、端口和数据库名称；没有读取或输出环境文件、密码、私钥或令牌。

| 环境 | 容器 | 数据库与用户 | 持久卷 | 端口 |
|---|---|---|---|---|
| 原演示环境 `/home/ubuntu/mmgis` | `mmgis-app-1`、`mmgis-db-1` | `mmgis` / `mmgis` | `mmgis_pgdata`、`mmgis_missions`、`mmgis_ssl` | `10.10.31.60:18891` |
| 隔离 QA `/home/ubuntu/mmgis-l10n-qa` | `mmgis-l10n-qa-app-1`、`mmgis-l10n-qa-db-1` | `mmgis-test` / `mmgis_test` | `mmgis-l10n-qa_pgdata`、`mmgis-l10n-qa_missions`、`mmgis-l10n-qa_ssl` | `127.0.0.1:18892` |

两个应用的挂载位置均为 `/usr/src/app/Missions` 和 `/usr/src/app/ssl`，数据库挂载为 `/var/lib/postgresql/data`。

原演示镜像为：

```text
ghcr.io/nasa-ammos/mmgis:latest@sha256:4316ce1897c058d73c4205c8a3bdb8f07835f14fdcf2b282691438d7b42f9dbf
```

原安装记录记载该镜像实际版本为 `4.2.34-20260328`；本次盘点只确认摘要，没有重新运行版本校验。隔离 QA 基线镜像为：

```text
ghcr.io/nasa-ammos/mmgis:5.2.24@sha256:3dd701715adca4dece7b7aa4fbbdfda65f88972d33681f39aa426c74ccc8d65d
```

两套数据库使用相同固定镜像：

```text
postgis/postgis:17-3.5-alpine@sha256:894f570c0cf0664ed5576a8fd5d5bfb8fb1b19d592885b686c3a88c8bd90c41f
```

本轮恢复源限定为 **QA 的 5.2.24 数据快照**。旧镜像恢复指使用同一 5.2.24 基线镜像恢复其升级前快照。**这不证明 4.2.34 到 5.2.24 的跨版本迁移可用**；原演示环境的跨版本迁移另行审查和演练，不运行本文命令修改原演示环境。

汉化 QA 当前可能使用镜像内文件覆盖。文件覆盖不能代替可重新部署的发行镜像；T10 未产出候选镜像固定摘要和资源清单前，不开展正式升级或切换。

## 备份内容与权限

必须将以下内容组成同一个快照：

1. PostgreSQL 逻辑备份：包含配置、用户、绘制、数据集及其数据库记录，使用 `pg_dump -Fc`。不要复制正在运行的 PostgreSQL 数据目录。
2. `Missions` 文件归档：包含本地项目文件和附件；数据库备份不能替代这些文件。
3. `ssl` 文件归档：可能包含私钥，按秘密资料管理。
4. 受限的部署配置和环境文件副本：用于保留必要密钥、连接设置和镜像摘要，不上传 GitHub。恢复数据库连接必须改为恢复专用数据库，禁止沿用原主机连接。
5. 快照记录：开始和结束时间、源镜像摘要、源容器及卷名、候选镜像摘要、数据库与附件所属的同一暂停写入窗口。记录中不写凭据。

备份目录权限 `0700`，备份文件权限 `0600`，使用 `umask 077`。备份、恢复环境文件和日志不得放入项目公开目录、HTTP 静态目录或 PR 附件，不用 `cat .env`、`docker inspect` 的完整 JSON 或 `docker compose config` 输出包含凭据的配置。

现有 `ubuntu` 账户通过 Docker 操作容器。Docker 组具备高权限，**不等于数据库最小权限备份账户**；本文不自动给账户加权限、不创建原环境角色。受限备份指限定源容器与卷、只读文件挂载、隔离临时容器及严格文件权限。长期备份服务应另行配置专用身份与加密存储。

## 暂停写入并制作 QA 快照

下面命令是待执行步骤，不是已执行证据。全部在 60 执行，使用现有 SSH 别名 `miguan-host60-qa`。不能将命令中的 QA 容器和卷名替换成原演示环境。

先结束 QA 浏览器写入操作并暂停外部导入、定时任务及其他写入者。随后只停止 QA 应用；数据库保持运行。如果仍有其他进程直接写数据库或文件，不能开始快照。

```sh
cd /home/ubuntu/mmgis-l10n-qa
umask 077
SNAPSHOT_DIR="/home/ubuntu/mmgis-backups/qa-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 -p /home/ubuntu/mmgis-backups
mkdir -m 700 "$SNAPSHOT_DIR"
docker stop mmgis-l10n-qa-app-1
```

在同一个无写入窗口中执行备份。命令失败、文件权限不足或备份中断时，不进入恢复或切换；保留失败产物并查明原因，不放宽源卷权限。

```sh
docker exec mmgis-l10n-qa-db-1 pg_dump \
  --username=mmgis_test --dbname=mmgis-test \
  --format=custom --no-owner --no-acl > "$SNAPSHOT_DIR/database.dump"

docker run --rm --network none --read-only --cap-drop ALL --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges \
  --mount type=volume,src=mmgis-l10n-qa_missions,dst=/source,readonly \
  --entrypoint tar \
  postgis/postgis:17-3.5-alpine@sha256:894f570c0cf0664ed5576a8fd5d5bfb8fb1b19d592885b686c3a88c8bd90c41f \
  -czf - -C /source . > "$SNAPSHOT_DIR/missions.tgz"

docker run --rm --network none --read-only --cap-drop ALL --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges \
  --mount type=volume,src=mmgis-l10n-qa_ssl,dst=/source,readonly \
  --entrypoint tar \
  postgis/postgis:17-3.5-alpine@sha256:894f570c0cf0664ed5576a8fd5d5bfb8fb1b19d592885b686c3a88c8bd90c41f \
  -czf - -C /source . > "$SNAPSHOT_DIR/ssl.tgz"
```

临时容器只读源卷，无网络，不挂载 Docker socket；移除默认能力，仅添加 `DAC_OVERRIDE` 以读取不同所有者的受限文件，源卷仍不可写。归档通过标准输出写入宿主机，由 `ubuntu` 持有。`pg_dump` 在指定数据库容器内使用现有身份，不把密码放进命令参数。

由操作人员将 QA 的实际 Compose 文件和 `.env` 复制到同一受限备份目录；文件名以实际部署为准，不能复制管理员凭据到公开位置。只在本机受限环境中记录必要配置，保留原 `SECRET` 等密钥，避免恢复后依赖密钥的数据不可读。

快照完成后可以恢复原 QA 应用供继续工作：

```sh
docker start mmgis-l10n-qa-app-1
```

若是在正式切换窗口中进行最终快照，保持源应用停止，直至候选副本验收及切换完成。发生失败时，记录原因并恢复源应用；不要默认让用户长期处于停机状态。

## 恢复至全新专属副本

使用旁边的 `compose.restore.yml`，分别创建“候选恢复副本”和“旧镜像恢复副本”。每次使用新的 `RESTORE_PROJECT`、未使用的端口和全新卷，不能复用 QA 或原演示卷。配置不声明 `external` 卷，不固定容器名称，避免误连现有资源。

准备权限 `0600` 的恢复配置文件，包含以下参数。密码与密钥由操作人员在受限文件中配置，不提交实际值：

| 参数 | 要求 |
|---|---|
| `RESTORE_PROJECT` | 全新项目名，例如 `mmgis-l10n-restore-时间标识-candidate`；旧镜像副本另用 `-baseline` |
| `MMGIS_RESTORE_IMAGE` | 候选使用 T10 产物的固定摘要，基线使用上文固定 5.2.24 摘要；不用 `latest` 或可变标签 |
| `MMGIS_RESTORE_ENV_FILE` | 恢复环境文件的绝对路径，权限 `0600` |
| `DB_PASS` | 新恢复数据库密码；不同于源数据库密码也可以 |
| 应用环境 | 保留必要 `SECRET` 等密钥，其余来自受限源配置；Compose 显式覆盖数据库地址、名称及用户 |

恢复应用显式连接 `db:5432`、数据库 `mmgis-test`、用户 `mmgis_restore`。数据库和应用都不发布宿主机端口。内部网络禁止容器外连；浏览器通过 SSH 隧道直连应用的容器 IP，客户端仅监听 `127.0.0.1`。这是隔离演练配置，不是生产部署配置。需要外部数据源的流程另行安排，不能因外部请求被隔离而宣称数据源正常或丢失。

首先只启动恢复数据库，不能提前启动应用，让迁移改写待恢复的空库：

```sh
docker compose --env-file /受限目录/restore.env \
  -f /受限目录/compose.restore.yml up -d db

docker compose --env-file /受限目录/restore.env \
  -f /受限目录/compose.restore.yml create --no-recreate app
```

第二条命令创建未启动的应用容器及两个专属文件卷，不执行应用迁移；`--no-recreate` 保留刚启动的数据库容器。`create` 不支持 `--no-deps`，不能使用该参数。确认新项目确实只使用其专属新卷；如名称与现有卷重复，停止该副本并重新选择项目名，不清空既有卷。

数据库先只初始化维护库 `postgres`；等待其就绪后，使用 `pg_restore --create` 从 QA 快照新建 `mmgis-test` 并恢复，避免向已经初始化的应用数据库重复恢复对象。`--create` 实际恢复到归档中记录的数据库名称，因此只接受本轮 `mmgis-test` 快照。恢复命令不包含 `--clean`、删库或覆盖已有对象。`--create` 不能与 `--single-transaction` 同用，任何恢复错误都会退出；失败副本保留原状，新一轮使用新的项目名和新卷，不能在部分恢复的库上重跑。参数行为依据 [PostgreSQL 17 的 pg_restore 文档](https://www.postgresql.org/docs/17/app-pgrestore.html)。

```sh
docker compose --env-file /受限目录/restore.env \
  -f /受限目录/compose.restore.yml exec -T db \
  pg_restore --username=mmgis_restore --dbname=postgres \
  --create --no-owner --no-acl --exit-on-error \
  < "$SNAPSHOT_DIR/database.dump"
```

在应用启动前，分别恢复 `missions` 和 `ssl` 的全新卷。先在当前终端设置 `RESTORE_PROJECT`，值必须与受限恢复配置文件中的项目名完全一致；`--env-file` 不会自动将变量导入终端。该名称必须是此次已确认的全新项目名，不能填写 `mmgis` 或 `mmgis-l10n-qa`。以候选副本为例：

```sh
RESTORE_PROJECT=mmgis-l10n-restore-20261013t120000z-candidate

docker run --rm -i --network none --read-only --cap-drop ALL \
  --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges \
  --mount "type=volume,src=${RESTORE_PROJECT}_missions,dst=/restore" \
  --entrypoint tar \
  postgis/postgis:17-3.5-alpine@sha256:894f570c0cf0664ed5576a8fd5d5bfb8fb1b19d592885b686c3a88c8bd90c41f \
  -xzf - -C /restore < "$SNAPSHOT_DIR/missions.tgz"

docker run --rm -i --network none --read-only --cap-drop ALL \
  --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE \
  --security-opt no-new-privileges \
  --mount "type=volume,src=${RESTORE_PROJECT}_ssl,dst=/restore" \
  --entrypoint tar \
  postgis/postgis:17-3.5-alpine@sha256:894f570c0cf0664ed5576a8fd5d5bfb8fb1b19d592885b686c3a88c8bd90c41f \
  -xzf - -C /restore < "$SNAPSHOT_DIR/ssl.tgz"

docker compose --env-file /受限目录/restore.env \
  -f /受限目录/compose.restore.yml up -d app
```

文件卷已由前面的 `create --no-recreate app` 创建。执行文件恢复前仍需确认此次全新的 `${RESTORE_PROJECT}_missions` 和 `${RESTORE_PROJECT}_ssl` 卷名；禁止让 Docker 在拼错名称时创建一个无关卷后继续操作。恢复容器只挂载目标新卷，保留恢复文件所有者和权限需要 `CHOWN`、`FOWNER`、`DAC_OVERRIDE`，源卷和宿主机目录不挂载。只恢复自己制作并保存于受限目录的归档，不接收来源不明的归档。

候选与基线使用同一暂停窗口的快照，但分别恢复独立数据库和文件卷。**不要把旧镜像接到候选镜像已经迁移的数据库上**；旧镜像可能不兼容新结构。

## QA 与切换门槛

应用启动后，在 60 读取本次专属应用容器的内部 IP（只读取 IP，不输出完整 inspect 或环境变量）：

```sh
docker inspect 本次专属应用容器名 --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

然后在本机建立隧道，以下 IP 仅为示例，必须使用刚读取的实际地址。容器重建后重新读取 IP：

```sh
ssh -N -L 127.0.0.1:18893:172.16.31.3:8888 miguan-host60-qa
```

浏览器访问 `http://127.0.0.1:18893/`。基线副本使用另一个未占用的客户端端口和它自己的容器 IP。60 的 Docker 内部网络没有启用宿主机端口发布，不能把 Compose 的 `ports` 配置当作已经可访问的证据；无需为演练增加外部网络或修改防火墙。

主任务使用 QA skill，在 SSH 隧道浏览器中检查两个恢复副本：管理员与项目配置可读、原图层及业务数据值可读、附件可打开、绘制内容可读、语言切换可用。记录镜像摘要、项目名、新卷名、快照时间和截图。需要管理员身份时使用已授权的受限凭据机制，不在报告中写密码。

2026-10-13 已在 60 执行同一 5.2.24 快照的独立恢复：快照目录 `/home/ubuntu/mmgis-backups/qa-20261013T112008Z`，权限 0700，归档及环境文件权限 0600。恢复项目分别为 `mmgis-l10n-restore-20261013t112008z-r2-candidate` 和 `mmgis-l10n-restore-20261013t112008z-r2-baseline`，各有新的 pgdata/missions/ssl 卷。两个副本均已通过真实浏览器读取管理员会话、L10nTools 项目配置、版本 v1，以及站点、线路、区域三份 GeoJSON 文件的地图显示。没有连接原 18891 数据库。

恢复候选实际使用本地固定镜像 ID `sha256:e03c47a48c8a242f9ca87e8107ccf7eaaa62f85f4f1535bb778255e846eeadff`；英文基线使用本文固定的官方 5.2.24 摘要。演练中发现 `create --no-deps` 不受当前 Compose 支持，以及内部网络不能通过宿主机发布端口访问，已据此修正文档。首次失败项目已停止并保留卷；未删除数据。后续性能检查仅替换英文副本的同版本编译前端，未更换其数据库或文件卷。

以上是配置及三份地图文件的实际读回证据，不覆盖 Draw 内容、全部附件格式、原 4.2.34 数据跨版本升级或开放写入后回滚。T9 的完整发布验收与 T10 的正式发行镜像证据尚不齐全，因此不能据此自动切换原服务。

正式切换涉及服务入口、现有端口、防火墙和实际数据写入。本轮只交付隔离演练，不自动替换 18891、不修改其他服务、不改全局防火墙。

## 回滚与新数据保护

### 尚未开放写入

保持源应用及其原卷完整。如果候选副本未开放写入而验收失败，可停止候选副本，恢复原入口和源应用。源数据不需要覆盖，也不需要从迁移后的库逆向降级。

### 已经开放写入

不能直接改回旧镜像或旧数据库，否则会丢失候选环境中新增的配置、绘制、数据和附件。

1. 再次暂停入口与全部写入者，停止候选应用。
2. 对候选数据库、Missions 和 ssl 制作一个新的受限快照，命名为“开放写入后保留快照”，保留候选镜像摘要及写入时间范围。
3. 保持候选卷原状。基于新的候选快照创建另一独立保留副本，用于读取和导出新增内容；不覆盖升级前快照。
4. 根据具体数据及旧版本兼容能力，使用应用的导出／导入接口迁移新增内容。没有完成兼容分析和冲突处理前，不宣称旧环境包含全部最新数据。
5. 如果必须先恢复旧环境服务，明确记录其数据截至升级前快照，并保留候选数据只读访问方案；由业务负责人确认哪些新增内容尚待补回。

暂停写入不意味着数据可以丢弃。回滚不运行 `docker compose down -v`、`docker volume rm`、`DROP DATABASE` 或其他删除数据的操作。失败副本使用 `docker compose stop` 保留卷与证据，后续清理由独立授权决定。
