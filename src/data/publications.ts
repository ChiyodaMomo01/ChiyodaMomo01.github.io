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
    title: "NeuralOM: Neural Ocean Model for Subseasonal-to-Seasonal Simulation",
    authors: "Yuan Gao, Ruiqi Shu, Hao Wu, Fan Xu, Yanfei Xiang, Ruijian Gou, Qingsong Wen, Xian Wu, Xiaomeng Huang",
    venue: "AAAI 2026",
    date: "2026",
    role: "Co-first author",
    summary: "A neural ocean model for stable subseasonal-to-seasonal ocean simulation with multi-scale interactive graph modeling.",
    links: [
      { label: "AAAI", url: "https://doi.org/10.1609/aaai.v40i14.39366" },
      { label: "arXiv", url: "https://arxiv.org/abs/2505.21020" },
      { label: "Code", url: "https://github.com/YuanGao-YG/NeuralOM" },
    ],
    imageStatus: placeholder,
  },
  {
    title: "OneForecast: A Universal Framework for Global and Regional Weather Forecasting",
    authors: "Yuan Gao, Hao Wu, Ruiqi Shu, Huanshuo Dong, Fan Xu, Rui Ray Chen, Yibo Yan, Qingsong Wen, Xuming Hu, Kun Wang, Jiahao Wu, Qing Li, Hui Xiong, Xiaomeng Huang",
    venue: "ICML 2025",
    date: "2025",
    role: "Co-first author",
    summary: "A global-regional nested forecasting framework that unifies weather prediction across spatial scales.",
    links: [
      { label: "PMLR", url: "https://proceedings.mlr.press/v267/gao25c.html" },
      { label: "OpenReview", url: "https://openreview.net/forum?id=9xGSeVolcN" },
      { label: "arXiv", url: "https://arxiv.org/abs/2502.00338" },
      { label: "Code", url: "https://github.com/YuanGao-YG/OneForecast" },
    ],
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
    title: "Impact of Downwelling Favorable Winds on Eddy Formation in the West Greenland Current",
    authors: "Ruiqi Shu et al.",
    venue: "Journal of Physical Oceanography",
    date: "Jan 2025",
    role: "First author",
    summary: "A study of subarctic ocean dynamics and wind-driven eddy formation in the West Greenland Current.",
    links: [{ label: "Search", url: "https://scholar.google.com/scholar?q=Impact+of+Downwelling+Favorable+Winds+on+Eddy+Formation+in+the+West+Greenland+Current" }],
    imageStatus: "Awaiting publisher page or author-provided figure",
  },
  {
    title: "Advanced long-term earth system forecasting by learning the small-scale nature",
    authors: "Hao Wu, Yuan Gao, Ruiqi Shu, Kun Wang, Ruijian Gou, Chuhan Wu, Xinliang Liu, Juncai He, Shuhao Cao, Junfeng Fang, Xingjian Shi, Feng Tao, Qi Song, Shengxuan Ji, Yanfei Xiang, Yuze Sun, Jiahao Li, Fan Xu, Huanshuo Dong, Haixin Wang, Fan Zhang, Penghao Zhao, Xian Wu, Qingsong Wen, Deliang Chen, Xiaomeng Huang",
    venue: "Preprint",
    date: "May 2025",
    role: "Co-first author",
    summary: "Long-term Earth system forecasting by representing small-scale dynamics in data-driven models.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2505.19432" }],
    imageStatus: placeholder,
  },
  {
    title: "Ocean-E2E: Hybrid Physics-Based and Data-Driven Global Forecasting of Extreme Marine Heatwaves with End-to-End Neural Assimilation",
    authors: "Ruiqi Shu and collaborators",
    venue: "Submitted / under review",
    date: "May 2025",
    role: "Co-first author",
    summary: "Hybrid physics-based and data-driven forecasting of extreme marine heatwaves with neural assimilation.",
    links: [],
    imageStatus: "No public manuscript found during automated search",
  },
  {
    title: "Turb-L1: Achieving Long-term Turbulence Tracing By Tackling Spectral Bias",
    authors: "Hao Wu, Yuan Gao, Ruiqi Shu, Zean Han, Fan Xu, Zhihong Zhu, Qingsong Wen, Xian Wu, Kun Wang, Xiaomeng Huang",
    venue: "Preprint",
    date: "May 2025",
    role: "Co-first author",
    summary: "A long-term turbulence tracing method designed to reduce spectral bias.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2505.19038" }],
    imageStatus: placeholder,
  },
  {
    title: "BeamVQ: Beam Search with Vector Quantization to Mitigate Data Scarcity in Physical Spatiotemporal Forecasting",
    authors: "Weiyan Wang, Xingjian Shi, Ruiqi Shu, Yuan Gao, Rui Ray Chen, Kun Wang, Fan Xu, Jinbao Xue, Shuaipeng Li, Yangyu Tao, Di Wang, Hao Wu, Xiaomeng Huang",
    venue: "Preprint",
    date: "Feb 2025",
    role: "Co-author",
    summary: "A data augmentation approach for physical spatiotemporal forecasting under data scarcity.",
    links: [{ label: "arXiv", url: "https://arxiv.org/abs/2502.18925" }],
    imageStatus: placeholder,
  },
];
