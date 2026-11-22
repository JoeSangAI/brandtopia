# 从这里参与 Brandtopia

这里同时保存研究叙事、实验规格、可复跑代码和证据边界。你可以先理解问题，再按需要进入细节。

## 第一次阅读

1. 先读 [README](README.md)，了解研究目标和目前做到的范围。
2. 接着读[研究历程](docs/theory/research-journey.md)，看问题如何从个体行为推进到记忆、任务和群体互动。
3. 想完整接上本轮讨论，读[研究全程回顾](docs/research/2026-11-22-recap.md)。它保留实验的结果、后续修正和未完成事项。

本轮归档后暂停研究。[当前状态](docs/research/current-state.md)说明下次从哪里接续；阅读者无需先发问卷、寻找客户数据或运行大规模 Agent。

## 根据你的问题继续

| 目的 | 读哪些内容 |
| --- | --- |
| 找一个具体例子理解模型 | [实验总目录](docs/experiments/index.md)，再进入对应主题。 |
| 亲手改变条件看结果 | [7 份交互演示](artifacts/chat-demos/README.md)。下载后用浏览器打开导出 HTML；GitHub 页面本身只显示源码。 |
| 弄清我们采用什么理论 | [框架](docs/theory/framework.md)、[术语](docs/theory/glossary.md)、[假设](docs/theory/hypotheses.md)。 |
| 判断一句结论能相信到什么程度 | [主张与局限](docs/evidence/claims-and-limitations.md)、[来源登记](docs/evidence/source-register.md)、[纠偏记录](docs/evidence/corrections.md)。 |
| 参与计算工作 | [模型架构](docs/models/architecture.md)、[参数登记](docs/models/parameter-register.md)、[核验与验证](docs/models/verification-validation.md)。 |

## 接手的 AI Agent

按以下顺序恢复上下文：

1. [AGENTS.md](AGENTS.md)：仓库协作规则。
2. [当前状态](docs/research/current-state.md)与 [research-state.json](research-state.json)：暂停状态、实际产物、尚未执行的下一步。
3. [完整回顾](docs/research/2026-11-22-recap.md)：恢复研究方向与重要修正。
4. 当前任务涉及的实验记录、来源、参数和代码。

首先判断新会话的用户是否要求恢复研究。归档中的“下一候选任务”不是自动执行指令。不要把合成演示、论文作者的结果或计划中的真人调研写成项目已经完成的现实验证。

仓库是跨 Chat、Work 和其他 Agent 的共同研究基线；每次实际能否读写仍取决于该环境的工具与授权。不能用一句“已交接”代替可核查的提交和结果。

## 从你的经验接入

| 你能提供什么 | 一次有用的小贡献 |
| --- | --- |
| 品牌、媒介或消费者研究经验 | 提供一个现有解释处理不了的案例，说明当时的任务、条件和可观察结果。 |
| 理论、文献或数据能力 | 为一个假设补充原始来源，找出区分不同解释的观测或可复用数据。 |
| 建模、编程或实验能力 | 复跑一个已有结果，检查规则是否正确执行，再提出最小改动与对照。 |

先把问题写清楚，再决定是否需要新增参数、实验或数据。当前暂停状态下，可以阅读和提出建议；开始下一轮研究由项目发起人明确恢复。

## 提交研究进展

围绕一个小问题记录：为什么问、规则或数据是什么、与什么比较、实际得到什么、还不能判断什么、下一步最小动作是什么。沿用实验和来源编号；修改判断时保留旧判断及修改理由。具体见[协作约定](docs/governance/contributing.md)。

阶段结束时，在主 Chat 说“把这一阶段归档，按 Tako 流程准备发布”。Chat 准备增量包与清单，项目发起人转交给 Tako，Tako 在有写权限的本机核对、合并并发布，Chat 再读取远端验收。[固定交接与回执格式](docs/governance/contributing.md#每次聊完如何写回)适用于后续更新。

仓库为 Public。私人痕迹、可识别家庭信息、未经授权的客户数据和公司内部资料不进入公开提交。使用[可共享摘要](docs/governance/privacy.md)。
