export type BlogLanguage = "zh" | "en";

export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "equation"; text: string }
  | { type: "references"; items: string[] }
  | { type: "slides"; basePath: string; count: number };

export type BlogPost = {
  slug: string;
  date: string;
  readTime: string;
  tags: string[];
  title: Record<BlogLanguage, string>;
  dek: Record<BlogLanguage, string>;
  content: Record<BlogLanguage, BlogBlock[]>;
};

const references = [
  "Sonnewald, M., Lguensat, R., Jones, D. C., Dueben, P. D., Brajard, J., and Balaji, V. Bridging observations, theory and numerical simulation of the ocean using machine learning. Environmental Research Letters, 2021. https://doi.org/10.1088/1748-9326/ac0eb0",
  "Kochkov, D., Yuval, J., Langmore, I., et al. Neural general circulation models for weather and climate. Nature, 2024. https://doi.org/10.1038/s41586-024-07744-y",
  "Rasp, S., Pritchard, M. S., and Gentine, P. Deep learning to represent subgrid processes in climate models. Proceedings of the National Academy of Sciences, 2018. https://doi.org/10.1073/pnas.1810286115",
  "Brenowitz, N. D., and Bretherton, C. S. Prognostic validation of a neural network unified physics parameterization. Geophysical Research Letters, 2018. https://doi.org/10.1029/2018GL078510",
  "Ross, A., Li, Z., Perezhogin, P., Fernandez-Granda, C., and Zanna, L. Benchmarking of machine learning ocean subgrid parameterizations in an idealized model. Journal of Advances in Modeling Earth Systems, 2023. https://doi.org/10.1029/2022MS003258",
  "Bolton, T., and Zanna, L. Applications of deep learning to ocean data inference and subgrid parameterization. Journal of Advances in Modeling Earth Systems, 2019. https://doi.org/10.1029/2018MS001472",
  "Guillaumin, A. P., and Zanna, L. Stochastic-deep learning parameterization of ocean momentum forcing. Journal of Advances in Modeling Earth Systems, 2021. https://doi.org/10.1029/2021MS002534",
  "Frezat, H., Le Sommer, J., Fablet, R., Balarac, G., and Lguensat, R. Coupled online learning as a way to tackle instabilities and biases in neural network parameterizations. Geoscientific Model Development, 2020. https://doi.org/10.5194/gmd-13-2185-2020",
  "Shen, C., Appling, A. P., Gentine, P., et al. Differentiable programming for Earth system modeling. Geoscientific Model Development, 2023. https://doi.org/10.5194/gmd-16-3123-2023",
  "Marotzke, J., Giering, R., Zhang, K. Q., Stammer, D., Hill, C., and Lee, T. Construction of the adjoint MIT ocean general circulation model and application to Atlantic heat transport sensitivity. Journal of Geophysical Research: Oceans, 1999. https://doi.org/10.1029/1999JC900236",
  "GLONET: Mercator's End-to-End Neural Global Ocean Forecasting System. Journal of Geophysical Research: Machine Learning and Computation, 2025. https://doi.org/10.1029/2025JH000686",
  "HybridOM: Hybrid Physics-Based and Data-Driven Global Ocean Modeling with Efficient Spatial Downscaling. arXiv, 2026. https://arxiv.org/abs/2602.00598",
  "Ocean-E2E: Hybrid Physics-Based and Data-Driven Global Forecasting of Extreme Marine Heatwaves with End-to-End Neural Assimilation. arXiv, 2025. https://arxiv.org/abs/2505.22071",
];

export const blogPosts: BlogPost[] = [
  {
    slug: "ocean-hybrid-ai-thinking-1",
    date: "June 1, 2026",
    readTime: "12 min read",
    tags: ["AI4Science", "Ocean Modeling", "Hybrid Models", "Differentiable Simulation"],
    title: {
      zh: "关于混合物理-AI海洋/大气模型的一些思考（1）",
      en: "Some Thoughts on Hybrid Physics-AI Ocean and Atmosphere Models (1)",
    },
    dek: {
      zh: "一篇关于海洋模拟、物理模型、数据驱动方法、在线训练和可微分动力核心的阶段性学习笔记。",
      en: "A working note on ocean simulation, physical models, data-driven methods, online training, and differentiable dynamical cores.",
    },
    content: {
      zh: [
        {
          type: "paragraph",
          text:
            "最近把之前答辩 PPT 里的内容重新翻了一遍（PPT放在最后了），也顺着这个题目想了一些问题。下面这些文字，是这段时间围绕海洋模拟、物理模型和数据驱动方法的一点阶段性理解。很多判断还不成熟，就当作抛砖引玉，也欢迎熟悉海洋模式、资料同化、机器学习建模和科学计算的老师、同学、同行批评指正。",
        },
        {
          type: "paragraph",
          text:
            "讲海洋预测，还是要先回到一个朴素的问题。我们到底想预测什么，又为什么这么难。海洋不是气候系统里的背景板，它参与能量、动量、淡水和碳的交换，也影响天气气候和很多具体决策。我们在模型里看到的是温度、盐度、流速、海表高度这些变量，往深处说，是在尝试用可计算的方式理解一个多尺度、强非线性、观测又很稀疏的系统。类似的判断，在近几年关于机器学习和海洋观测、理论、数值模拟结合的综述中也被反复提到 [1]。",
        },
        {
          type: "paragraph",
          text: "如果把某一时刻的海洋状态记作 x_t，它可以粗略理解为一个很高维的向量，里面装着不同空间位置、不同深度、不同变量的信息。预测问题最简单的写法，就是从当前状态走到下一时刻：",
        },
        { type: "equation", text: "x_{t+Δt} = 𝓕(x_t, t)" },
        {
          type: "paragraph",
          text:
            "传统数值模式做的事情，是用物理方程和数值格式来近似这个推进过程。它的价值很清楚。方程、边界条件、守恒关系、参数化方案，每一步都有来处，也能和我们熟悉的海洋动力过程对应起来。困难也很真实。海洋里有很多尺度很小、过程很复杂、又不能直接解析的东西。网格分辨率有限，湍流混合、涡旋、海气通量、近岸边界和地形都会带来额外的参数化问题。模式越复杂，计算越重；参数越多，调起来越难；时间一长，小误差还会慢慢积累。",
        },
        {
          type: "paragraph",
          text:
            "这几年机器学习模型进展很快，尤其是在天气预报里，已经给大家带来了很强的冲击。NeuralGCM 这类工作把神经网络和大气环流模型放到同一个预测框架里，说明 AI 天气模型已经开始从纯映射走向更结构化的物理融合（在后续的文章中会深入讨论） [2]。海洋领域自然也会关心这些方法。数据驱动模型可以把状态之间的映射直接学出来，形式上可以写成：",
        },
        { type: "equation", text: "x̂_{t+Δt} = 𝓝_θ(x_t)" },
        {
          type: "paragraph",
          text:
            "这里的 N_theta 是神经网络，theta 是需要从数据中学习的参数。它的吸引力在于推理快，表达能力强，也比较容易处理高维变量之间的复杂关系。但做长期海洋预测时，只看单步误差往往不够。模型每往前走一步，都会把自己上一步的输出再喂回去。短期看起来很小的偏差，可能会在滚动预测中逐渐扩散。大气参数化领域很早就发现，离线指标好，并不自动意味着接入动力系统以后也稳定 [3,4]。海洋次网格参数化的基准研究也提示了类似问题，真正难的是在线耦合后的稳定性和泛化能力 [5]。",
        },
        {
          type: "paragraph",
          text:
            "所以我现在更关心的，是 AI 怎样进入已有的物理框架，怎样和海洋模式中那些已经积累了很久的知识接在一起。一个比较自然的想法，是把已知的物理过程继续交给方程和数值求解器处理，把暂时写不准、算不细、参数化困难的部分，交给神经网络去学习。这样得到的混合物理和数据驱动模型，可以粗略写成：",
        },
        { type: "equation", text: "dx/dt = 𝓜_phys(x) + 𝓝_θ(x, p)" },
        {
          type: "paragraph",
          text:
            "这里 M_phys 表示已有物理模式中的趋势项，N_theta 可以表示可学习的闭合项、残差修正项或参数化项，p 可以包含外强迫、局地梯度、地形或其他辅助信息。Bolton 和 Zanna 早期关于海洋数据推断和次网格参数化的工作，已经很好地展示了深度学习进入海洋动力问题的方式 [6]；后续随机动量强迫、中尺度涡旋参数化和理想化海洋基准等研究，则把这个问题继续往模式嵌入和在线评估方向推进 [5,7]。",
        },
        {
          type: "paragraph",
          text:
            "这类方法里面，有一层区别很重要。弱物理约束通常还是以神经网络为主体，只是把物理知识放进损失函数、输入变量或网络结构中。比如加入守恒惩罚，加入梯度信息，或者让网络结构尊重某些对称性。强物理约束会往前走一步。它以数值求解器为主体，把神经网络嵌入动力方程内部。神经网络不再只是看历史数据做映射，而是要和模式一起往前走，参与每一次时间推进。这一套逻辑其实跟视频生成领域的 self-forcing 技术是类似的，都是通过多步监督训练的方式来减小误差。",
        },
        {
          type: "paragraph",
          text: "训练方式也会因此变得关键。离线训练比较直接，可以用高分辨率模拟或再分析资料构造监督样本，先训练出一个参数化模块，再接入模式。它的损失函数可以写得很简单：",
        },
        { type: "equation", text: "𝓛_offline(θ) = ‖𝓝_θ(x_t) - y_t‖²₂" },
        {
          type: "paragraph",
          text:
            "这里 y_t 可以是目标物理倾向、残差项或高分辨率资料给出的参考量。这个目标很清楚，就是让网络在当前样本上拟合得更好。问题在于，模式真正运行时面对的是多步反馈。一个参数化模块离线看起来很好，接进动力核心以后，仍然可能引起漂移、不稳定或过平滑。这一点在大气和海洋的很多研究里都已经反复出现 [3-5]。",
        },
        {
          type: "paragraph",
          text: "在线训练的想法，是让混合模型在训练阶段就滚动起来。我们不只看下一步准不准，也看未来几步之后还稳不稳。类似的 coupled online learning 工作已经把这个问题明确表述为缓解神经网络参数化不稳定和偏差的一条路径 [8]。一个简化写法是：",
        },
        { type: "equation", text: "𝓛_online(θ) = Σ_{k=1}^{K} ‖𝓗(x_{t+k}^θ) - y_{t+k}‖²₂ + λ𝓡(x_{t:t+K}^θ)" },
        {
          type: "paragraph",
          text:
            "这里 x_{t+k}^theta 是带有神经网络参数的混合模型滚动到第 k 步后的状态，H 可以表示从模式状态到可观测变量的映射，R 则可以放入一些物理约束或正则项。这件事听起来只是把损失函数写长了一点，实际要求很高。因为未来几步的误差要传回神经网络参数，动力核心本身就要能参与反向传播。换句话说，物理推进不只是外部模拟器，还要成为训练图的一部分。",
        },
        {
          type: "paragraph",
          text:
            "这就是可微分动力框架（Differential Dynamical Core）重要的原因。它听起来像一个技术名词，实际关系到在线训练能不能真正落地。关于这个话题，我推荐大家阅读一下这个综述 [9]，已经把可微分模型、伴随、自动微分和机器学习之间的关系梳理得很清楚。从海洋传统伴随模型到今天 JAX、PyTorch 等自动微分框架，技术路径在变化，核心问题其实很接近：如果想根据未来误差改进模型内部参数，物理推进过程就要允许梯度穿过去 [9,10]。",
        },
        {
          type: "paragraph",
          text:
            "在大气领域，已经有一些可微分模式和混合模型的探索。到了海洋这里，问题还会更麻烦。岸线和复杂地形会让网格和边界处理变得棘手，垂向结构和混合过程会带来额外尺度差异，温盐守恒、海表通量、海冰和开边界又会牵出更多细节。资料本身也不轻松。海洋观测稀疏，多源资料异质，再分析资料虽然方便，却包含模式偏差。训练集和验证集如果不够干净，模型学到的东西就很难判断到底来自真实海洋过程，还是来自资料系统的偏差。",
        },
        {
          type: "paragraph",
          text:
            "也正因为如此，最近一些更接近系统级海洋预测的工作值得关注。GLONET 把端到端神经全球海洋预报作为一个明确目标 [11]；HybridOM 尝试把一个相当简化的可微海洋动力框架和数据驱动修正放到同一个全球海洋建模框架里 [12]；Ocean-E2E 则把端到端神经同化和极端海洋热浪预报接在一起 [13]。这些工作还处在快速发展阶段，离成熟业务系统仍有很长一段路要走，但它们给出了一条值得探索的路线：海洋 AI 不能只停留在后处理订正或单步拟合上，它需要进入动力核心、状态估计和多步预测这几个更深的位置。",
        },
        {
          type: "paragraph",
          text:
            "最后说一点我自己粗浅的理解。海洋智能预测如果要继续往前走，不能只盯着更大的网络和更低的短期误差。动力核心、训练方式、物理一致性、资料约束和业务链条，都需要一起考虑。混合物理和数据驱动模型的吸引力，也正在这里。它给我们一个机会，把物理方程、数值求解、观测资料和可学习模块放到同一个可检验的框架里。这个框架现在还远没有成熟，尤其在真实海洋模式中还有很多工程和科学问题没有解决（事实上，这里面有相当多的“坑”，有很多问题我自己也没有琢磨清楚，我会在这个公众号持续更新）。目前可以预见的是，这种混合的建模方法，相对于“传统”的解决方案，具有以下几个优势：",
        },
        {
          type: "paragraph",
          text:
            "一是相对传统数据驱动模型，有着更长程的物理预测能力和更高的物理一致性，以及，最重要的，对 out-of-distribution（OOD）的建模能力。前半段其实已经是老生常谈了。因为混合模型保留了物理的框架，所以从理论上来讲，它应该具有更一致的物理和更稳定的模拟效果。不过需要指出的是，目前最前沿的一些纯粹数据驱动的模型，通过不断扩大神经网络的规模，其实已经可以做到十几年的稳定模拟（scaling law 发力了）。因此，在数据驱动模型“高歌猛进”的背景下，混合模型的这一点优势，究竟能达到什么样的程度，我觉得是非常有待商榷的。甚至于（个人暴论），十年之后，可能我们重新回看地球系统模型的发展，会发现这又是另外一个 The bitter lesson，也未可知。另外一点，也是我觉得更为重要的，就是对 OOD 状况的建模能力。我认为这个问题，从理论上来讲是纯数据驱动模型无法克服的。例如，100 年之后大气环流的整体分布可能会发生一个明显的偏移，从而导致 AI 模型无法去解析其中的规律。但是，无论这个分布怎么变，控制着大气运动规律的基本方程（primitive equations）是不会改变的。这个时候，混合模型的动力框架就可以发挥它的效用。",
        },
        {
          type: "paragraph",
          text:
            "二是相对传统的数值模型，理论上可以达到更高的建模精度（感谢神经网络的强大拟合能力），以及在一定程度上减轻计算开销。前者是非常显然的，因为神经网络可以直接建立从数据到数据的映射，帮助我们在浩如烟海的参数空间中找到最优值。后者其实不是一个严谨的判断，因为这里面其实存在着一个神经网络运算成本和动力框架运算成本的一个 trade-off。一个完善的动力框架，其实对神经网络的要求会相对放宽。而一个简化的框架，对神经网络的要求这会显著提高。如何将我们运行在 GPU 上的混合模型与运行在 CPU 集群上的数值模式进行公平的效率比较，也是一个值得思考的问题。",
        },
        {
          type: "paragraph",
          text:
            "这篇文章是系列的第一篇，主要为大家简单介绍一下相关的研究动机和最新的一些前沿进展。后续的篇章中，我会结合我自己做的一些相关工作去深度剖析一下这里面的一些技术细节和科学问题。",
        },
        { type: "heading", text: "参考文献" },
        { type: "references", items: references },
        { type: "heading", text: "附录：答辩 PPT 全部截图" },
        { type: "slides", basePath: "/images/blog/ocean-hybrid-post/slides", count: 24 },
      ],
      en: [
        {
          type: "paragraph",
          text:
            "I recently revisited the slides from an earlier defense presentation and used them as a starting point to think again about ocean simulation, physical models, and data-driven methods. The following notes are only a provisional understanding. Many judgments are still immature, so I treat this more as an invitation for discussion than as a finished argument.",
        },
        {
          type: "paragraph",
          text:
            "To talk about ocean prediction, it is useful to begin with a simple question: what exactly are we trying to predict, and why is it so difficult? The ocean is not a passive background of the climate system. It participates in the exchange of energy, momentum, freshwater, and carbon, and it affects weather, climate, and many concrete decisions. In models we see variables such as temperature, salinity, velocity, and sea-surface height. At a deeper level, we are trying to understand a multiscale, strongly nonlinear, and sparsely observed system in a computable way. Similar points have been repeatedly emphasized in recent reviews on machine learning, ocean observations, theory, and numerical simulation [1].",
        },
        { type: "paragraph", text: "If the ocean state at time t is denoted by x_t, it can be viewed as a high-dimensional vector containing variables at different locations, depths, and physical fields. The simplest form of the prediction problem is to advance the current state to the next time:" },
        { type: "equation", text: "x_{t+Δt} = 𝓕(x_t, t)" },
        {
          type: "paragraph",
          text:
            "Traditional numerical models approximate this time-advancement process through physical equations and numerical schemes. Their value is clear: equations, boundary conditions, conservation laws, and parameterizations all have physical interpretations. The difficulty is equally real. Many ocean processes are small-scale, complex, and not directly resolvable. Limited resolution, turbulent mixing, eddies, air-sea fluxes, coastal boundaries, and topography all introduce parameterization problems. The more complex the model, the heavier the computation; the more parameters it contains, the harder it is to tune; and over long integrations, small errors accumulate.",
        },
        {
          type: "paragraph",
          text:
            "Machine learning models have advanced rapidly in recent years, especially in weather forecasting. Work such as NeuralGCM places neural networks and atmospheric general circulation models in a single forecasting framework, suggesting that AI weather models are moving from pure mappings toward more structured physical integration [2]. The ocean community naturally cares about similar ideas. A data-driven model can directly learn the mapping between states:",
        },
        { type: "equation", text: "x̂_{t+Δt} = 𝓝_θ(x_t)" },
        {
          type: "paragraph",
          text:
            "Here N_theta is a neural network and theta denotes learnable parameters. The appeal is fast inference, strong expressiveness, and the ability to handle complex relationships among high-dimensional variables. For long-term ocean prediction, however, one-step error is not enough. Each rollout feeds the model output back as the next input. A small short-term bias may gradually spread during autoregressive prediction. Atmospheric parameterization studies have long shown that good offline scores do not automatically imply stability when the model is coupled back into a dynamical system [3,4]. Benchmarks for ocean subgrid parameterization point to a similar issue: the real difficulty lies in stability and generalization after online coupling [5].",
        },
        {
          type: "paragraph",
          text:
            "This is why I am more interested in how AI should enter existing physical frameworks and connect with the knowledge already accumulated in ocean models. A natural idea is to let equations and numerical solvers keep handling the physical processes we understand, while neural networks learn the parts that are hard to write down, expensive to resolve, or difficult to parameterize. A hybrid physics and data-driven model can be written schematically as:",
        },
        { type: "equation", text: "dx/dt = 𝓜_phys(x) + 𝓝_θ(x, p)" },
        {
          type: "paragraph",
          text:
            "Here M_phys is the tendency term from an existing physical model, N_theta may represent a learnable closure, residual correction, or parameterization, and p may include forcing, local gradients, topography, or other auxiliary information. Early work by Bolton and Zanna already showed how deep learning can enter ocean dynamics through data inference and subgrid parameterization [6]. Later studies on stochastic momentum forcing, mesoscale eddy parameterization, and idealized ocean benchmarks pushed the problem further toward model embedding and online evaluation [5,7].",
        },
        {
          type: "paragraph",
          text:
            "A distinction is important here. Weak physical constraints usually keep the neural network as the main model while injecting physics through losses, inputs, or architectures, such as conservation penalties, gradient features, or symmetry-aware networks. Strong physical constraints go further: the numerical solver remains the backbone, and the neural network is embedded inside the dynamical equations. The network is no longer only mapping historical data to the next state; it advances together with the model at every time step. This logic is also reminiscent of self-forcing in video generation, where multi-step supervision is used to reduce rollout error.",
        },
        { type: "paragraph", text: "Training strategy therefore becomes crucial. Offline training is straightforward: use high-resolution simulations or reanalysis data to create supervised samples, train a parameterization module, and then insert it into the model. A simple loss is:" },
        { type: "equation", text: "𝓛_offline(θ) = ‖𝓝_θ(x_t) - y_t‖²₂" },
        {
          type: "paragraph",
          text:
            "Here y_t may be a target physical tendency, a residual term, or a reference from high-resolution data. The objective is clear: fit the current sample. The problem is that a real model run faces multi-step feedback. A parameterization module that looks good offline may still cause drift, instability, or oversmoothing after it is coupled into the dynamical core. This has appeared repeatedly in both atmosphere and ocean studies [3-5].",
        },
        { type: "paragraph", text: "Online training lets the hybrid model roll out during training. We do not only ask whether the next step is accurate; we also ask whether the model remains stable several steps later. Coupled online learning has been proposed as one path to reducing instabilities and biases in neural network parameterizations [8]. A simplified objective is:" },
        { type: "equation", text: "𝓛_online(θ) = Σ_{k=1}^{K} ‖𝓗(x_{t+k}^θ) - y_{t+k}‖²₂ + λ𝓡(x_{t:t+K}^θ)" },
        {
          type: "paragraph",
          text:
            "Here x_{t+k}^theta is the state after k steps of a hybrid model with neural parameters, H maps model states to observable variables, and R can contain physical constraints or regularization. This looks like simply extending the loss over time, but it is technically demanding. Future errors must propagate back to neural parameters, meaning the dynamical core itself must participate in backpropagation. The physical solver is no longer an external simulator; it becomes part of the training graph.",
        },
        {
          type: "paragraph",
          text:
            "This is why a differentiable dynamical core matters. The phrase sounds technical, but it directly determines whether online training can be made practical. Reviews of differentiable programming for Earth system modeling explain the relationship among differentiable models, adjoints, automatic differentiation, and machine learning [9]. From traditional ocean adjoint models to modern JAX and PyTorch systems, the technical route has changed, but the core problem is similar: if future errors are to improve internal model parameters, gradients must pass through the physical time advancement [9,10].",
        },
        {
          type: "paragraph",
          text:
            "For the atmosphere, there have already been explorations of differentiable models and hybrid systems. In the ocean, things become more complicated. Coastlines and topography make grids and boundaries difficult; vertical structure and mixing introduce additional scale separation; salinity and temperature conservation, surface fluxes, sea ice, and open boundaries bring further details. The data are also challenging: observations are sparse, sources are heterogeneous, and reanalysis products contain model biases. If the training and validation data are not clean, it is hard to know whether a model has learned real ocean processes or artifacts from the data system.",
        },
        {
          type: "paragraph",
          text:
            "For this reason, recent system-level neural ocean prediction efforts are worth watching. GLONET frames end-to-end neural global ocean forecasting as an explicit goal [11]. HybridOM places a simplified differentiable ocean dynamical framework and data-driven correction into a global ocean modeling system [12]. Ocean-E2E connects end-to-end neural assimilation with extreme marine heatwave prediction [13]. These works are still developing rapidly and remain far from mature operational systems, but they suggest a route worth exploring: ocean AI should not stop at post-processing correction or one-step fitting. It needs to enter the dynamical core, state estimation, and multi-step prediction.",
        },
        {
          type: "paragraph",
          text:
            "My current understanding is still rough. If intelligent ocean prediction is to move forward, it cannot focus only on larger networks and lower short-term error. The dynamical core, training strategy, physical consistency, data constraints, and operational chain all have to be considered together. This is the appeal of hybrid physics and data-driven modeling: it gives us a way to place equations, numerical solvers, observations, and learnable modules in one testable framework. The framework is far from mature, especially in real ocean models where many scientific and engineering problems remain unresolved.",
        },
        {
          type: "paragraph",
          text:
            "Compared with traditional data-driven models, the first potential advantage is longer-range physically consistent prediction and, more importantly, better out-of-distribution modeling. The first part is familiar: because a hybrid model preserves a physical framework, it should in principle be more physically consistent and stable. But this advantage should not be overstated. State-of-the-art purely data-driven models, by scaling neural networks, can already produce stable simulations over many years. Whether hybrid models can maintain a decisive advantage under the momentum of scaling laws remains an open question. The more important point, in my view, is OOD behavior. A purely data-driven model cannot fully overcome this in principle. For example, the overall distribution of atmospheric circulation may shift substantially a century from now, making it difficult for an AI model to parse the pattern from training statistics alone. But the primitive equations governing atmospheric motion do not change with that distribution shift. This is where the dynamical framework of a hybrid model can matter.",
        },
        {
          type: "paragraph",
          text:
            "Compared with traditional numerical models, hybrid models may in principle improve modeling accuracy, thanks to the fitting ability of neural networks, and may reduce computational cost to some extent. The first point is straightforward: neural networks can learn mappings from data and help search a vast parameter space. The second point is less rigorous, because there is a trade-off between neural-network computation and dynamical-core computation. A complete dynamical framework may reduce the burden on the neural network, while a simplified framework may demand much more from it. How to fairly compare GPU-based hybrid models with CPU-cluster numerical models is itself a question worth thinking about.",
        },
        {
          type: "paragraph",
          text:
            "This is the first article in a series. It mainly introduces the motivation and some recent progress. In later pieces, I plan to discuss technical details and scientific questions through several related works that I have been involved in.",
        },
        { type: "heading", text: "References" },
        { type: "references", items: references },
        { type: "heading", text: "Appendix: Defense PPT Screenshots" },
        { type: "slides", basePath: "/images/blog/ocean-hybrid-post/slides", count: 24 },
      ],
    },
  },
];
