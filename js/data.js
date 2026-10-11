/**
 * EduConnect - Professor-Centered Architecture & Curriculum Data Catalog
 * Platform Priorities:
 * 1. Professors are the primary authority: they create classes, set rules, publish quizzes, conduct live sessions.
 * 2. Students only receive academic regulations, rules, and quizzes from professors they are actually enrolled with.
 * 3. No dummy example live sessions or quizzes — they are created exclusively by professors dynamically.
 * 4. Comprehensive B.Tech curriculum with 85+ subjects (> 50 total across 8 engineering disciplines).
 * 5. Comprehensive Diploma/Polytechnic curriculum with 65+ subjects across 6 engineering branches.
 * 6. Admin role completely removed.
 */

const ACADEMIC_LEVELS = {
  school: {
    label: "School Education (Class 1 to 12th)",
    grades: {
      "Class 1": ["Mathematics", "English", "General Science", "Environmental Studies"],
      "Class 2": ["Mathematics", "English", "General Science", "Environmental Studies"],
      "Class 3": ["Mathematics", "Science", "Social Studies", "English", "Regional Language"],
      "Class 4": ["Mathematics", "Science", "Social Studies", "English", "Regional Language"],
      "Class 5": ["Mathematics", "General Science", "Social Studies", "English", "Computer Basics"],
      "Class 6": ["Mathematics", "General Science", "Social Studies", "English", "Regional Language"],
      "Class 7": ["Mathematics", "General Science", "Social Science", "English", "Computer Studies"],
      "Class 8": ["Mathematics", "Physical Science", "Biological Science", "Social Studies", "English"],
      "Class 9": ["Mathematics", "Physical Science", "Biological Science", "Social Studies", "English"],
      "Class 10 (Board Exam)": ["Mathematics", "Physical Science", "Biological Science", "Social Studies", "English"],
      "Class 11 (MPC - Math, Physics, Chem)": ["Mathematics 1A", "Mathematics 1B", "Physics", "Chemistry", "English"],
      "Class 11 (BiPC - Biology, Physics, Chem)": ["Botany", "Zoology", "Physics", "Chemistry", "English"],
      "Class 12 (MPC - Board & Entrance)": ["Mathematics 2A", "Mathematics 2B", "Physics", "Chemistry", "Computer Science"],
      "Class 12 (BiPC - NEET & Board)": ["Botany", "Zoology", "Physics", "Chemistry", "English"]
    }
  },
  btech: {
    label: "B.Tech Engineering (AICTE Model Curriculum - 85+ Subjects)",
    branches: {
      "Computer Science & Engineering (CSE)": [
        "Problem Solving & C Programming",
        "Data Structures & Algorithms",
        "Digital Logic & Computer Organization",
        "Discrete Mathematics & Graph Theory",
        "Object-Oriented Programming (Java / C++)",
        "Operating Systems",
        "Database Management Systems (DBMS)",
        "Computer Networks",
        "Theory of Computation & Automata",
        "Design & Analysis of Algorithms",
        "Software Engineering & Agile",
        "Compiler Design",
        "Computer Architecture",
        "Cloud Computing & DevOps",
        "Web Technologies & Full Stack Development"
      ],
      "Artificial Intelligence & Data Science (AI & DS)": [
        "Foundations of Artificial Intelligence",
        "Machine Learning & Statistical Pattern Recognition",
        "Python for Data Science & Numerical Methods",
        "Probability & Statistics for Engineers",
        "Big Data Analytics & Spark",
        "Natural Language Processing (NLP)",
        "Deep Learning & Neural Networks",
        "Computer Vision & Image Processing",
        "Reinforcement Learning",
        "Data Mining & Data Warehousing"
      ],
      "Cyber Security & Information Assurance": [
        "Cryptography & Network Security",
        "Ethical Hacking & Penetration Testing",
        "Cyber Laws & Information Security Ethics",
        "Digital Forensics & Incident Response",
        "Application Security & OWASP Standards",
        "Malware Analysis & Reverse Engineering",
        "Identity & Access Management (IAM)",
        "Cloud Security & Zero Trust Architecture"
      ],
      "Electronics & Communication Engineering (ECE)": [
        "Electronic Devices & Semiconductor Physics",
        "Signals & Systems",
        "Network Theory & Circuit Analysis",
        "Analog Electronics & Op-Amps",
        "Digital System Design (Verilog / VHDL)",
        "Microprocessors (8086) & Microcontrollers (ARM)",
        "Electromagnetic Fields & Wave Propagation",
        "Analog & Digital Communication Systems",
        "Digital Signal Processing (DSP)",
        "VLSI Design & Chip Fabrication",
        "Embedded Systems & RTOS",
        "Wireless & Mobile Communications (5G / IoT)"
      ],
      "Electrical & Electronics Engineering (EEE)": [
        "Electrical Circuit Analysis",
        "DC Machines & Transformers",
        "AC Machines & Synchronous Motors",
        "Electromagnetic Field Theory",
        "Power Systems Analysis & Grid Transmission",
        "Control Systems Engineering",
        "Power Electronics & Inverters",
        "Electrical Measurements & Instrumentation",
        "Switchgear & Power System Protection",
        "Renewable Energy Systems & Smart Grids"
      ],
      "Mechanical Engineering (MECH)": [
        "Engineering Mechanics (Statics & Dynamics)",
        "Engineering Thermodynamics",
        "Strength of Materials & Solid Mechanics",
        "Fluid Mechanics & Hydraulic Machinery",
        "Kinematics & Dynamics of Machinery",
        "Manufacturing Technology & Metal Casting",
        "Heat & Mass Transfer",
        "Design of Machine Elements (DME)",
        "CAD/CAM & Finite Element Analysis (FEA)",
        "Automobile Engineering & IC Engines",
        "Refrigeration & Air Conditioning (RAC)",
        "Industrial Engineering & Operations Research"
      ],
      "Civil Engineering (CIVIL)": [
        "Surveying & Geomatics",
        "Mechanics of Solids & Structural Analysis",
        "Building Materials & Construction Technology",
        "Fluid Mechanics & Open Channel Hydraulics",
        "Geotechnical & Soil Mechanics",
        "Design of Reinforced Concrete (RCC) Structures",
        "Transportation & Highway Engineering",
        "Environmental Engineering & Wastewater Treatment",
        "Water Resources & Irrigation Engineering",
        "Design of Steel Structures",
        "Estimation, Costing & Valuation",
        "Construction Planning & Project Management"
      ],
      "Chemical Engineering (CHEM)": [
        "Chemical Process Calculations (Stoichiometry)",
        "Chemical Engineering Thermodynamics",
        "Fluid Flow Operations",
        "Heat Transfer Operations",
        "Mass Transfer Operations (Distillation/Absorption)",
        "Chemical Reaction Engineering (CRE)",
        "Process Dynamics & Instrumentation Control",
        "Plant Design & Process Economics"
      ]
    }
  },
  diploma: {
    label: "Diploma / Polytechnic (State Board Technical Curriculum - 65+ Subjects)",
    branches: {
      "Diploma in Computer Engineering": [
        "Computer Fundamentals & IT Tools",
        "Programming in C & Logic Development",
        "Data Structures using C/C++",
        "Web Design (HTML5, CSS3, JavaScript)",
        "Relational Database Management Systems (SQL)",
        "Computer Organization & Architecture",
        "Operating Systems (Linux & Windows Administration)",
        "Object-Oriented Programming with Java",
        "Computer Hardware Maintenance & Networking",
        "Software Engineering Principles",
        "Python Programming for Polytechnics",
        "Mobile Application Development"
      ],
      "Diploma in Mechanical Engineering": [
        "Applied Physics & Engineering Chemistry",
        "Engineering Graphics & CAD Drafting",
        "Workshop Practice (Fitting, Carpentry, Welding)",
        "Strength of Materials & Mechanics",
        "Thermal Engineering & Boiler Systems",
        "Fluid Mechanics & Pneumatics",
        "Manufacturing Processes (Lathe, Milling, Shaper)",
        "Theory of Machines & Mechanisms",
        "Machine Tool Technology & Metrology",
        "Machine Design Basics",
        "Automobile Engines & Maintenance",
        "Industrial Management & Plant Maintenance"
      ],
      "Diploma in Electrical & Electronics": [
        "Basics of Electrical Engineering",
        "Electrical Circuits & Network Theorems",
        "Electrical Drawing & Wiring Practice",
        "DC Machines & Transformers",
        "AC Machines & Alternators",
        "Electrical Measuring Instruments",
        "Power Generation, Transmission & Distribution",
        "Power Electronics Basics",
        "Utilization of Electrical Energy & Traction",
        "Control of Electrical Machines",
        "Switchgear & Protection Devices",
        "Renewable Energy Technologies & Solar PV"
      ],
      "Diploma in Civil Engineering": [
        "Basic Surveying with Chain & Compass",
        "Building Construction & Materials",
        "Applied Mechanics & Strength of Materials",
        "Advanced Surveying (Theodolite, Total Station)",
        "Hydraulics & Water Supply Engineering",
        "Concrete Technology & Material Testing",
        "Theory of Structures",
        "Design of RCC Structures",
        "Highway & Railway Engineering",
        "Irrigation Engineering Basics",
        "Quantity Surveying & Estimating",
        "Construction Management & Site Safety"
      ],
      "Diploma in Electronics & Communication": [
        "Electronic Components & Circuit Devices",
        "Analog Electronics & Transistor Amplifiers",
        "Digital Electronics & Logic Gates",
        "Electronic Measurements & Instruments",
        "Communication Engineering (AM, FM, PM)",
        "Microcontrollers (8051) & Interfacing",
        "Industrial Electronics & PLC Basics",
        "Optical Fiber & Microwave Basics",
        "Audio & Video Systems Maintenance",
        "PCB Design & Fabrication"
      ],
      "Diploma in Automobile Engineering": [
        "Automobile Engines & Fuel Injection Systems",
        "Automobile Chassis, Suspension & Transmission",
        "Vehicle Maintenance & Garage Practice",
        "Automotive Electrical & Electronics Systems",
        "Automotive Pollution & Emission Control",
        "Vehicle Body Engineering & Aerodynamics",
        "Two & Three Wheeler Technology",
        "Motor Vehicle Act & Transport Management"
      ]
    }
  }
};

const DEFAULT_DATA = {
  flowStep: 'lang_select',
  currentLanguage: 'en', // English default (Telugu only when selected by user)
  currentUser: null,
  currentRole: null, // 'student' | 'professor' | 'parent'
  theme: 'dark', // Modern 3D dark theme default

  // Clean empty initial state: Professors and students register dynamically
  users: [],

  // Platform Metrics
  platformStats: {
    totalStudents: 0,
    totalProfessors: 0,
    totalClasses: 0,
    doubtsSolvedByAI: 0,
    doubtsEscalatedToProf: 0,
    aiResolutionRate: 100
  },

  // Classes created dynamically by registered professors
  classes: [],

  // Live sessions scheduled exclusively by registered professors
  liveSessions: [],

  // Quizzes published exclusively by registered professors
  quizzes: [],

  // Doubts with explicit professor assignment
  doubts: [],

  // Assignments created by registered professors
  assignments: [],

  // Announcements created by registered professors
  announcements: [],

  // Real-time parent WhatsApp alerts dispatched on quiz/assignment completion
  parentNotifications: []
};
