# 不正经维度的消费行为预测实验 · v0.1

本版是同屏主持式网页原型。持有 [聊聊你喜欢的事 · 线上试用](https://brandtopia-chat-taste.ready-slug-6322.chatgpt.site) 链接即可用访客身份试用。[本机试用](http://127.0.0.1:47623/) 需先启动服务。[HTML 汇报](设计与汇报/汇报.html) 含开发与验收记录，以及单独的 [开发后思考](设计与汇报/汇报.html#post-prototype)。[版本设计](设计与汇报/设计文档.md) 记录本版规则和主持人准备。

## 本机运行

在版本目录用 PowerShell 执行以下命令。运行环境为 Node.js 22，本版服务监听本机 `127.0.0.1:47623`。

```powershell
.\原型\启动.ps1 -TokenDance
```

启动时可在终端遮蔽输入完整 TokenDance API Key，也可从进程环境变量 `TOKENDANCE_API_KEY` 读取。真实模式固定调用 `deepseek-v4.1-flash-1017`。以 `Ctrl+C` 停止服务。

```powershell
.\原型\启动.ps1
```

无参数时使用固定示例画像和示例分数，供演示整条流程。真实记录、演示记录和验收记录按运行模式保存在 [原型源码目录](原型/) 的本地 `.runtime/` 下。

使用 ChatGPT Sites 自行部署时，先创建自己的站点，在 `原型/.openai/hosting.json` 设置该站点的 `project_id`，再从 `原型` 目录运行 `node build-hosted.mjs`。在站点服务端设置自己的 `TOKENDANCE_API_KEY` Secret。线上场次从创建起可读取两小时，由本场访客会话或发起场次的账号访问。详细的暂存规则见 [版本设计](设计与汇报/设计文档.md)。

## 开始前

主持人可查看 [事实白描与记录边界](设计与汇报/设计文档.md)。商品资料取自样稿的 [十件示例商品](原型/示例商品.json)。输入题干采用样稿三档，按东西本身表态。正式试验前由实验负责人确认品项和量表。

[测试访谈](../测试/测试访谈-四组话题与意外细节.txt) 是虚构输入，可整段粘贴到闲聊记录。[独立预测](../测试/我的预测-十件商品.md) 按页面商品顺序列出十项估计，供与 DeepSeek 对照。

[原型项目目录](../README.md) · [版本仓库目录](https://github.com/JoeSangAI/brandtopia/tree/main/%E5%8E%9F%E5%9E%8B%E8%AE%BE%E8%AE%A1/%E4%B8%8D%E6%AD%A3%E7%BB%8F%E7%BB%B4%E5%BA%A6%E7%9A%84%E6%B6%88%E8%B4%B9%E8%A1%8C%E4%B8%BA%E9%A2%84%E6%B5%8B%E5%AE%9E%E9%AA%8C/v0.1) · [仓库协作约定](../../../docs/governance/contributing.md) · [TokenDance 接入文档](https://tokendance.space/docs/ai-integration.md)
