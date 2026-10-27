/**
 * Single source of truth for every word on the site.
 * Edit this file to change content — scene and UI code never hard-code copy.
 */

export interface Link {
  readonly label: string;
  readonly href: string;
}

export interface Profile {
  readonly name: string;
  readonly shortName: string;
  readonly title: string;
  readonly pitch: string;
  readonly location: string;
  readonly availability: string;
  readonly summary: readonly string[];
  readonly portrait?: string;
}

export interface Job {
  readonly company: string;
  readonly role: string;
  readonly start: string;
  readonly end: string;
  readonly location?: string;
  readonly achievements: readonly string[];
  readonly tech: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: readonly string[];
  readonly stack: readonly string[];
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  /** Path under /public. Omit to show a drawn placeholder card. */
  readonly image?: string;
}

export interface Skill {
  readonly name: string;
  /** 0–100, rendered as a stat meter. */
  readonly level: number;
}

export interface SkillGroup {
  readonly tool: string;
  readonly category: string;
  readonly skills: readonly Skill[];
}

export interface Education {
  readonly degree: string;
  readonly school: string;
  readonly years: string;
}

export interface Contact {
  readonly email: string;
  readonly linkedin: string;
  readonly github: string;
  /** Formspree form id (the part after /f/). Empty string falls back to mailto. */
  readonly formspreeId: string;
}

export interface Portfolio {
  readonly profile: Profile;
  readonly jobs: readonly Job[];
  readonly projects: readonly Project[];
  readonly skillGroups: readonly SkillGroup[];
  readonly education: readonly Education[];
  readonly accomplishments: readonly string[];
  readonly funFacts: readonly string[];
  readonly contact: Contact;
  readonly resumeFile: string;
  readonly siteUrl: string;
}

const GITHUB = 'https://github.com/Vinu-Balan';

export const portfolio: Portfolio = {
  profile: {
    name: 'Vinu Balan J',
    shortName: 'Vinu',
    title: 'Software Engineer — Full-Stack & Applied AI',
    pitch:
      'I build fast, production-grade web apps and AI features — from React interfaces to RAG pipelines on Azure.',
    location: 'Chennai, India',
    availability: 'Open to roles · Chennai or Bengaluru',
    summary: [
      'Software Engineer with 3+ years at AT&T building production web applications, backend services and AI-powered features end to end.',
      'I build responsive, high-performance interfaces with React, Next.js and TypeScript, and RESTful microservices with Python (FastAPI, Flask) and Node.js on Microsoft Azure with Docker and CI/CD.',
      'I develop and productionize LLM applications — Retrieval-Augmented Generation with data ingestion, embeddings, vector search, query rewriting and real-time streaming — and trained a custom machine-learning translation service used in production.',
      'Experienced in A/B testing (Adobe Target, Adobe Analytics), unit and end-to-end testing, performance tuning, code reviews and mentoring. Winner, AT&T Bounty Sprintathon 2025 ($50K).',
    ],
  },
  jobs: [
    {
      company: 'AT&T',
      role: 'Senior Associate Applications Developer',
      start: 'May 2024',
      end: 'Present',
      location: 'Chennai, India',
      achievements: [
        'Built high-performance, customer-facing apps with React, Next.js and TypeScript, integrated with backend REST APIs.',
        'Built ML-powered Python services on Azure that replaced paid third-party APIs, cutting operating cost while improving performance.',
        'Trained and shipped an English→Spanish machine-learning translation service, exposed to production apps via REST.',
        'Designed server-side A/B experimentation with Next.js and Adobe Target; analysed results in Adobe Analytics.',
        'Built Chrome extensions, automation tools and Next.js apps that removed vendor dependencies and saved the team 80+ hours.',
        'Mentored junior engineers and championed code reviews, reusable components and maintainable architecture.',
      ],
      tech: [
        'React',
        'Next.js',
        'TypeScript',
        'Python',
        'Node.js',
        'Azure',
        'Adobe Target',
        'Jenkins',
      ],
    },
    {
      company: 'AT&T',
      role: 'Staff Associate Technical Intern',
      start: 'May 2023',
      end: 'May 2024',
      location: 'Chennai, India',
      achievements: [
        'Developed modular, reusable React components supporting multiple product surfaces in production.',
        'Translated product requirements into production-ready features with product managers and designers.',
        'Analysed user data in Adobe Analytics and strengthened CI/CD workflows with Jenkins and Git.',
      ],
      tech: ['React', 'Next.js', 'JavaScript', 'Adobe Analytics', 'Jenkins', 'Jira'],
    },
    {
      company: 'Buddi.ai',
      role: 'Research Intern',
      start: 'Jun 2021',
      end: 'Dec 2021',
      achievements: [
        'Built an AI-powered resume-parsing platform in Python (Flask, spaCy, NLP) to extract structured data from unstructured resumes.',
        'Designed a graph-based filtering algorithm that processed millions of resumes for candidate matching.',
      ],
      tech: ['Python', 'Flask', 'spaCy', 'NLP', 'Machine Learning'],
    },
  ],
  projects: [
    {
      id: 'schemes-rag',
      name: 'Government Schemes Assistant',
      tagline: 'Full-stack RAG app with real-time streaming answers',
      description: [
        'FastAPI microservice with streaming endpoints and a Next.js conversational UI rendering responses as they arrive.',
        'Ingestion pipeline crawls, cleans and chunks Tamil Nadu and Government of India sites into ChromaDB embeddings.',
        'Query expansion, document scoring and retrieval filtering over a locally hosted LLM (Ollama, LangChain).',
        'PostgreSQL metadata, Redis caching, Docker, structured logging; tested with Jest and Playwright.',
      ],
      stack: [
        'Next.js',
        'TypeScript',
        'FastAPI',
        'LangChain',
        'ChromaDB',
        'Ollama',
        'PostgreSQL',
        'Redis',
        'Docker',
      ],
      repoUrl: GITHUB,
    },
    {
      id: 'ab-platform',
      name: 'Experimentation Platform',
      tagline: 'Self-serve A/B testing for product teams',
      description: [
        'Node.js REST backend and React / Next.js dashboards so product teams configure, run and analyse experiments without engineering support.',
        'Results visualisation that drives data-informed product decisions.',
      ],
      stack: ['React', 'Next.js', 'Node.js', 'REST APIs', 'Adobe Target'],
      repoUrl: GITHUB,
    },
    {
      id: 'resume-search',
      name: 'AI Resume Parser & Search',
      tagline: 'NLP-powered parsing and candidate discovery',
      description: [
        'Resume parsing and search web app with MongoDB data models and an interactive JavaScript interface for candidate discovery.',
      ],
      stack: ['Python', 'NLP', 'Django', 'MongoDB', 'JavaScript'],
      repoUrl: GITHUB,
    },
    {
      id: 'gesture-control',
      name: 'Hand-Gesture PC Control',
      tagline: 'Real-time gesture recognition drives the desktop',
      description: [
        'Real-time hand-gesture detection and classification with OpenCV and machine learning, plus a Flask backend and browser monitoring UI.',
      ],
      stack: ['Python', 'OpenCV', 'Machine Learning', 'Flask', 'JavaScript'],
      repoUrl: GITHUB,
    },
  ],
  skillGroups: [
    {
      tool: 'Hammer',
      category: 'Frontend',
      skills: [
        { name: 'React', level: 92 },
        { name: 'Next.js', level: 88 },
        { name: 'TypeScript', level: 88 },
        { name: 'Tailwind / SCSS', level: 82 },
      ],
    },
    {
      tool: 'Anvil',
      category: 'Backend & APIs',
      skills: [
        { name: 'Node.js / Express', level: 82 },
        { name: 'FastAPI / Flask', level: 84 },
        { name: 'REST & Microservices', level: 85 },
        { name: 'PostgreSQL / MongoDB / Redis', level: 75 },
      ],
    },
    {
      tool: 'Lantern',
      category: 'AI & LLM',
      skills: [
        { name: 'RAG & Vector Search', level: 85 },
        { name: 'LangChain / Ollama', level: 80 },
        { name: 'NLP & Model Training', level: 78 },
        { name: 'Prompt Engineering', level: 84 },
      ],
    },
    {
      tool: 'Saddlebag',
      category: 'Cloud, DevOps & Quality',
      skills: [
        { name: 'Azure & Docker', level: 80 },
        { name: 'CI/CD (Jenkins, Azure DevOps)', level: 78 },
        { name: 'Playwright / Jest / PyTest', level: 82 },
        { name: 'A/B Testing (Adobe Target)', level: 85 },
      ],
    },
  ],
  education: [
    {
      degree: 'MBA — Artificial Intelligence & Data Science',
      school: 'SRM Institute of Science and Technology, Chennai',
      years: '2025 – Present',
    },
    {
      degree: 'B.Tech — Artificial Intelligence & Data Science',
      school: 'Chennai Institute of Technology, Chennai',
      years: '2020 – 2024',
    },
  ],
  accomplishments: [
    'AT&T Bounty Sprintathon 2025 — Winner ($50K)',
    'AT&T Transformer Award · G.O.A.T Award · Service Excellence Award',
    'Smart India Hackathon — Winner (₹1 Lakh)',
    'Cognizant Prodigy Hackathon — Winner',
    'Tech Zeal Hackathon — Winner',
  ],
  funFacts: [
    'Won a $50K sprintathon bounty — the biggest haul this side of the river.',
    'Has won four hackathons. The sheriff stopped counting.',
    'Workflow automation saved his posse 80+ hours of chores.',
    'Taught a machine to speak Spanish. It still mispronounces "tumbleweed".',
  ],
  contact: {
    email: 'vinubalan2892002@gmail.com',
    linkedin: 'https://www.linkedin.com/in/vinu-balan-j-34a6791b7',
    github: GITHUB,
    formspreeId: '',
  },
  resumeFile: 'resume.pdf',
  siteUrl: 'https://vinu-balan.github.io/portfolio/',
};
