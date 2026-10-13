# 中文界面构建与交付

完整交付须包含 T3–T8 的地图、工具、后台、消息和帮助源码。构建必须使用同一提交、同一套翻译资源，不能分别复制不同版本的前端产物。

## 构建产物

安装根目录和 `configure` 的锁定依赖后，运行 `npm run build:delivery`。该命令依次生成地图前端、管理后台及两套 `index.pug`，最后生成 `API/i18n/generated/delivery-manifest.json`。本地构建可设置 `MMGIS_BUILD_COMMIT` 为完整的 40 位 Git 提交；未设置时记录为 `unknown`，不能据此声称产物已绑定提交。

两套前端的 `postbuild` 分别记录 `i18n-build.json`，包含编译时使用的资源版本与指纹。交付打包复用现有生产资源校验，要求两份记录与 API 资源索引一致，然后列出镜像实际包含的地图/后台文件、API 国际化模块、传统脚本、中英文帮助、Pug 模板和版本文件。每个文件记录相对路径、字节数和 SHA-256；清单不包含自身。

Docker 构建使用相同命令，并将提交写入清单及 OCI revision 标签：

```sh
docker build --build-arg SOURCE_COMMIT="$(git rev-parse HEAD)" -t mmgis-localized:local .
```

`.dockerignore` 明确保留帮助 Markdown 源码，并排除本地已生成的国际化文件，保证镜像从当前源码生成字典、传统脚本和帮助。生产镜像复制完整 `API`、`public`、`views` 和两套前端产物；启动仍使用已有 `prestart:prod-docker` 资源校验，不要求安装 Webpack 或重新编译。

## CI 与手动发布

PR 和 `main` 推送仅构建 AMD64/ARM64 完整镜像，并从实际镜像提取交付清单作为工作流附件。此阶段没有 GHCR 登录、包写权限、发布或部署步骤。

发布须在 `main` 手动运行 **MMGIS image build and manual release**，并显式设置 `publish=true`。两种架构构建成功后，发布作业才获得包写权限。`mmgis-release` 环境可由仓库维护者配置保护规则。工作流读取触发时的固定提交，发布到当前仓库的 GHCR，标签包含上游版本、`zh-cn` 和完整提交，不更新 `latest`。

发布完成后生成 `mmgis-release-lock` 附件，包含标签、来源提交和不可变的 `ghcr.io/<仓库>@sha256:<digest>` 引用。部署应使用此不可变引用。清单检查只是产物完整性依据；运行和界面集成验证由 60 的隔离副本通过 QA skill 完成。

本次开发不运行构建、发布或部署；由集成任务统一构建并在 60 验证。未新增其他测试或验收脚本。

Docker 清单格式与查询参数参考：[Docker 官方 imagetools inspect 文档](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/)。
