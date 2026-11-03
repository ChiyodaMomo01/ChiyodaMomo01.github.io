import type { BlogPost } from "../blogTypes";
import { thinking3Metadata } from "../blogIndex";

export const oceanHybridThinking3: BlogPost = {
  ...thinking3Metadata,
  "content": {
    "zh": [
      {
        "type": "paragraph",
        "text": "在上一篇学习笔记中，我们结合 **NeuralPOM** 讨论了如何把三维普林斯顿海洋模式（POM）重构为可微动力框架，并通过受守恒与蛙跳时间层约束的状态更新接口实现 100 天全状态海洋预报。当我们真正把神经网络放进这个三维原始方程循环里开始训练和高频耦合时，两个在简化模型中很少显露的问题很快浮出了水面。"
      },
      {
        "type": "paragraph",
        "text": "第一个问题关乎训练方式。在系列第一篇笔记里，我们曾写出在线多步训练的损失函数，直觉上认为只要物理模式支持自动微分，把未来多步误差沿时间反向传播就能解决离线模型接入动力系统后的漂移[1–4]。但在三维原始方程模式里，单步离线训练一旦进入闭环就会遭遇轨迹分布偏移[2,5]，而直接跨越几百个时间步展开反向传播又受限于显存开销与混沌敏感度。更值得追问的是：多步在线训练带来的性能提升，究竟是因为梯度真正穿过了可微物理求解器，还是仅仅因为网络在训练时见到了多步滚动后的状态样本[6,7]？"
      },
      {
        "type": "paragraph",
        "text": "第二个问题关乎高频耦合中的热力学—动力学反馈。当我们把状态更新频率从每天一次（$\\Delta=1\\text{ day}$）加密到每小时一次（$\\Delta=1\\text{ h}$）以强化对流场和海表高度的引导时，位温 $T$ 与盐度 $S$ 作为主动热力学变量，其微小残差会通过非线性状态方程转化为局地密度异常[8]，在流场完成地转调整之前持续激发虚假的斜压压强梯度并扰动垂向混合[9]。作为系列笔记的第三篇，我们将围绕这两个问题，分享分阶段训练流程的设计思路、三路线受控消融给出的物理边界，以及利用**密度法向阻尼（DND）**控制斜压反馈的机制验证。"
      },
      {
        "type": "heading",
        "text": "为什么离线训练不够：三阶段训练流程的机制分工"
      },
      {
        "type": "paragraph",
        "text": "在三维原始方程海洋模式中，每一次状态更新都会改变后续物理积分访问的相空间轨迹。如果我们只用离线单步目标训练神经网络，网络学到的是如何最小化单步残差，却完全不知道这次修正会在几个时间步之后激发出怎样的重力波或涡旋偏移；反过来，如果从随机初始化开始直接在长时效闭环轨迹上训练，早期不成熟的修正很容易在几十步内把物理模式推向数值发散。"
      },
      {
        "type": "paragraph",
        "text": "为此，我们在 NeuralPOM 中设计了沿时间视界循序渐进的**分阶段训练流程**——依次推进离线单步预训练（Pretrain）、跨求解器四步可微训练（Midtrain）与 10 天闭环滚动训练（Posttrain）。在每个计分步，物理引导端点损失 $\\ell(x,y)$ 不仅度量水平流速 $(u,v)$、位温 $T$ 和盐度 $S$ 的体积加权均方误差，还加入了静力斜压压强梯度一致性项、水平锋面梯度项以及海表高度 $\\eta$ 项，以约束修正后的热力学与动力学平衡。"
      },
      {
        "type": "paragraph",
        "text": "前两个阶段分别解决“起步映射”与“短时跨步动力响应”。在第一阶段**单步预训练（Pretrain）**中，网络输出层初始化为零（从恒等映射平滑起步），在离线缓存的单步物理预报终点 $x_1^-=\\mathcal{P}^\\Delta(x_0)$ 上优化单步损失；到了第二阶段**多步可微训练（Midtrain）**，模型在保留于自动微分计算图内的三个在线物理积分区间 $\\mathcal{P}^\\Delta$ 上连续展开四次校正（逐日耦合跨越 4 天，逐时耦合跨越 4 小时）："
      },
      {
        "type": "equation",
        "text": "J_{\\mathrm{pre}}(\\theta)=\\mathbb E\\bigl[\\ell\\bigl(\\mathcal K_\\theta(x_1^-),\\,y_1\\bigr)\\bigr],\\qquad J_{\\mathrm{mid}}(\\theta)=\\frac{1}{4}\\sum_{j=1}^{4}\\ell\\bigl(\\mathcal K_\\theta(\\mathcal P^\\Delta(x_{j-1}^+)),\\,y_j\\bigr)."
      },
      {
        "type": "paragraph",
        "text": "在 Midtrain 期间，后续时刻的流速、温盐乃至海表高度误差都会穿过可微原始方程算子 $\\mathcal{P}^\\Delta$ 反向回传。正如我们在第二篇笔记中提到的，状态更新算子 $\\mathcal{K}_\\theta$ 从不直接修改自由面高度 $\\eta$；唯有通过 Midtrain 的跨求解器反向传播，后续时刻的海面高度误差才能沿着线性化原始方程约束前序时刻的内部斜压切变与温盐更新。"
      },
      {
        "type": "paragraph",
        "text": "为了进一步抑制数周以上的累积轨迹漂移、同时避开长视界反向传播的显存瓶颈，第三阶段**闭环滚动训练（Posttrain）**将模型放入连续 10 天的自回归闭环轨迹中。记每天包含的耦合步数为 $K=1\\text{ day}/\\Delta$（逐日耦合 $K=1$，逐时耦合 $K=24$），算子 $\\operatorname{sg}(\\cdot)$ 表示截断梯度的 stop-gradient 操作。在每一天内部，前 $K-1$ 个循环以纯前向方式滚动演化，并在每次神经更新前截断物理状态梯度，仅在每天结束时（$k=K$）对照当日参考场 $y_d$ 更新一次网络参数："
      },
      {
        "type": "equation",
        "text": "x_{d,k}^-=\\mathcal P^\\Delta(x_{d,k-1}^+),\\qquad x_{d,k}^+=\\mathcal K_\\theta\\bigl(\\operatorname{sg}(x_{d,k}^-)\\bigr),\\qquad J_{\\mathrm{post},d}(\\theta)=\\ell(x_{d,K}^+,y_d)."
      },
      {
        "type": "paragraph",
        "text": "这种设计让校正器在训练阶段真实经历了长达 10 天（逐时耦合下达 240 个循环）的闭环状态分布，同时将单次反向传播的计算图严格控制在单个耦合步以内。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/forecast_skill.png",
        "width": 2614,
        "height": 1574,
        "alt": "不同训练阶段与耦合间隔下的百日预报技巧演变",
        "caption": "图 1：不同训练阶段与耦合间隔下的 100 天预报技巧。（a）以 DND 部署的全部 12 种混合配置（2 套动力框架 × 2 种耦合间隔 × 3 个训练阶段）在 16 个测试起报日上的 100 天预报变量 $(u,v,\\mathrm{SSH},T,S)$ RMSE 相对于同框架粗网格 Smagorinsky 基线的百分比变化。（b）对应的 100 天状态方程诊断密度 $\\rho$ RMSE 百分比变化。负值（蓝绿色）表示优于 Smagorinsky 物理基线；Imp 与 Exp 分别代表半隐式与显式模态分裂动力框架。来源：[NeuralPOM 论文图 3](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "观察图 1 中三个训练阶段在 100 天预报上的演进轨迹，可以看到一个非常有趣的对比。在低频逐日耦合（$1\\text{ d}$）下，4 步 Midtrain 覆盖了 4 天的天气尺度窗口，Midtrain 与 10 天 Posttrain 沿着同一方向稳步压低所有变量的百日误差。但在高频逐时耦合（$1\\text{ h}$）下，4 步 Midtrain 只覆盖了短短 4 个小时：在这个短窗口上做多步优化虽然降低了盐度 $S$ 误差，却在短期内激发出了过强的涡旋能量，导致流速 $(u,v)$、海表高度和位温 $T$ 的 100 天误差相对于 Pretrain 反而出现暂时回升；直到接入跨越 240 个逐时循环的 10 天闭环 Posttrain 后，跨日累积的过剩能量才被彻底驯服，全变量 100 天误差较 Midtrain 下降了 17%–33%，最终在流速与海表高度上取得了全系最佳表现。"
      },
      {
        "type": "heading",
        "text": "跨物理求解器的梯度究竟在什么时候不可或缺"
      },
      {
        "type": "paragraph",
        "text": "做完三阶段训练后，我们自己心里其实一直有一个疑问：既然最后都要经过截断物理梯度的 10 天闭环 Posttrain，那么在中间阶段大费周章让梯度穿过可微原始方程求解器 $\\mathcal{P}^\\Delta$，究竟是不是必须的？换句话说，Midtrain 的作用到底来自**穿过物理求解器的真实梯度**，还是仅仅因为网络多见到了几步滚动后的状态样本？"
      },
      {
        "type": "paragraph",
        "text": "为了把这个因果关系彻底剥离清楚，我们在严格相同的优化器更新步数预算下，设计了三条受控训练路线（表 1）："
      },
      {
        "type": "paragraph",
        "text": "第一条是**完整三阶段路线（Full：$\\text{Pretrain}\\to\\text{Midtrain}\\to\\text{Posttrain}$）**，在 Midtrain 中保留穿过可微物理求解器 $\\mathcal{P}^\\Delta$ 的完整梯度；"
      },
      {
        "type": "paragraph",
        "text": "第二条是**跳过中间阶段路线（Skip：$\\text{Pretrain}\\to\\text{Posttrain}$）**，直接把相同的总更新步数全部投入闭环 Posttrain；"
      },
      {
        "type": "paragraph",
        "text": "第三条是**截断物理梯度路线（Detached：$\\text{Pretrain}\\to\\text{Midtrain}_{\\text{detached}}\\to\\text{Posttrain}$）**，在中间阶段跑与 Full 完全相同的 4 步前向轨迹，但在每个物理区间 $\\mathcal{P}^\\Delta$ 入口处用 $\\operatorname{sg}(\\cdot)$ 截断梯度，让网络只看滚动状态而不拿跨物理步的梯度。"
      },
      {
        "type": "table",
        "headers": [
          "动力框架",
          "间隔 $\\Delta$",
          "阶段转换与受控路线对比",
          "$u$",
          "$v$",
          "$\\mathrm{SSH}$",
          "$T$",
          "$S$"
        ],
        "rows": [
          [
            "Implicit",
            "$1\\text{ d}$",
            "Mid / Pre ($\\Delta\\%$)",
            "−3.47",
            "−2.33",
            "−4.62",
            "−3.28",
            "−4.66"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "+0.19",
            "+0.15",
            "−0.04",
            "−2.07",
            "−1.49"
          ],
          [
            "",
            "",
            "Full vs. Skip (% 增益)",
            "+0.09",
            "+0.72",
            "+0.39",
            "+0.21",
            "+0.34"
          ],
          [
            "",
            "",
            "Full vs. Detached (% 增益)",
            "−0.38",
            "+0.06",
            "−0.20",
            "−0.13",
            "−0.10"
          ],
          [
            "Explicit",
            "$1\\text{ d}$",
            "Mid / Pre ($\\Delta\\%$)",
            "−0.56",
            "−2.28",
            "−1.66",
            "+0.63",
            "−3.38"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "−4.12",
            "−1.90",
            "−5.50",
            "−8.39",
            "−4.46"
          ],
          [
            "",
            "",
            "Full vs. Skip (% 增益)",
            "+0.29",
            "+0.10",
            "+0.33",
            "+0.33",
            "+0.87"
          ],
          [
            "",
            "",
            "Full vs. Detached (% 增益)",
            "−0.74",
            "−0.54",
            "−1.05",
            "−0.85",
            "−0.40"
          ],
          [
            "Implicit",
            "$1\\text{ h}$",
            "Mid / Pre ($\\Delta\\%$)",
            "+8.39",
            "+7.74",
            "+17.02",
            "+18.70",
            "−15.98"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "−24.55",
            "−22.23",
            "−29.18",
            "−32.63",
            "−23.28"
          ],
          [
            "",
            "",
            "Full vs. Skip (% 增益)",
            "−1.58",
            "−1.59",
            "−3.71",
            "+1.02",
            "+3.58"
          ],
          [
            "",
            "",
            "Full vs. Detached (% 增益)",
            "+0.06",
            "+0.39",
            "−1.82",
            "+0.96",
            "+9.71"
          ],
          [
            "**Explicit**",
            "**$1\\text{ h}$**",
            "**Mid / Pre ($\\Delta\\%$)**",
            "**+12.35**",
            "**+10.60**",
            "**+18.87**",
            "**+19.36**",
            "**−4.35**"
          ],
          [
            "",
            "",
            "**Post / Mid ($\\Delta\\%$)**",
            "**−24.00**",
            "**−23.02**",
            "**−28.21**",
            "**−29.17**",
            "**−17.22**"
          ],
          [
            "",
            "",
            "**Full vs. Skip (% 增益)**",
            "**+3.23**",
            "**+2.67**",
            "**+3.46**",
            "**+8.42**",
            "**+41.15**"
          ],
          [
            "",
            "",
            "**Full vs. Detached (% 增益)**",
            "**+4.66**",
            "**+4.88**",
            "**+5.09**",
            "**+8.80**",
            "**+38.75**"
          ]
        ],
        "caption": "表 1：DND 部署下分阶段训练演进与三路线受控消融（16 个测试起报日汇总的 100 天 RMSE）。Mid/Pre 与 Post/Mid 给出相邻阶段间的 100 天 RMSE 百分比变化（负值代表后一阶段误差降低）；Full vs. Skip 与 Full vs. Detached 给出相同更新预算下完整路线相对于两条对照路线的 100 天 RMSE 相对降幅，正值代表保留跨求解器梯度的 Full 路线更优。来源：[NeuralPOM 论文表 4](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "表 1 的结果给了我们一个非常诚实、也很有启发性的答案：**跨物理求解器的梯度是否有必要，取决于耦合间隔 $\\Delta$ 与动力框架的时间尺度关系。**"
      },
      {
        "type": "paragraph",
        "text": "在**低频逐日耦合（$\\Delta=1\\text{ d}$）**下，相邻两次状态更新之间隔着整整 24 小时的自由物理积分，求解器自身有充足的时间去频散和耗散单次更新带来的短时冲击。此时 10 天闭环 Posttrain 已经足够稳住长期轨迹，Full、Skip 与 Detached 三条路线的 100 天误差差异全部在 1% 以内。"
      },
      {
        "type": "paragraph",
        "text": "但在**高频逐时耦合（$\\Delta=1\\text{ h}$）**下，情况完全不同。神经网络每隔 6 个斜压步就要再次介入流场，上一次更新激起的短时波动还没来得及平息，就会直接成为下一次更新的输入背景。特别是在每个斜压步内通过 30 个正压子步显式推进快速外重力波的**显式模态分裂动力框架（Explicit，$1\\text{ h}$）**中，只看多步轨迹却截断物理梯度的 Detached 路线相对于 Skip 几乎没有任何帮助；唯有保留穿过可微求解器的真实梯度（Full），才能让校正器学会抑制跨步的正压—斜压失衡与温盐漂移，将 100 天流速 $(u,v)$ 与海表高度误差进一步降低 3%–5%、位温 $T$ 误差降低 8%–9%、盐度 $S$ 误差降低约 40%（图 2）。而在前向积分时已通过隐式椭圆求解滤除快速外重力波的半隐式框架（Implicit，$1\\text{ h}$）中，跨求解器梯度主要在温盐保持上带来温和增益。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/forecast_tracer_curves.png",
        "width": 2472,
        "height": 2440,
        "alt": "100天位温与盐度逐日均方根误差演变曲线",
        "caption": "图 2：100 天预报期内位温 $T$ 与盐度 $S$ 逐日 RMSE 演变曲线。各面板给出四种混合配置（Implicit 逐时 a,b、Implicit 逐日 c,d、Explicit 逐时 e,f、Explicit 逐日 g,h）下采用 DND 部署的 NeuralPOM（深蓝实线）同三种粗网格物理闭合基线在 16 个测试起报日上的逐日汇总误差。来源：[NeuralPOM 论文图 7](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "heading",
        "text": "高频耦合中的温盐–斜压反馈与密度法向阻尼"
      },
      {
        "type": "paragraph",
        "text": "在解决了训练路线问题之后，我们还遇到了一个更具海洋动力学色彩的挑战：在低频逐日耦合（$\\Delta=1\\text{ d}$）下，直接把经过层均值守恒投影的温盐增量加回模式（无阻尼更新 Undamped），五个预报变量的 100 天误差都能顺畅下降 5%–16%；但把完全相同的无阻尼更新规则放到高频逐时耦合（$\\Delta=1\\text{ h}$）下，100 天盐度 $S$ 误差却会比不加修正的物理模式高出 59%–91%。为什么同样大小的单步温盐修正，每天做一次效果很好，每小时做一次却会破坏温盐结构？"
      },
      {
        "type": "paragraph",
        "text": "顺着控制方程往深处查，原因出在位温 $T$ 与盐度 $S$ 的**主动热力学属性**上[8,9]。在三维原始方程中，$T$ 和 $S$ 不是随波逐流的被动标量，它们每时每刻都在通过非线性状态方程 $\\rho(T,S,P)$ 决定海水密度。哪怕神经网络在单个时间步上压低了 $T$ 和 $S$ 各自的逐点误差，两个变量增量 $(\\delta T,\\delta S)$ 之间只要存在一点没有协调好的小尺度残差，就会在一阶近似下合成出局地海水密度异常 $\\delta\\rho$，并通过静力关系转化为斜压压强梯度异常："
      },
      {
        "type": "equation",
        "text": "\\delta\\rho\\approx\\left(\\frac{\\partial\\rho}{\\partial T}\\right)_{S,P}\\delta T+\\left(\\frac{\\partial\\rho}{\\partial S}\\right)_{T,P}\\delta S,\\qquad\\partial_z p=-g\\rho."
      },
      {
        "type": "paragraph",
        "text": "这个密度异常 $\\delta\\rho$ 一旦进入物理模式，就会沿着两条通道反馈给后续流场：在水平方向上，密度异常的水平梯度 $\\nabla_h\\delta\\rho$ 直接变成虚假的静力斜压压强梯度力，激发近网格尺度的非地转流；在垂向方向上，密度异常的垂向梯度 $-\\partial_z\\delta\\rho$ 会扰动 Mellor–Yamada 湍流闭合中的浮力层结，改变水柱的垂向粘性与扩散系数。当耦合间隔是 $24\\text{ h}$ 的时候，物理求解器有充足的时间通过地转调整把这些瞬态密度毛刺消化掉；而当耦合间隔缩短到 $1\\text{ h}$，流场还没来得及完成地转调整，下一轮密度扰动又叠加了进来，最终造成近网格动能堆积和垂向温盐廓线漂移。"
      },
      {
        "type": "paragraph",
        "text": "理解了这一物理机制，解决思路也就自然清晰了：我们不需要一刀切地把所有温盐修正都砍小，而是应该把**改变密度的修正**和**不改变密度的修正**区分开来。"
      },
      {
        "type": "paragraph",
        "text": "在海洋学中，沿着等密度面进行的温盐调整（比如暖咸水与冷淡水按比例相互补偿，一阶近似下 $\\delta\\rho\\approx 0$）用来修正水团属性，不会激起斜压压强梯度冲击；真正激发非地转冲击的，是垂直于等密度面、直接改变海水密度的跨等密面（diapycnal）分量。因此，在每个活跃 $\\sigma$ 层内，我们在保持逐层热盐均值守恒的前提下，利用局地状态方程密度梯度构造了体积加权正交投影算子 $E$，将任意标准化温盐增量 $z$ 正交拆解为两部分：一是改变密度的**跨等密面分量 $Ez$**，二是不改变密度的**等密面密度补偿分量 $(I-E)z$**。对改变密度的分量乘以缩放因子 $c\\in[0,1]$，即可得到滤波后的更新 $z_c$ 及其能量关系："
      },
      {
        "type": "equation",
        "text": "z_c=(I-E)z+cEz,\\qquad\\|z_c\\|_w^2=\\|z\\|_w^2-(1-c^2)\\|Ez\\|_w^2."
      },
      {
        "type": "paragraph",
        "text": "在 NeuralPOM 中，我们将取 $c=3/4$ 的更新规则定义为**密度法向阻尼（Density-Normal Damping，DND）**。根据上式的正交勾股关系，把改变密度的分量在幅度上衰减 $25\\%$（$c=3/4$），就能把改变密度的平方范数 $\\|Ez\\|_w^2$——以及由此直接驱动的线性化斜压压强梯度扰动能量——削减 $1-(3/4)^2=43.75\\%$，同时 **100% 完整保留**沿等密面的水团修正 $(I-E)z$，并且严丝合缝地维持每个 $\\sigma$ 层的热量与盐量守恒。"
      },
      {
        "type": "heading",
        "text": "从 72 小时单次扰动到百日闭环的因果验证"
      },
      {
        "type": "paragraph",
        "text": "为了严格证明预报稳定性的提升确实源于“压住了改变密度的方向”，而不是因为“把温盐增量整体缩小了一点”，我们设计了两步递进的受控实验。"
      },
      {
        "type": "paragraph",
        "text": "第一步是**36 状态 72 小时单次扰动物理传播实验**（图 3）。我们从混合预报轨迹上取出 36 个校正前状态，在 $t=0$ 时刻只调用一次神经网络：四个平行分支施加完全相同的速度更新，而在温盐更新上分别采用完全不更新温盐（no-TS）、无阻尼更新（Undamped，$c=1$）、与 DND 平均增量范数 $\\|z_c\\|_w$ 严格相等的各向同性均匀缩放（Uniform，把整个温盐增量乘以常数 $\\kappa\\approx 0.90\\text{–}0.93$），以及密度法向阻尼（DND，$c=3/4$）。随后在 $0<t\\le 72\\text{ h}$ 期间，我们**彻底关掉神经网络**，只用纯物理原始方程求解器向前自由积分 72 小时，干净地观察这一次温盐修正在物理方程内部激起的涟漪。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/prediction_response.png",
        "width": 2472,
        "height": 976,
        "alt": "36个预报状态上的单次扰动物理响应与72小时自由物理传播",
        "caption": "图 3：36 个校正前状态上的单次扰动物理响应与 72 小时自由物理传播。（a）$t=0$ 时刻 DND（深蓝）与同范数 Uniform 均匀缩放（浅棕）相对于 Undamped 的瞬时斜压压强梯度倾向均方误差（MSE）百分比变化（虚线为线性化理论值 $-43.75\\%$）。（b）随后 72 小时纯物理积分中，Undamped 相对于不更新温盐（no-TS）的水平流速 RMSE 百分比变化（棕线为逐时模型，青线为逐日模型）。（c）两个逐时模型中 DND 与同范数 Uniform 相对于 Undamped 的水平流速 RMSE 百分比变化。来源：[NeuralPOM 论文图 5](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "图 3 把整个物理因果链条展现得非常直观。在 $t=0$ 刚做完状态更新的瞬间（图 3a），DND 将瞬时斜压压强梯度倾向均方误差降低了 44%–46%，与理论推导的 $43.75\\%$ 高度吻合，降幅达到同范数 Uniform 缩放（13%–18%）的约三倍。而在随后 72 小时的纯物理演化中（图 3b），逐日模型（青线）在经历最初几小时的调整后，温盐更新在 24–72 小时开始帮助降低流速误差；但逐时模型（棕线）里的单次无阻尼温盐更新却激起了非地转扰动，使流速误差在 72 小时内一直高于完全不更新温盐的 no-TS 分支。此时改用 DND（图 3c），便能在整个 72 小时窗口内有效压低这部分由温盐扰动诱发的流速误差。"
      },
      {
        "type": "paragraph",
        "text": "第二步是**冻结网络权重下的 100 天闭环测试**（图 4）。我们在 16 个测试起报日的 100 天逐时闭环积分中，用同一个训练好的网络对比 Undamped、同范数 Uniform 与 DND。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/retention_theory.png",
        "width": 2472,
        "height": 1039,
        "alt": "逐时耦合下DND与范数匹配Uniform的100天闭环验证",
        "caption": "图 4：高频逐时耦合下方向性阻尼（DND）与范数匹配均匀缩放（Uniform）的 100 天闭环验证（冻结相同网络权重）。（a）相对于 Undamped 的 100 天全变量与诊断密度 $\\rho$ RMSE 百分比变化。（b）预报后期（第 51–100 天）三种规则下的近网格水平速度能量比 $R_{\\text{near-grid}}$（左，虚线标出细网格参考标准 $R=1$）与全谱位相对齐度 $A$（右）。来源：[NeuralPOM 论文图 6](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "经过 100 天、2,400 次逐小时循环的闭环累积，单步的方向性差异转化成了悬殊的长期表现（图 4a）：相对于 Undamped，DND 将水平流速 $(u,v)$ 与海表高度的 100 天 RMSE 降低了 5%–9%，位温 $T$ 误差降低 12%–13%，盐度 $S$ 误差降低 38%–43%，诊断密度 $\\rho$ 误差降低 9%–10%——所有变量的误差降幅均达到同范数 Uniform 均匀缩放的 **4 至 8 倍**。更关键的是，这三种规则用的是同一个网络、施加了完全相同的速度更新，且都不直接修改自由面高度 $\\eta$；因此，流速与海表高度的改善完全来自阻断了温盐密度异常 $\\delta\\rho$ 向动量场和垂向混合的虚假反馈。图 4b 的后期波数谱也证实，DND 消除了 Undamped 下虚假堆积的近网格动能（将近网格能量比 $R_{\\text{near-grid}}$ 从 $1.83\\text{–}2.26$ 拉回至物理一致的 $1.03\\text{–}1.13$），并同步提升了全谱涡旋位相对齐度 $A$。"
      },
      {
        "type": "paragraph",
        "text": "写到这里，回顾整个 NeuralPOM 项目的探索过程，我们越来越强烈地感受到人工智能海洋建模与传统物理海洋学、资料同化之间的深层共鸣。在业务化海洋资料同化中，直接把温盐分析增量塞进原始方程模式同样会激起虚假的重力波与对流失稳，前辈学者为此发展出了增量分析更新（IAU）[10]与切线性热成风、密度平衡约束。今天当我们用深度神经网络去做高频在线状态修正时，底层的流体力学规律依然在起作用：分阶段可微与闭环训练让神经网络学会适应原始方程的跨步演化，而密度法向阻尼（DND）则像一把精准的物理手术刀，在守住逐层热盐守恒与等密面水团修正 $(I-E)z$ 的同时，滤除了跨等密面的斜压冲击 $Ez$。当前工作仍建立在零海表浮力通量的理想化双涡旋海盆之上；将这套可微原始方程动力框架、分阶段训练方法与方向性守恒更新接口推向真实区域与全球业务化海洋预测系统，将是我们下一阶段继续努力的目标。"
      },
      {
        "type": "heading",
        "text": "参考资料"
      },
      {
        "type": "references",
        "items": [
          "Rasp, S., Pritchard, M. S., & Gentine, P. (2018). Deep learning to represent subgrid processes in climate models. *Proceedings of the National Academy of Sciences*, 115(39), 9684–9689. https://doi.org/10.1073/pnas.1810286115",
          "Ross, A., Li, Z., Perezhogin, P., Fernandez-Granda, C., & Zanna, L. (2023). Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model. *Journal of Advances in Modeling Earth Systems*, 15(1), e2022MS003258. https://doi.org/10.1029/2022MS003258",
          "Frezat, H., Le Sommer, J., Fablet, R., Balarac, G., & Lguensat, R. (2022). A Posteriori Learning for Quasi-Geostrophic Turbulence Parametrization. *Journal of Advances in Modeling Earth Systems*, 14(11), e2022MS003124. https://doi.org/10.1029/2022MS003124",
          "Shen, C., Appling, A. P., Gentine, P., et al. (2023). Differentiable programming for Earth system modeling. *Geoscientific Model Development*, 16(11), 3123–3147. https://doi.org/10.5194/gmd-16-3123-2023",
          "Ouala, S., Chapron, B., Collard, F., Gaultier, L., & Fablet, R. (2024). Online calibration of deep learning sub-models for hybrid numerical modeling systems. *Communications Physics*, 7(1), 402. https://doi.org/10.1038/s42005-024-01880-7",
          "List, B., Chen, L.-W., Bali, K., & Thuerey, N. (2025). Differentiability in unrolled training of neural physics simulators on transient dynamics. *Computer Methods in Applied Mechanics and Engineering*, 433, 117441. https://doi.org/10.1016/j.cma.2024.117441",
          "Yan, F. E., Frezat, H., Le Sommer, J., Mak, J., & Otness, K. (2025). Adjoint-Based Online Learning of Two-Layer Quasi-Geostrophic Baroclinic Turbulence. *Journal of Advances in Modeling Earth Systems*, 17(7), e2024MS004857. https://doi.org/10.1029/2024MS004857",
          "Mellor, G. L. (1991). An Equation of State for Numerical Models of Oceans and Estuaries. *Journal of Atmospheric and Oceanic Technology*, 8(4), 609–611. https://doi.org/10.1175/1520-0426(1991)008<0609:AEOSFN>2.0.CO;2",
          "Mellor, G. L., & Yamada, T. (1982). Development of a turbulence closure model for geophysical fluid problems. *Reviews of Geophysics*, 20(4), 851–875. https://doi.org/10.1029/RG020i004p00851",
          "Bloom, S. C., Takacs, L. L., da Silva, A. M., & Ledvina, D. (1996). Data assimilation using incremental analysis updates. *Monthly Weather Review*, 124(6), 1256–1271. https://doi.org/10.1175/1520-0493(1996)124<1256:DAUIAU>2.0.CO;2"
        ]
      }
    ],
    "en": [
      {
        "type": "paragraph",
        "text": "In the previous note, we used **NeuralPOM** to discuss how to rebuild the three-dimensional Princeton Ocean Model (POM) as a differentiable dynamical framework. A state-update interface constrained by conservation and leapfrog time-level consistency enabled 100-day full-state ocean forecasts. Once we began training and coupling a neural network at high frequency inside this three-dimensional primitive-equation cycle, two issues that are less apparent in simplified models quickly emerged."
      },
      {
        "type": "paragraph",
        "text": "The first concerns training. In the first note, we wrote down an online multi-step loss and suggested that, if the physical model supports automatic differentiation, backpropagating future errors through time should address the drift encountered when offline models enter a dynamical system [1–4]. In three-dimensional primitive-equation models, however, offline single-step training encounters trajectory-distribution shift once the loop is closed [2,5], while unrolling hundreds of time steps is limited by memory and chaotic sensitivity. This raises a more specific question: do gains from online multi-step training come from gradients actually passing through the physical solver, or simply from exposing the network to states generated by multi-step rollouts [6,7]?"
      },
      {
        "type": "paragraph",
        "text": "The second concerns thermodynamic–dynamical feedback under frequent coupling. To strengthen the correction of flow and sea-surface height, we increased the state-update frequency from once daily ($\\Delta=1\\text{ day}$) to once hourly ($\\Delta=1\\text{ h}$). Potential temperature $T$ and salinity $S$ are active thermodynamic variables: small residuals can become local density anomalies through the nonlinear equation of state [8]. Before geostrophic adjustment is complete, these anomalies can repeatedly excite spurious baroclinic pressure gradients and disturb vertical mixing [9]. This third note examines the staged training design, the conditions identified by three controlled training routes, and the mechanism by which **Density-Normal Damping (DND)** controls baroclinic feedback."
      },
      {
        "type": "heading",
        "text": "Why offline training is insufficient: the roles of three training stages"
      },
      {
        "type": "paragraph",
        "text": "In a three-dimensional primitive-equation ocean model, every state update changes the phase-space trajectory visited by subsequent physical integration. A network trained only against an offline single-step target learns to reduce that residual without seeing the gravity waves or eddy displacement its correction may excite several steps later. Conversely, starting long closed-loop training from a random initialization can allow immature corrections to push the physical model toward numerical divergence within dozens of steps."
      },
      {
        "type": "paragraph",
        "text": "We therefore designed a **staged training procedure** that gradually extends the time horizon: offline single-step pretraining (Pretrain), four-step differentiable training through the solver (Midtrain), and 10-day closed-loop training (Posttrain). At each scored endpoint, the physics-guided loss $\\ell(x,y)$ measures volume-weighted MSE in horizontal velocity $(u,v)$, potential temperature $T$, and salinity $S$. It also includes hydrostatic baroclinic pressure-gradient consistency, horizontal frontal gradients, and sea-surface elevation $\\eta$, constraining the thermodynamic and dynamical balance after correction."
      },
      {
        "type": "paragraph",
        "text": "The first two stages learn the initial correction map and its short-term dynamical response across steps. During **single-step pretraining (Pretrain)**, the network's output layer is initialized to zero, starting smoothly from the identity map. We optimize a single-step loss at the cached physical endpoint $x_1^-=\\mathcal{P}^\\Delta(x_0)$. During **multi-step differentiable training (Midtrain)**, four corrections are unrolled across three online physical intervals $\\mathcal{P}^\\Delta$ retained in the automatic-differentiation graph. Daily coupling spans 4 days, and hourly coupling spans 4 hours:"
      },
      {
        "type": "equation",
        "text": "J_{\\mathrm{pre}}(\\theta)=\\mathbb E\\bigl[\\ell\\bigl(\\mathcal K_\\theta(x_1^-),\\,y_1\\bigr)\\bigr],\\qquad J_{\\mathrm{mid}}(\\theta)=\\frac{1}{4}\\sum_{j=1}^{4}\\ell\\bigl(\\mathcal K_\\theta(\\mathcal P^\\Delta(x_{j-1}^+)),\\,y_j\\bigr)."
      },
      {
        "type": "paragraph",
        "text": "During Midtrain, errors in later velocities, tracers, and even sea-surface height backpropagate through the differentiable primitive-equation operator $\\mathcal{P}^\\Delta$. As discussed in the second note, $\\mathcal{K}_\\theta$ never directly changes free-surface elevation $\\eta$. Backpropagation through the solver allows later elevation errors to constrain earlier internal shear and tracer updates through the linearized primitive equations."
      },
      {
        "type": "paragraph",
        "text": "To suppress trajectory drift over weeks while avoiding the memory cost of long-horizon backpropagation, **closed-loop training (Posttrain)** places the model on continuous 10-day autoregressive trajectories. Let $K=1\\text{ day}/\\Delta$ be the number of coupling steps per day: $K=1$ for daily and $K=24$ for hourly coupling. The operator $\\operatorname{sg}(\\cdot)$ denotes stop-gradient. Within each day, the first $K-1$ cycles run forward without gradient tracking, and the physical-state gradient is detached before every neural update. Network parameters are updated once at the end of each day ($k=K$), against the reference field $y_d$:"
      },
      {
        "type": "equation",
        "text": "x_{d,k}^-=\\mathcal P^\\Delta(x_{d,k-1}^+),\\qquad x_{d,k}^+=\\mathcal K_\\theta\\bigl(\\operatorname{sg}(x_{d,k}^-)\\bigr),\\qquad J_{\\mathrm{post},d}(\\theta)=\\ell(x_{d,K}^+,y_d)."
      },
      {
        "type": "paragraph",
        "text": "This exposes the corrector to the closed-loop state distribution over 10 days, or 240 cycles under hourly coupling, while limiting each backpropagation graph to a single coupling step."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/forecast_skill.png",
        "width": 2614,
        "height": 1574,
        "alt": "100-day forecast skill across training stages and coupling intervals",
        "caption": "Figure 1. 100-day forecast skill across training stages and coupling intervals. (a) Percentage change in RMSE for forecast variables $(u,v,\\mathrm{SSH},T,S)$ relative to the same-core coarse Smagorinsky baseline, aggregated over 16 initializations for all 12 hybrid configurations deployed with DND (2 dynamical frameworks × 2 coupling intervals × 3 training stages). (b) Corresponding changes in equation-of-state diagnostic density $\\rho$ RMSE. Negative values (blue-green) indicate improvement over Smagorinsky. Imp and Exp denote the semi-implicit and explicit mode-split frameworks. Source: Figure 3 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "Figure 1 reveals a contrast between the training trajectories. With daily coupling ($1\\text{ d}$), four-step Midtrain spans a 4-day weather-scale window. Midtrain and 10-day Posttrain steadily reduce 100-day errors across variables. With hourly coupling ($1\\text{ h}$), however, four-step Midtrain spans only 4 hours. Optimization over that short window reduces salinity $S$ error but excites excess eddy energy, temporarily increasing 100-day errors in velocity $(u,v)$, sea-surface height, and potential temperature $T$ relative to Pretrain. The 10-day Posttrain stage, spanning 240 hourly cycles, controls the accumulated excess energy. Errors across variables fall by 17%–33% relative to Midtrain, ultimately yielding the best velocity and sea-surface-height performance among the configurations."
      },
      {
        "type": "heading",
        "text": "When are gradients through the physical solver essential?"
      },
      {
        "type": "paragraph",
        "text": "After completing the three stages, we still had a question. If every model ultimately undergoes 10-day Posttrain with detached physical gradients, is the intermediate effort of differentiating through the primitive-equation solver $\\mathcal{P}^\\Delta$ necessary? Does Midtrain help because of **gradients through the physical solver**, or simply because the network sees states from multi-step rollouts?"
      },
      {
        "type": "paragraph",
        "text": "To separate these effects, we designed three controlled training routes with exactly the same optimizer-update budget (Table 1)."
      },
      {
        "type": "paragraph",
        "text": "The **full three-stage route (Full: $\\text{Pretrain}\\to\\text{Midtrain}\\to\\text{Posttrain}$)** retains all gradients through $\\mathcal{P}^\\Delta$ during Midtrain."
      },
      {
        "type": "paragraph",
        "text": "The **route that skips the intermediate stage (Skip: $\\text{Pretrain}\\to\\text{Posttrain}$)** allocates the same total number of updates entirely to closed-loop Posttrain."
      },
      {
        "type": "paragraph",
        "text": "The **detached-physics route (Detached: $\\text{Pretrain}\\to\\text{Midtrain}_{\\text{detached}}\\to\\text{Posttrain}$)** follows the same four-step forward trajectory as Full during the intermediate stage, but applies $\\operatorname{sg}(\\cdot)$ at the entrance to every physical interval. The network sees the rollout states without receiving gradients through the physical steps."
      },
      {
        "type": "table",
        "headers": [
          "Dynamics",
          "Interval $\\Delta$",
          "Training-stage and route comparison",
          "$u$",
          "$v$",
          "$\\mathrm{SSH}$",
          "$T$",
          "$S$"
        ],
        "rows": [
          [
            "Implicit",
            "$1\\text{ d}$",
            "Mid / Pre ($\\Delta\\%$)",
            "−3.47",
            "−2.33",
            "−4.62",
            "−3.28",
            "−4.66"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "+0.19",
            "+0.15",
            "−0.04",
            "−2.07",
            "−1.49"
          ],
          [
            "",
            "",
            "Full vs. Skip (% gain)",
            "+0.09",
            "+0.72",
            "+0.39",
            "+0.21",
            "+0.34"
          ],
          [
            "",
            "",
            "Full vs. Detached (% gain)",
            "−0.38",
            "+0.06",
            "−0.20",
            "−0.13",
            "−0.10"
          ],
          [
            "Explicit",
            "$1\\text{ d}$",
            "Mid / Pre ($\\Delta\\%$)",
            "−0.56",
            "−2.28",
            "−1.66",
            "+0.63",
            "−3.38"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "−4.12",
            "−1.90",
            "−5.50",
            "−8.39",
            "−4.46"
          ],
          [
            "",
            "",
            "Full vs. Skip (% gain)",
            "+0.29",
            "+0.10",
            "+0.33",
            "+0.33",
            "+0.87"
          ],
          [
            "",
            "",
            "Full vs. Detached (% gain)",
            "−0.74",
            "−0.54",
            "−1.05",
            "−0.85",
            "−0.40"
          ],
          [
            "Implicit",
            "$1\\text{ h}$",
            "Mid / Pre ($\\Delta\\%$)",
            "+8.39",
            "+7.74",
            "+17.02",
            "+18.70",
            "−15.98"
          ],
          [
            "",
            "",
            "Post / Mid ($\\Delta\\%$)",
            "−24.55",
            "−22.23",
            "−29.18",
            "−32.63",
            "−23.28"
          ],
          [
            "",
            "",
            "Full vs. Skip (% gain)",
            "−1.58",
            "−1.59",
            "−3.71",
            "+1.02",
            "+3.58"
          ],
          [
            "",
            "",
            "Full vs. Detached (% gain)",
            "+0.06",
            "+0.39",
            "−1.82",
            "+0.96",
            "+9.71"
          ],
          [
            "**Explicit**",
            "**$1\\text{ h}$**",
            "**Mid / Pre ($\\Delta\\%$)**",
            "**+12.35**",
            "**+10.60**",
            "**+18.87**",
            "**+19.36**",
            "**−4.35**"
          ],
          [
            "",
            "",
            "**Post / Mid ($\\Delta\\%$)**",
            "**−24.00**",
            "**−23.02**",
            "**−28.21**",
            "**−29.17**",
            "**−17.22**"
          ],
          [
            "",
            "",
            "**Full vs. Skip (% gain)**",
            "**+3.23**",
            "**+2.67**",
            "**+3.46**",
            "**+8.42**",
            "**+41.15**"
          ],
          [
            "",
            "",
            "**Full vs. Detached (% gain)**",
            "**+4.66**",
            "**+4.88**",
            "**+5.09**",
            "**+8.80**",
            "**+38.75**"
          ]
        ],
        "caption": "Table 1. Staged training and three controlled routes deployed with DND, using 100-day RMSE aggregated over 16 initializations. Mid/Pre and Post/Mid report percentage changes between consecutive stages; negative values mean that the later stage has lower error. Full vs. Skip and Full vs. Detached report the relative RMSE reduction of the full route against each control under an equal update budget. Positive values favor Full, which retains gradients through the solver. Source: Table 4 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "The results in Table 1 give a useful answer: **the importance of gradients through the physical solver depends on the relationship between coupling interval $\\Delta$ and the time scales of the dynamical framework.**"
      },
      {
        "type": "paragraph",
        "text": "With **low-frequency daily coupling ($\\Delta=1\\text{ d}$)**, a full 24 hours of physical integration separates consecutive state updates. The solver has time to disperse and dissipate short-lived disturbances from each correction. Ten-day closed-loop Posttrain is then sufficient to stabilize long trajectories, and the 100-day errors of Full, Skip, and Detached differ by less than 1%."
      },
      {
        "type": "paragraph",
        "text": "With **high-frequency hourly coupling ($\\Delta=1\\text{ h}$)**, the network intervenes every 6 baroclinic steps. Short-lived waves from one update become the background for the next before they can settle. This is especially important in the **explicit mode-split framework (Explicit, $1\\text{ h}$)**, where fast external gravity waves advance through 30 barotropic substeps within each baroclinic step. Detached, which sees multi-step trajectories but receives no gradients through the physics, provides almost no benefit over Skip. Retaining those gradients in Full lets the corrector learn to suppress cross-step barotropic–baroclinic imbalance and tracer drift. It further reduces 100-day velocity $(u,v)$ and sea-surface-height errors by 3%–5%, potential-temperature error by 8%–9%, and salinity error by about 40% (Figure 2). In the semi-implicit hourly framework (Implicit, $1\\text{ h}$), where the forward elliptic solve filters fast external gravity waves, gradients through the solver provide more modest tracer-retention gains."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/forecast_tracer_curves.png",
        "width": 2472,
        "height": 2440,
        "alt": "Daily temperature and salinity RMSE over 100-day forecasts",
        "caption": "Figure 2. Daily potential-temperature $T$ and salinity $S$ RMSE over the 100-day forecast. Panels compare NeuralPOM deployed with DND (dark-blue solid lines) against three coarse-grid physical closures, aggregated over 16 initializations: Implicit hourly (a,b), Implicit daily (c,d), Explicit hourly (e,f), and Explicit daily (g,h). Source: Figure 7 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "heading",
        "text": "Tracer–baroclinic feedback and density-normal damping under hourly coupling"
      },
      {
        "type": "paragraph",
        "text": "After resolving the training-route question, we encountered a more specifically oceanographic problem. With daily coupling ($\\Delta=1\\text{ d}$), adding the layer-mean-conserving tracer increments directly to the state, an Undamped update, reduces 100-day errors in all five forecast variables by 5%–16%. With hourly coupling ($\\Delta=1\\text{ h}$), exactly the same update rule instead raises 100-day salinity $S$ error by 59%–91% relative to the uncorrected physical model. Why does a correction work well once daily but damage tracer structure when applied once hourly?"
      },
      {
        "type": "paragraph",
        "text": "The governing equations point to the **active thermodynamic role** of potential temperature $T$ and salinity $S$ [8,9]. In the three-dimensional primitive equations, they are not passive scalars. They continually determine seawater density through the nonlinear equation of state $\\rho(T,S,P)$. Even if the network reduces the pointwise error of each variable in a single step, a small, uncoordinated residual between $(\\delta T,\\delta S)$ can produce a local density anomaly $\\delta\\rho$ to first order. Hydrostatic balance then turns this into a baroclinic pressure-gradient anomaly:"
      },
      {
        "type": "equation",
        "text": "\\delta\\rho\\approx\\left(\\frac{\\partial\\rho}{\\partial T}\\right)_{S,P}\\delta T+\\left(\\frac{\\partial\\rho}{\\partial S}\\right)_{T,P}\\delta S,\\qquad\\partial_z p=-g\\rho."
      },
      {
        "type": "paragraph",
        "text": "Once inside the physical model, $\\delta\\rho$ affects subsequent flow through two pathways. Horizontally, its gradient $\\nabla_h\\delta\\rho$ generates a spurious hydrostatic baroclinic pressure-gradient force and excites near-grid ageostrophic flow. Vertically, its gradient $-\\partial_z\\delta\\rho$ perturbs buoyancy stratification in the Mellor–Yamada turbulence closure, changing vertical viscosity and diffusivity. At a $24\\text{ h}$ coupling interval, geostrophic adjustment has time to absorb these transient density disturbances. At $1\\text{ h}$, another disturbance arrives before adjustment is complete, leading to near-grid kinetic-energy buildup and vertical temperature and salinity drift."
      },
      {
        "type": "paragraph",
        "text": "This mechanism suggests a targeted response: distinguish **density-changing corrections** from **density-compensated corrections**, rather than shrinking every tracer increment uniformly."
      },
      {
        "type": "paragraph",
        "text": "Temperature and salinity adjustments along an isopycnal can correct water-mass properties without exciting a baroclinic pressure-gradient impulse. For example, proportionate warming and salinification, or cooling and freshening, can compensate to give $\\delta\\rho\\approx 0$ to first order. The diapycnal component, normal to the isopycnal and directly changing density, is the one that excites ageostrophic disturbances. Within each active $\\sigma$ layer, we use the local equation-of-state density gradient to construct a volume-weighted orthogonal projector $E$, while preserving layerwise heat and salt means. A standardized tracer increment $z$ then splits into the **density-changing component $Ez$** and the **density-compensated component $(I-E)z$**. Scaling the first by $c\\in[0,1]$ gives the filtered update $z_c$ and its energy relation:"
      },
      {
        "type": "equation",
        "text": "z_c=(I-E)z+cEz,\\qquad\\|z_c\\|_w^2=\\|z\\|_w^2-(1-c^2)\\|Ez\\|_w^2."
      },
      {
        "type": "paragraph",
        "text": "In NeuralPOM, we call the rule with $c=3/4$ **Density-Normal Damping (DND)**. The orthogonal Pythagorean relation above shows that attenuating the density-changing component by $25\\%$ in amplitude reduces its squared norm $\\|Ez\\|_w^2$, and the directly induced linearized baroclinic pressure-gradient perturbation energy, by $1-(3/4)^2=43.75\\%$. Meanwhile, **100% of the isopycnal water-mass correction** $(I-E)z$ is retained, together with heat and salt conservation within each $\\sigma$ layer."
      },
      {
        "type": "heading",
        "text": "Causal tests from a single 72-hour perturbation to 100-day closed-loop forecasts"
      },
      {
        "type": "paragraph",
        "text": "To distinguish the effect of suppressing the density-changing direction from merely reducing the overall tracer-increment magnitude, we designed two successive controlled experiments."
      },
      {
        "type": "paragraph",
        "text": "The first is a **single-perturbation experiment with 36 states and 72 hours of physical evolution** (Figure 3). We extract 36 pre-correction states from hybrid forecast trajectories and call the network only once, at $t=0$. Four parallel branches receive identical velocity updates but different tracer treatments: no temperature or salinity update (no-TS); an Undamped update with $c=1$; isotropic Uniform scaling with exactly the same mean increment norm $\\|z_c\\|_w$ as DND, multiplying the full tracer increment by $\\kappa\\approx 0.90\\text{–}0.93$; and DND with $c=3/4$. For $0<t\\le 72\\text{ h}$, we **switch the network off entirely** and freely integrate the primitive-equation solver for 72 hours. This isolates the physical response to that one tracer correction."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/prediction_response.png",
        "width": 2472,
        "height": 976,
        "alt": "Single-perturbation responses during 72 hours of free physical integration",
        "caption": "Figure 3. Response to a single perturbation across 36 pre-correction states, followed by 72 hours of free physical integration. (a) Percentage change in instantaneous baroclinic pressure-gradient tendency MSE at $t=0$ for DND (dark blue) and norm-matched Uniform scaling (light brown), relative to Undamped. The dashed line marks the linearized prediction of $-43.75\\%$. (b) Subsequent horizontal-velocity RMSE change for Undamped relative to no-TS during 72 hours of physical integration; brown and teal denote hourly and daily models. (c) Horizontal-velocity RMSE changes for DND and norm-matched Uniform relative to Undamped in the two hourly models. Source: Figure 5 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "Figure 3 traces the physical response. Immediately after the update at $t=0$ (Figure 3a), DND reduces instantaneous baroclinic pressure-gradient tendency MSE by 44%–46%, close to the theoretical $43.75\\%$. The reduction is about three times that of norm-matched Uniform scaling (13%–18%). During the subsequent 72 hours of physical evolution (Figure 3b), the daily models (teal) adjust over the first few hours; tracer updates then begin to reduce velocity errors at 24–72 hours. In hourly models (brown), a single Undamped tracer update excites ageostrophic disturbances, leaving velocity errors above the no-TS branch throughout the 72-hour period. DND (Figure 3c) reduces this tracer-induced velocity error across the entire window."
      },
      {
        "type": "paragraph",
        "text": "The second experiment is a **100-day closed-loop test with frozen network weights** (Figure 4). Using the same trained network, we compare Undamped, norm-matched Uniform, and DND in hourly coupled forecasts over 100 days and 16 initializations."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-3/retention_theory.png",
        "width": 2472,
        "height": 1039,
        "alt": "100-day closed-loop comparison of DND and norm-matched uniform scaling",
        "caption": "Figure 4. 100-day closed-loop comparison of directional damping (DND) and norm-matched Uniform scaling under hourly coupling, with the same frozen network weights. (a) Percentage changes in 100-day RMSE for all forecast variables and diagnostic density $\\rho$, relative to Undamped. (b) Late-forecast (days 51–100) near-grid horizontal-velocity energy ratio $R_{\\text{near-grid}}$ (left, with the fine-grid reference $R=1$ shown by a dashed line) and full-spectrum phase alignment $A$ (right) for the three rules. Source: Figure 6 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "After 100 days and 2,400 hourly cycles, the directional difference in each update produces substantial long-term differences (Figure 4a). Relative to Undamped, DND reduces 100-day velocity $(u,v)$ and sea-surface-height RMSE by 5%–9%, potential-temperature error by 12%–13%, salinity error by 38%–43%, and diagnostic density $\\rho$ error by 9%–10%. Across variables, these reductions are **4 to 8 times** those of norm-matched Uniform scaling. The three rules use the same network, apply identical velocity increments, and never directly change free-surface elevation $\\eta$. The velocity and sea-surface-height improvements therefore arise from suppressing spurious feedback from tracer density anomalies $\\delta\\rho$ into momentum and vertical mixing. Late-forecast spectra in Figure 4b also show that DND removes the spurious near-grid kinetic-energy buildup in Undamped, bringing $R_{\\text{near-grid}}$ from $1.83\\text{–}2.26$ back to $1.03\\text{–}1.13$, while improving full-spectrum eddy phase alignment $A$."
      },
      {
        "type": "paragraph",
        "text": "Looking back over NeuralPOM, we see close connections between AI ocean modeling, physical oceanography, and data assimilation. In operational ocean assimilation, directly inserting temperature and salinity analysis increments into primitive-equation models can likewise excite spurious gravity waves and convective instability. Incremental analysis updates (IAU) [10], tangent-linear thermal-wind relations, and density-balance constraints were developed to address these problems. The same fluid dynamics govern frequent online corrections made by deep networks. Staged differentiable and closed-loop training helps the network adapt to evolution across primitive-equation steps. DND filters the diapycnal baroclinic impulse $Ez$ while retaining layerwise heat and salt conservation and the isopycnal water-mass correction $(I-E)z$. The current work still uses an idealized double-gyre basin with zero surface buoyancy flux. Extending the differentiable dynamics, staged training, and directional conservation-constrained update interface to realistic regional and global operational ocean prediction is our next goal."
      },
      {
        "type": "heading",
        "text": "References"
      },
      {
        "type": "references",
        "items": [
          "Rasp, S., Pritchard, M. S., & Gentine, P. (2018). Deep learning to represent subgrid processes in climate models. *Proceedings of the National Academy of Sciences*, 115(39), 9684–9689. https://doi.org/10.1073/pnas.1810286115",
          "Ross, A., Li, Z., Perezhogin, P., Fernandez-Granda, C., & Zanna, L. (2023). Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model. *Journal of Advances in Modeling Earth Systems*, 15(1), e2022MS003258. https://doi.org/10.1029/2022MS003258",
          "Frezat, H., Le Sommer, J., Fablet, R., Balarac, G., & Lguensat, R. (2022). A Posteriori Learning for Quasi-Geostrophic Turbulence Parametrization. *Journal of Advances in Modeling Earth Systems*, 14(11), e2022MS003124. https://doi.org/10.1029/2022MS003124",
          "Shen, C., Appling, A. P., Gentine, P., et al. (2023). Differentiable programming for Earth system modeling. *Geoscientific Model Development*, 16(11), 3123–3147. https://doi.org/10.5194/gmd-16-3123-2023",
          "Ouala, S., Chapron, B., Collard, F., Gaultier, L., & Fablet, R. (2024). Online calibration of deep learning sub-models for hybrid numerical modeling systems. *Communications Physics*, 7(1), 402. https://doi.org/10.1038/s42005-024-01880-7",
          "List, B., Chen, L.-W., Bali, K., & Thuerey, N. (2025). Differentiability in unrolled training of neural physics simulators on transient dynamics. *Computer Methods in Applied Mechanics and Engineering*, 433, 117441. https://doi.org/10.1016/j.cma.2024.117441",
          "Yan, F. E., Frezat, H., Le Sommer, J., Mak, J., & Otness, K. (2025). Adjoint-Based Online Learning of Two-Layer Quasi-Geostrophic Baroclinic Turbulence. *Journal of Advances in Modeling Earth Systems*, 17(7), e2024MS004857. https://doi.org/10.1029/2024MS004857",
          "Mellor, G. L. (1991). An Equation of State for Numerical Models of Oceans and Estuaries. *Journal of Atmospheric and Oceanic Technology*, 8(4), 609–611. https://doi.org/10.1175/1520-0426(1991)008<0609:AEOSFN>2.0.CO;2",
          "Mellor, G. L., & Yamada, T. (1982). Development of a turbulence closure model for geophysical fluid problems. *Reviews of Geophysics*, 20(4), 851–875. https://doi.org/10.1029/RG020i004p00851",
          "Bloom, S. C., Takacs, L. L., da Silva, A. M., & Ledvina, D. (1996). Data assimilation using incremental analysis updates. *Monthly Weather Review*, 124(6), 1256–1271. https://doi.org/10.1175/1520-0493(1996)124<1256:DAUIAU>2.0.CO;2"
        ]
      }
    ]
  }
};
