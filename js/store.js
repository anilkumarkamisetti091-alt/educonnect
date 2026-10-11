/**
 * EduConnect - State Store & Business Logic Engine (Professor-Centric)
 * Features:
 * - Direct Doubt Escalation to a Student-Selected Professor + AI Engine
 * - Dynamic AI Mock Test Generator (Changes questions every time)
 * - Professor-Assigned Quizzes & Live Sessions
 * - Smart Study Planner with 1st to 12th, B.Tech, and Diploma subject selection
 * - Strict Professor Academic Rules & Code of Conduct
 * - Zero Admin priority (Platform revolves around Professors and Students)
 */

class EduConnectStore {
  constructor() {
    this.storageKey = 'educonnect_platform_state_v12_fresh_clean';
    this.listeners = {};
    this.purgeOldStorage();
    this.state = this.loadState();
  }

  purgeOldStorage() {
    try {
      const legacyKeys = [
        'educonnect_platform_state_v9_dynamic_attendance',
        'educonnect_platform_state_v10_ai_mock_auto_link',
        'educonnect_platform_state_v8',
        'educonnect_platform_state_v7'
      ];
      legacyKeys.forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.users) parsed.users = [];
        if (!parsed.classes) parsed.classes = [];
        if (!parsed.liveSessions) parsed.liveSessions = [];
        if (!parsed.quizzes) parsed.quizzes = [];
        if (!parsed.doubts) parsed.doubts = [];
        if (!parsed.assignments) parsed.assignments = [];
        if (!parsed.announcements) parsed.announcements = [];
        if (!parsed.parentNotifications) parsed.parentNotifications = [];
        return { ...DEFAULT_DATA, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveState();
    this.emit('stateChanged', this.state);
    this.emit('flowChanged', this.state.flowStep);
    this.emit('languageChanged', this.state.currentLanguage);
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(payload); } catch (err) { console.error(`Error in listener for ${event}:`, err); }
      });
    }
  }

  // --- Multi-Language Translation ---
  t(path) {
    const lang = this.getLanguage();
    const dict = LOCALES[lang] || LOCALES.en;
    const parts = path.split('.');
    let cur = dict;
    for (const part of parts) {
      if (cur && cur[part] !== undefined) cur = cur[part];
      else {
        let fb = LOCALES.en;
        for (const p of parts) {
          if (fb && fb[p] !== undefined) fb = fb[p];
          else return path;
        }
        return fb;
      }
    }
    return cur;
  }

  getFlowStep() { return this.state.flowStep || 'lang_select'; }
  setFlowStep(step) {
    this.state.flowStep = step;
    this.saveState();
    this.emit('flowChanged', step);
  }

  getLanguage() { return this.state.currentLanguage || 'en'; }
  setLanguage(lang) {
    if (['en', 'te', 'hi', 'ta'].includes(lang)) {
      this.state.currentLanguage = lang;
      this.saveState();
      this.emit('languageChanged', lang);
    }
  }

  selectLanguageAndProceed(lang) {
    this.setLanguage(lang);
    this.setFlowStep('auth_login');
  }

  getCurrentRole() { return this.state.currentRole; }
  setRole(role) {
    this.state.currentRole = role;
    this.saveState();
    this.emit('roleChanged', role);
  }

  getCurrentUser() { return this.state.currentUser; }
  getTheme() { return this.state.theme || 'dark'; }
  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.saveState();
    this.emit('themeChanged', this.state.theme);
    return this.state.theme;
  }

  // --- Real-World Email & Mobile Validator (Strictly Regular Working Mail & Number) ---
  validateRealWorldIdentifier(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      const lang = this.getLanguage();
      const msg = lang === 'te' 
        ? 'దయచేసి ప్రస్తుతం పనిచేస్తున్న సరైన ఇమెయిల్ లేదా 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.' 
        : 'Please provide an active, regular working email or 10-digit mobile number.';
      return { valid: false, message: msg };
    }
    const clean = identifier.trim();

    if (clean.includes('@')) {
      // RFC-compliant real-world email format
      const emailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(clean)) {
        const lang = this.getLanguage();
        const msg = lang === 'te'
          ? 'దయచేసి ప్రస్తుతం పనిచేస్తున్న నిజమైన ఇమెయిల్ చిరునామా (ఉదా: name@gmail.com) నమోదు చేయండి.'
          : 'Please enter a regular working email address (e.g. name@gmail.com or university email).';
        return { valid: false, message: msg };
      }
      const [localPart, domainPart] = clean.toLowerCase().split('@');
      
      // Username constraints: at least 4 characters, must contain at least 2 letters
      if (localPart.length < 4) {
        return { valid: false, message: 'Email username must be at least 4 characters long.' };
      }
      const alphaCount = (localPart.match(/[a-z]/g) || []).length;
      if (alphaCount < 2) {
        return { valid: false, message: 'Email username must contain regular letters, not only numbers.' };
      }

      // Block placeholder, unused, or fake keywords
      const bogusKeywords = ['unused', 'junk', 'fake', 'dummy', 'tester', 'test', 'sample', 'example', 'trash', 'qwerty', 'asdf', 'spam', 'none', 'null', 'temp'];
      for (const kw of bogusKeywords) {
        if (localPart.includes(kw) || domainPart.includes(kw)) {
          return { valid: false, message: 'Please provide your actual regular working email, not an unused or test email address.' };
        }
      }

      // Block throwaway/burner/disposable email domains
      const disposableDomains = [
        'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'sharklasers.com',
        'throwawaymail.com', 'getairmail.com', 'yopmail.com', 'trashmail.com', 'dispostable.com',
        'fake.com', 'unused.com', 'test.com', 'dummy.com', 'sample.com', 'example.com'
      ];
      if (disposableDomains.includes(domainPart)) {
        return { valid: false, message: 'Temporary or disposable email domains are not permitted. Please use your regular working email.' };
      }

      // Legitimate major email providers or accredited institutional/corporate domains
      const majorProviders = [
        'gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com',
        'icloud.com', 'proton.me', 'protonmail.com', 'zoho.com', 'rediffmail.com',
        'aol.com', 'live.com', 'yandex.com', 'msn.com', 'mail.com'
      ];
      const isMajor = majorProviders.includes(domainPart);
      const isEducational = domainPart.endsWith('.edu') || domainPart.endsWith('.ac.in') || domainPart.endsWith('.edu.in') || domainPart.endsWith('.org') || domainPart.endsWith('.res.in');
      const isRealDomain = domainPart.includes('.') && domainPart.split('.')[0].length >= 3;

      if (!isMajor && !isEducational && !isRealDomain) {
        return { valid: false, message: 'Please enter a recognized working email address (e.g. Gmail, Outlook, Yahoo or college email).' };
      }

      if (/^(.)\1{3,}@/.test(clean)) {
        return { valid: false, message: 'Invalid email address with repeated characters.' };
      }
      return { valid: true, type: 'email', cleanValue: clean.toLowerCase() };
    } else {
      // Real-world 10-digit mobile number
      const digitsOnly = clean.replace(/[^0-9]/g, '');
      let tenDigit = digitsOnly;
      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        tenDigit = digitsOnly.substring(2);
      } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
        tenDigit = digitsOnly.substring(1);
      }

      if (tenDigit.length !== 10) {
        const lang = this.getLanguage();
        const msg = lang === 'te'
          ? 'మొబైల్ నంబర్ సరిగ్గా 10 అంకెలు ఉండాలి (ఉదా: 9876543210).'
          : 'Mobile number must be exactly 10 digits (e.g. 9876543210).';
        return { valid: false, message: msg };
      }

      // Valid Indian telecom series starts with 6, 7, 8, or 9
      if (!/^[6-9]/.test(tenDigit)) {
        const lang = this.getLanguage();
        const msg = lang === 'te'
          ? 'భారతీయ మొబైల్ నంబర్లు 6, 7, 8, లేదా 9 తో ప్రారంభం కావాలి.'
          : 'Regular working mobile numbers must start with 6, 7, 8, or 9.';
        return { valid: false, message: msg };
      }

      // Block bogus repeated sequences like 0000000000, 1111111111, 9999999999
      if (/^(\d)\1{9}$/.test(tenDigit)) {
        return { valid: false, message: 'Please enter a genuine working mobile number, not repeated identical digits.' };
      }

      // Block 5 or more consecutive identical digits (e.g. 9800000123)
      if (/(\d)\1{4,}/.test(tenDigit)) {
        return { valid: false, message: 'Please provide a regular working mobile number, not an unused number with repeated digits.' };
      }

      // Block alternating repeating patterns (e.g. 9898989898, 9191919191, 9090909090)
      const altPattern1 = tenDigit.substring(0, 2);
      if (tenDigit === altPattern1.repeat(5)) {
        return { valid: false, message: 'Alternating dummy numbers are not permitted. Please enter your active mobile number.' };
      }

      // Block repeated half-blocks (e.g. 9876598765)
      if (tenDigit.substring(0, 5) === tenDigit.substring(5, 10)) {
        return { valid: false, message: 'Please provide your actual active mobile number.' };
      }

      // Block sequential test numbers
      const sequentialPlaceholders = [
        '1234567890', '0123456789', '9876543210', '8765432109', '6789012345',
        '9012345678', '9898989898', '9123456780', '9876501234'
      ];
      if (sequentialPlaceholders.includes(tenDigit)) {
        return { valid: false, message: 'Please provide your active regular working mobile number, not a placeholder sequence.' };
      }

      return { valid: true, type: 'phone', cleanValue: tenDigit };
    }
  }

  // --- Authentication System (Student, Professor, Parent) ---
  registerUser({ name, identifier, password, role, year, major, dept, childCode, parentIdentifier, childIdentifier }) {
    const valResult = this.validateRealWorldIdentifier(identifier);
    if (!valResult.valid) {
      return { success: false, message: valResult.message };
    }
    const cleanId = valResult.cleanValue;
    const cleanPass = (password || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Please provide your password.' };
    }
    if (cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    if (!this.state.users) this.state.users = [];

    // Strictly enforce global uniqueness: once registered, email/mobile cannot match any other account across students, professors, or parents!
    const existing = this.state.users.find(u => (u.identifier || '').trim().toLowerCase() === cleanId);
    if (existing) {
      const lang = this.getLanguage();
      const existingRole = existing.role.toUpperCase();
      const msg = lang === 'te'
        ? `ఈ ఇమెయిల్ లేదా మొబైల్ నంబర్ (${cleanId}) ఇప్పటికే '${existing.role}' ఖాతాగా నమోదు చేయబడింది. ఒకే వివరాలతో వేర్వేరు ఖాతాలు సృష్టించడం సాధ్యం కాదు. దయచేసి లాగిన్ అవ్వండి.`
        : `This email or mobile number (${cleanId}) is already registered as a ${existingRole} account. Accounts cannot share the same email/mobile across roles. Please Sign In instead.`;
      return { success: false, message: msg };
    }

    let studentCode = '';
    if (role === 'student') {
      const cleanPrefix = (name || 'STD').replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase() || 'STD';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      studentCode = `ST-${cleanPrefix}-${randomNum}`;
    }

    let cleanParentId = '';
    if (parentIdentifier) {
      const parentVal = this.validateRealWorldIdentifier(parentIdentifier);
      if (parentVal.valid) {
        cleanParentId = parentVal.cleanValue;
      }
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name || 'User',
      identifier: cleanId,
      password: cleanPass,
      role: role || 'student',
      avatar: `https://api.dicebear.com/7.x/${role === 'student' ? 'bottts' : 'identicon'}/svg?seed=${encodeURIComponent(name || cleanId)}`,
      year: year || '1st Year',
      major: major || 'General',
      dept: dept || (role === 'professor' ? 'Department of Engineering' : ''),
      title: role === 'professor' ? 'Faculty Professor' : '',
      studentCode,
      childCode: (childCode || childIdentifier || '').trim().toUpperCase(),
      parentIdentifier: cleanParentId,
      parentPhone: cleanParentId,
      linkedParentId: null,
      linkedStudentId: null,
      studyStreakDays: 1,
      attendancePercentage: 0, // Starts at 0% for new students. Earned dynamically based on enrolled classes, quizzes, and assignments!
      averageGrade: 'Pending',
      verified: role === 'professor' ? true : false,
      enrolledClassIds: [],
      rules: role === 'professor' ? [
        'Maintain class attendance above 75%.',
        'Submit assignments on time.',
        'Follow academic honesty during quizzes.'
      ] : [],
      studyPlanner: null // Clean start: planner is generated ONLY after student selects their stream, branch, subjects, and hours!
    };

    // --- Automatic Student-Parent Bi-directional Connection ---
    if (role === 'student' && cleanParentId) {
      const matchedParent = this.state.users.find(u => u.role === 'parent' && (u.identifier || '').toLowerCase() === cleanParentId);
      if (matchedParent) {
        newUser.linkedParentId = matchedParent.id;
        newUser.parentName = matchedParent.name;
        matchedParent.linkedStudentId = newUser.id;
        matchedParent.childCode = newUser.studentCode;
      }
    } else if (role === 'parent') {
      const searchChild = (childIdentifier || childCode || '').trim();
      let matchedStudent = null;

      // 1. Auto-connect if student previously registered with this parent's mobile or email
      matchedStudent = this.state.users.find(u => u.role === 'student' && (u.parentIdentifier === cleanId || u.parentPhone === cleanId));

      // 2. Or connect if parent entered child's phone, email, or code
      if (!matchedStudent && searchChild) {
        matchedStudent = this.state.users.find(u => 
          u.role === 'student' && (
            (u.studentCode && u.studentCode.toUpperCase() === searchChild.toUpperCase()) ||
            (u.identifier && u.identifier.toLowerCase() === searchChild.toLowerCase())
          )
        );
      }

      if (matchedStudent) {
        newUser.linkedStudentId = matchedStudent.id;
        newUser.childCode = matchedStudent.studentCode;
        matchedStudent.linkedParentId = newUser.id;
        matchedStudent.parentPhone = newUser.identifier;
        matchedStudent.parentName = newUser.name;
      }
    }

    this.state.users.push(newUser);
    this.state.currentUser = newUser;
    this.state.currentRole = role;
    this.state.flowStep = 'app';

    if (role === 'student') this.state.platformStats.totalStudents++;
    if (role === 'professor') this.state.platformStats.totalProfessors++;

    this.saveState();
    this.emit('stateChanged', this.state);
    this.emit('userLoggedIn', newUser);
    return { success: true, user: newUser };
  }

  // Auto-sync parent and student linkages
  autoSyncParentStudentLinks(userId) {
    const user = (this.state.users || []).find(u => u.id === userId);
    if (!user) return;

    if (user.role === 'parent' && !user.linkedStudentId) {
      const student = (this.state.users || []).find(u => 
        u.role === 'student' && (
          u.parentIdentifier === user.identifier ||
          u.parentPhone === user.identifier ||
          (user.childCode && u.studentCode === user.childCode)
        )
      );
      if (student) {
        user.linkedStudentId = student.id;
        user.childCode = student.studentCode;
        student.linkedParentId = user.id;
        student.parentPhone = user.identifier;
        student.parentName = user.name;
        this.saveState();
      }
    } else if (user.role === 'student' && !user.linkedParentId && user.parentIdentifier) {
      const parent = (this.state.users || []).find(u => 
        u.role === 'parent' && u.identifier === user.parentIdentifier
      );
      if (parent) {
        user.linkedParentId = parent.id;
        user.parentName = parent.name;
        parent.linkedStudentId = user.id;
        parent.childCode = user.studentCode;
        this.saveState();
      }
    }
  }

  updateStudentParentContact(studentId, parentContact) {
    const student = (this.state.users || []).find(u => u.id === studentId);
    if (!student) return { success: false, message: 'Student not found.' };

    const val = this.validateRealWorldIdentifier(parentContact);
    if (!val.valid) return { success: false, message: val.message };

    student.parentIdentifier = val.cleanValue;
    student.parentPhone = val.cleanValue;

    // Check if parent account exists and link immediately
    const parent = (this.state.users || []).find(u => u.role === 'parent' && u.identifier === val.cleanValue);
    if (parent) {
      student.linkedParentId = parent.id;
      student.parentName = parent.name;
      parent.linkedStudentId = student.id;
      parent.childCode = student.studentCode;
    }

    this.saveState();
    this.emit('stateChanged', this.state);
    return { 
      success: true, 
      linked: !!parent, 
      parentName: parent ? parent.name : null,
      message: parent ? 'Parent automatically connected!' : 'Parent contact saved for automated alerts.' 
    };
  }

  loginUser({ identifier, password, role }) {
    const valResult = this.validateRealWorldIdentifier(identifier);
    if (!valResult.valid) {
      return { success: false, message: valResult.message };
    }
    const cleanId = valResult.cleanValue;
    const cleanPass = (password || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Please enter your password.' };
    }

    if (!this.state.users) this.state.users = [];

    // Find user by identifier and role
    const user = this.state.users.find(u => (u.identifier || '').trim().toLowerCase() === cleanId && u.role === role);
    if (!user) {
      // Check if user is registered under a different role
      const otherUser = this.state.users.find(u => (u.identifier || '').trim().toLowerCase() === cleanId);
      if (otherUser) {
        return { 
          success: false, 
          message: `This email/mobile is registered as a ${otherUser.role.toUpperCase()}. Please select the '${otherUser.role}' role above to log in.` 
        };
      }
      return { success: false, message: 'No registered account found with this email or mobile. Please Register first.' };
    }

    if (user.password !== cleanPass) {
      return { success: false, message: 'Incorrect password entered. Click "Forgot Password?" below to reset.' };
    }

    // Auto-sync parent-student relationship upon login
    this.autoSyncParentStudentLinks(user.id);

    this.state.currentUser = user;
    this.state.currentRole = role;
    this.state.flowStep = 'app';

    this.saveState();
    this.emit('stateChanged', this.state);
    this.emit('userLoggedIn', user);
    return { success: true, user };
  }

  resetPassword({ identifier, newPassword }) {
    const valResult = this.validateRealWorldIdentifier(identifier);
    if (!valResult.valid) {
      return { success: false, message: valResult.message };
    }
    const cleanId = valResult.cleanValue;
    const cleanPass = (newPassword || '').trim();

    if (!cleanPass) {
      return { success: false, message: 'Please provide both your registered email/mobile and a new password.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    if (!this.state.users) this.state.users = [];
    const user = this.state.users.find(u => (u.identifier || '').trim().toLowerCase() === cleanId);
    if (!user) {
      return { success: false, message: 'No registered account found with this email or mobile number.' };
    }

    user.password = cleanPass;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, user, message: 'Password has been reset successfully! You can now log in.' };
  }

  changePassword(userId, oldPassword, newPassword) {
    const user = (this.state.users || []).find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const cleanOld = (oldPassword || '').trim();
    const cleanNew = (newPassword || '').trim();

    if (user.password !== cleanOld) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (cleanNew.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    user.password = cleanNew;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: 'Password changed successfully!' };
  }

  logout() {
    this.state.currentUser = null;
    this.state.currentRole = null;
    this.state.flowStep = 'lang_select';
    this.saveState();
    this.emit('stateChanged', this.state);
    this.emit('userLoggedOut');
    this.emit('flowChanged', 'lang_select');
  }

  // --- Professors Management (The Platform Authority) ---
  getProfessors() {
    return (this.state.users || []).filter(u => u.role === 'professor');
  }

  getProfessor(id) {
    return (this.state.users || []).find(u => u.id === id && u.role === 'professor');
  }

  getEnrolledProfessorRules(studentId) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    const enrolledIds = student ? (student.enrolledClassIds || []) : [];
    if (enrolledIds.length === 0) {
      return []; // No rules if student has not enrolled with a mentor professor yet!
    }

    const classes = (this.state.classes || []).filter(c => enrolledIds.includes(c.id));
    const rules = [];
    const profs = this.getProfessors();
    
    classes.forEach(c => {
      const p = profs.find(prof => prof.id === c.professorId);
      if (p && p.rules) {
        rules.push({ 
          professorId: p.id,
          professorName: p.name, 
          classTitle: c.title,
          joinCode: c.joinCode, 
          rules: p.rules.concat(c.rules || []) 
        });
      }
    });

    return rules;
  }

  // --- AI Doubt Solver & Direct Escalation to Chosen Professor ---
  getDoubts() { return this.state.doubts || []; }
  
  getStudentDoubts(studentId) {
    if (!studentId) return [];
    return (this.state.doubts || []).filter(d => d.studentId === studentId);
  }

  getProfessorPendingDoubts(profId) {
    return (this.state.doubts || []).filter(d => d.status === 'escalated' && d.professorId === profId);
  }

  askDoubt(studentId, question, subject = '') {
    const user = this.getCurrentUser();
    if (!user) return null;

    const lang = this.getLanguage();
    let aiAnswer = '';

    // Step-by-Step Multilingual AI Solutions (AI Engine)
    if (lang === 'te') {
      aiAnswer = `✨ AI దశలవారీ విశ్లేషణ:\n` +
        `1. ప్రాథమిక సూత్రం: "${question}" అంశానికి సంబంధించిన కీలక భావనలు మరియు నిర్వచనం.\n` +
        `2. విశ్లేషణ & విడమరచడం: ప్రశ్నను ముఖ్యమైన దశలుగా విభజించి, మూల సూత్రాలను వర్తింపజేయడం.\n` +
        `3. ఆచరణాత్మక ఉదాహరణ: స్పష్టమైన గణన లేదా ఆచరణాత్మక విధానంతో దశలవారీగా పరిష్కరించడం.\n` +
        `4. పరీక్షల ముఖ్యాంశాలు: సాధారణంగా విద్యార్థులు చేసే తప్పులు మరియు సమర్థవంతమైన షార్ట్‌కట్‌లు.\n` +
        `📌 మరింత వివరణ లేదా ప్రొఫెసర్ ప్రత్యక్ష సమీక్ష కోసం, దిగువన ఉన్న జాబితా నుండి మీకు నచ్చిన నిర్దిష్ట ప్రొఫెసర్‌ను ఎంచుకుని "ప్రొఫెసర్‌కు పంపండి" క్లిక్ చేయండి.`;
    } else if (lang === 'hi') {
      aiAnswer = `✨ AI चरण-दर-चरण समाधान:\n` +
        `1. मुख्य संकल्पना: "${question}" से संबंधित मूलभूत सिद्धांत और परिभाषा।\n` +
        `2. चरणबद्ध विश्लेषण: प्रश्न को छोटे घटकों में विभाजित कर हल की दिशा तय करना।\n` +
        `3. व्यावहारिक समाधान: उदाहरण के साथ तार्किक प्रमाण या गणना।\n` +
        `4. महत्वपूर्ण बिंदु: परीक्षा उपयोगी सूत्र और सीमाएं।\n` +
        `📌 यदि आपको संकाय स्पष्टीकरण चाहिए, तो नीचे अपनी पसंद के प्रोफेसर का चयन कर "प्रोफेसर को भेजें" दबाएं।`;
    } else if (lang === 'ta') {
      aiAnswer = `✨ AI படிபடியான விளக்கம்:\n` +
        `1. அடிப்படைக் கோட்பாடு: "${question}" தொடர்பான அடிப்படை அறிவியல்/கணித உண்மை.\n` +
        `2. படிபடியான தீர்வு: கேள்வியை எளிய கூறுகளாக பகுத்தாய்ந்து விடை காணுதல்.\n` +
        `3. செய்முறை விளக்கம்: நடைமுறை உதாரணத்துடன் தீர்வு.\n` +
        `4. முக்கிய குறிப்பு: தேர்வுக் குறிப்புகள் மற்றும் தவிர்க்க வேண்டிய தவறுகள்.\n` +
        `📌 பேராசிரியரின் நேரடி விளக்கம் தேவைப்பட்டால், பேராசிரியரைத் தேர்ந்தெடுத்து அனுப்பவும்.`;
    } else {
      aiAnswer = `✨ AI Step-by-Step Solution:\n` +
        `1. Core Principle: Definition and foundational logic governing "${question}".\n` +
        `2. Systematic Decomposition: Breaking the problem into inputs, constraints, and algorithmic equations.\n` +
        `3. Detailed Walkthrough: Step-by-step mathematical proof or technical implementation.\n` +
        `4. Edge Cases & Exam Insights: Common student pitfalls, complexity analysis, and verification.\n` +
        `📌 If you need human faculty clarification, select your designated professor below and click "Escalate to Professor".`;
    }

    const newDoubt = {
      id: 'dbt_' + Date.now(),
      studentId: user.id,
      studentName: user.name,
      question,
      subject: subject || 'General Academic',
      language: lang,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      aiAnswer,
      status: 'ai',
      professorId: null,
      professorName: '',
      professorReply: ''
    };

    if (!this.state.doubts) this.state.doubts = [];
    this.state.doubts.unshift(newDoubt);
    this.state.platformStats.doubtsSolvedByAI++;
    this.saveState();
    this.emit('stateChanged', this.state);
    return newDoubt;
  }

  // Direct escalation to a STUDENT-SELECTED Professor
  escalateDoubtToProfessor(doubtId, selectedProfessorId) {
    const doubt = (this.state.doubts || []).find(d => d.id === doubtId);
    if (!doubt) return { success: false, message: 'Doubt not found' };

    const prof = this.getProfessor(selectedProfessorId);
    if (!prof) return { success: false, message: 'Selected professor not found' };

    doubt.status = 'escalated';
    doubt.professorId = prof.id;
    doubt.professorName = prof.name;
    doubt.escalatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);

    this.state.platformStats.doubtsEscalatedToProf++;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, professor: prof };
  }

  resolveDoubt(doubtId, professorReply) {
    const doubt = (this.state.doubts || []).find(d => d.id === doubtId);
    if (!doubt) return;

    doubt.status = 'resolved';
    doubt.professorReply = professorReply;
    doubt.resolvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.saveState();
    this.emit('stateChanged', this.state);
  }

  // Primary First-Preference: Send Doubt Directly to Student-Selected Professor
  askProfessorDoubt(studentId, selectedProfessorId, question, subject = '') {
    const user = this.getCurrentUser();
    if (!user) return { success: false, message: 'Please sign in to ask a doubt.' };

    const prof = this.getProfessor(selectedProfessorId);
    if (!prof) return { success: false, message: 'Please select a registered professor.' };

    const cleanQ = (question || '').trim();
    if (!cleanQ) return { success: false, message: 'Please type your academic question or doubt.' };

    const lang = this.getLanguage();
    const newDoubt = {
      id: 'dbt_' + Date.now(),
      studentId: user.id,
      studentName: user.name,
      question: cleanQ,
      subject: subject || (prof.dept || 'Academic Course'),
      language: lang,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      aiAnswer: '',
      status: 'escalated', // First preference: queued directly in professor's inbox
      professorId: prof.id,
      professorName: prof.name,
      escalatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      professorReply: '',
      resolvedAt: ''
    };

    if (!this.state.doubts) this.state.doubts = [];
    this.state.doubts.unshift(newDoubt);
    this.state.platformStats.doubtsEscalatedToProf++;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, doubt: newDoubt, professor: prof };
  }

  // Next-Option: Generate AI step-by-step solution for any question or while waiting for professor
  generateAIDoubtAnswer(doubtId) {
    const doubt = (this.state.doubts || []).find(d => d.id === doubtId);
    if (!doubt) return { success: false, message: 'Doubt not found.' };

    const lang = doubt.language || this.getLanguage();
    const question = doubt.question;
    let aiAnswer = '';

    if (lang === 'te') {
      aiAnswer = `✨ AI దశలవారీ విశ్లేషణ:\n` +
        `1. ప్రాథమిక సూత్రం: "${question}" అంశానికి సంబంధించిన కీలక భావనలు మరియు నిర్వచనం.\n` +
        `2. విశ్లేషణ & విడమరచడం: ప్రశ్నను ముఖ్యమైన దశలుగా విభజించి, మూల సూత్రాలను వర్తింపజేయడం.\n` +
        `3. ఆచరణాత్మక ఉదాహరణ: స్పష్టమైన గణన లేదా ఆచరణాత్మక విధానంతో దశలవారీగా పరిష్కరించడం.\n` +
        `4. పరీక్షల ముఖ్యాంశాలు: సాధారణంగా విద్యార్థులు చేసే తప్పులు మరియు సమర్థవంతమైన షార్ట్‌కట్‌లు.\n` +
        `📌 మీ ఎంపిక చేసిన ప్రొఫెసర్ సమాధానం ఇచ్చిన వెంటనే వారి ప్రత్యక్ష వివరణ కూడా ఇక్కడ కనిపిస్తుంది.`;
    } else if (lang === 'hi') {
      aiAnswer = `✨ AI चरण-दर-चरण समाधान:\n` +
        `1. मुख्य संकल्पना: "${question}" से संबंधित मूलभूत सिद्धांत और परिभाषा।\n` +
        `2. चरणबद्ध विश्लेषण: प्रश्न को छोटे घटकों में विभाजित कर हल की दिशा तय करना।\n` +
        `3. व्यावहारिक समाधान: उदाहरण के साथ तार्किक प्रमाण या गणना।\n` +
        `4. महत्वपूर्ण बिंदु: परीक्षा उपयोगी सूत्र और सीमाएं।\n` +
        `📌 आपके चयनित प्रोफेसर द्वारा उत्तर दिए जाने पर उनका प्रत्यक्ष स्पष्टीकरण भी यहाँ प्रदर्शित होगा।`;
    } else if (lang === 'ta') {
      aiAnswer = `✨ AI படிபடியான விளக்கம்:\n` +
        `1. அடிப்படைக் கோட்பாடு: "${question}" தொடர்பான அடிப்படை அறிவியல்/கணித உண்மை.\n` +
        `2. படிபடியான தீர்வு: கேள்வியை எளிய கூறுகளாக பகுத்தாய்ந்து விடை காணுதல்.\n` +
        `3. செய்முறை விளக்கம்: நடைமுறை உதாரணத்துடன் தீர்வு.\n` +
        `4. முக்கிய குறிப்பு: தேர்வுக் குறிப்புகள் மற்றும் தவிர்க்க வேண்டிய தவறுகள்.\n` +
        `📌 நீங்கள் தேர்ந்தெடுத்த பேராசிரியரின் பதிலும் விரைவில் இங்கே இணைக்கப்படும்.`;
    } else {
      aiAnswer = `✨ AI Step-by-Step Solution:\n` +
        `1. Core Principle: Foundational theorem and underlying definitions governing "${question}".\n` +
        `2. Step-by-Step Breakdown: Logical decomposition of requirements, assumptions, and formulas.\n` +
        `3. Applied Demonstration: Concrete calculation, code example, or conceptual derivation.\n` +
        `4. Key Exam Pitfalls: Common student mistakes and high-yield shortcuts.\n` +
        `📌 Your designated professor has also received this question in their inbox and their verified response will appear once answered.`;
    }

    doubt.aiAnswer = aiAnswer;
    this.state.platformStats.doubtsSolvedByAI++;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, aiAnswer };
  }

  // Update profile picture from gallery / file upload or preset avatar
  updateUserProfileAvatar(userId, avatarUrl) {
    if (!userId || !avatarUrl) return { success: false, message: 'Invalid avatar data.' };
    const user = (this.state.users || []).find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    user.avatar = avatarUrl;
    if (this.state.currentUser && this.state.currentUser.id === userId) {
      this.state.currentUser.avatar = avatarUrl;
    }
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, user };
  }

  // --- Classes & Enrollment (Managed by Professors) ---
  getClasses() { return this.state.classes || []; }
  getClass(id) { return (this.state.classes || []).find(c => c.id === id); }
  
  getProfessorClasses(profId) {
    if (!profId) return [];
    return (this.state.classes || []).filter(c => c.professorId === profId);
  }

  getStudentEnrolledClasses(studentId) {
    if (!studentId) return [];
    return (this.state.classes || []).filter(c => c.enrolledStudentIds && c.enrolledStudentIds.includes(studentId));
  }

  createClass(title, schedule, rulesText = '') {
    const user = this.getCurrentUser();
    const randomCode = Math.floor(100 + Math.random() * 900);
    const joinCode = `CLS${randomCode}`;

    const rules = rulesText 
      ? rulesText.split('\n').map(r => r.trim()).filter(Boolean)
      : ['Follow professor guidelines and submit weekly work on schedule.'];

    const newClass = {
      id: 'cls_' + Date.now(),
      joinCode,
      title,
      professorId: user ? user.id : 'prof_default',
      professorName: user ? user.name : 'Faculty Professor',
      schedule: schedule || 'Mon, Wed (10:00 AM - 11:30 AM)',
      enrolledStudentIds: [],
      rules,
      materials: []
    };

    if (!this.state.classes) this.state.classes = [];
    this.state.classes.unshift(newClass);
    this.state.platformStats.totalClasses = this.state.classes.length;
    this.saveState();
    this.emit('stateChanged', this.state);
    return newClass;
  }

  joinClassByCode(studentId, code) {
    const cleanCode = (code || '').trim().toUpperCase();
    const targetClass = (this.state.classes || []).find(c => c.joinCode === cleanCode);
    if (!targetClass) {
      return { success: false, message: 'Invalid class join code. Please request the verified code from your professor.' };
    }

    if (!targetClass.enrolledStudentIds) targetClass.enrolledStudentIds = [];
    if (!targetClass.enrolledStudentIds.includes(studentId)) {
      targetClass.enrolledStudentIds.push(studentId);
    }

    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    if (student) {
      if (!student.enrolledClassIds) student.enrolledClassIds = [];
      if (!student.enrolledClassIds.includes(targetClass.id)) {
        student.enrolledClassIds.push(targetClass.id);
      }
      this.calculateStudentAttendance(student.id);
    }

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, class: targetClass };
  }

  uploadMaterial(classId, title, type, url) {
    const cls = this.getClass(classId);
    if (!cls) return;

    const newMaterial = {
      id: 'mat_' + Date.now(),
      title,
      type,
      url: url || '#',
      date: new Date().toISOString().substring(0, 10)
    };

    if (!cls.materials) cls.materials = [];
    cls.materials.unshift(newMaterial);
    this.saveState();
    this.emit('stateChanged', this.state);
    return newMaterial;
  }

  // --- Deletion Capabilities (Professor Classes, Live Sessions, Quizzes, Assignments, Profile) ---
  deleteClass(classId) {
    if (!classId) return { success: false, message: 'Class ID is required.' };
    const classIdx = (this.state.classes || []).findIndex(c => c.id === classId);
    if (classIdx === -1) return { success: false, message: 'Class not found.' };

    const targetClass = this.state.classes[classIdx];

    // Remove class from classes list
    this.state.classes.splice(classIdx, 1);
    this.state.platformStats.totalClasses = this.state.classes.length;

    // Remove this class from all students' enrolledClassIds & recalculate attendance
    (this.state.users || []).forEach(u => {
      if (u.role === 'student' && u.enrolledClassIds && u.enrolledClassIds.includes(classId)) {
        u.enrolledClassIds = u.enrolledClassIds.filter(id => id !== classId);
        this.calculateStudentAttendance(u.id);
      }
    });

    // Cascade delete: remove all live sessions for this class
    if (this.state.liveSessions) {
      this.state.liveSessions = this.state.liveSessions.filter(s => s.classId !== classId);
    }

    // Cascade delete: remove all quizzes for this class
    if (this.state.quizzes) {
      this.state.quizzes = this.state.quizzes.filter(q => q.classId !== classId);
    }

    // Cascade delete: remove all assignments for this class
    if (this.state.assignments) {
      this.state.assignments = this.state.assignments.filter(a => a.classId !== classId);
    }

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: `Class "${targetClass.title}" and its associated activities were deleted.` };
  }

  deleteLiveSession(sessionId) {
    if (!sessionId) return { success: false, message: 'Session ID is required.' };
    const initialLen = (this.state.liveSessions || []).length;
    this.state.liveSessions = (this.state.liveSessions || []).filter(s => s.id !== sessionId);
    if (this.state.liveSessions.length === initialLen) return { success: false, message: 'Live session not found.' };

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: 'Live lecture removed.' };
  }

  deleteQuiz(quizId) {
    if (!quizId) return { success: false, message: 'Quiz ID is required.' };
    const initialLen = (this.state.quizzes || []).length;
    this.state.quizzes = (this.state.quizzes || []).filter(q => q.id !== quizId);
    if (this.state.quizzes.length === initialLen) return { success: false, message: 'Quiz not found.' };

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: 'Class quiz removed.' };
  }

  deleteAssignment(assignmentId) {
    if (!assignmentId) return { success: false, message: 'Assignment ID is required.' };
    const initialLen = (this.state.assignments || []).length;
    this.state.assignments = (this.state.assignments || []).filter(a => a.id !== assignmentId);
    if (this.state.assignments.length === initialLen) return { success: false, message: 'Assignment not found.' };

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: 'Assignment removed.' };
  }

  deleteProfessor(professorId) {
    if (!professorId) return { success: false, message: 'Professor ID is required.' };
    const profIdx = (this.state.users || []).findIndex(u => u.id === professorId && u.role === 'professor');
    if (profIdx === -1) return { success: false, message: 'Professor account not found.' };

    const prof = this.state.users[profIdx];

    // Find all classes created by this professor and cascade delete them
    const profClasses = (this.state.classes || []).filter(c => c.professorId === professorId);
    profClasses.forEach(c => {
      this.deleteClass(c.id);
    });

    // Remove any live sessions by this professor
    if (this.state.liveSessions) {
      this.state.liveSessions = this.state.liveSessions.filter(s => s.professorId !== professorId);
    }

    // Remove any quizzes by this professor
    if (this.state.quizzes) {
      this.state.quizzes = this.state.quizzes.filter(q => q.professorId !== professorId);
    }

    // Remove any assignments by this professor
    if (this.state.assignments) {
      this.state.assignments = this.state.assignments.filter(a => a.professorId !== professorId);
    }

    // Remove any doubts assigned to this professor
    if (this.state.doubts) {
      this.state.doubts = this.state.doubts.filter(d => d.professorId !== professorId);
    }

    // Remove professor from users
    this.state.users.splice(profIdx, 1);
    this.state.platformStats.totalProfessors = (this.state.users || []).filter(u => u.role === 'professor').length;

    const isCurrent = this.state.currentUser && this.state.currentUser.id === professorId;
    if (isCurrent) {
      this.state.currentUser = null;
      this.state.currentRole = null;
      this.state.flowStep = 'lang_select';
      this.emit('userLoggedOut');
    }

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: `Professor profile and all created classes were deleted.` };
  }

  unenrollStudentFromClass(studentId, classId) {
    const student = (this.state.users || []).find(u => u.id === studentId);
    const cls = (this.state.classes || []).find(c => c.id === classId);
    if (!student || !cls) return { success: false, message: 'Class or student not found.' };

    student.enrolledClassIds = (student.enrolledClassIds || []).filter(id => id !== classId);
    cls.enrolledStudentIds = (cls.enrolledStudentIds || []).filter(id => id !== studentId);
    this.calculateStudentAttendance(studentId);

    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, message: `Left class "${cls.title}".` };
  }

  getStudentAssignments(studentId) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    const enrolledIds = student ? (student.enrolledClassIds || []) : [];
    if (enrolledIds.length === 0) return [];
    return (this.state.assignments || []).filter(a => enrolledIds.includes(a.classId));
  }

  // --- Live Sessions (Conducted Exclusively by Professors) ---
  getLiveSessions() { return this.state.liveSessions || []; }

  getStudentLiveSessions(studentId) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    const enrolledIds = student ? (student.enrolledClassIds || []) : [];
    if (enrolledIds.length === 0) return [];
    return (this.state.liveSessions || []).filter(s => enrolledIds.includes(s.classId));
  }

  getProfessorLiveSessions(profId) {
    if (!profId) return [];
    return (this.state.liveSessions || []).filter(s => s.professorId === profId);
  }

  scheduleLiveSession(professorId, classId, title, date, time, meetUrl) {
    const prof = this.getProfessor(professorId) || this.getCurrentUser();
    const cls = this.getClass(classId);

    const newSession = {
      id: 'live_' + Date.now(),
      professorId: prof ? prof.id : 'prof_default',
      professorName: prof ? prof.name : 'Faculty Member',
      classId: classId || '',
      classTitle: cls ? cls.title : 'Department Lecture',
      title: title || 'Live Faculty Interactive Session',
      date: date || new Date().toISOString().substring(0, 10),
      time: time || '04:00 PM - 05:00 PM',
      meetUrl: meetUrl || 'https://meet.google.com/edu-live-session',
      status: 'scheduled'
    };

    if (!this.state.liveSessions) this.state.liveSessions = [];
    this.state.liveSessions.unshift(newSession);
    this.saveState();
    this.emit('stateChanged', this.state);
    return newSession;
  }

  // --- Quizzes (Created & Published Strictly by Course Professors) ---
  getQuizzes() { return this.state.quizzes || []; }

  getStudentProfessorQuizzes(studentId) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    const enrolledIds = student ? (student.enrolledClassIds || []) : [];
    if (enrolledIds.length === 0) return [];
    return (this.state.quizzes || []).filter(q => enrolledIds.includes(q.classId));
  }

  getProfessorQuizzes(profId) {
    if (!profId) return [];
    return (this.state.quizzes || []).filter(q => q.professorId === profId);
  }
  
  createProfessorQuiz(professorId, classId, title, timeLimitMinutes, questions) {
    const prof = this.getProfessor(professorId) || this.getCurrentUser();
    const cls = this.getClass(classId);
    const newQuiz = {
      id: 'prof_qz_' + Date.now(),
      classId: classId || '',
      classTitle: cls ? cls.title : 'Class Quiz',
      professorId: prof ? prof.id : 'prof_default',
      professorName: prof ? prof.name : 'Professor',
      title: title || 'Professor Class Quiz',
      timeLimitMinutes: Number(timeLimitMinutes) || 15,
      questions: questions || []
    };

    if (!this.state.quizzes) this.state.quizzes = [];
    this.state.quizzes.unshift(newQuiz);
    this.saveState();
    this.emit('stateChanged', this.state);
    return newQuiz;
  }

  submitQuizAttempt(quizId, answers) {
    const quiz = (this.state.quizzes || []).find(q => q.id === quizId);
    if (!quiz) return null;

    let score = 0;
    const total = quiz.questions.length;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) score++;
    });

    const percent = Math.round((score / total) * 100);
    return { score, total, percent };
  }

  // --- Dynamic AI Mock Test Generator (Changes Every Time, 20 Questions Minimum, Topic-Specific) ---
  generateAIMockTest(level, subjectName) {
    if (typeof QuestionEngine !== 'undefined' && QuestionEngine.generate) {
      return QuestionEngine.generate(level, subjectName);
    }

    // Fallback if QuestionEngine is not yet in scope
    const sub = subjectName || 'Core Engineering';
    const questions = [];
    for (let i = 1; i <= 20; i++) {
      questions.push({
        question: `[AI Dynamic #${i}] In ${sub}, what is a foundational analytical principle or design benchmark?`,
        options: [
          `Verified theoretical theorems and boundary conditions in ${sub}`,
          `Unchecked algorithmic assumptions`,
          `Arbitrary heuristic values without proof`,
          `Non-standard metric deviations`
        ],
        correctIndex: 0,
        explanation: `Comprehensive examination in ${sub} requires validated theoretical formulations, boundary compliance, and structured proofs.`
      });
    }

    return {
      id: 'aimock_' + Date.now(),
      title: `Dynamic AI Mock Test: ${sub} (20 Questions)`,
      subject: sub,
      level: level || 'btech',
      timeLimitMinutes: 20,
      totalQuestions: 20,
      generatedAt: new Date().toISOString(),
      questions
    };
  }

  // --- Smart Study Planner (Customized for 1 to 12th, B.Tech, and Diploma) ---
  getAcademicCurriculum() {
    return ACADEMIC_LEVELS;
  }

  generateCustomStudyPlan(studentId, { level, gradeOrBranch, year, selectedSubjects, dailyHours, examName, examDate }) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    if (!student) return { success: false, message: 'Student account not found.' };

    const hours = Number(dailyHours);
    const validLevel = (level || '').trim();
    const validGrade = (gradeOrBranch || '').trim();
    const validDate = (examDate || '').trim();
    const subjects = Array.isArray(selectedSubjects) ? selectedSubjects.filter(Boolean) : [];

    // Strict validation: if ANY ONE of the required fields is not selected, DO NOT generate study planner!
    if (!validLevel || !validGrade || subjects.length === 0 || !hours || hours <= 0 || !validDate) {
      const lang = this.getLanguage();
      const msg = lang === 'te'
        ? 'దయచేసి అన్ని వివరాలు (విద్యా స్థాయి, గ్రేడ్/బ్రాంచ్, కనీసం ఒక సబ్జెక్ట్, రోజువారీ అధ్యయన గంటలు మరియు పరీక్ష తేదీ) ఎంచుకోండి. అప్పుడే స్టడీ ప్లానర్ రూపొందించబడుతుంది.'
        : 'Please select all required fields (Academic Stream, Grade/Branch, at least 1 Subject, Daily Hours, and Target Exam Date) before generating your timetable.';
      return { success: false, message: msg };
    }

    // Generate intelligent subject-wise timetable blocks
    const schedule = [];
    const timeSlots = [
      { start: '06:00 AM', end: '07:30 AM' },
      { start: '05:00 PM', end: '06:30 PM' },
      { start: '07:00 PM', end: '08:30 PM' },
      { start: '09:00 PM', end: '10:00 PM' }
    ];

    subjects.forEach((subj, idx) => {
      const slot = timeSlots[idx % timeSlots.length];
      schedule.push({
        time: `${slot.start} - ${slot.end}`,
        subject: subj,
        topic: `Professor lecture notes, derivations, and practice problems in ${subj}`,
        done: false
      });
    });

    // Add daily AI dynamic mock test session
    schedule.push({
      time: '08:30 PM - 09:00 PM',
      subject: 'Daily Mock Test & AI Review',
      topic: 'Attempt dynamic AI mock test (20 questions) and review step-by-step solutions',
      done: false
    });

    const planner = {
      level: validLevel,
      gradeOrBranch: validGrade,
      year: year || '',
      subjects,
      examName: examName || `${validGrade} Examination`,
      examDate: validDate,
      dailyHours: hours,
      schedule
    };

    student.studyPlanner = planner;
    this.saveState();
    this.emit('stateChanged', this.state);
    return { success: true, planner };
  }

  toggleStudyTask(studentId, taskIndex) {
    const student = (this.state.users || []).find(u => u.id === studentId) || this.getCurrentUser();
    if (student && student.studyPlanner && student.studyPlanner.schedule[taskIndex]) {
      student.studyPlanner.schedule[taskIndex].done = !student.studyPlanner.schedule[taskIndex].done;
      this.calculateStudentAttendance(student.id);
      this.saveState();
      this.emit('stateChanged', this.state);
    }
  }

  // --- Dynamic Academic Attendance & Performance Calculation ---
  calculateStudentAttendance(studentId) {
    const student = (this.state.users || []).find(u => u.id === studentId && u.role === 'student');
    if (!student) return 0;

    let points = 0;

    // 1. Enrolled in Professor Classes (Max 25%)
    const enrolledCount = (student.enrolledClassIds || []).length;
    if (enrolledCount > 0) {
      points += Math.min(25, 15 + (enrolledCount - 1) * 10);
    }

    // 2. Completed Quizzes (Professor Quizzes & Dynamic AI Mock Tests) (Max 35%)
    const notifs = this.getParentNotifications(student.studentCode);
    const quizNotifs = notifs.filter(n => n.type === 'quiz');
    if (quizNotifs.length > 0) {
      const avgQuizPct = quizNotifs.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizNotifs.length;
      const attemptPoints = Math.min(20, quizNotifs.length * 10);
      const scorePoints = Math.round((avgQuizPct / 100) * 15);
      points += (attemptPoints + scorePoints);
    }

    // 3. Submitted and Graded Assignments (Max 25%)
    const asgNotifs = notifs.filter(n => n.type === 'assignment_submitted' || n.type === 'assignment_graded');
    const gradedNotifs = notifs.filter(n => n.type === 'assignment_graded');
    if (asgNotifs.length > 0) {
      const subPoints = Math.min(15, asgNotifs.length * 10);
      const gradePoints = gradedNotifs.length > 0
        ? Math.round((gradedNotifs.reduce((sum, g) => sum + (g.marks || 0), 0) / gradedNotifs.length / 100) * 10)
        : 5;
      points += (subPoints + gradePoints);
    }

    // 4. Daily Study Planner Consistency & Completed Tasks (Max 15%)
    if (student.studyPlanner && Array.isArray(student.studyPlanner.schedule)) {
      const tasks = student.studyPlanner.schedule;
      const doneCount = tasks.filter(t => t.done).length;
      if (tasks.length > 0) {
        points += Math.round((doneCount / tasks.length) * 15);
      }
    } else if (student.studyStreakDays && student.studyStreakDays > 1) {
      points += Math.min(15, student.studyStreakDays * 5);
    }

    const finalPct = Math.min(100, Math.round(points));
    student.attendancePercentage = finalPct;

    // Dynamically update average grade based on quiz and assignment performance
    const scores = [];
    quizNotifs.forEach(q => { if (q.percentage !== undefined) scores.push(q.percentage); });
    gradedNotifs.forEach(g => { if (g.marks !== undefined) scores.push(g.marks); });
    if (scores.length > 0) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      student.averageGrade = `${avg}%`;
    }

    this.saveState();
    return finalPct;
  }

  // --- Assignments & Grading ---
  getAssignments() { return this.state.assignments || []; }
  
  createAssignment(classId, title, description, maxMarks, dueDate) {
    const user = this.getCurrentUser();
    const newAsg = {
      id: 'asg_' + Date.now(),
      classId,
      professorId: user ? user.id : 'prof_default',
      title,
      description,
      maxMarks: Number(maxMarks) || 100,
      dueDate,
      submissions: []
    };
    if (!this.state.assignments) this.state.assignments = [];
    this.state.assignments.unshift(newAsg);
    this.saveState();
    this.emit('stateChanged', this.state);
    return newAsg;
  }

  // --- Parent Real-Time WhatsApp Notifications System ---
  addParentWhatsAppNotification({ studentId, studentCode, studentName, type, title, score, total, percentage, marks, feedback }) {
    if (!this.state.parentNotifications) this.state.parentNotifications = [];
    const lang = this.getLanguage();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toISOString().substring(0, 10);

    let messageText = '';
    let badgeLabel = '';

    if (type === 'quiz') {
      badgeLabel = lang === 'te' ? 'క్విజ్ పూర్తి' : 'Quiz Completed';
      if (lang === 'te') {
        messageText = `📲 [WhatsApp Alert] విద్యార్థి ${studentName} (${studentCode}) '${title}' పరీక్ష పూర్తి చేశారు!\nస్కోరు: ${score}/${total} (${percentage}%)\nసమయం: ${timeStr}, ${dateStr}\nఫలితాలు అధ్యాపకుల రికార్డులో నమోదయ్యాయి.`;
      } else {
        messageText = `📲 [WhatsApp Alert] Student ${studentName} (${studentCode}) completed '${title}'!\nScore: ${score}/${total} (${percentage}%)\nTime: ${timeStr}, ${dateStr}\nRecorded for academic tracking.`;
      }
    } else if (type === 'assignment_submitted') {
      badgeLabel = lang === 'te' ? 'అసైన్‌మెంట్ సమర్పణ' : 'Assignment Submitted';
      if (lang === 'te') {
        messageText = `📲 [WhatsApp Alert] విద్యార్థి ${studentName} (${studentCode}) '${title}' అసైన్‌మెంట్‌ను అధ్యాపకుల సమీక్షకు సమర్పించారు.\nసమయం: ${timeStr}, ${dateStr}`;
      } else {
        messageText = `📲 [WhatsApp Alert] Student ${studentName} (${studentCode}) submitted solution for '${title}' for faculty evaluation.\nTime: ${timeStr}, ${dateStr}`;
      }
    } else if (type === 'assignment_graded') {
      badgeLabel = lang === 'te' ? 'మార్కులు కేటాయింపు' : 'Graded by Professor';
      if (lang === 'te') {
        messageText = `📲 [WhatsApp Alert] ప్రొఫెసర్ ${studentName} (${studentCode}) అసైన్‌మెంట్ '${title}' కు మార్కులు కేటాయించారు!\nమార్కులు: ${marks}%\nఅధ్యాపకుల అభిప్రాయం: ${feedback || 'మంచి పనితీరు!'}\nసమయం: ${timeStr}, ${dateStr}`;
      } else {
        messageText = `📲 [WhatsApp Alert] Professor graded ${studentName}'s (${studentCode}) assignment '${title}'!\nMarks Awarded: ${marks}%\nFeedback: ${feedback || 'Good work'}\nTime: ${timeStr}, ${dateStr}`;
      }
    }

    const alertItem = {
      id: 'notif_' + Date.now(),
      studentId,
      studentCode,
      studentName,
      type,
      badgeLabel,
      title,
      score,
      total,
      percentage,
      messageText,
      timestamp: `${dateStr} ${timeStr}`,
      status: 'Delivered via WhatsApp'
    };

    this.state.parentNotifications.unshift(alertItem);
    if (studentId) {
      this.calculateStudentAttendance(studentId);
    }
    this.saveState();
    this.emit('stateChanged', this.state);
    return alertItem;
  }

  getParentNotifications(studentCode = null) {
    const list = this.state.parentNotifications || [];
    if (!studentCode) return list;
    return list.filter(n => n.studentCode === studentCode);
  }

  submitAssignment(assignmentId, studentId, fileUrl) {
    const asg = (this.state.assignments || []).find(a => a.id === assignmentId);
    if (!asg) return;
    const student = this.getCurrentUser();
    if (!student) return;

    const sub = {
      id: 'sub_' + Date.now(),
      studentId,
      studentName: student.name,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      fileUrl: fileUrl || 'assignment_solution.pdf',
      marks: null,
      maxMarks: asg.maxMarks,
      status: 'submitted',
      feedback: ''
    };

    const exIndex = asg.submissions.findIndex(s => s.studentId === studentId);
    if (exIndex >= 0) asg.submissions[exIndex] = sub;
    else asg.submissions.push(sub);

    // Automated WhatsApp alert to parent
    this.addParentWhatsAppNotification({
      studentId,
      studentCode: student.studentCode,
      studentName: student.name,
      type: 'assignment_submitted',
      title: asg.title
    });

    this.saveState();
    this.emit('stateChanged', this.state);
    return sub;
  }

  gradeSubmission(assignmentId, submissionId, marks, feedback) {
    const asg = (this.state.assignments || []).find(a => a.id === assignmentId);
    if (!asg) return;
    const sub = asg.submissions.find(s => s.id === submissionId);
    if (!sub) return;

    sub.marks = Number(marks);
    sub.feedback = feedback;
    sub.status = 'graded';

    const student = (this.state.users || []).find(u => u.id === sub.studentId);
    if (student) student.averageGrade = `${sub.marks}%`;

    // Automated WhatsApp alert to parent
    this.addParentWhatsAppNotification({
      studentId: sub.studentId,
      studentCode: student ? student.studentCode : '',
      studentName: sub.studentName,
      type: 'assignment_graded',
      title: asg.title,
      marks: sub.marks,
      feedback: sub.feedback
    });

    this.saveState();
    this.emit('stateChanged', this.state);
  }

  // --- Announcements ---
  getAnnouncements() { return this.state.announcements || []; }
  
  createAnnouncement(title, content) {
    const user = this.getCurrentUser();
    const newAnc = {
      id: 'anc_' + Date.now(),
      professorId: user ? user.id : null,
      professorName: user ? user.name : 'Faculty Announcement',
      title,
      content,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    if (!this.state.announcements) this.state.announcements = [];
    this.state.announcements.unshift(newAnc);
    this.saveState();
    this.emit('stateChanged', this.state);
    return newAnc;
  }

  // --- Parent Weekly Report Generator (Real Logged-in/Registered Student Only) ---
  generateWeeklyReport(studentCode) {
    const allStudents = (this.state.users || []).filter(u => u.role === 'student');
    const currUser = this.getCurrentUser();
    let student = null;

    if (studentCode) {
      student = allStudents.find(u => (u.studentCode || '').toUpperCase() === studentCode.toUpperCase());
    }

    if (!student && currUser && currUser.role === 'parent') {
      const childId = (currUser.childIdentifier || currUser.childCode || '').trim();
      if (childId) {
        student = allStudents.find(u => 
          (u.studentCode && u.studentCode.toUpperCase() === childId.toUpperCase()) ||
          (u.identifier && u.identifier.toLowerCase() === childId.toLowerCase()) ||
          (u.identifier && childId && u.identifier.replace(/\D/g, '') === childId.replace(/\D/g, '') && childId.replace(/\D/g, '').length >= 10)
        );
      }
      if (!student && currUser.identifier) {
        student = allStudents.find(u => 
          u.parentContact && (
            u.parentContact.toLowerCase() === currUser.identifier.toLowerCase() ||
            (u.parentContact.replace(/\D/g, '') === currUser.identifier.replace(/\D/g, '') && currUser.identifier.replace(/\D/g, '').length >= 10)
          )
        );
      }
    }

    const lang = this.getLanguage();

    if (!student) {
      return {
        title: lang === 'te' ? 'విద్యార్థి లింక్ కాలేదు' : 'No Student Linked Yet',
        greeting: lang === 'te' ? 'నమస్కారం,' : 'Dear Parent,',
        body: lang === 'te'
          ? 'దయచేసి మీ పిల్లల స్టూడెంట్ కోడ్ (ఉదా: ST-XXXX-1234) నమోదు చేసి లింక్ చేయండి. విద్యార్థి క్విజ్ లేదా అసైన్‌మెంట్ రాసిన వెంటనే నిజ-సమయ WhatsApp హెచ్చరికలు ఇక్కడ అందుతాయి.'
          : 'Please connect your child using their Student Code (e.g. ST-XXXX-1234). Live WhatsApp notifications and performance updates will appear here whenever they complete a quiz or assignment.',
        channel: 'WhatsApp & SMS',
        student: null
      };
    }

    const stdName = student.name;
    const stdCode = student.studentCode;
    const stdAttendance = student.attendancePercentage !== undefined ? student.attendancePercentage : 0;
    const stdStreak = student.studyStreakDays || 1;
    const stdGrade = student.averageGrade || 'Pending';

    const notifs = this.getParentNotifications(stdCode);
    const quizCount = notifs.filter(n => n.type === 'quiz').length;
    const asgCount = notifs.filter(n => n.type === 'assignment_submitted' || n.type === 'assignment_graded').length;

    if (lang === 'te') {
      return {
        title: `వారంవారీ విద్యా సారాంశం (WhatsApp / SMS)`,
        greeting: `నమస్కారం,`,
        body: `${stdName} (${stdCode}) గారి తాజా అధ్యాపకుల పురోగతి నివేదిక:\n• ప్రొఫెసర్ తరగతి హాజరు: ${stdAttendance}%\n• రోజువారీ అధ్యయన స్ట్రీక్: ${stdStreak} రోజులు\n• అసైన్మెంట్ మార్కులు: ${stdGrade}\n• రాసిన క్విజ్‌లు: ${quizCount} | సమర్పించిన అసైన్‌మెంట్లు: ${asgCount}\n• విద్యార్థి ప్రతి క్విజ్ మరియు అసైన్‌మెంట్ వివరాలు క్రమం తప్పకుండా WhatsApp ద్వారా పంపబడుతున్నాయి.`,
        channel: 'WhatsApp & SMS',
        student
      };
    } else if (lang === 'hi') {
      return {
        title: `साप्ताहिक शैक्षणिक रिपोर्ट (WhatsApp / SMS)`,
        greeting: `नमस्ते,`,
        body: `${stdName} (${stdCode}) की प्रगति रिपोर्ट:\n• उपस्थिति: ${stdAttendance}%\n• अध्ययन क्रम (Streak): ${stdStreak} दिन\n• ग्रेड: ${stdGrade}\n• पूर्ण किए गए टेस्ट: ${quizCount} | असाइनमेंट: ${asgCount}\n• छात्र के प्रत्येक टेस्ट और असाइनमेंट की जानकारी WhatsApp पर भेजी जा रही है।`,
        channel: 'WhatsApp & SMS',
        student
      };
    } else if (lang === 'ta') {
      return {
        title: `வாராந்திர கல்வி அறிக்கை (WhatsApp / SMS)`,
        greeting: `வணக்கம்,`,
        body: `${stdName} (${stdCode}) அவர்களின் முன்னேற்ற அறிக்கை:\n• வகுப்பு வருகை: ${stdAttendance}%\n• படிப்பு தொடர்ச்சி: ${stdStreak} நாட்கள்\n• சராசரி தரம்: ${stdGrade}\n• எழுதிய தேர்வுகள்: ${quizCount} | சமர்ப்பித்த பணிகள்: ${asgCount}\n• மாணவரின் தேர்வுகள் WhatsApp மூலம் கண்காணிக்கப்படுகிறது.`,
        channel: 'WhatsApp & SMS',
        student
      };
    }

    return {
      title: `Weekly Academic Digest (WhatsApp & SMS Preview)`,
      greeting: `Dear Parent,`,
      body: `Here is ${stdName}'s (${stdCode}) performance summary:\n• Classroom Attendance: ${stdAttendance}%\n• Consecutive Study Streak: ${stdStreak} days\n• Academic Grade Standing: ${stdGrade}\n• Completed Quizzes: ${quizCount} | Submitted Assignments: ${asgCount}\n• Real-time updates dispatched to your registered WhatsApp on every test attempt.`,
      channel: 'WhatsApp & SMS',
      student
    };
  }
}

// Global store instance
const store = new EduConnectStore();
