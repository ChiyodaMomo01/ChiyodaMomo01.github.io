import type { BlogPost } from "../blogTypes";
import { thinking2Metadata } from "../blogIndex";

export const oceanHybridThinking2: BlogPost = {
  ...thinking2Metadata,
  "content": {
    "zh": [
      {
        "type": "paragraph",
        "text": "在上一篇学习笔记中，我们从概念层面梳理了物理海洋模式与数据驱动方法的结合思路，把混合建模写成“物理方程趋势项加神经网络修正项”的微分方程形式，并讨论了离线训练与在线训练的区别。那篇笔记写完后，我们一直在思考一个更具体的问题：当走出二维准地转或浅水方程这类理想化模型，真正面对一个包含自由面起伏、正压与斜压模态分裂、三维温盐输运、非线性状态方程和垂向湍流闭合的三维原始方程海洋环流模式时，概念公式与可运行的预报系统之间究竟隔着哪些物理与数值门槛？"
      },
      {
        "type": "paragraph",
        "text": "这正是我们开展 **NeuralPOM** 研究的初衷。预测海洋的物理状态及其长期演化，本质上是在涡旋允许（eddy-permitting）分辨率下寻找一条兼顾物理守恒与中尺度涡旋精度的道路。传统粗网格数值模式受限于网格分辨率，经验次网格闭合难以仅凭可分辨流场的局地应变恢复未分辨中尺度涡的空间位相[1,2]；纯数据驱动的神经预报器虽然单步推理很快[3–5]，但在数周至数月的自回归滚动中容易产生轨迹漂移，在逐点均方误差（MSE）目标下抹平近网格尺度变率[6–8]，且缺乏内建的体积、热量与盐量守恒约束[8,9]。作为系列笔记的第二篇与第三篇，我们将结合 NeuralPOM 的建模过程与实验结果，分享其中的方法设计与研究体会。本篇聚焦三维可微动力框架的重构、受守恒约束的状态更新接口，以及 100 天全状态预报与波数谱机制诊断；下一篇则专门探讨跨物理求解器的分阶段训练机制与高频温盐更新激发的斜压反馈控制。"
      },
      {
        "type": "heading",
        "text": "为什么选择三维原始方程模式“旧瓶装新酒”"
      },
      {
        "type": "paragraph",
        "text": "在已有的海洋混合建模研究中，许多探索是在准地转或单层浅水模型上完成的[10–13]。这类简化模型非常适合验证算法原型，但它们省略了业务化海洋环流模式中最核心的三维斜压热力学过程与快慢模态耦合。我们之所以把论文题目定为“旧瓶新酒（New Wine in an Old Bottle）”，是因为选择了物理海洋学界非常经典的三维地形跟随坐标环流模式——普林斯顿海洋模式（POM）[14,15]作为物理基座。"
      },
      {
        "type": "paragraph",
        "text": "在水平交错 Arakawa-C 网格和垂向地形跟随 $\\sigma$ 坐标（$\\sigma\\in[-1,0]$ 由海面 $z=\\eta$ 延伸至海底 $z=-h$，水柱总厚度 $H=h+\\eta$）下，POM 求解静力、Boussinesq 原始方程[14]。记水平速度为 $\\boldsymbol{u}_h=(u,v)$，垂向速度为 $w$，物质导数为 $D_t$，科氏参数为 $f$，参考海水密度为 $\\rho_0$，静水压力为 $p$，现场密度为 $\\rho$，位温与盐度等示踪物为 $C\\in\\{T,S\\}$，次网格动量与示踪物混合项分别为 $\\mathcal{D}_m$ 与 $\\mathcal{D}_C$，控制方程与垂向积分自由面连续方程写为："
      },
      {
        "type": "equation",
        "text": "\\begin{aligned}\nD_t\\boldsymbol u_h+f\\boldsymbol e_z\\times\\boldsymbol u_h&=-\\rho_0^{-1}\\nabla_h p+\\mathcal D_m,\\\\\n\\partial_z p&=-g\\rho,\\qquad\\nabla_h\\cdot\\boldsymbol u_h+\\partial_z w=0,\\\\\nD_t C&=\\mathcal D_C,\\qquad\\partial_t\\eta+\\nabla_h\\cdot(H\\boldsymbol U)=0.\n\\end{aligned}"
      },
      {
        "type": "paragraph",
        "text": "在这套方程里，位温 $T$ 和盐度 $S$ 通过非线性 Mellor 状态方程决定现场海水密度 $\\rho(T,S,P)$[16]，进而通过静力平衡关系 $\\partial_z p=-g\\rho$ 驱动水平斜压压强梯度力；垂向粘性系数与扩散系数则由求解湍动能与混合长度乘积 $(q^2,q^2 l)$ 的 Mellor–Yamada 2.5 阶湍流闭合方案给出[17]。"
      },
      {
        "type": "paragraph",
        "text": "要把这套传统 Fortran 模式改造成支持反向传播的可微动力框架，首先遇到的物理障碍是**快慢时间尺度分离**。在 2000 m 水深的海盆中，表面外重力波相速度约为 $\\sqrt{gh}\\approx 140\\text{ m s}^{-1}$，比典型内模态斜压流速（约 $1\\text{ m s}^{-1}$）快两个数量级。为了系统弄清外模态时间积分方式如何影响混合建模，我们在 PyTorch 中实现了两套共享三维斜压、温盐和湍流算子（内模态步长 $\\Delta t=600\\text{ s}$）的可微动力框架。"
      },
      {
        "type": "paragraph",
        "text": "第一套是**显式模态分裂动力框架（Explicit）**。它忠实还原了标准 POM 的模态分裂算法：在每个 $600\\text{ s}$ 的斜压步内，用 30 个短时间步（$\\delta t=20\\text{ s}$）的正压蛙跳子步显式积分自由面高度 $\\eta$ 与深度平均速度 $\\boldsymbol{U}=(U,V)$，并累加区间平均水位与网格面体积输运量，以此保证正压与斜压模态之间的体积收支一致。反向传播时，梯度直接沿展开的正压子步回传。"
      },
      {
        "type": "paragraph",
        "text": "第二套是**半隐式自由面动力框架（Implicit）**。它省去了 30 个正压子步，直接在 $600\\text{ s}$ 的斜压步长上对表面压力梯度施加隐式时间权重 $\\alpha$，将前向自由面高度 $\\eta^f$ 的求解转化为二维椭圆型 Helmholtz 方程 $A_\\eta\\eta^f=b_\\eta$（其中 $L_H$ 为水深加权水平散度—梯度算子）："
      },
      {
        "type": "equation",
        "text": "A_\\eta=I-4\\Delta t^2 g\\alpha L_{H^n},\\qquad A_\\eta\\eta^f=b_\\eta."
      },
      {
        "type": "paragraph",
        "text": "前向积分时，我们采用带离散正弦变换（DST）谱预条件子的共轭梯度法（PCG）求解该椭圆方程。如果在反向传播时把几十步 PCG 迭代直接展开进计算图，不仅显存开销大，还会把迭代截断误差混入梯度。为此，我们利用算子 $A_\\eta$ 关于网格单元面积矩阵 $M_A$ 的自伴性质 $A_\\eta^\\top=M_A A_\\eta M_A^{-1}$，设计了**隐式微分伴随算子**：给定损失函数 $\\mathcal{L}$ 对前向水位的上游梯度 $g_\\eta=\\partial\\mathcal{L}/\\partial\\eta^f$，只需调用一次相同的线性求解器算出伴随场 $\\lambda$，即可直接求得对任意前序状态变量 $\\zeta$ 的精确梯度："
      },
      {
        "type": "equation",
        "text": "\\lambda=M_A A_\\eta^{-1}(M_A^{-1}g_\\eta),\\qquad\\frac{d\\mathcal L}{d\\zeta}=\\lambda^\\top\\left(\\frac{\\partial b_\\eta}{\\partial\\zeta}-\\frac{\\partial A_\\eta}{\\partial\\zeta}\\eta^f\\right)."
      },
      {
        "type": "paragraph",
        "text": "在把神经网络接入之前，我们在 64 位双精度下将这两套可微 PyTorch 动力框架与原始双精度 Fortran POM 进行了严格的对标验证。从理想化的双涡旋海盆、近岸潮汐、层结海山，到具有复杂岸线与浅滩地形的胶州湾真实地形 15 天 $\\mathrm{M}_2$ 潮汐算例（图 1），显式框架在起转阶段与 Fortran 达到机器舍入精度吻合，两套可微框架在胶州湾受迫潮汐平衡态下的全域水位均方根差异均控制在 $0.2\\text{ mm}$ 以内。这为我们后续开展百日尺度的物理—神经耦合实验提供了可靠的动力底座。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/jiaozhou_bay_validation.png",
        "width": 3242,
        "height": 3631,
        "alt": "真实地形胶州湾15天M2潮汐验证基准算例",
        "caption": "图 1：真实地形胶州湾 15 天 $\\mathrm{M}_2$ 潮汐验证基准算例。（a）近岸水深、南侧与东侧开边界及湾内四个验潮站位置。（b）验潮站水位序列对比（上）与相对于双精度 Fortran POM 参考解的全域面积加权自由面高度 $\\eta$ 均方根误差时间序列（下）。（c–e）第 15 天 Fortran 参考自由面高度 $\\eta$ 及 Explicit、Implicit 两套可微动力框架的逐点差值。（f–h）第 15 天水柱最大水平流速及两套可微动力框架的逐点流速差值。来源：[NeuralPOM 论文图 9](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "heading",
        "text": "神经网络如何与原始方程状态安全耦合"
      },
      {
        "type": "paragraph",
        "text": "有了可微动力框架，接下来的问题是：神经网络应该怎样修改海洋状态？在单时间层的简化模型里，把网络预测的增量直接加到状态变量上似乎顺理成章。但在三维原始方程求解器中，每一次物理推进都需要当前时间层（$n$）与历史时间层（$b$）上完整的 45 变量状态向量。我们在早期尝试中很快意识到，任何不加物理约束的直接状态修改，都会立刻破坏水柱体积收支或蛙跳时间层的一致性，在下一步物理积分中激发出虚假的外重力波或蛙跳计算模态。"
      },
      {
        "type": "paragraph",
        "text": "因此在 NeuralPOM 中，我们将预报推进设计为“物理积分 + 受约束状态更新”的交替循环（图 2a）。记第 $n$ 个循环后的完整模式状态为 $x_n^+$，时间间隔 $\\Delta$（本文同时考察高频 $\\Delta=1\\text{ h}$ 与低频 $\\Delta=1\\text{ day}$）上的原始方程积分算子为 $\\mathcal{P}^\\Delta$，受守恒约束的神经状态更新算子为 $\\mathcal{K}_\\theta$："
      },
      {
        "type": "equation",
        "text": "x_{n+1}^-=\\mathcal P^\\Delta(x_n^+),\\qquad x_{n+1}^+=\\mathcal K_\\theta(x_{n+1}^-)."
      },
      {
        "type": "paragraph",
        "text": "在每个物理积分区间末端，残差 U-Net 接收当前与历史时间层的三维速度和温盐场以及二维外模态场，输出 15 个活跃 $\\sigma$ 层上的水平速度与温盐原始增量 $(\\delta u,\\delta v,\\delta T,\\delta S)$。在写入模式状态之前，算子 $\\mathcal{K}_\\theta$ 会依次执行三道物理约束。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/method_flow.png",
        "width": 2472,
        "height": 2298,
        "alt": "NeuralPOM物理–神经耦合与三阶段训练框架",
        "caption": "图 2：NeuralPOM 的物理–神经耦合循环与三阶段训练流程。（a）在每个耦合步，可微 POM 动力框架将海洋状态输入残差 U-Net，网络输出的原始速度与温盐增量 $(\\delta u,\\delta v,\\delta T,\\delta S)$ 经水柱/层均值守恒投影、密度法向阻尼与限幅后，同步更新当前与历史蛙跳时间层并重算状态方程密度 $\\rho$，再进入下一物理积分区间。（b–d）依次推进的单步预训练（Pretrain）、跨求解器多步可微训练（Midtrain）与 10 天闭环滚动训练（Posttrain）。来源：[NeuralPOM 论文图 1](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "第一道约束是**正压与斜压职责分离**。我们将水平速度增量投影为水柱层厚加权平均为零，同时将位温和盐度增量投影为每个活跃 $\\sigma$ 层上的湿体积加权平均为零（记 $\\langle\\cdot\\rangle_k$ 为第 $k$ 层的湿体积加权水平平均）："
      },
      {
        "type": "equation",
        "text": "\\sum_{k=0}^{14}\\Delta\\sigma_k\\,\\delta\\boldsymbol u_{h,k}=\\boldsymbol 0,\\qquad\\langle\\delta T\\rangle_k=0,\\qquad\\langle\\delta S\\rangle_k=0."
      },
      {
        "type": "paragraph",
        "text": "这一设计体现了混合建模中非常关键的物理分工：去除水柱平均速度增量后，神经网络的直接动量修正被严格限制在**斜压垂向切变**上，水柱的垂向积分体积输运继续完全由外模态连续方程控制；去除逐层平均温盐增量后，网络只能在每个 $\\sigma$ 层内部水平重新分配热量与盐量，不会向任何水层引入净热源或净盐源。一个很有意思的推论是，尽管神经网络从不直接修改自由面高度 $\\eta$，但它对内部斜压切变与温盐层结的修正，会在随后的物理积分区间 $\\mathcal{P}^\\Delta$ 中通过正压—斜压模态耦合自然调整海面高度。"
      },
      {
        "type": "paragraph",
        "text": "第二道约束是针对温盐增量的**密度法向阻尼（Density-Normal Damping，DND）**与成对极值限幅，用来滤除高频耦合下可能激发虚假斜压压强梯度的跨等密面密度扰动（这一机制我们将在第三篇笔记中重点剖析）。"
      },
      {
        "type": "paragraph",
        "text": "第三道约束是**蛙跳时间层同步更新**。我们将经过守恒投影和阻尼后的物理增量 $\\widehat{\\delta f}$ 同步加到当前（$n$）与历史（$b$）两个蛙跳时间层上："
      },
      {
        "type": "equation",
        "text": "f^n\\leftarrow f^n+\\widehat{\\delta f},\\qquad f^b\\leftarrow f^b+\\widehat{\\delta f},\\qquad f\\in\\{u,v,T,S\\}."
      },
      {
        "type": "paragraph",
        "text": "同步修改两个时间层保持了时间层差值 $f^n-f^b$ 不变，从而避免了单层跳变激发的蛙跳计算模态。随后，三维海水密度 $\\rho$ 立即由非线性状态方程重新计算，而自由面高度 $\\eta$、垂向速度 $w$ 与湍流混合变量则在下一个物理积分区间内按照原始方程完成动力平衡。"
      },
      {
        "type": "heading",
        "text": "逾十万模式日基准上的百日全状态预报"
      },
      {
        "type": "paragraph",
        "text": "为了在收支严格闭合、没有观测稀疏性与再分析同化偏差干扰的环境下检验这套系统，我们在跨越 $30^\\circ\\text{N}\\text{–}50^\\circ\\text{N}$、水平尺度 $2500\\text{ km}$、水深 $2000\\text{ m}$ 的三维风生双涡旋海盆（double-gyre）中，针对显式与半隐式两套动力框架各积分了 8 个细网格（水平格距约 $7\\text{ km}$，涡旋分辨尺度）集合成员，每个成员连续积分 9,000 个模式日，累计超过 **10 万个模式日**。定常纬向风应力在海盆中驱动出副热带与副极地双涡旋对、强劲的东向分离急流以及饱满的三维中尺度涡旋场（图 3）。我们将细网格参考场经体积加权守恒限制映射投影至约 $28\\text{ km}$ 的粗预报网格（涡旋允许尺度），从未参与训练的独立测试成员上选取 16 个起报日，开展连续 100 天的三维海洋物理状态预报。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/developed_surface_fields.png",
        "width": 900,
        "height": 900,
        "alt": "细网格风生双涡旋海盆充分发展的三维环流场",
        "caption": "图 3：细网格风生双涡旋海盆参考数据集中充分发展的三维环流场。图示细网格 Explicit 参考模拟最上层活跃 $\\sigma$ 层的瞬时归一化相对涡度 $\\zeta/f$（a）、自由面高度 $\\eta$（b）、位温 $T$（c）、纬向流速 $u$（d）、经向流速 $v$（e）和盐度 $S$（f）。来源：[NeuralPOM 论文图 2](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "围绕 100 天长时效预报，我们重点对比了两类代表性基线：一类是在同一 $28\\text{ km}$ 粗网格 POM 求解器上运行的三种经典次网格物理闭合方案（标准二阶谐波 Smagorinsky 扩散、四阶双调和粘性 Biharmonic，以及将耗散动能回注可分辨流场的动能逆散射方案 Backscatter）；另一类是不调用物理求解器、直接以自回归方式逐日推进全部 313 个状态通道的五种时空神经网络架构（Triton[18]、ResUNet、SimVP[19]、ConvLSTM[20] 与 PastNet[21]，均依次完成单步预训练 Pre 与 10 天闭环滚动训练 Post）。"
      },
      {
        "type": "paragraph",
        "text": "实验结果呈现出两条清晰的规律。首先，与粗网格物理基线相比，NeuralPOM 在显式与半隐式两套动力框架上全面降低了全部五个预报变量 $(u,v,\\mathrm{SSH},T,S)$ 及诊断海水密度 $\\rho$ 的 100 天均方根误差（RMSE）：在逐日耦合下，水平流速与海表高度（SSH）误差较 Smagorinsky 基线降低 5%–10%，位温与盐度误差分别降低 10%–12% 和 15%–18%；在逐时耦合配合 DND 下，环流与海表高度取得最大改善（水平流速误差降低 7%–10%，SSH 误差降低 12%–13%）。相反，在未校正粗网格上改用四阶双调和粘性 Biharmonic 或动能逆散射 Backscatter，反而使全变量 100 天误差上升了 4%–17%。"
      },
      {
        "type": "table",
        "headers": [
          "配置",
          "$u\\ (\\mathrm{m\\,s^{-1}})\\downarrow$",
          "$v\\ (\\mathrm{m\\,s^{-1}})\\downarrow$",
          "$\\mathrm{SSH}\\ (\\mathrm{m})\\downarrow$",
          "$T\\ (^\\circ\\mathrm{C})\\downarrow$",
          "$S\\downarrow$"
        ],
        "rows": [
          [
            "Smagorinsky",
            "<u>0.07926</u>",
            "0.08197",
            "<u>0.11970</u>",
            "<u>0.29351</u>",
            "<u>0.03382</u>"
          ],
          [
            "Triton Pre",
            "0.09935",
            "0.09526",
            "0.21544",
            "0.79294",
            "0.21825"
          ],
          [
            "Triton Post",
            "0.08886",
            "0.08663",
            "0.14570",
            "0.36668",
            "0.10914"
          ],
          [
            "ResUNet Pre",
            "0.10189",
            "0.09767",
            "0.16460",
            "0.45770",
            "0.12531"
          ],
          [
            "ResUNet Post",
            "0.08267",
            "0.08401",
            "0.12812",
            "0.60935",
            "0.22609"
          ],
          [
            "SimVP Pre",
            "0.09434",
            "0.09123",
            "0.22382",
            "0.79226",
            "0.21567"
          ],
          [
            "SimVP Post",
            "0.08452",
            "<u>0.08180</u>",
            "0.13804",
            "0.63266",
            "0.25703"
          ],
          [
            "ConvLSTM Pre",
            "0.10088",
            "0.10351",
            "0.29508",
            "0.96630",
            "0.22385"
          ],
          [
            "ConvLSTM Post",
            "0.10222",
            "0.09665",
            "0.18062",
            "0.51404",
            "0.10723"
          ],
          [
            "PastNet Pre",
            "0.14249",
            "0.12674",
            "0.23017",
            "0.61166",
            "0.17605"
          ],
          [
            "PastNet Post",
            "0.10278",
            "0.10150",
            "0.17001",
            "0.77017",
            "0.26912"
          ],
          [
            "**NeuralPOM Post-DND (ours)**",
            "**0.07415**",
            "**0.07789**",
            "**0.11227**",
            "**0.26537**",
            "**0.02822**"
          ]
        ],
        "highlightedRow": 11,
        "caption": "表 1：混合模式 NeuralPOM 与粗网格物理基线及五种直接神经网络预报模型在 16 个测试起报日上汇总的 100 天 RMSE（半隐式参考场）。每列最优结果以浅绿背景加粗体标出，次优结果以下划线标出（按未舍入数值排序）；Pre 与 Post 分别对应单步预训练与 10 天闭环滚动训练模型，盐度 $S$ 为模式单位。来源：[NeuralPOM 论文表 2](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "其次，对比表 1 中的五种纯数据驱动神经网络可以看到，仅经过单步预训练（Pre）的模型在 100 天滚动中发生了明显的轨迹发散；引入 10 天闭环滚动训练（Post）虽然帮助直接神经网络稳住了大尺度环流，使流速 $(u,v)$ 与海表高度误差接近粗网格物理基线，但纯数据驱动映射在百日尺度上依然无法维持三维温盐 $(T,S)$ 结构，其 100 天盐度误差达到物理求解器的 3 至 8 倍。嵌入可微原始方程框架的 NeuralPOM 则在所有变量上均取得最低误差，较各变量最强的直接神经网络基线分别降低 5%–12%（水平流速与海表高度）、28%（位温 $T$）和 74%（盐度 $S$）。"
      },
      {
        "type": "heading",
        "text": "波数谱视角：为什么纯物理闭合与纯 AI 走入相反的困境"
      },
      {
        "type": "paragraph",
        "text": "为什么在粗网格物理模式里调小耗散或加入动能逆散射反而会增大误差，而纯 AI 模型又为何难以兼顾长时效精度与小尺度结构？格点均方根误差把“涡旋强度对不对”和“涡旋位置准不准”混在了一起。为了把这两件事拆开，我们对预报后期（第 51–100 天）的水平速度场做二维傅里叶变换，在径向波数 $k$ 空间考察三个无量纲指标：预测动能与参考动能之比**能量比 $R$**（$R=1$ 表示能量水平与参考场一致）、度量预测与参考涡旋空间位置相干性的**位相对齐度 $A\\in[-1,1]$**（$A=1$ 表示位相完全对齐），以及误差能量与参考能量之比**归一化谱误差 $Q$**。三者满足精确恒等式："
      },
      {
        "type": "equation",
        "text": "Q=R+1-2A\\sqrt{R},\\qquad\\Delta Q=\\underbrace{\\Delta R}_{\\Delta Q_{\\mathrm{amp}}}\\,\\underbrace{-2\\Delta(A\\sqrt{R})}_{\\Delta Q_{\\mathrm{align}}}."
      },
      {
        "type": "paragraph",
        "text": "这个简单的恒等式把湍流预报中的“双重惩罚（double penalty）”效应[7,8]写得非常透彻。在小尺度或长提前期下，涡旋的精确位置很难预测（位相对齐度 $A$ 接近 $0$），此时谱误差近似为 $Q\\approx 1+R$。如果一个模型激发出了很强的小尺度涡旋（$R$ 变大），但位置没有对准（$A$ 没有提升），多出来的能量就会变成纯粹的振幅惩罚（$\\Delta Q_{\\mathrm{amp}}=\\Delta R>0$），反而推高总误差 $Q$；反过来，如果一个模型为了讨好均方误差指标，干脆把不可预测的小尺度涡旋全部抹平（令 $R\\to 0$），虽然表面上降低了 $Q$，却丢掉了真实的海洋小尺度动力结构。"
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/velocity_spectra.png",
        "width": 2472,
        "height": 2488,
        "alt": "预报后期第51至100天的水平速度波数谱诊断",
        "caption": "图 4：预报后期（第 51–100 天）层厚加权的径向波数水平速度谱。四行分别对应四种混合配置（Implicit 逐时、Implicit 逐日、Explicit 逐时、Explicit 逐日）及其粗网格物理闭合基线（Smagorinsky、Biharmonic、Backscatter）。左列为动能比 $R(k)$，中列为归一化谱误差 $Q(k)$，右列为位相对齐度 $A(k)$，横轴为径向波数 $k$（周/格距，$\\mathrm{cpg}$）；浅色与深色阴影分别标出近网格波段（$0.25<k\\le 0.5\\text{ cpg}$）与角波数带。来源：[NeuralPOM 论文图 4](https://arxiv.org/abs/2611.02460)。"
      },
      {
        "type": "paragraph",
        "text": "对照图 4 的后期波数谱，三类方法的物理行为便一目了然："
      },
      {
        "type": "paragraph",
        "text": "在未校正粗网格上改用双调和粘性 Biharmonic 或动能逆散射 Backscatter，确实在近网格尺度注入了充沛的涡旋动能（图 4 左列虚线 $R(k)$ 明显抬升）；然而，仅凭粗网格自身的应变率并不能算出未分辨涡旋的真实空间位相（右列位相对齐度 $A(k)$ 未见改善），错位的涡旋能量直接转化为正向振幅惩罚 $\\Delta Q_{\\mathrm{amp}}>0$，推高了中列的总谱误差 $Q(k)$。"
      },
      {
        "type": "paragraph",
        "text": "五种纯数据驱动神经网络（Post）则走向了另一端：为了在逐点均方误差训练下规避位相惩罚，它们将近网格波段（$0.25<k\\le 0.5\\text{ cpg}$）的动能比 $R_{\\text{near-grid}}$ 强烈压低至 $0.07\\text{–}0.29$，表现为流场的小尺度平滑。"
      },
      {
        "type": "paragraph",
        "text": "相比之下，NeuralPOM（深蓝实线）依托底层原始方程求解器维持了物理可分辨的涡旋动能水平（高频逐时耦合下近网格能量比保持在 $1.0\\text{–}1.1$ 附近），同时依靠周期性神经状态更新拉升了中尺度波段的位相对齐度 $A(k)$，使谱误差 $Q(k)$ 的下降几乎全部来自位相对齐项的改善（$\\Delta Q_{\\mathrm{align}}<0$）。"
      },
      {
        "type": "paragraph",
        "text": "回顾从概念微分方程到三维混合模式 NeuralPOM 的搭建过程，我们最大的体会是：在三维海洋环流问题上，物理模式与人工智能并不是非此即彼的替代关系。让可微原始方程动力框架守住体积连续性、逐层热盐收支与近网格湍流变率，让受约束的神经网络专注于校准粗网格缺失的中尺度斜压位相，才能在百日积分中兼顾物理一致性与预报技巧。当前基准算例建立在零海表浮力通量的理想化双涡旋海盆之上，但这一耦合机制为迈向真实区域与全球海洋预报提供了清晰的蓝图。那么，当神经网络进入这个可微原始方程循环之后，跨物理求解器的反向传播梯度在训练中究竟什么时候不可或缺？为什么高频逐时耦合在带来最强环流引导的同时，会引发温盐—斜压反馈失稳？我们将在下一篇笔记中继续拆解。"
      },
      {
        "type": "heading",
        "text": "参考资料"
      },
      {
        "type": "references",
        "items": [
          "Fox-Kemper, B., Adcroft, A., Böning, C. W., et al. (2019). Challenges and Prospects in Ocean Circulation Models. *Frontiers in Marine Science*, 6, 65. https://doi.org/10.3389/fmars.2019.00065",
          "Hewitt, H. T., Roberts, M., Mathiot, P., et al. (2020). Resolving and Parameterising the Ocean Mesoscale in Earth System Models. *Current Climate Change Reports*, 6(4), 137–152. https://doi.org/10.1007/s40641-020-00164-w",
          "Cui, Y., Wu, R., Zhang, X., et al. (2025). Forecasting the eddying ocean with a deep neural network. *Nature Communications*, 16(1), 2268. https://doi.org/10.1038/s41467-025-57389-2",
          "El Aouni, A., Gaudel, Q., Regnier, C., et al. (2025). GLONET: Mercator's end-to-end neural global ocean forecasting system. *Journal of Geophysical Research: Machine Learning and Computation*, 2(3), e2025JH000686. https://doi.org/10.1029/2025JH000686",
          "Niu, Y., Huang, Q., Zhong, X., et al. (2026). A deep learning global ocean forecasting model with sub-daily and eddy-resolving resolution. *npj Climate and Atmospheric Science*, 9(1), 194. https://doi.org/10.1038/s41612-026-01444-2",
          "Chattopadhyay, A., Gray, M., Wu, T., Lowe, A. B., & He, R. (2024). OceanNet: a principled neural operator-based digital twin for regional oceans. *Scientific Reports*, 14(1), 21181. https://doi.org/10.1038/s41598-024-72145-0",
          "Leith, C. E. (1974). Theoretical skill of Monte Carlo forecasts. *Monthly Weather Review*, 102(6), 409–418. https://doi.org/10.1175/1520-0493(1974)102<0409:TSOMCF>2.0.CO;2",
          "Kochkov, D., Yuval, J., Langmore, I., et al. (2024). Neural general circulation models for weather and climate. *Nature*, 632(8027), 1060–1066. https://doi.org/10.1038/s41586-024-07744-y",
          "Zanna, L., Gregory, W., Perezhogin, P., et al. (2025). A framework for hybrid physics-AI coupled ocean models. *arXiv preprint*, arXiv:2510.22676. https://arxiv.org/abs/2510.22676",
          "Bolton, T., & Zanna, L. (2019). Applications of Deep Learning to Ocean Data Inference and Subgrid Parameterization. *Journal of Advances in Modeling Earth Systems*, 11(1), 376–399. https://doi.org/10.1029/2018MS001472",
          "Ross, A., Li, Z., Perezhogin, P., Fernandez-Granda, C., & Zanna, L. (2023). Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model. *Journal of Advances in Modeling Earth Systems*, 15(1), e2022MS003258. https://doi.org/10.1029/2022MS003258",
          "Frezat, H., Le Sommer, J., Fablet, R., Balarac, G., & Lguensat, R. (2022). A Posteriori Learning for Quasi-Geostrophic Turbulence Parametrization. *Journal of Advances in Modeling Earth Systems*, 14(11), e2022MS003124. https://doi.org/10.1029/2022MS003124",
          "Yan, F. E., Frezat, H., Le Sommer, J., Mak, J., & Otness, K. (2025). Adjoint-Based Online Learning of Two-Layer Quasi-Geostrophic Baroclinic Turbulence. *Journal of Advances in Modeling Earth Systems*, 17(7), e2024MS004857. https://doi.org/10.1029/2024MS004857",
          "Blumberg, A. F., & Mellor, G. L. (1987). A description of a three-dimensional coastal ocean circulation model. In *Three-Dimensional Coastal Ocean Models*, Coastal and Estuarine Sciences, Vol. 4, pp. 1–16, AGU. https://doi.org/10.1029/CO004p0001",
          "Xu, S., Huang, X., Oey, L.-Y., et al. (2015). POM.gpu-v1.0: a GPU-based Princeton Ocean Model. *Geoscientific Model Development*, 8(9), 2815–2827. https://doi.org/10.5194/gmd-8-2815-2015",
          "Mellor, G. L. (1991). An Equation of State for Numerical Models of Oceans and Estuaries. *Journal of Atmospheric and Oceanic Technology*, 8(4), 609–611. https://doi.org/10.1175/1520-0426(1991)008<0609:AEOSFN>2.0.CO;2",
          "Mellor, G. L., & Yamada, T. (1982). Development of a turbulence closure model for geophysical fluid problems. *Reviews of Geophysics*, 20(4), 851–875. https://doi.org/10.1029/RG020i004p00851",
          "Wu, H., Gao, Y., Shu, R., et al. (2025). Advanced long-term earth system forecasting by learning the small-scale nature. *arXiv preprint*, arXiv:2505.19432v1. https://arxiv.org/abs/2505.19432v1",
          "Gao, Z., Tan, C., Wu, L., & Li, S. Z. (2022). SimVP: Simpler yet better video prediction. In *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, pp. 3170–3180.",
          "Shi, X., Chen, Z., Wang, H., et al. (2015). Convolutional LSTM network: A machine learning approach for precipitation nowcasting. In *Advances in Neural Information Processing Systems (NeurIPS)*, Vol. 28, pp. 802–810.",
          "Wu, H., Xu, F., Chen, C., et al. (2023). PastNet: Introducing physical inductive biases for spatio-temporal video prediction. *arXiv preprint*, arXiv:2305.11421. https://doi.org/10.48550/arXiv.2305.11421"
        ]
      }
    ],
    "en": [
      {
        "type": "paragraph",
        "text": "In the previous note, we reviewed the conceptual connections between physical ocean models and data-driven methods. We described hybrid modeling as a differential equation that adds a neural correction to the physical tendency, and discussed the difference between offline and online training. Since then, a more concrete question has stayed with us: once we move beyond idealized two-dimensional quasi-geostrophic or shallow-water models to a three-dimensional primitive-equation ocean circulation model, what physical and numerical obstacles separate that conceptual equation from a working forecast system? Such a system must accommodate a moving free surface, barotropic–baroclinic mode splitting, three-dimensional temperature and salinity transport, a nonlinear equation of state, and vertical turbulence closure."
      },
      {
        "type": "paragraph",
        "text": "That question motivated **NeuralPOM**. Predicting the ocean's physical state and its long-term evolution requires a balance between physical conservation and mesoscale eddy accuracy at eddy-permitting resolution. Conventional coarse-grid models have limited spatial resolution: empirical subgrid closures cannot readily recover the spatial phase of unresolved mesoscale eddies from local strain in the resolved flow alone [1,2]. Purely data-driven neural forecasters offer fast single-step inference [3–5], but autoregressive forecasts over weeks to months can develop trajectory drift and smooth near-grid variability under a pointwise mean-squared-error (MSE) objective [6–8]. They also lack built-in volume, heat, and salt conservation [8,9]. In the second and third notes of this series, we use the development and experiments of NeuralPOM to discuss these design choices. This note covers the three-dimensional differentiable dynamics, the conservation-constrained state-update interface, and 100-day full-state forecasts with wavenumber diagnostics. The next examines staged training through the physical solver and the control of baroclinic feedback excited by frequent temperature and salinity updates."
      },
      {
        "type": "heading",
        "text": "Why put “new wine” into a three-dimensional primitive-equation model?"
      },
      {
        "type": "paragraph",
        "text": "Many studies of hybrid ocean modeling have used quasi-geostrophic or single-layer shallow-water models [10–13]. These are useful settings for testing algorithms, but they omit the three-dimensional baroclinic thermodynamics and fast–slow mode coupling central to operational ocean circulation models. We chose the title “New Wine in an Old Bottle” because our physical foundation is a classical three-dimensional circulation model with terrain-following coordinates: the Princeton Ocean Model (POM) [14,15]."
      },
      {
        "type": "paragraph",
        "text": "POM solves the hydrostatic, Boussinesq primitive equations on a horizontally staggered Arakawa-C grid with terrain-following vertical $\\sigma$ coordinates [14]. Here $\\sigma\\in[-1,0]$ extends from the surface $z=\\eta$ to the bottom $z=-h$, and the total water-column thickness is $H=h+\\eta$. Let $\\boldsymbol{u}_h=(u,v)$ be horizontal velocity, $w$ vertical velocity, $D_t$ the material derivative, $f$ the Coriolis parameter, $\\rho_0$ the reference seawater density, $p$ hydrostatic pressure, and $\\rho$ in-situ density. The tracers $C\\in\\{T,S\\}$ denote potential temperature and salinity; $\\mathcal{D}_m$ and $\\mathcal{D}_C$ are subgrid momentum and tracer mixing terms. The governing equations and vertically integrated free-surface continuity equation are:"
      },
      {
        "type": "equation",
        "text": "\\begin{aligned}\nD_t\\boldsymbol u_h+f\\boldsymbol e_z\\times\\boldsymbol u_h&=-\\rho_0^{-1}\\nabla_h p+\\mathcal D_m,\\\\\n\\partial_z p&=-g\\rho,\\qquad\\nabla_h\\cdot\\boldsymbol u_h+\\partial_z w=0,\\\\\nD_t C&=\\mathcal D_C,\\qquad\\partial_t\\eta+\\nabla_h\\cdot(H\\boldsymbol U)=0.\n\\end{aligned}"
      },
      {
        "type": "paragraph",
        "text": "In this system, potential temperature $T$ and salinity $S$ determine in-situ density $\\rho(T,S,P)$ through the nonlinear Mellor equation of state [16]. Density then sets the horizontal baroclinic pressure-gradient force through hydrostatic balance, $\\partial_z p=-g\\rho$. Vertical viscosity and diffusivity come from the Mellor–Yamada level-2.5 turbulence closure, which evolves turbulent kinetic energy and its product with the mixing length, $(q^2,q^2 l)$ [17]."
      },
      {
        "type": "paragraph",
        "text": "The first physical obstacle in turning this Fortran model into a differentiable framework is the **separation of fast and slow time scales**. In a basin 2000 m deep, surface gravity waves travel at approximately $\\sqrt{gh}\\approx 140\\text{ m s}^{-1}$, two orders of magnitude faster than a typical baroclinic velocity of about $1\\text{ m s}^{-1}$. To examine how external-mode time integration affects hybrid modeling, we implemented two differentiable frameworks in PyTorch. They share the same three-dimensional baroclinic, tracer, and turbulence operators, with an internal-mode time step of $\\Delta t=600\\text{ s}$."
      },
      {
        "type": "paragraph",
        "text": "The first is an **explicit mode-split framework (Explicit)**. It reproduces the standard POM mode-splitting algorithm: within each $600\\text{ s}$ baroclinic step, 30 short barotropic leapfrog substeps of $\\delta t=20\\text{ s}$ explicitly advance free-surface elevation $\\eta$ and depth-mean velocity $\\boldsymbol{U}=(U,V)$. Interval-mean surface elevation and face-volume transports are accumulated to keep the barotropic and baroclinic volume budgets consistent. During backpropagation, gradients pass directly through the unrolled barotropic substeps."
      },
      {
        "type": "paragraph",
        "text": "The second is a **semi-implicit free-surface framework (Implicit)**. It replaces the 30 barotropic substeps with an implicit time weight $\\alpha$ on the surface pressure gradient at the $600\\text{ s}$ baroclinic step. Solving for forward free-surface elevation $\\eta^f$ becomes a two-dimensional elliptic Helmholtz problem, $A_\\eta\\eta^f=b_\\eta$, where $L_H$ is the depth-weighted horizontal divergence–gradient operator:"
      },
      {
        "type": "equation",
        "text": "A_\\eta=I-4\\Delta t^2 g\\alpha L_{H^n},\\qquad A_\\eta\\eta^f=b_\\eta."
      },
      {
        "type": "paragraph",
        "text": "In the forward pass, we solve this elliptic equation using preconditioned conjugate gradients (PCG) with a discrete-sine-transform (DST) spectral preconditioner. Directly unrolling dozens of PCG iterations during backpropagation would consume substantial memory and introduce iteration-truncation error into the gradient. Instead, we use the self-adjoint property of $A_\\eta$ with respect to the cell-area matrix $M_A$, namely $A_\\eta^\\top=M_A A_\\eta M_A^{-1}$, to construct an **implicit-differentiation adjoint**. Given the upstream gradient of the loss $\\mathcal{L}$ with respect to forward elevation, $g_\\eta=\\partial\\mathcal{L}/\\partial\\eta^f$, one additional call to the same linear solver yields the adjoint field $\\lambda$ and the exact gradient with respect to any preceding state variable $\\zeta$:"
      },
      {
        "type": "equation",
        "text": "\\lambda=M_A A_\\eta^{-1}(M_A^{-1}g_\\eta),\\qquad\\frac{d\\mathcal L}{d\\zeta}=\\lambda^\\top\\left(\\frac{\\partial b_\\eta}{\\partial\\zeta}-\\frac{\\partial A_\\eta}{\\partial\\zeta}\\eta^f\\right)."
      },
      {
        "type": "paragraph",
        "text": "Before adding the neural network, we benchmarked both differentiable PyTorch frameworks against the original double-precision Fortran POM in 64-bit arithmetic. The cases included an idealized double-gyre basin, coastal tides, a stratified seamount, and a 15-day $\\mathrm{M}_2$ tidal simulation of Jiaozhou Bay with realistic coastlines and shoal bathymetry (Figure 1). The explicit framework agreed with Fortran to machine roundoff during spin-up. In the forced tidal equilibrium of Jiaozhou Bay, both differentiable frameworks kept domain-wide free-surface RMS differences below $0.2\\text{ mm}$. These tests provided a physical foundation for the subsequent 100-day coupled experiments."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/jiaozhou_bay_validation.png",
        "width": 3242,
        "height": 3631,
        "alt": "Jiaozhou Bay: 15-day tidal validation against Fortran POM",
        "caption": "Figure 1. A 15-day $\\mathrm{M}_2$ tidal validation case for Jiaozhou Bay with realistic bathymetry. (a) Coastal depth, southern and eastern open boundaries, and four tide-gauge locations. (b) Gauge elevation time series (top) and domain-wide, area-weighted free-surface elevation $\\eta$ RMSE relative to double-precision Fortran POM (bottom). (c–e) Day-15 reference elevation $\\eta$ and pointwise differences for Explicit and Implicit. (f–h) Day-15 water-column maximum horizontal speed and pointwise speed differences. Source: Figure 9 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "heading",
        "text": "Coupling a neural network safely to the primitive-equation state"
      },
      {
        "type": "paragraph",
        "text": "Once differentiable dynamics are available, the next question is how the neural network should modify the ocean state. In a simplified single-time-level model, adding predicted increments directly to the state may seem natural. In a three-dimensional primitive-equation solver, however, each physical step requires the complete 45-variable state vector at both the current ($n$) and historical ($b$) time levels. Early experiments showed that unconstrained state changes can immediately disrupt the water-column volume budget or leapfrog time-level consistency, exciting spurious external gravity waves or computational modes at the next physical step."
      },
      {
        "type": "paragraph",
        "text": "We therefore formulate NeuralPOM forecasts as an alternating cycle of physical integration and constrained state updates (Figure 2a). Let $x_n^+$ be the complete state after cycle $n$, $\\mathcal{P}^\\Delta$ the primitive-equation integration operator over interval $\\Delta$, and $\\mathcal{K}_\\theta$ the conservation-constrained neural update. We examine both high-frequency $\\Delta=1\\text{ h}$ and low-frequency $\\Delta=1\\text{ day}$ coupling:"
      },
      {
        "type": "equation",
        "text": "x_{n+1}^-=\\mathcal P^\\Delta(x_n^+),\\qquad x_{n+1}^+=\\mathcal K_\\theta(x_{n+1}^-)."
      },
      {
        "type": "paragraph",
        "text": "At the end of each physical interval, a residual U-Net takes three-dimensional velocity, temperature, and salinity at the current and historical time levels, together with two-dimensional external-mode fields. It produces raw horizontal-velocity and tracer increments $(\\delta u,\\delta v,\\delta T,\\delta S)$ on 15 active $\\sigma$ layers. Before these increments enter the model state, $\\mathcal{K}_\\theta$ applies three physical constraints."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/method_flow.png",
        "width": 2472,
        "height": 2298,
        "alt": "NeuralPOM physical–neural coupling and three training stages",
        "caption": "Figure 2. The physical–neural coupling cycle and three training stages in NeuralPOM. (a) At each coupling step, differentiable POM dynamics supply the ocean state to a residual U-Net. Raw velocity and tracer increments $(\\delta u,\\delta v,\\delta T,\\delta S)$ undergo column/layer-mean conservation projection, density-normal damping, and limiting. The resulting increments update both leapfrog time levels, density $\\rho$ is recomputed from the equation of state, and the next physical interval begins. (b–d) Single-step pretraining (Pretrain), multi-step differentiable training through the solver (Midtrain), and 10-day closed-loop training (Posttrain). Source: Figure 1 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "The first constraint **separates barotropic and baroclinic responsibilities**. Horizontal-velocity increments are projected to have zero thickness-weighted column mean. Potential-temperature and salinity increments are projected to have zero wet-volume-weighted mean within each active $\\sigma$ layer. Writing $\\langle\\cdot\\rangle_k$ for the wet-volume-weighted horizontal average in layer $k$:"
      },
      {
        "type": "equation",
        "text": "\\sum_{k=0}^{14}\\Delta\\sigma_k\\,\\delta\\boldsymbol u_{h,k}=\\boldsymbol 0,\\qquad\\langle\\delta T\\rangle_k=0,\\qquad\\langle\\delta S\\rangle_k=0."
      },
      {
        "type": "paragraph",
        "text": "This choice defines a physical division of labor. Removing the column-mean velocity increment confines the network's direct momentum correction to **baroclinic vertical shear**; vertically integrated volume transport remains controlled by external-mode continuity. Removing layer-mean temperature and salinity increments allows the network to redistribute heat and salt horizontally within each $\\sigma$ layer without introducing a net source into any layer. One useful consequence is that, although the network never directly changes free-surface elevation $\\eta$, its corrections to internal shear and stratification can still adjust sea-surface height through barotropic–baroclinic coupling during the next physical interval $\\mathcal{P}^\\Delta$."
      },
      {
        "type": "paragraph",
        "text": "The second constraint applies **Density-Normal Damping (DND)** and paired extrema limiting to temperature and salinity increments. It filters density-changing, diapycnal perturbations that can excite spurious baroclinic pressure gradients under high-frequency coupling. The third note examines this mechanism in detail."
      },
      {
        "type": "paragraph",
        "text": "The third constraint **updates the leapfrog time levels together**. The conservation-projected and damped increment $\\widehat{\\delta f}$ is added to both the current ($n$) and historical ($b$) levels:"
      },
      {
        "type": "equation",
        "text": "f^n\\leftarrow f^n+\\widehat{\\delta f},\\qquad f^b\\leftarrow f^b+\\widehat{\\delta f},\\qquad f\\in\\{u,v,T,S\\}."
      },
      {
        "type": "paragraph",
        "text": "Updating both levels preserves their difference, $f^n-f^b$, and avoids exciting the leapfrog computational mode through a jump at only one level. Three-dimensional seawater density $\\rho$ is then recomputed immediately using the nonlinear equation of state. Free-surface elevation $\\eta$, vertical velocity $w$, and turbulence variables adjust under the primitive equations during the next physical integration interval."
      },
      {
        "type": "heading",
        "text": "100-day full-state forecasts on a benchmark exceeding 100,000 model days"
      },
      {
        "type": "paragraph",
        "text": "To test the system with closed budgets and without sparse-observation or reanalysis-assimilation effects, we used a three-dimensional wind-driven double-gyre basin spanning $30^\\circ\\text{N}\\text{–}50^\\circ\\text{N}$, with a horizontal scale of $2500\\text{ km}$ and a depth of $2000\\text{ m}$. For each of the Explicit and Implicit frameworks, we integrated 8 fine-grid ensemble members at approximately $7\\text{ km}$ spacing, an eddy-resolving scale, for 9,000 model days per member: more than **100,000 model days** in total. Steady zonal wind stress generates subtropical and subpolar gyres, a strong eastward separating jet, and a developed three-dimensional mesoscale eddy field (Figure 3). Volume-weighted conservative restriction maps the fine-grid reference fields to an approximately $28\\text{ km}$ eddy-permitting forecast grid. We selected 16 initial dates from an independent ensemble member excluded from training and made continuous 100-day forecasts of the three-dimensional physical state."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/developed_surface_fields.png",
        "width": 900,
        "height": 900,
        "alt": "Developed fine-grid double-gyre circulation fields",
        "caption": "Figure 3. Developed three-dimensional circulation in the fine-grid wind-driven double-gyre reference dataset. Instantaneous fields on the uppermost active $\\sigma$ layer of the fine-grid Explicit simulation: (a) normalized relative vorticity $\\zeta/f$, (b) free-surface elevation $\\eta$, (c) potential temperature $T$, (d) zonal velocity $u$, (e) meridional velocity $v$, and (f) salinity $S$. Source: Figure 2 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "For 100-day forecasts, we compared two groups of baselines. The first comprises three classical subgrid closures in the same $28\\text{ km}$ coarse POM solver: standard second-order harmonic Smagorinsky diffusion, fourth-order biharmonic viscosity (Biharmonic), and kinetic-energy backscatter (Backscatter), which returns dissipated kinetic energy to the resolved flow. The second comprises five spatiotemporal neural architectures that advance all 313 state channels autoregressively at daily intervals without calling a physical solver: Triton [18], ResUNet, SimVP [19], ConvLSTM [20], and PastNet [21]. Each neural baseline completes single-step pretraining (Pre) followed by 10-day closed-loop training (Post)."
      },
      {
        "type": "paragraph",
        "text": "Two patterns emerge. First, relative to the coarse physical baseline, NeuralPOM reduces 100-day root-mean-square error (RMSE) for all five forecast variables $(u,v,\\mathrm{SSH},T,S)$ and equation-of-state diagnostic density $\\rho$ in both dynamical frameworks. Daily coupling reduces horizontal-velocity and sea-surface-height (SSH) errors by 5%–10% relative to Smagorinsky, with potential-temperature and salinity errors reduced by 10%–12% and 15%–18%, respectively. Hourly coupling with DND yields the greatest circulation and SSH improvement: 7%–10% lower horizontal-velocity errors and 12%–13% lower SSH errors. In contrast, replacing the closure on the uncorrected coarse grid with Biharmonic or Backscatter increases 100-day errors across variables by 4%–17%."
      },
      {
        "type": "table",
        "headers": [
          "Configuration",
          "$u\\ (\\mathrm{m\\,s^{-1}})\\downarrow$",
          "$v\\ (\\mathrm{m\\,s^{-1}})\\downarrow$",
          "$\\mathrm{SSH}\\ (\\mathrm{m})\\downarrow$",
          "$T\\ (^\\circ\\mathrm{C})\\downarrow$",
          "$S\\downarrow$"
        ],
        "rows": [
          [
            "Smagorinsky",
            "<u>0.07926</u>",
            "0.08197",
            "<u>0.11970</u>",
            "<u>0.29351</u>",
            "<u>0.03382</u>"
          ],
          [
            "Triton Pre",
            "0.09935",
            "0.09526",
            "0.21544",
            "0.79294",
            "0.21825"
          ],
          [
            "Triton Post",
            "0.08886",
            "0.08663",
            "0.14570",
            "0.36668",
            "0.10914"
          ],
          [
            "ResUNet Pre",
            "0.10189",
            "0.09767",
            "0.16460",
            "0.45770",
            "0.12531"
          ],
          [
            "ResUNet Post",
            "0.08267",
            "0.08401",
            "0.12812",
            "0.60935",
            "0.22609"
          ],
          [
            "SimVP Pre",
            "0.09434",
            "0.09123",
            "0.22382",
            "0.79226",
            "0.21567"
          ],
          [
            "SimVP Post",
            "0.08452",
            "<u>0.08180</u>",
            "0.13804",
            "0.63266",
            "0.25703"
          ],
          [
            "ConvLSTM Pre",
            "0.10088",
            "0.10351",
            "0.29508",
            "0.96630",
            "0.22385"
          ],
          [
            "ConvLSTM Post",
            "0.10222",
            "0.09665",
            "0.18062",
            "0.51404",
            "0.10723"
          ],
          [
            "PastNet Pre",
            "0.14249",
            "0.12674",
            "0.23017",
            "0.61166",
            "0.17605"
          ],
          [
            "PastNet Post",
            "0.10278",
            "0.10150",
            "0.17001",
            "0.77017",
            "0.26912"
          ],
          [
            "**NeuralPOM Post-DND (ours)**",
            "**0.07415**",
            "**0.07789**",
            "**0.11227**",
            "**0.26537**",
            "**0.02822**"
          ]
        ],
        "highlightedRow": 11,
        "caption": "Table 1. 100-day RMSE aggregated over 16 test initializations for hybrid NeuralPOM, the coarse physical baseline, and five direct neural forecasters, using the semi-implicit reference. The best result in each column is bold with a pale-green background; the runner-up is underlined, with ranks determined before rounding. Pre and Post denote single-step pretraining and 10-day closed-loop training; salinity $S$ is in model units. Source: Table 2 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "Second, the five purely data-driven architectures in Table 1 show substantial trajectory divergence over 100 days after single-step pretraining alone. Ten-day closed-loop training stabilizes the large-scale circulation and brings velocity $(u,v)$ and SSH errors close to the coarse physical baseline. However, the direct mappings still fail to maintain three-dimensional temperature and salinity $(T,S)$ structure at 100-day lead times: their salinity errors are 3 to 8 times those of the physical solver. NeuralPOM, embedded in differentiable primitive-equation dynamics, achieves the lowest error in every variable. Relative to the strongest direct neural baseline for each variable, it reduces horizontal-velocity and SSH errors by 5%–12%, potential-temperature error by 28%, and salinity error by 74%."
      },
      {
        "type": "heading",
        "text": "A spectral view of the opposing difficulties faced by physical closures and pure AI"
      },
      {
        "type": "paragraph",
        "text": "Why can reducing dissipation or adding backscatter increase coarse-model forecast error, and why do pure AI models struggle to retain both long-range accuracy and small-scale structure? Gridpoint RMSE combines two questions: whether an eddy has the right strength, and whether it is in the right place. To distinguish them, we Fourier-transform late-forecast horizontal velocities (days 51–100) and examine three dimensionless quantities at radial wavenumber $k$: the **energy ratio $R$** of predicted to reference kinetic energy ($R=1$ denotes matching energy); **phase alignment $A\\in[-1,1]$**, which measures spatial coherence between predicted and reference eddies ($A=1$ denotes perfect alignment); and **normalized spectral error $Q$**, the ratio of error energy to reference energy. They satisfy the exact identity:"
      },
      {
        "type": "equation",
        "text": "Q=R+1-2A\\sqrt{R},\\qquad\\Delta Q=\\underbrace{\\Delta R}_{\\Delta Q_{\\mathrm{amp}}}\\,\\underbrace{-2\\Delta(A\\sqrt{R})}_{\\Delta Q_{\\mathrm{align}}}."
      },
      {
        "type": "paragraph",
        "text": "This identity expresses the “double penalty” in turbulence forecasting [7,8]. At small scales or long lead times, precise eddy positions are difficult to predict, so phase alignment $A$ approaches $0$ and spectral error becomes approximately $Q\\approx 1+R$. If a model generates strong small-scale eddies, increasing $R$, without improving their positions or $A$, the extra energy becomes a positive amplitude penalty, $\\Delta Q_{\\mathrm{amp}}=\\Delta R>0$, and raises total error $Q$. Conversely, a model can lower the apparent error by smoothing away unpredictable small-scale eddies, taking $R\\to 0$, but it then loses real small-scale ocean dynamics."
      },
      {
        "type": "image",
        "src": "/images/blog/ocean-hybrid-ai-thinking-2/velocity_spectra.png",
        "width": 2472,
        "height": 2488,
        "alt": "Late-forecast velocity energy, error, and phase-alignment spectra",
        "caption": "Figure 4. Thickness-weighted radial horizontal-velocity spectra during days 51–100. The four rows show the four hybrid configurations (Implicit hourly, Implicit daily, Explicit hourly, Explicit daily) and coarse-grid physical closures (Smagorinsky, Biharmonic, Backscatter). Columns show energy ratio $R(k)$, normalized spectral error $Q(k)$, and phase alignment $A(k)$. The horizontal axis is radial wavenumber $k$ in cycles per grid spacing ($\\mathrm{cpg}$); light and dark shading identify the near-grid band ($0.25<k\\le 0.5\\text{ cpg}$) and corner-wavenumber band. Source: Figure 4 of the [NeuralPOM paper](https://arxiv.org/abs/2611.02460)."
      },
      {
        "type": "paragraph",
        "text": "The late-forecast spectra in Figure 4 distinguish three behaviors. On the uncorrected coarse grid, Biharmonic viscosity and Backscatter do supply additional near-grid eddy kinetic energy: dashed $R(k)$ curves rise in the left column. But the coarse-grid strain field alone does not recover unresolved eddy phases, and phase alignment $A(k)$ does not improve in the right column. Misplaced eddy energy becomes a positive amplitude penalty, $\\Delta Q_{\\mathrm{amp}}>0$, increasing total spectral error $Q(k)$ in the middle column."
      },
      {
        "type": "paragraph",
        "text": "The five purely data-driven networks (Post) move in the opposite direction. Under pointwise MSE training, they suppress the near-grid energy ratio $R_{\\text{near-grid}}$ to $0.07\\text{–}0.29$ in the band $0.25<k\\le 0.5\\text{ cpg}$, smoothing small-scale flow to avoid phase penalties."
      },
      {
        "type": "paragraph",
        "text": "NeuralPOM, shown by the dark-blue solid curves, uses the primitive-equation solver to maintain physically resolved eddy energy, with hourly near-grid energy ratios around $1.0\\text{–}1.1$. Periodic neural state updates simultaneously improve mesoscale phase alignment $A(k)$. Almost all of the reduction in spectral error $Q(k)$ comes from this alignment contribution, $\\Delta Q_{\\mathrm{align}}<0$."
      },
      {
        "type": "paragraph",
        "text": "Our main lesson from moving from a conceptual differential equation to three-dimensional NeuralPOM is that physical models and AI can play complementary roles in ocean circulation forecasting. Differentiable primitive-equation dynamics preserve volume continuity, layerwise heat and salt budgets, and near-grid turbulent variability. A constrained neural network can then concentrate on correcting the mesoscale baroclinic phase missing from the coarse grid. Together, these roles support physical consistency and forecast skill over 100 days. The present benchmark uses an idealized double-gyre basin with zero surface buoyancy flux, while the coupling design suggests a path toward regional and global ocean forecasts. Once a neural network is inside this differentiable primitive-equation cycle, when are gradients through the solver essential? Why can hourly coupling offer the strongest circulation correction while destabilizing tracer–baroclinic feedback? The next note takes up those questions."
      },
      {
        "type": "heading",
        "text": "References"
      },
      {
        "type": "references",
        "items": [
          "Fox-Kemper, B., Adcroft, A., Böning, C. W., et al. (2019). Challenges and Prospects in Ocean Circulation Models. *Frontiers in Marine Science*, 6, 65. https://doi.org/10.3389/fmars.2019.00065",
          "Hewitt, H. T., Roberts, M., Mathiot, P., et al. (2020). Resolving and Parameterising the Ocean Mesoscale in Earth System Models. *Current Climate Change Reports*, 6(4), 137–152. https://doi.org/10.1007/s40641-020-00164-w",
          "Cui, Y., Wu, R., Zhang, X., et al. (2025). Forecasting the eddying ocean with a deep neural network. *Nature Communications*, 16(1), 2268. https://doi.org/10.1038/s41467-025-57389-2",
          "El Aouni, A., Gaudel, Q., Regnier, C., et al. (2025). GLONET: Mercator's end-to-end neural global ocean forecasting system. *Journal of Geophysical Research: Machine Learning and Computation*, 2(3), e2025JH000686. https://doi.org/10.1029/2025JH000686",
          "Niu, Y., Huang, Q., Zhong, X., et al. (2026). A deep learning global ocean forecasting model with sub-daily and eddy-resolving resolution. *npj Climate and Atmospheric Science*, 9(1), 194. https://doi.org/10.1038/s41612-026-01444-2",
          "Chattopadhyay, A., Gray, M., Wu, T., Lowe, A. B., & He, R. (2024). OceanNet: a principled neural operator-based digital twin for regional oceans. *Scientific Reports*, 14(1), 21181. https://doi.org/10.1038/s41598-024-72145-0",
          "Leith, C. E. (1974). Theoretical skill of Monte Carlo forecasts. *Monthly Weather Review*, 102(6), 409–418. https://doi.org/10.1175/1520-0493(1974)102<0409:TSOMCF>2.0.CO;2",
          "Kochkov, D., Yuval, J., Langmore, I., et al. (2024). Neural general circulation models for weather and climate. *Nature*, 632(8027), 1060–1066. https://doi.org/10.1038/s41586-024-07744-y",
          "Zanna, L., Gregory, W., Perezhogin, P., et al. (2025). A framework for hybrid physics-AI coupled ocean models. *arXiv preprint*, arXiv:2510.22676. https://arxiv.org/abs/2510.22676",
          "Bolton, T., & Zanna, L. (2019). Applications of Deep Learning to Ocean Data Inference and Subgrid Parameterization. *Journal of Advances in Modeling Earth Systems*, 11(1), 376–399. https://doi.org/10.1029/2018MS001472",
          "Ross, A., Li, Z., Perezhogin, P., Fernandez-Granda, C., & Zanna, L. (2023). Benchmarking of Machine Learning Ocean Subgrid Parameterizations in an Idealized Model. *Journal of Advances in Modeling Earth Systems*, 15(1), e2022MS003258. https://doi.org/10.1029/2022MS003258",
          "Frezat, H., Le Sommer, J., Fablet, R., Balarac, G., & Lguensat, R. (2022). A Posteriori Learning for Quasi-Geostrophic Turbulence Parametrization. *Journal of Advances in Modeling Earth Systems*, 14(11), e2022MS003124. https://doi.org/10.1029/2022MS003124",
          "Yan, F. E., Frezat, H., Le Sommer, J., Mak, J., & Otness, K. (2025). Adjoint-Based Online Learning of Two-Layer Quasi-Geostrophic Baroclinic Turbulence. *Journal of Advances in Modeling Earth Systems*, 17(7), e2024MS004857. https://doi.org/10.1029/2024MS004857",
          "Blumberg, A. F., & Mellor, G. L. (1987). A description of a three-dimensional coastal ocean circulation model. In *Three-Dimensional Coastal Ocean Models*, Coastal and Estuarine Sciences, Vol. 4, pp. 1–16, AGU. https://doi.org/10.1029/CO004p0001",
          "Xu, S., Huang, X., Oey, L.-Y., et al. (2015). POM.gpu-v1.0: a GPU-based Princeton Ocean Model. *Geoscientific Model Development*, 8(9), 2815–2827. https://doi.org/10.5194/gmd-8-2815-2015",
          "Mellor, G. L. (1991). An Equation of State for Numerical Models of Oceans and Estuaries. *Journal of Atmospheric and Oceanic Technology*, 8(4), 609–611. https://doi.org/10.1175/1520-0426(1991)008<0609:AEOSFN>2.0.CO;2",
          "Mellor, G. L., & Yamada, T. (1982). Development of a turbulence closure model for geophysical fluid problems. *Reviews of Geophysics*, 20(4), 851–875. https://doi.org/10.1029/RG020i004p00851",
          "Wu, H., Gao, Y., Shu, R., et al. (2025). Advanced long-term earth system forecasting by learning the small-scale nature. *arXiv preprint*, arXiv:2505.19432v1. https://arxiv.org/abs/2505.19432v1",
          "Gao, Z., Tan, C., Wu, L., & Li, S. Z. (2022). SimVP: Simpler yet better video prediction. In *Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, pp. 3170–3180.",
          "Shi, X., Chen, Z., Wang, H., et al. (2015). Convolutional LSTM network: A machine learning approach for precipitation nowcasting. In *Advances in Neural Information Processing Systems (NeurIPS)*, Vol. 28, pp. 802–810.",
          "Wu, H., Xu, F., Chen, C., et al. (2023). PastNet: Introducing physical inductive biases for spatio-temporal video prediction. *arXiv preprint*, arXiv:2305.11421. https://doi.org/10.48550/arXiv.2305.11421"
        ]
      }
    ]
  }
};
