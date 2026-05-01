export type Publication = {
  title: string;
  authors: string;
  venue: string;
  date: string;
  role: "First author" | "Co-first author" | "Co-author";
  summary: string;
  links: { label: string; url: string }[];
  image?: string;
  imageStatus?: string;
};

const placeholder = "Representative figure pending manual extraction";

export const publications: Publication[] = [
  {
    title: "HybridOM: Hybrid Physics-Based and Data-Driven Global Ocean Modeling with Efficient Spatial Downscaling",
    authors: "Ruiqi Shu, Xiaohui Zhong, Qiusheng Huang, Ruijian Gou, Tianrun Gao, Hao Li, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2602.00598",
    date: "2026",
    role: "First author",
    summary: "A hybrid physics-based and data-driven framework for global ocean modeling with efficient spatial downscaling.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2602.00598" }],
    imageStatus: placeholder,
  },
  {
    title: "NeuralOM: Neural Ocean Model for Subseasonal-to-Seasonal Simulation",
    authors:
      "Yuan Gao, Hao Wu, Fan Xu, Yanfei Xiang, Ruijian Gou, Ruiqi Shu, Qingsong Wen, Xian Wu, Kun Wang, Xiaomeng Huang",
    venue: "AAAI 2026, pp. 14756-14764",
    date: "2026",
    role: "Co-author",
    summary: "A neural ocean model for stable subseasonal-to-seasonal ocean simulation with multi-scale interactive graph modeling.",
    links: [
      { label: "DBLP", url: "https://dblp.org/rec/conf/aaai/GaoWXXGSWWWH26" },
      { label: "arXiv", url: "https://arxiv.org/abs/2505.21020" },
      { label: "Code", url: "https://github.com/YuanGao-YG/NeuralOM" },
    ],
    imageStatus: placeholder,
  },
  {
    title: "Advancing Ocean State Estimation with efficient and scalable AI",
    authors: "Yanfei Xiang, Yuan Gao, Hao Wu, Quan Zhang, Ruiqi Shu, Xiao Zhou, Xian Wu, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2511.06041",
    date: "2025",
    role: "Co-author",
    summary: "An AI-driven ocean data assimilation framework for efficient, scalable, high-resolution ocean state estimation.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2511.06041" }],
    imageStatus: placeholder,
  },
  {
    title: "An Exterior-Embedding Neural Operator Framework for Preserving Conservation Laws",
    authors: "Huanshuo Dong, Hong Wang, Hao Wu, Zhiwei Zhuang, Xuanze Yang, Ruiqi Shu, Yuan Gao, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2511.16573",
    date: "2025",
    role: "Co-author",
    summary: "A neural operator framework designed to preserve conservation laws through exterior embedding.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2511.16573" }],
    imageStatus: placeholder,
  },
  {
    title: "Cracking the Code of Arctic Sea Ice: Why Models Fail to Predict Its Retreat?",
    authors: "Ruijian Gou, Gerrit Lohmann, Deliang Chen, Shiming Xu, Ruiqi Shu, Shaoqing Zhang, Lixin Wu",
    venue: "arXiv preprint arXiv:2511.04961",
    date: "2025",
    role: "Co-author",
    summary: "An analysis of why current models struggle to predict Arctic sea-ice retreat.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2511.04961" }],
    imageStatus: placeholder,
  },
  {
    title: "OneForecast: A Universal Framework for Global and Regional Weather Forecasting",
    authors:
      "Yuan Gao, Hao Wu, Ruiqi Shu, Huanshuo Dong, Fan Xu, Rui Ray Chen, Yibo Yan, Qingsong Wen, Xuming Hu, Kun Wang, Jiahao Wu, Qing Li, Hui Xiong, Xiaomeng Huang",
    venue: "ICML 2025, PMLR 267:18658-18697",
    date: "2025",
    role: "Co-first author",
    summary: "A global-regional nested forecasting framework that unifies weather prediction across spatial scales.",
    links: [
      { label: "PMLR", url: "https://proceedings.mlr.press/v267/gao25r.html" },
      { label: "OpenReview", url: "https://openreview.net/forum?id=9xGSeVolcN" },
      { label: "arXiv", url: "https://arxiv.org/abs/2502.00338" },
      { label: "Code", url: "https://github.com/YuanGao-YG/OneForecast" },
    ],
    imageStatus: placeholder,
  },
  {
    title: "Advanced long-term earth system forecasting by learning the small-scale nature",
    authors:
      "Hao Wu, Yuan Gao, Ruiqi Shu, Kun Wang, Ruijian Gou, Chuhan Wu, Xinliang Liu, Juncai He, Shuhao Cao, Junfeng Fang, Xingjian Shi, Feng Tao, Qi Song, Shengxuan Ji, Yanfei Xiang, Yuze Sun, Jiahao Li, Fan Xu, Huanshuo Dong, Haixin Wang, Fan Zhang, Penghao Zhao, Xian Wu, Qingsong Wen, Deliang Chen, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2505.19432",
    date: "2025",
    role: "Co-first author",
    summary: "Long-term Earth system forecasting by representing small-scale dynamics in data-driven models.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2505.19432" }],
    imageStatus: placeholder,
  },
  {
    title: "Turb-L1: Achieving Long-term Turbulence Tracing By Tackling Spectral Bias",
    authors: "Hao Wu, Yuan Gao, Ruiqi Shu, Zean Han, Fan Xu, Zhihong Zhu, Qingsong Wen, Xian Wu, Kun Wang, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2505.19038",
    date: "2025",
    role: "Co-first author",
    summary: "A long-term turbulence tracing method designed to reduce spectral bias.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2505.19038" }],
    imageStatus: placeholder,
  },
  {
    title: "Advanced forecasts of global extreme marine heatwaves through a physics-guided data-driven approach",
    authors: "Ruiqi Shu, Hao Wu, Yuan Gao, Fanghua Xu, Ruijian Gou, Wei Xiong, Xiaomeng Huang",
    venue: "Environmental Research Letters, 20(4), 044030",
    date: "Mar 2025",
    role: "First author",
    summary: "A physics-guided deep learning framework for ten-day global extreme marine heatwave forecasting.",
    links: [
      { label: "DOI", url: "https://doi.org/10.1088/1748-9326/adbddd" },
      { label: "arXiv", url: "https://arxiv.org/abs/2412.15532" },
    ],
    imageStatus: placeholder,
  },
  {
    title: "BeamVQ: Beam Search with Vector Quantization to Mitigate Data Scarcity in Physical Spatiotemporal Forecasting",
    authors:
      "Weiyan Wang, Xingjian Shi, Ruiqi Shu, Yuan Gao, Rui Ray Chen, Kun Wang, Fan Xu, Jinbao Xue, Shuaipeng Li, Yangyu Tao, Di Wang, Hao Wu, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2502.18925",
    date: "2025",
    role: "Co-author",
    summary: "A data augmentation approach for physical spatiotemporal forecasting under data scarcity.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2502.18925" }],
    imageStatus: placeholder,
  },
  {
    title: "Ocean-E2E: Hybrid Physics-Based and Data-Driven Global Forecasting of Extreme Marine Heatwaves with End-to-End Neural Assimilation",
    authors: "Ruiqi Shu, Yuan Gao, Hao Wu, Ruijian Gou, Kun Wang, Yanfei Xiang, Fan Xu, Qingsong Wen, Xiaomeng Huang",
    venue: "arXiv preprint arXiv:2505.22071",
    date: "2025",
    role: "Co-first author",
    summary: "Hybrid physics-based and data-driven forecasting of extreme marine heatwaves with end-to-end neural assimilation.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2505.22071" }],
    imageStatus: placeholder,
  },
  {
    title: "Impact of Downwelling-Favorable Winds on Eddy Formation in the West Greenland Current",
    authors: "Ruiqi Shu, Ruijian Gou, Clark Pennelly, Yaocheng Deng, Lixin Wu, Ke Xiao, Yitian Huang, Paul G. Myers",
    venue: "Journal of Physical Oceanography, 55(2), 191-201",
    date: "2025",
    role: "First author",
    summary: "A study of subarctic ocean dynamics and wind-driven eddy formation in the West Greenland Current.",
    links: [{ label: "DOI", url: "https://doi.org/10.1175/JPO-D-24-0053.1" }],
    imageStatus: placeholder,
  },
  {
    title: "Adaptive Universal Network for Ocean Vertical Velocity Reconstruction",
    authors: "Yuan Gao, Wei Xiong, Hao Wu, Ruiqi Shu, Xiaomeng Huang",
    venue: "AGU Fall Meeting Abstracts 2024, OS31C-0615",
    date: "2024",
    role: "Co-author",
    summary: "An AGU abstract on AI-based ocean vertical velocity reconstruction.",
    links: [
      {
        label: "Scholar",
        url: "https://scholar.google.com/scholar?q=Adaptive+Universal+Network+for+Ocean+Vertical+Velocity+Reconstruction",
      },
    ],
    imageStatus: "Conference abstract; representative figure pending",
  },
  {
    title: "A Scale-Aware Framework for Regional to Global Marine Heatwaves Forecast",
    authors: "Ruiqi Shu, Wei Xiong, Hao Wu, Yuan Gao, Ruijian Gou, Xiaomeng Huang",
    venue: "AGU Fall Meeting Abstracts 2024, OS31C-0613",
    date: "2024",
    role: "First author",
    summary: "An AGU abstract on scale-aware regional-to-global marine heatwave forecasting.",
    links: [
      {
        label: "Scholar",
        url: "https://scholar.google.com/scholar?q=A+Scale-Aware+Framework+for+Regional+to+Global+Marine+Heatwaves+Forecast",
      },
    ],
    imageStatus: "Conference abstract; representative figure pending",
  },
  {
    title: "Ocean-E2E: Hybrid Physics-Based and Data-Driven Global Forecasting of Marine Heatwaves with End-to-End Neural Assimilation",
    authors: "Ruiqi Shu, Ruijian Gou, Yanfei Xiang, Xiaomeng Huang",
    venue: "Manuscript listed on Google Scholar",
    date: "2025",
    role: "First author",
    summary: "A Scholar-listed earlier manuscript entry on end-to-end neural assimilation for marine heatwave forecasting.",
    links: [
      {
        label: "Scholar",
        url: "https://scholar.google.com/scholar?q=Ocean-E2E+Hybrid+Physics-Based+and+Data-Driven+Global+Forecasting+of+Marine+Heatwaves+with+End-to-End+Neural+Assimilation",
      },
    ],
    imageStatus: "Earlier Scholar entry; public manuscript link pending",
  },
];
