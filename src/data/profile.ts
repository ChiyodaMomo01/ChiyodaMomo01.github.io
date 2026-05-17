export type NewsItem = {
  date: string;
  label: string;
  text: string;
};

export type TimelineItem = {
  date: string;
  title: string;
  place: string;
  detail: string;
};

export const profile = {
  name: "Ruiqi Shu",
  chineseName: "舒睿骐",
  title: "PhD Candidate · AI for Earth System Science",
  affiliation: "Department of Earth System Science, Tsinghua University",
  location: "Beijing, China",
  email: "srq24@mails.tsinghua.edu.cn",
  github: "https://github.com/ChiyodaMomo01",
  scholar: "https://scholar.google.com/citations?user=WKBB3r0AAAAJ&hl=zh-CN",
  scholarStatus: "Google Scholar citations: 103 · h-index: 5 · i10-index: 4",
  neuralPom: "https://neural-pom.vercel.app/",
  photo: "/images/shuruiqi.jpg",
  cv: "/files/ruiqi_shu_cv.pdf",
};

export const navItems = [
  ["About", "about"],
  ["News", "news"],
  ["Publications", "publications"],
  ["Awards", "awards"],
  ["Experience", "experience"],
  ["Service", "service"],
  ["Miscellaneous", "miscellaneous"],
  ["Visitors", "visitors"],
] as const;

export const news: NewsItem[] = [
  {
    date: "May 16, 2026",
    label: "KDD 2026",
    text: "Two papers were accepted to KDD 2026: Ocean-E2E to the AI4Sciences Track as first author, and An Exterior-Embedding Neural Operator Framework for Preserving Conservation Laws to the Research Track as co-author. Congratulations to all collaborators.",
  },
  {
    date: "May 2026",
    label: "ICML 2026",
    text: "First-author paper accepted to ICML 2026. Congratulations to all collaborators.",
  },
  {
    date: "Dec 2025",
    label: "AAAI 2026",
    text: "Co-authored paper accepted to AAAI 2026. Congratulations to all collaborators.",
  },
  {
    date: "May 2025",
    label: "ICML 2025",
    text: "Co-first-author work OneForecast accepted as an ICML 2025 poster. Congratulations to all collaborators.",
  },
  {
    date: "Mar 2025",
    label: "ERL",
    text: "First-author paper accepted by Environmental Research Letters. Congratulations to all collaborators.",
  },
  {
    date: "Dec 2024",
    label: "AGU 2024",
    text: "Presented A Scale-Aware Framework for Regional to Global Marine Heatwaves Forecast at the American Geophysical Union 2024 Fall Meeting.",
  },
  {
    date: "Dec 2024",
    label: "JPO",
    text: "First-author paper accepted by Journal of Physical Oceanography. Congratulations to all collaborators.",
  },
];

export const awards: TimelineItem[] = [
  {
    date: "2022",
    title: "National Scholarship",
    place: "Ministry of Education of the PRC",
    detail: "National-level scholarship awarded in China.",
  },
  {
    date: "2023",
    title: "National 2nd Prize",
    place: "Chinese Mathematics Competitions",
    detail: "National mathematics competition award.",
  },
  {
    date: "2022",
    title: "1st Prize",
    place: "China Undergraduate Mathematical Contest in Modeling",
    detail: "Undergraduate mathematical modeling competition.",
  },
  {
    date: "2019",
    title: "Silver Medal",
    place: "Chinese Mathematical Olympiad",
    detail: "National olympiad medal.",
  },
];

export const experience: TimelineItem[] = [
  {
    date: "Nov 2025 - Present",
    title: "Research Intern",
    place: "Shanghai Academy of AI for Science",
    detail: "Research internship on AI for Science and neural-physics modeling.",
  },
  {
    date: "Sep 2024 - Present",
    title: "PhD Candidate in Atmospheric Science",
    place: "Department of Earth System Science, Tsinghua University",
    detail: "Supervised by Xiaomeng Huang; focused on AI for Earth system science.",
  },
  {
    date: "Sep 2020 - Jun 2024",
    title: "BSc in Marine Science (Oceanography)",
    place: "Chongben Honors College, Ocean University of China",
    detail: "Undergraduate training in oceanography and geophysical fluid dynamics.",
  },
];

export const services = {
  reviewer: ["ICLR", "KDD", "ICML"],
  areas: ["AI4Science", "AI4PDE", "Geophysical Fluid Dynamics", "AI for Earth System Science"],
};

export const miscellaneous = {
  text: "I am also a road cycling enthusiast.",
  bikeImage: "/images/miscellaneous/road-bike.png",
};

export const visitorMap = {
  provider: "MapMyVisitors",
  linkUrl: "https://mapmyvisitors.com/web/1c4bu",
  imageUrl: "https://mapmyvisitors.com/map.png?d=F88uieSfA7NOO5A0OAHGaI14pJGmrc3xg-fyPCxT3Ww&cl=ffffff&w=640",
  imageSrcSet:
    "https://mapmyvisitors.com/map.png?d=F88uieSfA7NOO5A0OAHGaI14pJGmrc3xg-fyPCxT3Ww&cl=ffffff&w=640 1x, https://mapmyvisitors.com/map.png?d=F88uieSfA7NOO5A0OAHGaI14pJGmrc3xg-fyPCxT3Ww&cl=ffffff&w=960 2x",
  note: "A live visitor map plots approximate visitor locations using IP-based geolocation.",
};
