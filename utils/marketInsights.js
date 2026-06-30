const axios = require("axios");

const CATEGORY_PROFILES = {
  "Technology": {
    remoteBase: 74,
    outlook: "Strong",
    salaryNote: "Salary pressure stays high as product teams compete for engineers.",
    drivers: ["cloud migration", "mobile-first products", "AI-assisted workflows"],
    risks: ["rapid tool churn", "high competition for senior talent"],
    trends: ["AI copilots", "platform engineering", "product analytics"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build production-ready fundamentals",
        timeframe: "0-12 months",
        description:
          "Focus on core programming, shipping small products, and learning team workflows.",
      },
      {
        stage: "Mid",
        title: "Own features end to end",
        timeframe: "1-3 years",
        description:
          "Strengthen system design, testing, deployment, and collaboration across product teams.",
      },
      {
        stage: "Senior",
        title: "Specialize or lead architecture",
        timeframe: "3+ years",
        description:
          "Move into architecture, platform leadership, or a deep specialty such as AI or cloud.",
      },
    ],
    certifications: [
      { name: "AWS Certified Solutions Architect", provider: "AWS", why: "Signals cloud architecture readiness" },
      { name: "Google Cloud Digital Leader", provider: "Google Cloud", why: "Validates cloud strategy literacy" },
      { name: "Microsoft Certified: Azure Fundamentals", provider: "Microsoft", why: "Useful for cross-cloud environments" },
    ],
    learningPaths: [
      {
        title: "freeCodeCamp curriculum",
        url: "https://www.freecodecamp.org/learn/",
        type: "Course",
        duration: "Self-paced",
        provider: "freeCodeCamp",
      },
      {
        title: "Roadmap for modern engineers",
        url: "https://roadmap.sh/",
        type: "Guide",
        duration: "Self-paced",
        provider: "Roadmap.sh",
      },
      {
        title: "AWS Skill Builder",
        url: "https://skillbuilder.aws/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "AWS",
      },
    ],
  },
  "Data & AI": {
    remoteBase: 78,
    outlook: "Very strong",
    salaryNote: "Data and AI work keeps attracting premium pay as teams automate decisions.",
    drivers: ["analytics adoption", "automation", "generative AI", "decision intelligence"],
    risks: ["raising entry-level bar", "model deployment complexity"],
    trends: ["LLM applications", "MLOps", "analytics engineering"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn analysis and experimentation",
        timeframe: "0-12 months",
        description:
          "Build fluency in SQL, Python, statistics, and dashboards using real datasets.",
      },
      {
        stage: "Mid",
        title: "Turn data into decisions",
        timeframe: "1-3 years",
        description:
          "Own experimentation, forecasting, and communication with business stakeholders.",
      },
      {
        stage: "Senior",
        title: "Scale AI and analytics systems",
        timeframe: "3+ years",
        description:
          "Lead model strategy, data architecture, governance, or applied machine learning work.",
      },
    ],
    certifications: [
      { name: "Google Data Analytics Professional Certificate", provider: "Google", why: "Strong entry point for analysts" },
      { name: "IBM Data Science Professional Certificate", provider: "IBM", why: "Good applied data science signal" },
      { name: "Microsoft Azure AI Engineer Associate", provider: "Microsoft", why: "Useful for production AI roles" },
    ],
    learningPaths: [
      {
        title: "Kaggle Learn",
        url: "https://www.kaggle.com/learn",
        type: "Course",
        duration: "Self-paced",
        provider: "Kaggle",
      },
      {
        title: "Google ML crash course",
        url: "https://developers.google.com/machine-learning/crash-course",
        type: "Guide",
        duration: "10-15 hours",
        provider: "Google",
      },
      {
        title: "Microsoft Learn AI paths",
        url: "https://learn.microsoft.com/training/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "Microsoft",
      },
    ],
  },
  "Security": {
    remoteBase: 48,
    outlook: "Strong",
    salaryNote: "Security pay is climbing as organizations respond to threats and compliance pressure.",
    drivers: ["cloud security", "identity management", "regulatory compliance"],
    risks: ["incident-response fatigue", "tool sprawl"],
    trends: ["zero trust", "appsec automation", "security operations AI"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Master defensive fundamentals",
        timeframe: "0-12 months",
        description:
          "Learn networking, Linux, incident basics, and security tooling.",
      },
      {
        stage: "Mid",
        title: "Specialize in detection or testing",
        timeframe: "1-3 years",
        description:
          "Build depth in SOC operations, pentesting, cloud security, or governance.",
      },
      {
        stage: "Senior",
        title: "Lead risk and response strategy",
        timeframe: "3+ years",
        description:
          "Operate across architecture, policy, and response leadership.",
      },
    ],
    certifications: [
      { name: "CompTIA Security+", provider: "CompTIA", why: "Baseline credential for security roles" },
      { name: "Certified Ethical Hacker (CEH)", provider: "EC-Council", why: "Signals offensive testing skills" },
      { name: "CISSP", provider: "ISC2", why: "Valuable for senior security leadership" },
    ],
    learningPaths: [
      {
        title: "OWASP learning resources",
        url: "https://owasp.org/www-project-top-ten/",
        type: "Guide",
        duration: "Self-paced",
        provider: "OWASP",
      },
      {
        title: "CompTIA certification prep",
        url: "https://www.comptia.org/certifications/security",
        type: "Certificate",
        duration: "Self-paced",
        provider: "CompTIA",
      },
      {
        title: "ISC2 candidate resources",
        url: "https://www.isc2.org/certifications/cissp",
        type: "Certificate",
        duration: "Self-paced",
        provider: "ISC2",
      },
    ],
  },
  "Design": {
    remoteBase: 70,
    outlook: "Strong",
    salaryNote: "Design rewards people who pair strong taste with measurable product thinking.",
    drivers: ["product-led growth", "design systems", "accessibility"],
    risks: ["tool commoditization", "portfolio saturation"],
    trends: ["design systems", "motion design", "AI-assisted ideation"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn research and interface craft",
        timeframe: "0-12 months",
        description:
          "Practice wireframes, prototyping, accessibility, and user interviews.",
      },
      {
        stage: "Mid",
        title: "Design for outcomes",
        timeframe: "1-3 years",
        description:
          "Collaborate closely with product and engineering to improve conversion and retention.",
      },
      {
        stage: "Senior",
        title: "Lead systems and strategy",
        timeframe: "3+ years",
        description:
          "Own a design system, mentor peers, and connect design decisions to business outcomes.",
      },
    ],
    certifications: [
      { name: "Google UX Design Professional Certificate", provider: "Google", why: "Useful for structured UX training" },
      { name: "Figma Learn certificates", provider: "Figma", why: "Helps validate modern design tooling" },
      { name: "Nielsen Norman Group UX courses", provider: "NN/g", why: "Strong credibility for UX depth" },
    ],
    learningPaths: [
      {
        title: "Figma Learn",
        url: "https://www.figma.com/resources/learn-design/",
        type: "Course",
        duration: "Self-paced",
        provider: "Figma",
      },
      {
        title: "Nielsen Norman Group articles",
        url: "https://www.nngroup.com/articles/",
        type: "Guide",
        duration: "Self-paced",
        provider: "NN/g",
      },
      {
        title: "Coursera UX search",
        url: "https://www.coursera.org/search?query=ux%20design",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  "Medical & Health": {
    remoteBase: 22,
    outlook: "Strong",
    salaryNote: "Clinical and public-health work stays resilient even when other sectors cool.",
    drivers: ["population growth", "preventive care", "digital health"],
    risks: ["licensure requirements", "workforce strain"],
    trends: ["telemedicine", "health analytics", "patient-centered care"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build clinical or public-health foundations",
        timeframe: "0-18 months",
        description:
          "Focus on patient care, diagnostics, ethics, and record-keeping.",
      },
      {
        stage: "Mid",
        title: "Gain specialization",
        timeframe: "2-5 years",
        description:
          "Deepen your practice in a specialty area, research track, or community health role.",
      },
      {
        stage: "Senior",
        title: "Lead teams or programs",
        timeframe: "5+ years",
        description:
          "Move into advanced practice, research leadership, or health-system management.",
      },
    ],
    certifications: [
      { name: "Basic Life Support (BLS)", provider: "AHA or local accreditor", why: "Expected in many clinical settings" },
      { name: "Advanced Cardiovascular Life Support (ACLS)", provider: "AHA or local accreditor", why: "Useful for acute care roles" },
      { name: "Master of Public Health (MPH)", provider: "University program", why: "Strong for population-health careers" },
    ],
    learningPaths: [
      {
        title: "WHO training resources",
        url: "https://www.who.int/training",
        type: "Guide",
        duration: "Self-paced",
        provider: "WHO",
      },
      {
        title: "Coursera public health search",
        url: "https://www.coursera.org/search?query=public%20health",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
      {
        title: "CDC training and resources",
        url: "https://www.cdc.gov/training/index.html",
        type: "Guide",
        duration: "Self-paced",
        provider: "CDC",
      },
    ],
  },
  "Finance & Economics": {
    remoteBase: 54,
    outlook: "Steady",
    salaryNote: "Finance remains strong for people who can blend analysis, regulation, and business judgment.",
    drivers: ["risk management", "digital banking", "regulatory reporting"],
    risks: ["automation of routine tasks", "regulatory changes"],
    trends: ["embedded finance", "fraud analytics", "real-time risk monitoring"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build analysis fluency",
        timeframe: "0-12 months",
        description:
          "Strengthen Excel, reporting, valuation, and presentation skills.",
      },
      {
        stage: "Mid",
        title: "Own models and decisions",
        timeframe: "1-3 years",
        description:
          "Move into forecasting, scenario planning, or transaction support.",
      },
      {
        stage: "Senior",
        title: "Lead risk or strategy",
        timeframe: "3+ years",
        description:
          "Take on portfolio management, risk leadership, or finance transformation work.",
      },
    ],
    certifications: [
      { name: "CFA Program", provider: "CFA Institute", why: "Widely respected for investment roles" },
      { name: "ACCA Qualification", provider: "ACCA", why: "Strong accounting and reporting signal" },
      { name: "Financial Risk Manager (FRM)", provider: "GARP", why: "Useful for risk-heavy roles" },
    ],
    learningPaths: [
      {
        title: "CFA Institute resources",
        url: "https://www.cfainstitute.org/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "CFA Institute",
      },
      {
        title: "Corporate Finance Institute learning",
        url: "https://corporatefinanceinstitute.com/",
        type: "Course",
        duration: "Self-paced",
        provider: "CFI",
      },
      {
        title: "Coursera finance search",
        url: "https://www.coursera.org/search?query=finance",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  "Business & Management": {
    remoteBase: 60,
    outlook: "Strong",
    salaryNote: "Business roles are shifting toward data-driven leadership and cross-functional ownership.",
    drivers: ["digital transformation", "customer retention", "revenue operations"],
    risks: ["role overlap", "expectations for measurable impact"],
    trends: ["revops", "product-led growth", "AI-assisted operations"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn the operating model",
        timeframe: "0-12 months",
        description:
          "Develop communication, spreadsheet, process, and stakeholder skills.",
      },
      {
        stage: "Mid",
        title: "Own measurable outcomes",
        timeframe: "1-3 years",
        description:
          "Take responsibility for projects, revenue, or customer success metrics.",
      },
      {
        stage: "Senior",
        title: "Lead teams and strategy",
        timeframe: "3+ years",
        description:
          "Move into management, portfolio ownership, or transformation leadership.",
      },
    ],
    certifications: [
      { name: "Project Management Professional (PMP)", provider: "PMI", why: "Strong for cross-functional leadership" },
      { name: "Scrum Master certification", provider: "Scrum Alliance / Scrum.org", why: "Useful for agile delivery" },
      { name: "HubSpot inbound certification", provider: "HubSpot", why: "Valuable for growth and sales roles" },
    ],
    learningPaths: [
      {
        title: "HubSpot Academy",
        url: "https://academy.hubspot.com/",
        type: "Course",
        duration: "Self-paced",
        provider: "HubSpot",
      },
      {
        title: "PMI certification resources",
        url: "https://www.pmi.org/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "PMI",
      },
      {
        title: "Coursera business search",
        url: "https://www.coursera.org/search?query=business%20strategy",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  "Arts & Humanities": {
    remoteBase: 66,
    outlook: "Steady",
    salaryNote: "Creative and editorial roles now reward people who pair storytelling with digital distribution.",
    drivers: ["content demand", "brand storytelling", "multichannel publishing"],
    risks: ["platform shifts", "automation of low-value content"],
    trends: ["AI-assisted editing", "creator economy", "SEO/content ops"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Create a strong portfolio",
        timeframe: "0-12 months",
        description:
          "Build writing, design, or media samples and learn distribution basics.",
      },
      {
        stage: "Mid",
        title: "Own a content or creative lane",
        timeframe: "1-3 years",
        description:
          "Specialize in editorial, brand, multimedia, or UX content work.",
      },
      {
        stage: "Senior",
        title: "Lead narrative strategy",
        timeframe: "3+ years",
        description:
          "Move into creative direction, editorial leadership, or content operations.",
      },
    ],
    certifications: [
      { name: "Google News Initiative training", provider: "Google", why: "Useful for journalism and media workflows" },
      { name: "HubSpot content certification", provider: "HubSpot", why: "Good for content marketing roles" },
      { name: "Canva design school", provider: "Canva", why: "Helpful for visual communication" },
    ],
    learningPaths: [
      {
        title: "Canva Design School",
        url: "https://www.canva.com/designschool/",
        type: "Course",
        duration: "Self-paced",
        provider: "Canva",
      },
      {
        title: "Google News Initiative",
        url: "https://newsinitiative.withgoogle.com/",
        type: "Guide",
        duration: "Self-paced",
        provider: "Google",
      },
      {
        title: "Coursera writing search",
        url: "https://www.coursera.org/search?query=writing",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  Education: {
    remoteBase: 35,
    outlook: "Steady",
    salaryNote: "Education demand is stable, with the strongest gains in digital learning and tutoring.",
    drivers: ["edtech adoption", "curriculum modernization", "remote tutoring"],
    risks: ["budget constraints", "infrastructure gaps"],
    trends: ["hybrid learning", "adaptive assessment", "digital curriculum"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn instructional design",
        timeframe: "0-12 months",
        description:
          "Build lesson planning, assessment, and classroom management habits.",
      },
      {
        stage: "Mid",
        title: "Improve learning outcomes",
        timeframe: "1-3 years",
        description:
          "Work on curriculum, student support, and digital teaching methods.",
      },
      {
        stage: "Senior",
        title: "Lead programs and strategy",
        timeframe: "3+ years",
        description:
          "Coordinate departments, school strategy, or learning product design.",
      },
    ],
    certifications: [
      { name: "Teaching license / local certification", provider: "Education authority", why: "Required for many school roles" },
      { name: "Google for Education certification", provider: "Google", why: "Useful for digital classrooms" },
      { name: "Instructional design certificate", provider: "Coursera / university", why: "Strong for edtech and curriculum work" },
    ],
    learningPaths: [
      {
        title: "Google for Education",
        url: "https://edu.google.com/",
        type: "Course",
        duration: "Self-paced",
        provider: "Google",
      },
      {
        title: "UNESCO education resources",
        url: "https://www.unesco.org/en/education",
        type: "Guide",
        duration: "Self-paced",
        provider: "UNESCO",
      },
      {
        title: "Coursera teaching search",
        url: "https://www.coursera.org/search?query=teaching",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  Engineering: {
    remoteBase: 44,
    outlook: "Strong",
    salaryNote: "Engineering still rewards deep technical practice and project execution.",
    drivers: ["infrastructure buildout", "manufacturing modernization", "green engineering"],
    risks: ["capital cycle swings", "project delays"],
    trends: ["BIM", "smart infrastructure", "sustainability"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn core design tools",
        timeframe: "0-18 months",
        description:
          "Strengthen CAD, analysis, and project documentation skills.",
      },
      {
        stage: "Mid",
        title: "Own technical delivery",
        timeframe: "2-5 years",
        description:
          "Move into project leadership, site execution, or design specialization.",
      },
      {
        stage: "Senior",
        title: "Lead systems or projects",
        timeframe: "5+ years",
        description:
          "Progress into engineering management, consulting, or specialist design leadership.",
      },
    ],
    certifications: [
      { name: "AutoCAD certification", provider: "Autodesk", why: "Useful across design-heavy engineering roles" },
      { name: "Project Management Professional (PMP)", provider: "PMI", why: "Useful for delivery and coordination" },
      { name: "LEED Green Associate", provider: "USGBC", why: "Helpful for sustainable design and planning" },
    ],
    learningPaths: [
      {
        title: "Autodesk learning",
        url: "https://www.autodesk.com/learn",
        type: "Course",
        duration: "Self-paced",
        provider: "Autodesk",
      },
      {
        title: "MIT OpenCourseWare",
        url: "https://ocw.mit.edu/",
        type: "Guide",
        duration: "Self-paced",
        provider: "MIT",
      },
      {
        title: "Coursera engineering search",
        url: "https://www.coursera.org/search?query=engineering",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  },
  Law: {
    remoteBase: 28,
    outlook: "Steady",
    salaryNote: "Legal work stays competitive, with more demand for specialists in compliance and technology.",
    drivers: ["regulatory complexity", "commercial disputes", "privacy and compliance"],
    risks: ["billable-hour pressure", "document automation"],
    trends: ["legal tech", "privacy law", "AI governance"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build legal reasoning",
        timeframe: "0-12 months",
        description:
          "Strengthen research, writing, and argumentation across core practice areas.",
      },
      {
        stage: "Mid",
        title: "Choose a practice specialty",
        timeframe: "1-4 years",
        description:
          "Develop depth in corporate, litigation, IP, compliance, or policy work.",
      },
      {
        stage: "Senior",
        title: "Lead cases or counsel strategy",
        timeframe: "4+ years",
        description:
          "Move into senior advocacy, in-house counsel, or compliance leadership.",
      },
    ],
    certifications: [
      { name: "Compliance certification", provider: "ACAMS / ICA", why: "Useful for regulated sectors" },
      { name: "Privacy law training", provider: "IAPP", why: "Helpful in data and tech legal work" },
      { name: "Contract management certificate", provider: "University / vendor", why: "Useful for commercial practice" },
    ],
    learningPaths: [
      {
        title: "Coursera law search",
        url: "https://www.coursera.org/search?query=law",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
      {
        title: "IAPP privacy training",
        url: "https://iapp.org/training/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "IAPP",
      },
      {
        title: "Legal research resources",
        url: "https://www.law.cornell.edu/",
        type: "Guide",
        duration: "Self-paced",
        provider: "Cornell LII",
      },
    ],
  },
  Operations: {
    remoteBase: 34,
    outlook: "Steady",
    salaryNote: "Operations talent is becoming more data-driven as supply chains digitize.",
    drivers: ["inventory visibility", "automation", "procurement optimization"],
    risks: ["macro volatility", "infrastructure friction"],
    trends: ["supply-chain analytics", "automation", "vendor intelligence"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Learn process fundamentals",
        timeframe: "0-12 months",
        description:
          "Develop budgeting, inventory, and coordination habits.",
      },
      {
        stage: "Mid",
        title: "Optimize execution",
        timeframe: "1-3 years",
        description:
          "Use data to improve procurement, warehousing, or service operations.",
      },
      {
        stage: "Senior",
        title: "Lead operational strategy",
        timeframe: "3+ years",
        description:
          "Own planning, logistics networks, or operational transformation work.",
      },
    ],
    certifications: [
      { name: "APICS supply chain certification", provider: "ASCM", why: "Strong for supply chain management" },
      { name: "Lean Six Sigma", provider: "Various providers", why: "Signals process improvement skill" },
      { name: "Procurement certification", provider: "CIPS", why: "Useful for sourcing and purchasing" },
    ],
    learningPaths: [
      {
        title: "ASCM supply chain learning",
        url: "https://www.ascm.org/",
        type: "Certificate",
        duration: "Self-paced",
        provider: "ASCM",
      },
      {
        title: "Coursera supply chain search",
        url: "https://www.coursera.org/search?query=supply%20chain",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
      {
        title: "Microsoft Excel training",
        url: "https://support.microsoft.com/excel",
        type: "Guide",
        duration: "Self-paced",
        provider: "Microsoft",
      },
    ],
  },
  "Science & Research": {
    remoteBase: 28,
    outlook: "Strong",
    salaryNote: "Research careers improve when people can translate experiments into usable outcomes.",
    drivers: ["health innovation", "agritech", "biotech commercialization"],
    risks: ["funding cycles", "lab infrastructure constraints"],
    trends: ["bioinformatics", "digital labs", "translational research"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build lab and methods fluency",
        timeframe: "0-18 months",
        description:
          "Focus on experimental design, statistics, and documentation.",
      },
      {
        stage: "Mid",
        title: "Own a research stream",
        timeframe: "2-4 years",
        description:
          "Run studies, publish findings, and collaborate across teams.",
      },
      {
        stage: "Senior",
        title: "Lead research programs",
        timeframe: "4+ years",
        description:
          "Move into principal investigator, innovation, or scientific leadership roles.",
      },
    ],
    certifications: [
      { name: "Good Laboratory Practice (GLP)", provider: "Industry / institutional", why: "Important for regulated research" },
      { name: "Research methods certificate", provider: "University / online", why: "Builds methodological credibility" },
      { name: "Data analysis specialization", provider: "Coursera / edX", why: "Useful for modern scientific research" },
    ],
    learningPaths: [
      {
        title: "Nature careers",
        url: "https://www.nature.com/naturecareers",
        type: "Guide",
        duration: "Self-paced",
        provider: "Nature",
      },
      {
        title: "Coursera science search",
        url: "https://www.coursera.org/search?query=scientific%20research",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
      {
        title: "NIH training",
        url: "https://www.nih.gov/training",
        type: "Course",
        duration: "Self-paced",
        provider: "NIH",
      },
    ],
  },
};

const CAREER_ALIAS_MAP = {
  software_engineer: ["software engineer", "software developer", "backend developer", "backend engineer"],
  data_scientist: ["data scientist", "machine learning engineer", "ai engineer", "ml engineer"],
  web_developer: ["web developer", "frontend developer", "frontend engineer", "full stack developer"],
  devops_engineer: ["devops engineer", "site reliability engineer", "platform engineer"],
  cybersecurity_analyst: ["cybersecurity analyst", "security analyst", "information security analyst"],
  product_manager: ["product manager", "product owner", "product lead"],
  ux_designer: ["ux designer", "ui designer", "product designer"],
  mobile_developer: ["mobile developer", "android developer", "ios developer"],
  cloud_architect: ["cloud architect", "cloud engineer"],
  ai_engineer: ["ai engineer", "ml engineer", "machine learning engineer"],
  data_analyst: ["data analyst", "business intelligence analyst", "bi analyst"],
  blockchain_developer: ["blockchain developer", "web3 developer", "smart contract developer"],
  physician: ["physician", "medical doctor", "doctor"],
  nurse: ["nurse", "registered nurse", "rn"],
  pharmacist: ["pharmacist"],
  public_health_specialist: ["public health specialist", "epidemiologist", "public health analyst"],
  medical_researcher: ["medical researcher", "biomedical researcher"],
  financial_analyst: ["financial analyst", "fp&a analyst", "investment analyst"],
  investment_banker: ["investment banker", "m&a analyst"],
  accountant: ["accountant", "auditor", "cpa"],
  risk_manager: ["risk manager", "risk analyst"],
  graphic_designer: ["graphic designer", "visual designer"],
  content_writer: ["content writer", "copywriter", "editor"],
  journalist: ["journalist", "reporter", "news writer"],
  teacher_educator: ["teacher", "educator", "instructional designer"],
  translator: ["translator", "interpreter"],
  civil_engineer: ["civil engineer", "structural engineer"],
  mechanical_engineer: ["mechanical engineer"],
  electrical_engineer: ["electrical engineer", "electronics engineer"],
  environmental_engineer: ["environmental engineer", "sustainability engineer"],
  marketing_manager: ["marketing manager", "digital marketing manager", "brand manager"],
  human_resources_manager: ["human resources manager", "hr manager", "people operations"],
  lawyer: ["lawyer", "solicitor", "legal counsel", "attorney"],
  business_analyst: ["business analyst", "requirements analyst"],
  qa_engineer: ["qa engineer", "software tester", "test automation engineer"],
  sales_manager: ["sales manager", "account executive", "business development manager"],
  supply_chain_manager: ["supply chain manager", "logistics manager", "procurement manager"],
  customer_success_manager: ["customer success manager", "account manager", "client success manager"],
  dentist: ["dentist", "dental surgeon"],
  physiotherapist: ["physiotherapist", "physical therapist"],
  architect: ["architect", "building designer"],
  biotechnologist: ["biotechnologist", "bioscientist"],
  game_developer: ["game developer", "game designer", "unity developer"],
};

const sanitize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const slugify = (value) =>
  sanitize(value).replace(/\s+/g, "-");

const uniqueStrings = (values = []) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];

const mapCertification = (name, provider, why) => ({ name, provider, why });

const getCategoryProfile = (category) =>
  CATEGORY_PROFILES[category] ||
  {
    remoteBase: 45,
    outlook: "Steady",
    salaryNote: "This field remains stable for people who keep their skills current.",
    drivers: ["digital transformation", "specialization", "continuous learning"],
    risks: ["automation", "market saturation"],
    trends: ["AI-assisted workflows", "analytics", "specialization"],
    pathwayStages: [
      {
        stage: "Entry",
        title: "Build the fundamentals",
        timeframe: "0-12 months",
        description: "Focus on baseline skills and practical projects.",
      },
      {
        stage: "Mid",
        title: "Develop depth",
        timeframe: "1-3 years",
        description: "Increase autonomy, ownership, and technical range.",
      },
      {
        stage: "Senior",
        title: "Lead or specialize",
        timeframe: "3+ years",
        description: "Move into leadership, architecture, or niche expertise.",
      },
    ],
    certifications: [
      mapCertification("Project management certificate", "Various providers", "Useful across most professions"),
    ],
    learningPaths: [
      {
        title: "Coursera search",
        url: "https://www.coursera.org/search",
        type: "Course",
        duration: "Self-paced",
        provider: "Coursera",
      },
    ],
  };

const buildTrendingSkills = (career) => {
  const profile = getCategoryProfile(career.category);
  const skills = (career.topSkills || [])
    .slice()
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .map((skill) => skill.name)
    .filter(Boolean);

  return uniqueStrings([...skills, ...(profile.trends || [])]).slice(0, 8);
};

const buildAliases = (career) => {
  const map = CAREER_ALIAS_MAP[career.careerId] || [];
  return uniqueStrings([career.title, career.careerId, ...map, ...(career.aliases || [])]);
};

const buildDemandScore = (career) => {
  const demandMap = { "Very High": 92, High: 78, Medium: 58, Low: 34 };
  const demandScore = demandMap[career.demandLevel] || 50;
  const growthScore = Math.min(25, Math.max(0, Number(career.growthRate || 0) * 0.7));
  const openingsScore = Math.min(15, Math.max(0, Math.log10(Number(career.jobOpenings || 1)) * 5));
  return Math.round(Math.min(100, demandScore * 0.6 + growthScore + openingsScore));
};

const buildRemotePercent = (career) => {
  const profile = getCategoryProfile(career.category);
  const base = profile.remoteBase || 45;
  const adjustment = career.remote ? 12 : -16;
  const growthBump = Math.min(8, Math.max(0, Number(career.growthRate || 0) / 5));
  return Math.max(8, Math.min(92, Math.round(base + adjustment + growthBump)));
};

const buildHybridPercent = (career, remotePercent) => {
  if (!career.remote) return Math.max(10, Math.min(45, 30 + Math.round((career.growthRate || 0) / 4)));
  return Math.max(6, Math.min(32, Math.round((100 - remotePercent) * 0.55)));
};

const buildSalaryTrend = (career) => {
  const growth = Number(career.growthRate || 0);
  const direction = growth >= 18 ? "Rising fast" : growth >= 10 ? "Rising" : growth >= 5 ? "Stable" : "Flat";
  return {
    direction,
    yoyGrowthPct: Math.max(3, Math.round(growth * 0.6 + (career.trending ? 5 : 2))),
    note: getCategoryProfile(career.category).salaryNote,
  };
};

const buildIndustryGrowth = (career) => {
  const profile = getCategoryProfile(career.category);
  return {
    outlook: profile.outlook,
    growthRate: career.growthRate || 0,
    drivers: profile.drivers,
    risks: profile.risks,
  };
};

const buildCareerPathways = (career) => {
  const profile = getCategoryProfile(career.category);
  const skillHints = buildTrendingSkills(career).slice(0, 3);
  return profile.pathwayStages.map((stage, index) => ({
    ...stage,
    description:
      index === 0
        ? `${stage.description} Focus on ${skillHints.join(", ")}.`
        : stage.description,
  }));
};

const buildLearningPaths = (career) => {
  const profile = getCategoryProfile(career.category);
  return profile.learningPaths;
};

const buildCertifications = (career) => {
  const profile = getCategoryProfile(career.category);
  return profile.certifications;
};

const buildEmergingTrends = (career) => {
  const profile = getCategoryProfile(career.category);
  const title = String(career.title || "").toLowerCase();
  const extras = [];

  if (/ai|ml|data|science/.test(title)) extras.push("LLM workflows", "prompt engineering");
  if (/cloud|devops|infrastructure/.test(title)) extras.push("platform engineering", "observability");
  if (/design|ux|ui/.test(title)) extras.push("design systems", "accessibility");
  if (/health|medical|nurse|doctor|pharm|physio/.test(title)) extras.push("telehealth", "health analytics");
  if (/finance|account|risk|bank/.test(title)) extras.push("fraud analytics", "real-time reporting");
  if (/law|legal/.test(title)) extras.push("privacy law", "AI governance");
  if (/marketing|content|sales|customer/.test(title)) extras.push("revenue operations", "customer lifecycle analytics");

  return uniqueStrings([...(profile.trends || []), ...extras]).slice(0, 6);
};

const buildHiringTrend = (career) => {
  const demand = career.demandLevel || "Medium";
  if (career.trending || demand === "Very High") return "Accelerating";
  if (demand === "High" || (career.growthRate || 0) >= 12) return "Strong";
  if ((career.growthRate || 0) >= 6) return "Steady";
  return "Selective";
};

const buildCareerInsights = (career, options = {}) => {
  const updatedAt = options.updatedAt ? new Date(options.updatedAt) : new Date();
  const remotePercent = career.remotePercent ?? buildRemotePercent(career);
  const hybridPercent = career.hybridPercent ?? buildHybridPercent(career, remotePercent);
  const liveOpenings = career.liveOpenings ?? career.jobOpenings ?? 0;

  return {
    ...career,
    aliases: uniqueStrings(career.aliases || buildAliases(career)),
    demandScore: career.demandScore ?? buildDemandScore(career),
    salaryTrend: career.salaryTrend ?? buildSalaryTrend(career),
    industryGrowth: career.industryGrowth ?? buildIndustryGrowth(career),
    remotePercent,
    hybridPercent,
    hiringTrend: career.hiringTrend ?? buildHiringTrend(career),
    topHiringCompanies: uniqueStrings(career.topHiringCompanies || career.companies || []).slice(0, 5),
    trendingSkills: uniqueStrings(career.trendingSkills || buildTrendingSkills(career)).slice(0, 8),
    learningPaths: career.learningPaths?.length ? career.learningPaths : buildLearningPaths(career),
    certifications: career.certifications?.length ? career.certifications : buildCertifications(career),
    careerPathways: career.careerPathways?.length ? career.careerPathways : buildCareerPathways(career),
    emergingTrends: career.emergingTrends?.length ? career.emergingTrends : buildEmergingTrends(career),
    liveOpenings,
    marketUpdatedAt: career.marketUpdatedAt || updatedAt.toISOString(),
    marketSources: career.marketSources?.length
      ? career.marketSources
      : [
          {
            name: "Seeded career dataset",
            url: "https://www.themuse.com/api/public/jobs",
            type: "static",
            lastCheckedAt: updatedAt.toISOString(),
          },
        ],
  };
};

const CAREER_TO_MUSE_CATEGORY = (q) => {
  const t = String(q || "").toLowerCase();
  if (/nurs|doctor|physician|surgeon|healthcare|pharmacist|dentist|radiolog|midwif|paramedic|anaesth|physiother|occupational therap/.test(t))
    return "Healthcare & Medical";
  if (/full.?stack|web dev|frontend|front.end|back.?end|javascript dev|react dev|node dev|vue dev|angular dev/.test(t))
    return "Software Engineering";
  if (/software|mobile dev|ios dev|android dev|app dev|engineer/.test(t))
    return "Software Engineering";
  if (/data scien|machine learn|deep learn|nlp|artificial intel|computer vision|ml engineer/.test(t))
    return "Data & Analytics";
  if (/data analyst|business analyst|bi developer|tableau|power bi/.test(t))
    return "Data & Analytics";
  if (/devops|sre |cloud engineer|infrastructure|kubernetes|docker|sysadmin|network engineer/.test(t))
    return "Software Engineering";
  if (/cybersec|information security|penetration|security engineer/.test(t))
    return "Software Engineering";
  if (/product manager|product owner|product lead/.test(t))
    return "Product";
  if (/ux|ui design|graphic design|visual design|creative direct/.test(t))
    return "Design & UX";
  if (/teacher|tutor|educator|lecturer|professor|instructor|curriculum/.test(t))
    return "Teaching & Education";
  if (/accountant|auditor|finance|financial analyst|investment banker|economist|tax/.test(t))
    return "Finance";
  if (/marketing|seo|content strateg|growth hacker|brand manager|digital market/.test(t))
    return "Marketing & PR";
  if (/sales|account executive|business development|account manager/.test(t))
    return "Sales";
  if (/project manager|program manager|scrum master|agile coach/.test(t))
    return "Project & Program Management";
  if (/hr |human resource|recruiter|talent acquisition|people ops/.test(t))
    return "Human Resources & Recruiting";
  if (/lawyer|attorney|legal counsel|paralegal|compliance/.test(t))
    return "Legal";
  if (/operations|supply chain|logistics|procurement|warehouse/.test(t))
    return "Operations";
  if (/researcher|research scientist|biologist|chemist|lab tech/.test(t))
    return "Research";
  if (/social media|community manager|influencer/.test(t))
    return "Social Media & Community";
  return null;
};

const fetchLiveMarketSnapshot = async ({ query, category }) => {
  const safeQuery = String(query || "").replace(/[^a-zA-Z0-9\s\-]/g, "").trim().slice(0, 100);
  if (!safeQuery) return null;

  const museCategory = category || CAREER_TO_MUSE_CATEGORY(safeQuery);
  const baseParams = { descending: true };
  if (museCategory) baseParams.category = museCategory;

  try {
    const [r0, r1] = await Promise.all([
      axios.get("https://www.themuse.com/api/public/jobs", {
        params: { ...baseParams, page: 0 },
        timeout: 10000,
      }),
      axios.get("https://www.themuse.com/api/public/jobs", {
        params: { ...baseParams, page: 1 },
        timeout: 10000,
      }),
    ]);

    const jobs = [...(r0.data?.results || []), ...(r1.data?.results || [])];
    const total = Number(r0.data?.total || jobs.length || 0);
    const remoteCount = jobs.filter((job) => {
      const locationText = [
        job.locations?.[0]?.name,
        job.locations?.map((loc) => loc.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return /remote|flexible/.test(locationText);
    }).length;

    const companyCounts = {};
    jobs.forEach((job) => {
      const company = job.company?.name;
      if (!company) return;
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    });

    const topHiringCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const matchedRatio = jobs.length ? remoteCount / jobs.length : 0;
    const hiringTrend =
      total >= 2500
        ? "Strong"
        : total >= 1000
        ? "Steady"
        : total > 0
        ? "Niche"
        : "Limited";

    return {
      query: safeQuery,
      category: museCategory || "All Fields",
      source: "The Muse",
      sourceUrl: "https://www.themuse.com",
      liveOpenings: total,
      remotePercent: Math.round(matchedRatio * 100),
      topHiringCompanies,
      hiringTrend,
      marketUpdatedAt: new Date().toISOString(),
      marketSources: [
        {
          name: "The Muse Public Jobs API",
          url: "https://www.themuse.com/api/public/jobs",
          type: "live_jobs",
          lastCheckedAt: new Date().toISOString(),
        },
      ],
      sampleLocations: uniqueStrings(
        jobs
          .flatMap((job) => job.locations || [])
          .map((location) => location?.name)
          .filter(Boolean),
      ).slice(0, 5),
    };
  } catch (error) {
    return null;
  }
};

const createCareerIndex = (careers = []) => {
  const index = new Map();

  careers.forEach((career) => {
    const variants = [
      career.careerId,
      career.title,
      ...(career.aliases || []),
    ];

    variants
      .map((variant) => sanitize(variant))
      .filter(Boolean)
      .forEach((variant) => {
        if (!index.has(variant)) {
          index.set(variant, career);
        }
      });
  });

  return index;
};

const findCareerMatch = (query, careersOrIndex = []) => {
  const normalizedQuery = sanitize(query);
  if (!normalizedQuery) return null;

  const index = careersOrIndex instanceof Map
    ? careersOrIndex
    : createCareerIndex(careersOrIndex);

  if (index.has(normalizedQuery)) return index.get(normalizedQuery);

  for (const [key, value] of index.entries()) {
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      return value;
    }
  }

  return null;
};

const mergeLearningPaths = (primary = [], secondary = []) => {
  const seen = new Set();
  return [...primary, ...secondary].filter((item) => {
    const key = sanitize(item?.url || item?.title);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeMarketInsights = (career, liveSnapshot = null) => {
  const enriched = buildCareerInsights(career);
  if (!liveSnapshot) return enriched;

  return {
    ...enriched,
    liveOpenings: liveSnapshot.liveOpenings ?? enriched.liveOpenings,
    remotePercent: liveSnapshot.remotePercent ?? enriched.remotePercent,
    topHiringCompanies: liveSnapshot.topHiringCompanies?.length
      ? liveSnapshot.topHiringCompanies
      : enriched.topHiringCompanies,
    hiringTrend: liveSnapshot.hiringTrend || enriched.hiringTrend,
    marketUpdatedAt: liveSnapshot.marketUpdatedAt || enriched.marketUpdatedAt,
    marketSources: uniqueStrings([
      ...(enriched.marketSources || []).map((source) => JSON.stringify(source)),
      ...(liveSnapshot.marketSources || []).map((source) => JSON.stringify(source)),
    ]).map((source) => {
      try {
        return JSON.parse(source);
      } catch {
        return null;
      }
    }).filter(Boolean),
  };
};

const enrichRecommendationWithMarketData = (recommendation, marketIndexOrCareers = []) => {
  const marketCareer = findCareerMatch(
    recommendation.careerId || recommendation.title,
    marketIndexOrCareers,
  );

  if (!marketCareer) return recommendation;

  const enrichedMarket = buildCareerInsights(marketCareer);
  return {
    ...recommendation,
    category: recommendation.category || enrichedMarket.category,
    demand: recommendation.demand || enrichedMarket.demandLevel,
    demandLevel: enrichedMarket.demandLevel,
    averageSalary: recommendation.averageSalary || enrichedMarket.averageSalary,
    growthRate: recommendation.growthRate ?? enrichedMarket.growthRate,
    topSkills: enrichedMarket.topSkills,
    trendingSkills: enrichedMarket.trendingSkills,
    topHiringCompanies: enrichedMarket.topHiringCompanies,
    remotePercent: enrichedMarket.remotePercent,
    hiringTrend: enrichedMarket.hiringTrend,
    liveOpenings: enrichedMarket.liveOpenings,
    marketUpdatedAt: enrichedMarket.marketUpdatedAt,
    marketSources: enrichedMarket.marketSources,
    certifications: enrichedMarket.certifications,
    careerPathways: enrichedMarket.careerPathways,
    emergingTrends: enrichedMarket.emergingTrends,
    industryGrowth: enrichedMarket.industryGrowth,
    salaryTrend: enrichedMarket.salaryTrend,
    aliases: enrichedMarket.aliases,
    learningPaths: mergeLearningPaths(
      recommendation.learningPaths || [],
      enrichedMarket.learningPaths || [],
    ),
    marketMatch: {
      careerId: marketCareer.careerId,
      title: marketCareer.title,
    },
  };
};

module.exports = {
  CAREER_ALIAS_MAP,
  CAREER_TO_MUSE_CATEGORY,
  buildCareerInsights,
  buildLearningPaths,
  buildCertifications,
  buildCareerPathways,
  buildEmergingTrends,
  buildIndustryGrowth,
  buildSalaryTrend,
  buildTrendingSkills,
  buildDemandScore,
  buildRemotePercent,
  fetchLiveMarketSnapshot,
  createCareerIndex,
  findCareerMatch,
  mergeLearningPaths,
  mergeMarketInsights,
  enrichRecommendationWithMarketData,
  sanitize,
  slugify,
};
