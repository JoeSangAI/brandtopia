# Brandtopia

Brandtopia 研究少数可复用的个体机制，如何在关系网络中生成可观察、可预测、可被推翻的群体行为。我们分别研究信息怎样传播、人怎样形成品牌信任、人在具体场景中怎样选择，以及外部干预改变了多少结果。

**[从这里开始](START_HERE.md)** · [研究北极星](docs/theory/north-star.md) · [实验履历](docs/experiments/index.md) · [证据与局限](docs/evidence/claims-and-limitations.md)

## 当前基线 · 2026-11-22

[ABM-001／实验 15](docs/experiments/abm-001-information-diffusion.md)已复跑。固定十人环和 6/10 初始知晓，在“两位邻居都知晓”的规则下，连续布点停在 **6/10**，穿插布点首轮到 **10/10**。这是合成条件下的传播结果。代码通过 9 项测试，四份日志逐字节复现。品牌信任、实际选择和投放增量仍待实证。

下一研究问题是保持相同人口、覆盖和门槛，什么样的网络能让第二轮继续新增知晓者。见 [H02](docs/theory/hypotheses.md)。

## 研究与协作

| 内容 | 入口 |
| --- | --- |
| 心理史学、IPO + B=MAP、学习与贝叶斯更新、信息丰度、品牌Token化 | [理论框架](docs/theory/framework.md) · [术语](docs/theory/glossary.md) · [可证伪假设](docs/theory/hypotheses.md) |
| 实现、参数、复跑和验证 | [架构](docs/models/architecture.md) · [参数登记](docs/models/parameter-register.md) · [核验与验证](docs/models/verification-validation.md) |
| 7 月两份底稿、主 Chat、Town 原型与公开参考 | [来源登记](docs/evidence/source-register.md) |
| 小组成员与 Agent 的协作 | [协作说明](docs/governance/contributing.md) · [AGENTS.md](AGENTS.md) · [隐私](docs/governance/privacy.md) · [决策](docs/governance/decision-log.md) · [版本记录](CHANGELOG.md) |

理论继续在「介绍心理史学」Chat 中讨论。仓库保存可以共同引用、复跑和修订的研究基线。

## 本地复跑

使用 Python 3.10 或以上版本，在仓库根目录运行：

```sh
python3 -m unittest discover -s tests -v
python3 brandtopia.py run interleaved --threshold 2
python3 brandtopia.py replay results/interleaved-t2.json
```

`run` 输出 JSON；`replay` 校验日志并显示逐轮知晓状态。内置情景为 `clustered` 和 `interleaved`，阈值可选 1 或 2。
