# Issue 任务清单

总览：https://github.com/zssggle-rgb/MMGIS/issues/1

| 任务 | Issue | 依赖 | 分支 |
|---|---|---|---|
| T1 基线、清单、术语规范 | #2 | — | l10n/t01-baseline |
| T2 字典与语言基础 | #3 | T1 | l10n/t02-i18n-core |
| T3 地图 React | #4 | T2 | l10n/t03-map-react |
| T4 内置传统工具 | #5 | T2 | l10n/t04-legacy-tools |
| T5 元数据控件 | #6 | T2 | l10n/t05-metadata |
| T6 管理后台 | #7 | T2/T5 | l10n/t06-configure |
| T7 认证与反馈 | #8 | T2 | l10n/t07-auth-feedback |
| T8 界面内帮助 | #9 | T2 | l10n/t08-help |
| T9 验收与文案校核 | #10 | T3–T8 | l10n/t09-acceptance |
| T10 构建与镜像 | #11 | T2/T8 | l10n/t10-build-release |
| T11 升级恢复 | #12 | T1/T9/T10 | l10n/t11-upgrade-restore |
| T12 性能 | #13 | T3–T8/T10 | l10n/t12-performance |

每个任务开发完成后只运行 review skill 并自动提交正式 PR。需要集成时仅在 60 运行 QA skill；其他测试不自行新增或运行。任务状态以各 Issue/PR 的实现和 skill 记录为准，清单不代表完成。
