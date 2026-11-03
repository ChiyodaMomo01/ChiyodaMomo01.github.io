import type { BlogPostMetadata } from "./blogTypes";

export const thinking2Metadata: BlogPostMetadata = {
  slug: "ocean-hybrid-ai-thinking-2",
  date: "November 2026",
  readTime: "18 min read",
  title: {
    zh: "关于混合物理-AI海洋/大气模型的一些思考（2）",
    en: "Some Thoughts on Hybrid Physics-AI Ocean and Atmosphere Models (2)",
  },
  dek: {
    zh: "从三维可微海洋动力框架与守恒状态更新，到百日全状态预报和波数谱诊断。",
    en: "From three-dimensional differentiable ocean dynamics and conservative state updates to 100-day full-state forecasts and spectral diagnostics.",
  },
};

export const thinking3Metadata: BlogPostMetadata = {
  slug: "ocean-hybrid-ai-thinking-3",
  date: "November 2026",
  readTime: "18 min read",
  title: {
    zh: "关于混合物理-AI海洋/大气模型的一些思考（3）",
    en: "Some Thoughts on Hybrid Physics-AI Ocean and Atmosphere Models (3)",
  },
  dek: {
    zh: "分阶段在线训练、跨求解器梯度，以及高频耦合中温盐—斜压反馈与密度法向阻尼。",
    en: "Staged online training, gradients through the solver, and tracer–baroclinic feedback with density-normal damping under hourly coupling.",
  },
};

export const blogIndex: BlogPostMetadata[] = [
  thinking3Metadata,
  thinking2Metadata,
  {
    slug: "ocean-hybrid-ai-thinking-1",
    date: "June 1, 2026",
    readTime: "12 min read",
    title: {
      zh: "关于混合物理-AI海洋/大气模型的一些思考（1）",
      en: "Some Thoughts on Hybrid Physics-AI Ocean and Atmosphere Models (1)",
    },
    dek: {
      zh: "一篇关于海洋模拟、物理模型、数据驱动方法、在线训练和可微分动力核心的阶段性学习笔记。",
      en: "A working note on ocean simulation, physical models, data-driven methods, online training, and dynamical cores.",
    },
  },
];
