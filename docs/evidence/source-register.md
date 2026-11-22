# 来源登记

**更新于 2026-11-22。** S 编号用于追溯材料，不代表材料都已成为实证结论。“论文结果”由原作者报告；本项目是否复算、是否用自己的数据验证，另行标明。

| 想核查什么 | 来源 |
| --- | --- |
| 研究来路、早期稿件和计算基线 | S01–S05、S17 |
| 行动条件、社会传播和共同知识 | S06–S07 |
| 强制尝试、重复与主观可信度 | S08–S09 |
| 任务、品牌检索、TOM 和品类结构 | S10–S12 |
| 思考成本与下一步公开数据入口 | S13–S14 |
| 模型验证、真人样本规划、生成式研究 | S15–S16、S18 |
| AI 输入能力的事实修正 | S19 |

## S01 · 介绍心理史学

- 类型：Brandtopia 主研究对话；本次归档恢复了从早期门槛实验、路径依赖、广告与补贴，到信念更新、社会传播、任务与品牌选择、真人验证边界的研究主线。
- 查阅范围：当前可见的连续用户陈述、已恢复的研究记录、原有仓库与存活的交互演示源文件。完整回顾见[研究 recap](../research/2026-11-22-recap.md)，逐项设定与结果见[实验档案](../experiments/index.md)。
- 来源缺口：部分早期逐轮参数、随机抽样结果、旧广告模型的完整实现及原始界面未恢复。可从原稿重算的公式与仅能恢复的讨论结论分别标注；归档日期不作为实验发生日期。
- 证据身份：用户的行业经验和个案叙述提供候选机制，不自动代表行业总体效果。贝恩／秒针“约三周内 9–16 次接触”的具体样本、指标、条件与原图尚未完整核对，保留为待核线索，不作为默认参数。
- 隐私：公开仓库使用去标识的研究摘要，家庭成员、客户原始材料、私人对话和账号信息不随归档发布。

## S02 · 生成模型视角下的营销科学

- 版本：v0.2.1，2026-07-13；文件名 `generative_model_marketing_science_v0.2.1_2026-07-13.md`。前次建库已查阅底稿；本次保留定位，未重新发布原稿。
- 定位：附录 A8 是心理史学的群体层设想。§6–7、§9–10 讨论品牌作为可提取的预测节点、学习与遗忘、隐藏状态、行为及干预；§13 定义品牌Token化及七阶段学习回路，§16 写认知残留，§18 拆分覆盖、理解与相互可见，§23 给失败条件。
- 用途：消费者认知与传播机制的理论来路。底稿中的概念、行业解释与举例仍按各自证据身份使用；具体商业材料留在原授权范围内。

## S03 · AI归因

- 题名：《AI归因：从Token效率到企业经营的动态因果模型》，2026-07-14；文件名 `2026-07-14-ai-attribution-research-note.md`。前次建库已查阅研究笔记。
- 定位：§三至七区分内外因素、可观测性与动态拟合；§八至九从使用、过程、能力、中间结果到最终经营结果，提出基线、外部冲击、可控过程与相对比较。
- 用途：为外部干预如何归因提供方法背景。其对象是企业 AI 使用与经营绩效，Token 衡量算力使用，和 S02 的品牌Token化含义不同。文中投入与营收百分比属于举例。

## S04 · ABM v0.1

- 资产：[引擎](../../brandtopia.py)、[自动测试](../../tests/test_brandtopia.py)、[实验及四份日志](../experiments/abm-001-information-diffusion.md)。
- 支持范围：固定十人环、同步门槛、合成布点下的传播轨迹。可复跑命令和本次核验记录以实验页为准。
- 不支持：消费者购买、投放增量、公众信任，或真实社交网络的传播参数。

## S05 · Brandtopia Town

- 来源：旧研究副本的 `README.md`、`docs/framework.md` 与 2026-11-01《BrandTopia 完整方案 v3》。前次归档查阅了原型边界、实验设计和分支状态。
- 去标识摘要：早期原型用生活流与社交流模拟品牌表达被接触、记住、转述及触发行动；方案提议比较静态画像、个人生活流、加入社会关系三种条件，并用外部观测与留出条件校准。
- 状态：原型、拟议的真人对照与实际完成的验证各自保留原状态。本次没有重跑旧原型，也没有把设计提案记成已完成实验。
- 用途：生活流、社交流和表达预演的设计来路；内部附件按原授权路径管理。

## S06 · 福格行为模型

- 一手说明：[Stanford Behavior Design Lab — Fogg Behavior Model](https://behaviordesign.stanford.edu/resources/fogg-behavior-model)。本次已核对。
- 支持：动机、能力与提示在行为发生时汇合；用于组织行动条件。
- 边界：B=MAP 在本项目中没有被解释为三个已测概率的乘积，也没有取代记忆、信念更新与社会互动机制。对话中的“BDMIP”已确认为 B=MAP 的转录错误。

## S07 · 复杂传播与共同知识

- Damon Centola、Michael W. Macy，2007。[Complex Contagions and the Weakness of Long Ties](https://www.journals.uchicago.edu/doi/full/10.1086/521848)，DOI：10.1086/521848。关系结构与多来源强化的理论参照；本次保留已有书目记录。
- Michael Suk-Young Chwe。[Rational Ritual](https://press.princeton.edu/books/ebook/9781400846436/rational-ritual-0)。公共可见性与协调的理论参照；本次未重读全书。
- Julian De Freitas、Kyle Thomas、Peter DeScioli、Steven Pinker，2019。[Common knowledge, coordination, and strategic mentalizing in human social life](https://doi.org/10.1073/pnas.1905518116)，*PNAS*，116(28)，13751–13758。此次已核对题名、作者、日期、DOI 及论文摘要。这是对话提及的 2019 年共同知识研究。
- 支持范围：该论文考察人在协调情境中如何区分私人知晓、共享知晓与共同知识。
- 边界：没有直接验证电梯广告的效果、同楼宇 SaaS 采购转化，或品牌公开投放的普遍优势。Brandtopia 的“信息丰度”操作化仍是本项目的待检验方案。

## S08 · 伦敦地铁：强制尝试与路线调整

- Shaun Larcom、Ferdinand Rauch、Tim Willems，2017。[The Benefits of Forced Experimentation: Striking Evidence from the London Underground Network](https://doi.org/10.1093/qje/qjx020)，*Quarterly Journal of Economics*，132(4)，2019–2055。
- [牛津大学存档及作者稿入口](https://ora.ox.ac.uk/objects/uuid%3A271f6f8e-2915-445f-8ebd-5a2900970af1)。此前研究核对过作者稿的样本、表 4 和 §7.2；此次复核了出版社与存档的元数据、摘要，PDF 直链本次未成功读取。
- 作者报告：罢工迫使部分乘客尝试其他路线，恢复运营后部分路线改变仍然保留；信息不完全是解释线索。
- 对本项目的用途：说明“重新考虑的触发事件”和新信息可能改变既有选择。
- 不支持：某站客流必定沿指数曲线恢复、必定永久低于原水平，或停运越久必定形成越强习惯。本项目的恢复曲线是合成机制推演。
- 复算状态：本项目未下载该研究的乘客数据或重新估计论文结果。论文另给出[作者复制材料入口](https://doi.org/10.7910/DVN/1HUQRM)，其具体数据权限与内容尚未在本项目审查。

## S09 · 重复与虚幻真实效应

- Lisa K. Fazio、Nadia M. Brashier、B. Keith Payne、Elizabeth J. Marsh，2015。[Knowledge does not protect against illusory truth](https://scholars.duke.edu/publication/1090926)，*Journal of Experimental Psychology: General*，144(5)，993–1002，DOI：10.1037/xge0000098。
- 查阅：本次核对作者所在大学的出版记录与摘要，未复算实验数据。
- 支持：论文中的重复陈述可以提高主观真实感，已有知识并不总能阻止这种效应。
- 边界：这一结果没有给出广告重复到购买的统一换算系数。熟悉感、主观可信度、客观证据与购买行为仍分别记录；相同信息的重复也不能直接作为多条独立贝叶斯证据相乘。

## S10 · Jobs to Be Done

- 一手说明：[Christensen Institute — Jobs to Be Done Theory](https://www.christenseninstitute.org/theory/jobs-to-be-done/)。本次已核对定义部分。
- 支持：从特定处境中消费者想取得的进展理解选择，包含功能、情感和社会维度。
- 本项目采用：用“当前要完成什么任务”组织模型输入，检查品牌如何成为可调用的解决方案线索。
- 边界：JTBD 是研究视角，没有证明大脑只储存任务，也没有证明所有品牌价值都等于节省思考成本。

## S11 · 品牌检索、考虑集合与品类结构

| 来源 | 本次可核查内容 | 对本项目的用途 |
| --- | --- | --- |
| Prakash Nedungadi，1990，[Recall and Consumer Consideration Sets: Influencing Choice without Altering Brand Evaluations](https://academic.oup.com/jcr/article-abstract/17/3/263/1822527)，DOI：10.1086/208556 | 出版社摘要与元数据；全文入口本次读取失败 | 品牌能否被想起、进入考虑集合，可以与品牌评价区分。 |
| J. Wesley Hutchinson、Kalyan Raman、Murali K. Mantrala，1994，[Finding Choice Alternatives in Memory: Probability Models of Brand Name Recall](https://journals.sagepub.com/doi/10.1177/002224379403100401) | 出版社题名与书目；此前讨论核对过模型摘要，本次未重读全文 | 为品牌回忆提供概率过程的建模参照。 |
| Prakash Nedungadi、Amitava Chattopadhyay、A. V. Muthukrishnan，2001，[Category structure, brand recall, and choice](https://researchportal.hkust.edu.hk/en/publications/category-structure-brand-recall-and-choice/)，DOI：10.1016/S0167-8116(00)00028-8 | 作者所在大学的摘要与出版记录 | 论文两项研究分别讨论品类结构对品牌回忆及记忆型选择的影响。 |

这些研究支持我们区分检索、评价与选择。它们没有验证本项目的具体权重、候选数量或品类命名实验；原始数据的开放可得性也未由本项目确认。

## S12 · TOM、品牌显著性与品类入口

- Jenni Romaniuk、Byron Sharp，2004。[Conceptualizing and measuring brand salience](https://assets.marketingscience.info/9419.pdf)，*Marketing Theory*，4(4)，327–342，DOI：10.1177/1470593104047643。本次读取了论文文本。
- 支持：单一品类提示下的第一提及不足以概括购买情境中的品牌可提取性；品牌显著性与品牌评价需要区分。
- [Ehrenberg-Bass Institute — Identifying and Prioritising Category Entry Points](https://marketingscience.info/learn-with-us/commercial-research/identifying-and-prioritising-category-entry-points)：本次核对官方定义，用于理解购买情境中的检索线索。这是研究机构的方法说明页。
- [RIES Consulting](https://ries.com/consulting)：本次核对“开创可成为第一的品类”这一策略主张的官方表述。它属于策略倡议，不能作为“命名新品类必然带来默认选择”的因果证据。
- 本项目问题：消费者是否在真实任务中使用该品类线索；被问卷明确提示后的第一提及，与自然任务中的自主提取分别测量。

## S13 · 思考成本与有限认知资源

- Daniel Kahneman，2003。[Maps of Bounded Rationality: Psychology for Behavioral Economics](https://kahneman.scholar.princeton.edu/sites/g/files/toruqf3831/files/kahneman/files/maps_bounded_rationality_dk_2003.pdf)，*American Economic Review*，93(5)，1449–1475，DOI：10.1257/000282803322655392。核对了作者论文版本；对话也以《思考，快与慢》的系统一／系统二作为交流语言。
- Falk Lieder、Thomas L. Griffiths，2020。[Resource-rational analysis: Understanding human cognition as the optimal use of limited computational resources](https://perception.jhu.edu/files/PDFs/20_ResourceRationality/LiederGriffiths_ResourceRationality_BBS.pdf)，*Behavioral and Brain Sciences*，43，e1，DOI：10.1017/S0140525X1900061X。核对了论文定义与摘要。
- 用途：把时间、注意与计算成本放入个体决策的候选机制。系统一／系统二提供处理方式的概括，不能直接作为两个独立脑模块，或固定概率参数使用。
- 尚缺：本项目没有估计“少一秒会少想起几个品牌”的映射，也没有验证 AI 代替消费者比较后的品牌效应。

## S14 · 时间压力与策略压缩：下一步公开数据入口

- Lucy Lai、Samuel J. Gershman，2024。[Human decision making balances reward maximization and policy compression](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1012057)，*PLOS Computational Biology*，20(4)，e1012057，2024-04-26，DOI：10.1371/journal.pcbi.1012057。
- 查阅：已核对论文 Task 3、图 7、模型比较，以及[作者公开代码与数据仓库](https://github.com/lucylai96/simplepolicies)的目录、README 和分析入口。
- 作者报告：相同奖励结构下，将反应窗口由 2 秒缩至 1 秒，会使参与者在某个不适合惯常动作的状态中更常选择该动作。
- 我们准备做的事：只复算这一项对照，检查分母、遗漏反应、被试内比较和结果是否可复现。
- **当前状态：已定位；未下载并清洗原始数据，未复算效应，未拟合模型，未生成本项目结果图。用户已要求暂停。**
- 适用边界：原研究是按键学习任务，不能直接读成“赶时间时某品牌购买率上升多少”。论文比较的模型中，多种策略压缩版本表现接近；也不能据此宣布内部机制已被唯一识别。

## S15 · ABM 如何接受现实检验

- Andrew Collins、Matthew Koehler、Christopher Lynch，2024。[Methods That Support the Validation of Agent-Based Models: An Overview and Discussion](https://www.jasss.org/27/1/11.html)，*Journal of Artificial Societies and Social Simulation*，27(1)，11，DOI：10.18564/jasss.5258。本次核对全文入口、定义与方法概览。
- 用途：区分实现是否符合规格的核验，与模型能否服务于目标现实问题的验证；说明行为研究、经验比较等资料可以支持 ABM 验证。
- 边界：该文没有要求每一个思想实验都先做真人问卷，也没有提供适用于所有项目的统一验证门槛。

## S16 · 真人研究样本量的规划依据

- 方法参照：[statsmodels — samplesize_proportions_2indep_onetail](https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.samplesize_proportions_2indep_onetail.html)。本次核对了函数的正态近似、双侧选项、效应量与样本比例定义。
- 本项目的数值属于**设计计算**：两个独立、等样本组，双侧显著性水平 0.05，功效 0.80，参考比例 0.20，预先选定一个二元结果；没有连续性校正。具体公式与结果见[实验档案](../experiments/index.md)及 S17。
- 这些数值没有来自真实问卷，也不同时保证多品牌比较、子群分析、模型校准与留出验证的功效。20–30 人的小样本可用于检查题目与流程，本项目没有执行这一试测。
- 问卷工具、学生协作与招募只是可用资源；本次没有创建或发布问卷，也没有联系参与者。

## S17 · 对话演示源码与归档计算

- 原稿及离线演示：[交互演示目录与说明](../../artifacts/chat-demos/README.md)。存活原片段与导出版本分开保存，来源和摘要值见该目录的 `provenance.json`。
- 归档计算：[标准库复算脚本](../../scripts/verify_archived_calculations.py)与[结果记录](../../results/archive-calculations.json)。它们用于复核已经讨论过的公式与数值，没有执行 S14 的新研究。
- 证据边界：HTML 保存、公式重算、JavaScript 交互检查、浏览器渲染检查是不同核验动作，以目录内记录的实际完成范围为准。随机抽样按钮可以重新运行，但新抽样不是恢复过去那一次随机结果。
- 旧广告／促销模型只有部分公式和问题记录可恢复；归档不能据此声称完整旧实现已修复。

## S18 · 生成式社会科学与微观到宏观

- Joshua M. Epstein，1999。[Agent-based computational models and generative social science](https://pure.johnshopkins.edu/en/publications/agent-based-computational-models-and-generative-social-science-7/)，*Complexity*，4(5)，41–60。本次核对作者所在大学的出版记录与摘要。
- 用途：以个体规则生成宏观规律，并结合行为研究比较竞争模型，是本项目采用 ABM 的方法来路。
- 边界：生成一种现象不等于唯一识别其真实原因；模拟更多个体，也不会自动补齐错误规则、缺失输入或现实验证。

## S19 · AI 输入能力的事实修正

- [Anthropic 官方 Vision 文档](https://platform.claude.com/docs/en/build-with-claude/vision)，本次核对了图像输入说明。
- 用途：纠正讨论中“所有 LLM Agent 都只能接受文本输入”的表述。多模态输入已经存在；本项目仍需单独定义模拟个体能够接触、保留和调用哪些信息。
- 档案能够持续保存，不代表模型一次可读无限内容，也不代表文本完整保留了人的感官经历。数字档案、可调用记忆与思考预算分别建模。

## 尚待补证的线索

| 线索 | 当前处理 |
| --- | --- |
| 贝恩／秒针具体频次曲线与“3 周、9–16 次” | 留在 S01 行业输入；原图、样本、效果指标与适用范围核定后才能作参数依据。 |
| 某游戏广告成为社交话题、某品牌高频广告引发质疑 | 作为用户观察或机制线索；未核实的媒体出处和品牌争议不发布为事实。 |
| “广告／内容是售前产品”的原始出处 | 保留其在本项目中的解释用途，不给出未经核验的学术归属。 |
| 早期未恢复的实验参数和旧广告模型全部状态流 | 在档案中显式留缺口；不以新构造的演示冒充历史原版。 |
| 拟议问卷和本项目消费者样本外预测 | 尚未实施，没有数据结果可引用。 |
