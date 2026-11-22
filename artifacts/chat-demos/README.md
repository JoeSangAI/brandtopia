# 对话中的交互演示

这里保存找回的 **7 份原始交互演示**，以及可独立打开的导出版本。它们对应不同阶段的合成模型，没有被合并成一个已经验证的消费者模拟系统。

**打开方式：** 下载某个下表中的 HTML 文件，用浏览器打开；也可以下载整个仓库。GitHub 文件页显示源码，不会直接运行交互。导出文件已内嵌所需展示资源，没有发布为线上网站。

| 演示 | 独立文件 | 研究记录 |
| --- | --- | --- |
| 改初始参与者，固定乙先丙后 | [三人参与](three-person-lab.html) | [CHAT-01](../../docs/experiments/archive/01-thresholds-and-identification.md) |
| 随机决定乙、丙的更新顺序 | [随机顺序](three-person-random-order.html) | 同上 |
| 十人各自有 10% 概率临时缺席 | [独立邀约](ten-person-invitation.html) | [CHAT-03](../../docs/experiments/archive/01-thresholds-and-identification.md) |
| 对比独立缺席和全员共同加班 | [共同事件](shared-event-invitation.html) | 同上 |
| 一次干预之后，经历是否降低门槛 | [经历与干预](experience-and-intervention.html) | [CHAT-01](../../docs/experiments/archive/01-thresholds-and-identification.md) |
| 停运天数、回流速度与长期缺口 | [路线恢复](commute-recovery-curves.html) | [CHAT-04](../../docs/experiments/archive/02-routes-and-path-dependence.md) |
| 固定品牌评价，只改变当前任务 | [任务与品牌选择](task-conditioned-choice.html) | [CHAT-17](../../docs/experiments/archive/07-tasks-and-brand-retrieval.md) |

## 原稿与导出版本

[fragments](fragments/) 保存对话中找回的 HTML 片段，字节保持原样。这些片段依赖原展示环境的样式，供追溯和再编辑使用。上表中的完整 HTML 由同一原稿导出，未改动实验规则。

[provenance.json](provenance.json)记录原稿与导出文件的 SHA-256、标题及归档日期。2026-11-22 是此次保存日期；不能据此推定这些实验都在同一天讨论。

## 核验范围

本次确认了七份原稿完整复制、导出文档包含对应原稿、文件内脚本可以通过语法检查。关键计算另以[标准库脚本](../../scripts/verify_archived_calculations.py)复核，结果见[归档计算](../../results/archive-calculations.json)。

原稿先前的演示与本次导出分别记录；本次没有重新完成所有导出页面的浏览器交互及多尺寸视觉审查。运行模型的解释范围以对应研究档案为准。

## 使用时记住的区别

- 随机顺序和随机邀约使用浏览器随机数。每次重新运行会得到新序列；过去点击时产生的具体序列没有被恢复。
- 三人实验允许退出，ABM-001 的知晓一旦发生就持续。它们不是同一套更新规则。
- 路线曲线来自人为设定的期望公式，没有使用伦敦乘客数据。
- 任务演示输出的是“已经决定从 A、B 中购买”条件下的选择概率，没有“不买”选项，也不代表市场购买率。
- 旧广告/补贴界面的完整源码尚未恢复。相关结果和发现的问题保存在[价格与留存档案](../../docs/experiments/archive/03-price-advertising-and-retention.md)，没有用新写的页面替代旧稿。
