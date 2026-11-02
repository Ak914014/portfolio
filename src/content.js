// Portfolio copy is based on AJAY_KUMAR_CV_Draft.pdf.
// Keep six chapters and four projects to match the experience's camera sequence.
export const chapters = [
  {
    id: 'origin',
    title: 'Full stack developer',
    line: 'I build React interfaces, Node.js and Python APIs, and the services that connect them.',
    stats: [['~2.5 years', 'Project experience']],
  },
  {
    id: 'memory',
    title: 'From UI to API',
    line: 'Responsive interfaces, REST APIs, databases and asynchronous jobs. From user workflows to Docker deployment.',
  },
  {
    id: 'refraction',
    title: 'Tools I work with',
    line: 'JavaScript, TypeScript and Python. React on the frontend, Node.js and FastAPI on the backend.',
  },
  {
    id: 'work',
    title: 'Selected projects',
    line: 'Medical-device documentation, scientific software and a biotechnology company website.',
  },
  {
    id: 'threshold',
    title: 'Education',
    line: 'A foundation in computer applications, built on a broader undergraduate education.',
    stats: [
      ['MCA', 'Chandigarh University · 2021–2023'],
      ['Full Stack Developer', 'Coding Ninjas · 2023–2024 · Online'],
    ],
  },
  {
    id: 'network',
    title: 'Let’s connect',
    line: 'Based in India. Get in touch to discuss full stack development and software projects.',
  },
];

export const frameLabels = ['React', 'FastAPI', 'Node.js', 'PostgreSQL', 'Docker'];

export const networkTicker = 'REACT · FASTAPI · NODE.JS · POSTGRESQL · DOCKER · ';

const summaryMedia = (slug) => [
  { type: 'image', src: `/portfolio/ajay/${slug}-overview.svg`, label: 'Project overview' },
  { type: 'image', src: `/portfolio/ajay/${slug}-details.svg`, label: 'Contributions & stack' },
];

export const projects = [
  {
    id: 'mdr',
    name: 'MDR',
    tag: 'Documentation · Shared project',
    color: '#77a8ff',
    desc: 'MDR Technical Documentation and Approval Platform. Full stack contributor in a two-person team, both full stack. Contributed to structured submissions, review workflows, document exports and real-time notifications.',
    cover: { type: 'image', src: '/portfolio/ajay/mdr-overview.svg' },
    media: summaryMedia('mdr'),
  },
  {
    id: 'numol',
    name: 'NuMol',
    tag: 'Scientific software · Shared project',
    color: '#67dfc2',
    desc: 'NuMol Molecular Design Platform. Frontend and backend contributor, working with a four-person backend team and two-person frontend team. Contributed to interactive scientific interfaces, API integration, asynchronous ML jobs and deployment.',
    cover: { type: 'image', src: '/portfolio/ajay/numol-overview.svg' },
    media: summaryMedia('numol'),
  },
  {
    id: 'micro-crispr',
    name: 'Micro CRISPR',
    tag: 'Company website · Sole developer',
    color: '#ffae7a',
    desc: 'Micro CRISPR Website. Sole developer of a biotechnology company website with seven views, responsive navigation, animated transitions, a filterable pipeline, career applications and analytics.',
    cover: { type: 'image', src: '/portfolio/ajay/micro-crispr-overview.svg' },
    media: summaryMedia('micro-crispr'),
  },
  {
    id: 'ligand-explorer',
    name: 'Ligand Explorer',
    tag: 'Interactive visualization · Personal project',
    color: '#c3a0ff',
    desc: 'Ligand Explorer — Ligand Interaction Diagram. Personal full stack project for uploaded scientific structures and interactive SVG contact diagrams, with upload APIs, visual filtering and containerized frontend and backend services.',
    cover: { type: 'image', src: '/portfolio/ajay/ligand-explorer-overview.svg' },
    media: summaryMedia('ligand-explorer'),
  },
];
