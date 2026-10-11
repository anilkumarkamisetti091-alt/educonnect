/**
 * EduConnect - Core Application Controller (Professor-Centric Platform)
 * 
 * Features:
 * 1. AI Doubt Solver & Chosen Professor Escalation:
 *    - Direct AI step-by-step solutions
 *    - Student selects designated professor from faculty list for direct escalation
 * 2. Professor Academic Regulations & Code of Conduct:
 *    - Prominently displayed class rules, attendance guidelines, and student integrity standards
 * 3. Professor-Assigned Quizzes vs Dynamic AI Mock Tests:
 *    - Quizzes provided strictly by professors for their classes
 *    - Mock tests generated dynamically by AI agent (questions change every attempt)
 * 4. Smart Study Planner & Custom Schedule:
 *    - Student selects curriculum level (School 1-12th, B.Tech, Diploma/Polytechnic)
 *    - Dynamic grade/branch and subject checkboxes
 *    - Daily hours and exam date based intelligent timetable generation
 * 5. Live Lectures:
 *    - Scheduled and conducted exclusively by verified professors
 * 6. Zero Admin Priority:
 *    - Platform fully revolves around Professors and Students (with Parents linked)
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  activeQuiz: null,
  currentAIMockTest: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initTheme();
    this.initLanguage();
    this.updateScreenVisibility();
  },

  cacheDOM() {
    // Screens
    this.openingScreen = document.getElementById('opening-screen');
    this.appScreen = document.getElementById('app-screen');
    this.langSelectStep = document.getElementById('lang-select-step');
    this.authCredentialsStep = document.getElementById('auth-credentials-step');

    // Auth Elements
    this.tabLoginBtn = document.getElementById('tab-login-btn');
    this.tabRegisterBtn = document.getElementById('tab-register-btn');
    this.authLoginForm = document.getElementById('auth-login-form');
    this.authRegisterForm = document.getElementById('auth-register-form');
    this.loginErrorMsg = document.getElementById('login-error-msg');
    this.registerErrorMsg = document.getElementById('register-error-msg');
    this.rolePills = document.querySelectorAll('.role-pill-label');

    // Navbar & Global Controls
    this.langSelect = document.getElementById('global-lang-select');
    this.navUserName = document.getElementById('nav-user-name');
    this.navUserAvatar = document.getElementById('nav-user-avatar');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.resetDataBtn = document.getElementById('reset-data-btn');

    // Role Banner
    this.roleBanner = document.getElementById('role-banner');
    this.roleAvatar = document.getElementById('role-avatar');
    this.roleTitle = document.getElementById('role-title');
    this.roleSubtitle = document.getElementById('role-subtitle');
    this.roleBadge = document.getElementById('role-badge');

    // Views (No Admin role!)
    this.views = {
      student: document.getElementById('student-portal'),
      professor: document.getElementById('professor-portal'),
      parent: document.getElementById('parent-portal')
    };

    // Modals
    this.joinClassModal = document.getElementById('join-class-modal');
    this.createClassModal = document.getElementById('create-class-modal');
    this.uploadMaterialModal = document.getElementById('upload-material-modal');
    this.createAssignmentModal = document.getElementById('create-assignment-modal');
    this.gradeModal = document.getElementById('grade-modal');
    this.quizModal = document.getElementById('quiz-modal');
    this.bookMeetingModal = document.getElementById('book-meeting-modal');
    this.newForumModal = document.getElementById('new-forum-modal');
    this.scheduleLiveModal = document.getElementById('schedule-live-modal');
    this.createQuizModal = document.getElementById('create-quiz-modal');
    this.forgotPasswordModal = document.getElementById('forgot-password-modal');
    this.forgotErrorMsg = document.getElementById('forgot-error-msg');
    this.forgotSuccessMsg = document.getElementById('forgot-success-msg');

    this.toastContainer = document.getElementById('toast-container');
  },

  bindEvents() {
    // Global Regional Language Selector
    if (this.langSelect) {
      this.langSelect.addEventListener('change', (e) => {
        store.setLanguage(e.target.value);
      });
    }

    // Theme Toggle
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        const newTheme = store.toggleTheme();
        this.applyTheme(newTheme);
      });
    }

    // Reset Data
    if (this.resetDataBtn) {
      this.resetDataBtn.addEventListener('click', () => {
        const lang = store.getLanguage();
        const confirmMsg = lang === 'te' 
          ? 'ప్లాట్‌ఫారమ్ డేటా మొత్తాన్ని క్లియర్ చేసి ప్రారంభ దశకు రీసెట్ చేయాలా?' 
          : 'Clear all data and reset platform to initial state?';
        if (confirm(confirmMsg)) {
          store.resetToDefault();
          this.updateScreenVisibility();
          this.showToast('Platform reset to clean initial state.', 'info');
        }
      });
    }

    // Modal Close handlers
    document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => this.closeAllModals());
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeAllModals();
      });
    });

    // Reactive Store Listeners
    store.on('flowChanged', () => {
      this.updateScreenVisibility();
    });

    store.on('languageChanged', (lang) => {
      document.documentElement.lang = lang;
      if (this.langSelect) this.langSelect.value = lang;
      this.applyTranslations();
      this.renderCurrentView();
    });

    store.on('userLoggedIn', () => {
      this.updateScreenVisibility();
      this.renderCurrentView();
    });

    store.on('userLoggedOut', () => {
      this.updateScreenVisibility();
    });

    store.on('stateChanged', () => {
      this.renderCurrentView();
    });
  },

  initTheme() {
    this.applyTheme(store.getTheme());
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (this.themeToggleBtn) {
      this.themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  initLanguage() {
    const lang = store.getLanguage();
    if (this.langSelect) this.langSelect.value = lang;
    document.documentElement.lang = lang;
    this.applyTranslations();
  },

  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const text = store.t(key);
      if (text && typeof text === 'string') {
        el.textContent = text;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const text = store.t(key);
      if (text && typeof text === 'string') {
        el.placeholder = text;
      }
    });
  },

  // =========================================================================
  // Screen Management (Opening Screen -> Authentication -> Portal View)
  // =========================================================================

  updateScreenVisibility() {
    const user = store.getCurrentUser();
    const flowStep = store.getFlowStep();

    if (!user) {
      if (this.appScreen) this.appScreen.style.display = 'none';
      if (this.openingScreen) this.openingScreen.style.display = 'flex';

      if (flowStep === 'lang_select') {
        if (this.langSelectStep) this.langSelectStep.style.display = 'block';
        if (this.authCredentialsStep) this.authCredentialsStep.style.display = 'none';
      } else {
        if (this.langSelectStep) this.langSelectStep.style.display = 'none';
        if (this.authCredentialsStep) this.authCredentialsStep.style.display = 'block';
      }
    } else {
      if (this.openingScreen) this.openingScreen.style.display = 'none';
      if (this.appScreen) this.appScreen.style.display = 'block';

      this.updateNavbarUserBadge();
      this.renderCurrentView();
    }

    this.applyTranslations();
  },

  chooseLanguageAndProceed(lang) {
    store.selectLanguageAndProceed(lang);
    if (this.langSelect) this.langSelect.value = lang;
    this.applyTranslations();
    this.updateScreenVisibility();
  },

  backToLanguageSelect() {
    store.setFlowStep('lang_select');
    this.updateScreenVisibility();
  },

  switchAuthMode(mode) {
    if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';
    if (this.registerErrorMsg) this.registerErrorMsg.style.display = 'none';

    if (mode === 'login') {
      if (this.tabLoginBtn) this.tabLoginBtn.classList.add('active');
      if (this.tabRegisterBtn) this.tabRegisterBtn.classList.remove('active');
      if (this.authLoginForm) this.authLoginForm.style.display = 'block';
      if (this.authRegisterForm) this.authRegisterForm.style.display = 'none';
    } else {
      if (this.tabRegisterBtn) this.tabRegisterBtn.classList.add('active');
      if (this.tabLoginBtn) this.tabLoginBtn.classList.remove('active');
      if (this.authRegisterForm) this.authRegisterForm.style.display = 'block';
      if (this.authLoginForm) this.authLoginForm.style.display = 'none';
    }
  },

  handleRoleChange(role) {
    this.rolePills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.role === role);
    });

    const stdFields = document.getElementById('reg-student-fields');
    const profFields = document.getElementById('reg-prof-fields');
    const parentFields = document.getElementById('reg-parent-fields');

    if (stdFields) stdFields.style.display = role === 'student' ? 'block' : 'none';
    if (profFields) profFields.style.display = role === 'professor' ? 'block' : 'none';
    if (parentFields) parentFields.style.display = role === 'parent' ? 'block' : 'none';
  },

  getSelectedAuthRole() {
    const checked = document.querySelector('input[name="auth_role"]:checked');
    return checked ? checked.value : 'student';
  },

  handleLogin(e) {
    e.preventDefault();
    const identifier = (document.getElementById('login-identifier').value || '').trim();
    const password = (document.getElementById('login-password').value || '').trim();
    const role = this.getSelectedAuthRole();

    const res = store.loginUser({ identifier, password, role });
    if (!res.success) {
      if (this.loginErrorMsg) {
        this.loginErrorMsg.textContent = res.message;
        this.loginErrorMsg.style.display = 'block';
      }
      return;
    }

    if (this.loginErrorMsg) this.loginErrorMsg.style.display = 'none';
    this.showToast(`Welcome back, ${res.user.name}!`, 'success');
    this.updateScreenVisibility();
  },

  handleRegister(e) {
    e.preventDefault();
    const name = (document.getElementById('reg-name').value || '').trim();
    const identifier = (document.getElementById('reg-identifier').value || '').trim();
    const password = (document.getElementById('reg-password').value || '').trim();
    const role = this.getSelectedAuthRole();

    const yearInput = document.getElementById('reg-year');
    const majorInput = document.getElementById('reg-major');
    const deptInput = document.getElementById('reg-dept');
    const childCodeInput = document.getElementById('reg-child-code');
    const parentIdInput = document.getElementById('reg-parent-id');
    const childIdentifierInput = document.getElementById('reg-child-identifier');

    const year = yearInput ? yearInput.value.trim() : '';
    const major = majorInput ? majorInput.value.trim() : '';
    const dept = deptInput ? deptInput.value.trim() : '';
    const childCode = childCodeInput ? childCodeInput.value.trim() : '';
    const parentIdentifier = parentIdInput ? parentIdInput.value.trim() : '';
    const childIdentifier = childIdentifierInput ? childIdentifierInput.value.trim() : '';

    const res = store.registerUser({ 
      name, 
      identifier, 
      password, 
      role, 
      year, 
      major, 
      dept, 
      childCode,
      parentIdentifier,
      childIdentifier
    });
    if (!res.success) {
      if (this.registerErrorMsg) {
        this.registerErrorMsg.textContent = res.message;
        this.registerErrorMsg.style.display = 'block';
      }
      return;
    }

    if (this.registerErrorMsg) this.registerErrorMsg.style.display = 'none';
    this.showToast(`Account created successfully! Welcome, ${res.user.name}!`, 'success');
    this.updateScreenVisibility();
  },

  openForgotPasswordModal() {
    if (this.forgotErrorMsg) this.forgotErrorMsg.style.display = 'none';
    if (this.forgotSuccessMsg) this.forgotSuccessMsg.style.display = 'none';

    const idInput = document.getElementById('forgot-identifier');
    const newPassInput = document.getElementById('forgot-new-pass');
    const confirmPassInput = document.getElementById('forgot-confirm-pass');

    const loginIdInput = document.getElementById('login-identifier');
    if (idInput && loginIdInput && loginIdInput.value) {
      idInput.value = loginIdInput.value.trim();
    } else if (idInput) {
      idInput.value = '';
    }

    if (newPassInput) newPassInput.value = '';
    if (confirmPassInput) confirmPassInput.value = '';

    if (this.forgotPasswordModal) this.forgotPasswordModal.classList.add('active');
  },

  submitForgotPassword(e) {
    e.preventDefault();
    const identifier = (document.getElementById('forgot-identifier').value || '').trim();
    const newPass = (document.getElementById('forgot-new-pass').value || '').trim();
    const confirmPass = (document.getElementById('forgot-confirm-pass').value || '').trim();

    if (newPass !== confirmPass) {
      if (this.forgotErrorMsg) {
        this.forgotErrorMsg.textContent = 'New password and confirm password do not match.';
        this.forgotErrorMsg.style.display = 'block';
      }
      return;
    }

    const res = store.resetPassword({ identifier, newPassword: newPass });
    if (!res.success) {
      if (this.forgotErrorMsg) {
        this.forgotErrorMsg.textContent = res.message;
        this.forgotErrorMsg.style.display = 'block';
      }
      return;
    }

    if (this.forgotErrorMsg) this.forgotErrorMsg.style.display = 'none';
    if (this.forgotSuccessMsg) {
      this.forgotSuccessMsg.textContent = res.message;
      this.forgotSuccessMsg.style.display = 'block';
    }

    const loginPassInput = document.getElementById('login-password');
    if (loginPassInput) loginPassInput.value = newPass;

    setTimeout(() => {
      this.closeAllModals();
      this.showToast('Password reset successfully. You can now log in!', 'success');
    }, 1200);
  },

  handleLogout() {
    store.logout();
    const lang = store.getLanguage();
    const byeMsg = lang === 'te' ? 'విజయవంతంగా లాగ్ అవుట్ అయ్యారు.' : 'Logged out successfully.';
    this.showToast(byeMsg, 'info');
    this.updateScreenVisibility();
  },

  updateNavbarUserBadge() {
    const user = store.getCurrentUser();
    if (!user) return;

    if (this.navUserName) {
      this.navUserName.textContent = `${user.name} (${store.t('roles.' + user.role)})`;
    }
    if (this.navUserAvatar) {
      this.navUserAvatar.src = user.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.name)}`;
    }
  },

  // =========================================================================
  // Main Portal Views (Student, Professor, Parent - Zero Admin Priority)
  // =========================================================================

  renderCurrentView() {
    const user = store.getCurrentUser();
    const role = user ? user.role : (store.getCurrentRole() || 'student');

    // Update navbar portal pill (strictly shows logged-in user's role)
    const portalIcon = document.getElementById('current-portal-icon');
    const portalText = document.getElementById('current-portal-text');
    if (portalIcon && portalText) {
      const icons = { student: '🎒', professor: '👨‍🏫', parent: '👨‍👩‍👧' };
      portalIcon.textContent = icons[role] || '🎓';
      portalText.textContent = `${store.t('roles.' + role)} Portal`;
    }

    // Strictly show ONLY the authenticated user's portal view
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        this.views[key].classList.toggle('active', key === role);
        this.views[key].style.display = key === role ? 'block' : 'none';
      }
    });

    this.updateRoleBanner(role);

    if (role === 'student') this.renderStudentPortal();
    else if (role === 'professor') this.renderProfessorPortal();
    else if (role === 'parent') this.renderParentPortal();
  },

  updateRoleBanner(role) {
    const user = store.getCurrentUser();

    this.roleBanner.className = 'role-banner ' + (
      role === 'student' ? 'student-theme' :
      role === 'professor' ? 'prof-theme' :
      role === 'parent' ? 'parent-theme' : 'student-theme'
    );

    if (this.roleAvatar) {
      this.roleAvatar.src = user && user.avatar ? user.avatar : `https://api.dicebear.com/7.x/identicon/svg?seed=${role}`;
    }

    if (this.roleTitle) {
      if (user) {
        this.roleTitle.textContent = `${user.name} - ${store.t('roles.' + role)}`;
      } else {
        this.roleTitle.textContent = `EduConnect - ${store.t('roles.' + role)}`;
      }
    }

    if (this.roleBadge) {
      this.roleBadge.className = `role-badge badge-${role}`;
      this.roleBadge.textContent = user && user.studentCode ? user.studentCode : (user ? 'Verified Active' : 'Portal');
    }

    if (this.roleSubtitle) {
      this.roleSubtitle.textContent = store.t('tagline');
    }
  },

  // =========================================================================
  // 1. STUDENT PORTAL
  // =========================================================================

  renderStudentPortal() {
    const user = store.getCurrentUser();
    if (!user) return;

    // Dynamically calculate attendance based on enrolled classes, completed quizzes & assignments
    store.calculateStudentAttendance(user.id);

    // KPIs
    const streakEl = document.getElementById('student-streak-val');
    const attEl = document.getElementById('student-attendance-val');
    const classesEl = document.getElementById('student-classes-count-val');
    const gradeEl = document.getElementById('student-grade-val');

    if (streakEl) streakEl.textContent = `${user.studyStreakDays || 1} Day${user.studyStreakDays > 1 ? 's' : ''}`;
    if (attEl) attEl.textContent = `${user.attendancePercentage !== undefined ? user.attendancePercentage : 0}%`;
    const enrolledClasses = store.getStudentEnrolledClasses(user.id);
    if (classesEl) classesEl.textContent = enrolledClasses.length;
    if (gradeEl) gradeEl.textContent = user.averageGrade || 'Pending';

    // Display Unique Student Code for Parent WhatsApp linkage
    const studentCodeEl = document.getElementById('student-unique-code-display');
    if (studentCodeEl) studentCodeEl.textContent = user.studentCode || 'ST-ACTIVE';

    // Populate Designated Professor selector in Doubt Solver
    this.populateDoubtProfessorSelect();

    // Render Doubts History
    this.renderStudentDoubts(user.id);

    // Render Professor Academic Regulations & Code of Conduct
    this.renderStudentProfessorRules(user.id);

    // Enrolled Classes
    this.renderStudentClasses(user.id);

    // Assignments
    this.renderStudentAssignments(user.id);

    // Professor Quizzes
    this.renderStudentProfessorQuizzes();

    // Dynamic AI Mock Test controls
    this.renderMockTestControls();

    // Smart Study Planner (Classes 1-12, B.Tech, Diploma)
    this.renderStudentPlannerControls(user);
    this.renderStudentPlannerTasks(user);

    // Discussion Forum
    this.renderForum();

    // Parent Automatic Connection Status
    this.renderParentConnectionStatus(user);
  },

  renderParentConnectionStatus(user) {
    const container = document.getElementById('student-parent-connect-card');
    if (!container) return;

    // Check if any parent account is matched with this student
    const allParents = (store.state.users || []).filter(u => u.role === 'parent');
    const matchedParent = allParents.find(p => {
      const childId = (p.childIdentifier || p.childCode || '').trim();
      const isMatchedChild = (
        (p.childCode && p.childCode.toUpperCase() === (user.studentCode || '').toUpperCase()) ||
        (childId && childId.toUpperCase() === (user.studentCode || '').toUpperCase()) ||
        (childId && childId.toLowerCase() === (user.identifier || '').toLowerCase()) ||
        (childId && user.identifier && childId.replace(/\D/g, '') === user.identifier.replace(/\D/g, '') && childId.replace(/\D/g, '').length >= 10)
      );
      const isMatchedContact = (
        user.parentContact && (
          user.parentContact.toLowerCase() === (p.identifier || '').toLowerCase() ||
          (user.parentContact.replace(/\D/g, '') === (p.identifier || '').replace(/\D/g, '') && user.parentContact.replace(/\D/g, '').length >= 10)
        )
      );
      return isMatchedChild || isMatchedContact;
    });

    if (matchedParent) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: var(--success-bg); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              👨‍👩‍👧
            </div>
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--success-text); display: flex; align-items: center; gap: 0.35rem;">
                <span>✅ ${store.t('student.parentConnected')}</span>
                <span class="badge badge-success" style="font-size: 0.7rem;">Auto-Synced</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-main); font-weight: 600;">
                ${this.escapeHTML(matchedParent.name)} (${this.escapeHTML(matchedParent.identifier)})
              </div>
            </div>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 250px; line-height: 1.35;">
            📲 Live quiz & assignment marks instantly forwarded to parent WhatsApp & portal.
          </div>
        </div>
      `;
    } else {
      const savedContact = user.parentContact || '';
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
            <div style="font-size: 0.825rem; font-weight: 700; color: var(--warning-text); display: flex; align-items: center; gap: 0.35rem;">
              <span>⚠️ ${store.t('student.parentNotConnected')}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">
              ${savedContact ? `Saved: ${this.escapeHTML(savedContact)} (Auto-Sync Ready)` : 'Auto-links via Mobile or Email'}
            </span>
          </div>
          <form onsubmit="App.handleUpdateParentContact(event)" style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
            <input type="text" id="student-parent-input" class="form-control" style="font-size: 0.8rem; padding: 0.35rem 0.65rem;" placeholder="Parent Mobile (10 digits) or Email" value="${this.escapeHTML(savedContact)}" required>
            <button type="submit" class="btn btn-primary btn-sm" style="white-space: nowrap; padding: 0.35rem 0.75rem; font-size: 0.8rem;">
              🔗 Auto-Link
            </button>
          </form>
        </div>
      `;
    }
  },

  handleUpdateParentContact(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const input = document.getElementById('student-parent-input');
    const contact = (input ? input.value : '').trim();
    if (!contact) return;

    const res = store.updateStudentParentContact(user.id, contact);
    if (!res.success) {
      alert(res.message);
      return;
    }

    this.renderStudentPortal();
    const lang = store.getLanguage();
    const msg = lang === 'te'
      ? 'తల్లిదండ్రుల వివరాలు విజయవంతంగా సేవ్ చేయబడ్డాయి! వారి ఖాతాతో ఆటోమేటిక్‌గా కనెక్ట్ చేయబడింది.'
      : 'Parent contact saved! Account auto-synced with parent profile.';
    this.showToast(msg, 'success');
  },

  populateDoubtProfessorSelect() {
    const select = document.getElementById('doubt-prof-select');
    if (!select) return;

    const profs = store.getProfessors();
    if (profs.length === 0) {
      const lang = store.getLanguage();
      const emptyMsg = lang === 'te'
        ? 'ఇంకా ఏ ప్రొఫెసర్ రిజిస్టర్ కాలేదు (ప్రొఫెసర్ రిజిస్టర్ కాగానే ఆటోమేటిక్‌గా ఇక్కడ కనిపిస్తారు)'
        : 'No professors registered yet (Will automatically appear once a professor registers)';
      select.innerHTML = `<option value="">${emptyMsg}</option>`;
      return;
    }

    select.innerHTML = profs.map(p => `
      <option value="${p.id}">👨‍🏫 ${this.escapeHTML(p.name)} (${this.escapeHTML(p.dept || p.title || 'Faculty')})</option>
    `).join('');
  },

  renderStudentProfessorRules(studentId) {
    const container = document.getElementById('student-professor-rules-list');
    if (!container) return;

    const rulesData = store.getEnrolledProfessorRules(studentId);
    if (rulesData.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1.5rem; color: var(--text-muted); background: var(--bg-card-subtle); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem;">📜</span>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
            No Professor Academic Regulations Assigned Yet
          </h4>
          <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 1.25rem auto; line-height: 1.5;">
            Academic regulations and code of conduct are set strictly by the specific professor/mentor whose class you enroll in. Join your professor's class using their join code to view their official rules.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="App.openJoinClassModal()">
            + Join Mentor Class with Code
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = rulesData.map(item => `
      <div class="prof-rules-box">
        <div class="prof-rules-header">
          <div>
            <strong style="font-size: 0.95rem; color: var(--primary);">👨‍🏫 ${this.escapeHTML(item.professorName)}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">• ${this.escapeHTML(item.classTitle)} (Code: ${item.joinCode})</span>
          </div>
          <span class="badge badge-warning" style="font-size: 0.75rem;">Mentor Regulations</span>
        </div>
        <ul class="prof-rules-list">
          ${item.rules.map(rule => `<li>${this.escapeHTML(rule)}</li>`).join('')}
        </ul>
        <div style="margin-top: 0.65rem; font-size: 0.8rem; color: var(--success); font-weight: 600;">
          ✓ ${store.t('student.rulesPledge')}
        </div>
      </div>
    `).join('');
  },

  renderStudentDoubts(studentId) {
    const container = document.getElementById('student-doubts-history');
    if (!container) return;

    const doubts = store.getStudentDoubts(studentId);
    if (doubts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          <p>${store.t('student.noDoubts')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = doubts.map(d => {
      const isAI = d.status === 'ai';
      const isEscalated = d.status === 'escalated';
      const isResolved = d.status === 'resolved';

      let statusBadge = '';
      if (isAI) {
        statusBadge = `<span class="badge badge-info" style="background: rgba(59, 130, 246, 0.15); color: var(--primary); border: 1px solid rgba(59, 130, 246, 0.3);">⚡ AI-Solved</span>`;
      } else if (isEscalated) {
        statusBadge = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.3);">⏳ Assigned to Prof. ${this.escapeHTML(d.professorName || 'Faculty')} (Awaiting Faculty Response)</span>`;
      } else if (isResolved) {
        statusBadge = `<span class="badge badge-success" style="background: rgba(16, 185, 129, 0.15); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3);">✓ Verified Answer by Prof. ${this.escapeHTML(d.professorName || 'Faculty')}</span>`;
      }

      return `
        <div class="doubt-card ${isResolved ? 'resolved' : ''}">
          <div class="doubt-header">
            <div>
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">Q: ${this.escapeHTML(d.question)}</span>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${d.createdAt} ${d.professorName ? `• Designated Faculty: <strong>Prof. ${this.escapeHTML(d.professorName)}</strong>` : ''}
              </div>
            </div>
            <div>${statusBadge}</div>
          </div>

          <!-- Professor Reply (Primary Faculty Clarification) -->
          ${d.professorReply ? `
            <div style="margin-top: 0.75rem; padding: 0.85rem; background: var(--success-bg); border-radius: var(--radius-sm); border: 1px solid rgba(16, 185, 129, 0.3);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--success); margin-bottom: 0.25rem;">
                👨‍🏫 Verified Faculty Explanation (Prof. ${this.escapeHTML(d.professorName || 'Professor')}):
              </div>
              <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.5; margin: 0;">${this.escapeHTML(d.professorReply)}</p>
              <span style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.35rem;">Resolved on ${d.resolvedAt || ''}</span>
            </div>
          ` : ''}

          <!-- AI Explanation if present -->
          ${d.aiAnswer ? `
            <div class="doubt-body" style="margin-top: 0.75rem;">
              <div style="font-size: 0.825rem; font-weight: 600; color: var(--primary); margin-bottom: 0.35rem;">
                🤖 Step-by-Step AI Solution:
              </div>
              <pre style="white-space: pre-wrap; font-family: inherit; font-size: 0.85rem; color: var(--text-main); background: var(--bg-card-subtle); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); line-height: 1.5;">${this.escapeHTML(d.aiAnswer)}</pre>
            </div>
          ` : ''}

          <!-- Awaiting Professor with on-demand AI solver -->
          ${isEscalated && !d.aiAnswer && !d.professorReply ? `
            <div style="margin-top: 0.75rem; padding: 0.85rem 1rem; background: rgba(99, 102, 241, 0.05); border-radius: var(--radius-sm); border: 1px dashed var(--primary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                👨‍🏫 Submitted directly to <strong>Prof. ${this.escapeHTML(d.professorName || 'Faculty')}</strong> as first preference. Faculty response will appear here.
              </div>
              <button type="button" class="btn btn-sm btn-secondary" onclick="App.handleGenerateAIForDoubt('${d.id}')" style="font-size: 0.8rem; font-weight: 600;">
                ⚡ Solve with AI while waiting (Next Option)
              </button>
            </div>
          ` : ''}

          <!-- AI-only doubt, allow escalating to professor -->
          ${isAI ? `
            <div class="doubt-actions" style="margin-top: 0.75rem; display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Need faculty review from your mentor?</span>
              <button type="button" class="btn btn-sm btn-secondary" onclick="App.handleEscalateDoubt('${d.id}')">
                👨‍🏫 Send to Selected Professor
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  handleSendDoubtToProfessor(e) {
    if (e && e.preventDefault) e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const input = document.getElementById('student-doubt-input');
    const question = (input ? input.value : '').trim();
    if (!question) {
      alert('Please type your academic question or doubt description.');
      return;
    }

    const profSelect = document.getElementById('doubt-prof-select');
    const selectedProfId = profSelect ? profSelect.value : null;

    if (!selectedProfId) {
      alert('Please select your designated professor from the dropdown above to submit your academic question.');
      return;
    }

    const res = store.askProfessorDoubt(user.id, selectedProfId, question);
    if (!res.success) {
      alert(res.message);
      return;
    }

    if (input) input.value = '';
    this.renderStudentDoubts(user.id);
    const lang = store.getLanguage();
    const msg = lang === 'te'
      ? `మీ సందేహం ప్రొఫెసర్ ${res.professor.name} గారికి విజయవంతంగా పంపబడింది (మొదటి ప్రాధాన్యత)!`
      : `Academic doubt submitted directly to Professor ${res.professor.name}! (First Preference)`;
    this.showToast(msg, 'success');
  },

  handleSolveDoubtWithAI() {
    const user = store.getCurrentUser();
    if (!user) return;

    const input = document.getElementById('student-doubt-input');
    const question = (input ? input.value : '').trim();
    if (!question) {
      alert('Please type your academic question or concept doubt first.');
      return;
    }

    store.askDoubt(user.id, question);
    if (input) input.value = '';
    this.renderStudentDoubts(user.id);
    const lang = store.getLanguage();
    const successMsg = lang === 'te'
      ? 'మీ సందేహం AI ద్వారా తెలుగులో దశలవారీగా పరిష్కరించబడింది (తదుపరి ఎంపిక)!'
      : 'Step-by-step solution generated with AI! (Next Option)';
    this.showToast(successMsg, 'success');
  },

  handleGenerateAIForDoubt(doubtId) {
    const user = store.getCurrentUser();
    if (!user) return;

    const res = store.generateAIDoubtAnswer(doubtId);
    if (!res) {
      alert('Could not generate AI solution for this doubt.');
      return;
    }

    this.renderStudentDoubts(user.id);
    this.showToast('AI step-by-step explanation generated while awaiting professor reply!', 'info');
  },

  handleAskDoubt(e) {
    // Keep backward compatibility, route to professor-first
    this.handleSendDoubtToProfessor(e);
  },

  handleEscalateDoubt(doubtId) {
    const profSelect = document.getElementById('doubt-prof-select');
    const selectedProfId = profSelect ? profSelect.value : null;

    if (!selectedProfId) {
      alert('Please select a designated professor from the dropdown above to submit your doubt.');
      return;
    }

    const res = store.escalateDoubtToProfessor(doubtId, selectedProfId);
    if (!res.success) {
      alert(res.message);
      return;
    }

    const user = store.getCurrentUser();
    if (user) this.renderStudentDoubts(user.id);

    const lang = store.getLanguage();
    const escMsg = lang === 'te'
      ? `సందేహం ప్రొఫెసర్ ${res.professor.name} గారికి పంపబడింది.`
      : `Doubt sent to Professor ${res.professor.name} for verified faculty explanation!`;
    this.showToast(escMsg, 'info');
  },

  renderStudentClasses(studentId) {
    const container = document.getElementById('student-classes-list');
    if (!container) return;

    const enrolled = store.getStudentEnrolledClasses(studentId);
    if (enrolled.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          <p>${store.t('student.noClasses')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
        ${enrolled.map(c => `
          <div class="class-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${this.escapeHTML(c.title)}</h3>
              <span class="badge badge-info" style="font-family: monospace;">${c.joinCode}</span>
            </div>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.5rem;">
              👨‍🏫 ${this.escapeHTML(c.professorName)} • 🕒 ${this.escapeHTML(c.schedule)}
            </p>
            <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
              <div style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--text-main);">
                ${store.t('student.materialsTitle')}
              </div>
              ${(c.materials && c.materials.length > 0) ? `
                <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.35rem;">
                  ${c.materials.map(m => `
                    <li style="font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between;">
                      <span>📄 ${this.escapeHTML(m.title)} (${m.type})</span>
                      <a href="${m.url}" target="_blank" style="color: var(--primary); text-decoration: underline; font-size: 0.75rem;">Open</a>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p style="font-size: 0.775rem; color: var(--text-muted);">No materials uploaded yet.</p>
              `}
            </div>
            <div style="margin-top: 0.75rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: flex; justify-content: flex-end;">
              <button class="btn btn-sm btn-outline-danger" onclick="App.handleUnenrollClass('${c.id}')" style="font-size: 0.75rem; padding: 0.2rem 0.55rem;">
                ${store.t('student.leaveClassBtn')}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStudentAssignments(studentId) {
    const container = document.getElementById('student-assignments-list');
    if (!container) return;

    const assignments = store.getStudentAssignments(studentId);
    if (assignments.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
          <p>${store.t('student.noAssignments')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = assignments.map(a => {
      const sub = (a.submissions || []).find(s => s.studentId === studentId);
      const isGraded = sub && sub.status === 'graded';
      const isSubmitted = sub && sub.status === 'submitted';

      let statusHtml = '<span class="badge badge-warning">Pending Submission</span>';
      if (isGraded) statusHtml = `<span class="badge badge-success">Graded: ${sub.marks}/${a.maxMarks}</span>`;
      else if (isSubmitted) statusHtml = '<span class="badge badge-info">Submitted - Awaiting Review</span>';

      return `
        <div style="background-color: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700;">${this.escapeHTML(a.title)}</h4>
            ${statusHtml}
          </div>
          <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            ${this.escapeHTML(a.description)}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.775rem; color: var(--text-muted);">
            <span>Due: ${a.dueDate}</span>
            ${!sub ? `
              <button class="btn btn-sm btn-primary" onclick="App.handleStudentSubmitAssignment('${a.id}')">
                ${store.t('student.submitBtn')}
              </button>
            ` : (isGraded && sub.feedback ? `
              <span style="color: var(--success); font-weight: 600;">Feedback: ${this.escapeHTML(sub.feedback)}</span>
            ` : '')}
          </div>
        </div>
      `;
    }).join('');
  },

  handleStudentSubmitAssignment(assignmentId) {
    const user = store.getCurrentUser();
    if (!user) return;
    const fileUrl = prompt('Enter link or filename for your completed solution:', 'https://drive.google.com/my-solution.pdf');
    if (!fileUrl) return;

    store.submitAssignment(assignmentId, user.id, fileUrl);
    this.renderStudentAssignments(user.id);
    this.showToast('Solution submitted successfully for professor grading!', 'success');
  },

  // --- Professor Quizzes & Dynamic AI Mock Tests ---

  renderStudentProfessorQuizzes() {
    const container = document.getElementById('student-prof-quizzes-list');
    if (!container) return;

    const user = store.getCurrentUser();
    const quizzes = store.getStudentProfessorQuizzes(user ? user.id : null);
    if (quizzes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1.5rem; color: var(--text-muted); background: var(--bg-card-subtle); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem;">📝</span>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
            No Professor-Assigned Class Quizzes Yet
          </h4>
          <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 1.25rem auto; line-height: 1.5;">
            Class quizzes are created exclusively by your enrolled mentor professors for their batches. Once your professor publishes an assessment, it will appear here. You can also practice anytime using the Dynamic AI Mock Test below.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="App.openJoinClassModal()">
            + Join Mentor Class with Code
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = quizzes.map(q => `
      <div class="quiz-card-item">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.2rem;">
            ${this.escapeHTML(q.title)}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            👨‍🏫 By ${this.escapeHTML(q.professorName)} • ⏱️ ${q.timeLimitMinutes} Mins • ❓ ${q.questions.length} Questions
          </div>
        </div>
        <button class="btn btn-sm btn-primary" onclick="App.openProfessorQuiz('${q.id}')">
          ▶️ Take Quiz
        </button>
      </div>
    `).join('');
  },

  openProfessorQuiz(quizId) {
    const quiz = store.getQuizzes().find(q => q.id === quizId);
    if (!quiz) return;

    this.activeQuiz = quiz;
    const titleEl = document.getElementById('quiz-modal-title');
    const bodyEl = document.getElementById('quiz-questions-body');
    const activeIdEl = document.getElementById('quiz-active-id');
    const activeTypeEl = document.getElementById('quiz-active-type');

    if (titleEl) titleEl.textContent = `Professor Quiz: ${quiz.title}`;
    if (activeIdEl) activeIdEl.value = quiz.id;
    if (activeTypeEl) activeTypeEl.value = 'professor';

    bodyEl.innerHTML = quiz.questions.map((q, idx) => `
      <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
        <p style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem;">
          ${idx + 1}. ${this.escapeHTML(q.question)}
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          ${q.options.map((opt, optIdx) => `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
              <input type="radio" name="quiz_q_${idx}" value="${optIdx}" required>
              <span>${this.escapeHTML(opt)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    if (this.quizModal) this.quizModal.classList.add('active');
  },

  renderMockTestControls() {
    const levelSelect = document.getElementById('mock-level-select');
    if (levelSelect) {
      this.handleMockLevelChange(levelSelect.value);
    }
  },

  handleMockLevelChange(level) {
    const subjectSelect = document.getElementById('mock-subject-select');
    if (!subjectSelect) return;

    const curr = store.getAcademicCurriculum();
    const lvlData = curr[level];
    if (!lvlData) return;

    if (level === 'school') {
      const grades = lvlData.grades || {};
      subjectSelect.innerHTML = Object.keys(grades).map(grade => `
        <optgroup label="${this.escapeHTML(grade)}">
          ${grades[grade].map(s => `<option value="${this.escapeHTML(s)}">${this.escapeHTML(s)}</option>`).join('')}
        </optgroup>
      `).join('');
    } else {
      const branches = lvlData.branches || {};
      subjectSelect.innerHTML = Object.keys(branches).map(branch => `
        <optgroup label="${this.escapeHTML(branch)}">
          ${branches[branch].map(s => `<option value="${this.escapeHTML(s)}">${this.escapeHTML(s)}</option>`).join('')}
        </optgroup>
      `).join('');
    }
  },

  startAIMockTest() {
    const levelSelect = document.getElementById('mock-level-select');
    const subjectSelect = document.getElementById('mock-subject-select');
    const level = levelSelect ? levelSelect.value : 'btech';
    const subject = subjectSelect ? subjectSelect.value : 'Computer Science';

    // Generate fresh dynamic questions (Changes Every Time!)
    const dynamicMock = store.generateAIMockTest(level, subject);
    this.currentAIMockTest = dynamicMock;

    const titleEl = document.getElementById('quiz-modal-title');
    const bodyEl = document.getElementById('quiz-questions-body');
    const activeIdEl = document.getElementById('quiz-active-id');
    const activeTypeEl = document.getElementById('quiz-active-type');

    if (titleEl) titleEl.textContent = dynamicMock.title;
    if (activeIdEl) activeIdEl.value = dynamicMock.id;
    if (activeTypeEl) activeTypeEl.value = 'ai_mock';

    bodyEl.innerHTML = dynamicMock.questions.map((q, idx) => `
      <div style="margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
        <p style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem;">
          ${idx + 1}. ${this.escapeHTML(q.question)}
        </p>
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          ${q.options.map((opt, optIdx) => `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
              <input type="radio" name="quiz_q_${idx}" value="${optIdx}" required>
              <span>${this.escapeHTML(opt)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    if (this.quizModal) this.quizModal.classList.add('active');
    this.showToast('Dynamic AI Mock Test questions generated fresh for this session!', 'info');
  },

  submitQuiz(e) {
    e.preventDefault();
    const typeEl = document.getElementById('quiz-active-type');
    const isMock = typeEl && typeEl.value === 'ai_mock';

    const testObject = isMock ? this.currentAIMockTest : this.activeQuiz;
    if (!testObject || !testObject.questions) return;

    let score = 0;
    const total = testObject.questions.length;
    testObject.questions.forEach((q, idx) => {
      const checked = document.querySelector(`input[name="quiz_q_${idx}"]:checked`);
      const val = checked ? parseInt(checked.value, 10) : -1;
      if (val === q.correctIndex) score++;
    });

    const percent = Math.round((score / total) * 100);
    this.closeAllModals();

    const student = store.getCurrentUser();
    if (student) {
      const testTitle = testObject.title || (isMock ? 'Dynamic AI Mock Test' : 'Class Quiz');
      store.addParentWhatsAppNotification({
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.name,
        type: 'quiz',
        title: testTitle,
        score,
        total,
        percentage: percent
      });
    }

    const lang = store.getLanguage();
    const resultMsg = lang === 'te'
      ? `పరీక్ష పూర్తయింది!\nమీ స్కోరు: ${score}/${total} (${percent}%)\n${percent >= 75 ? 'అద్భుతమైన ప్రతిభ! 🎉' : 'మంచి ప్రయత్నం! మరింత అభ్యాసం చేయండి.'}\n\n📲 ఈ పరీక్ష ఫలితాలు మీ తల్లిదండ్రుల WhatsApp కు తక్షణమే పంపబడ్డాయి!`
      : `Test Complete!\nScore: ${score}/${total} (${percent}%)\n${percent >= 75 ? 'Outstanding performance! 🎉' : 'Keep practicing to master these concepts!'}\n\n📲 Test results have been sent to your parent's WhatsApp in real time!`;

    alert(resultMsg);
    this.showToast(`Test Auto-Graded: ${percent}% (WhatsApp Alert Sent to Parent)`, 'success');
  },

  // --- Smart Study Planner (Classes 1-12, B.Tech, Diploma) ---

  renderStudentPlannerControls(user) {
    const levelSelect = document.getElementById('planner-level-select');
    if (!levelSelect) return;

    const planner = user ? user.studyPlanner : null;
    if (planner && planner.level) {
      levelSelect.value = planner.level;
      this.handlePlannerLevelChange(planner.level, planner.gradeOrBranch, planner.subjects);
      const hoursInput = document.getElementById('planner-hours-input');
      const dateInput = document.getElementById('planner-exam-date');
      if (hoursInput && planner.dailyHours) hoursInput.value = planner.dailyHours;
      if (dateInput && planner.examDate) dateInput.value = planner.examDate;
    } else {
      levelSelect.value = '';
      const gradeSelect = document.getElementById('planner-grade-select');
      if (gradeSelect) {
        gradeSelect.innerHTML = `<option value="" disabled selected>-- Select Grade / Branch --</option>`;
      }
      const container = document.getElementById('planner-subjects-checkboxes');
      if (container) {
        const lang = store.getLanguage();
        container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">${lang === 'te' ? 'ముందుగా విద్యా స్థాయి మరియు బ్రాంచ్‌ను ఎంచుకోండి.' : 'Please select Academic Stream and Grade/Branch first.'}</span>`;
      }
      const hoursInput = document.getElementById('planner-hours-input');
      const dateInput = document.getElementById('planner-exam-date');
      if (hoursInput) hoursInput.value = '';
      if (dateInput) dateInput.value = '';
    }
  },

  handlePlannerLevelChange(level, preselectedGrade = null, preselectedSubjects = null) {
    const gradeSelect = document.getElementById('planner-grade-select');
    if (!gradeSelect) return;

    if (!level) {
      gradeSelect.innerHTML = `<option value="" disabled selected>-- Select Grade / Branch --</option>`;
      return;
    }

    const curr = store.getAcademicCurriculum();
    const lvlData = curr[level];
    if (!lvlData) return;

    let keys = [];
    if (level === 'school') keys = Object.keys(lvlData.grades || {});
    else keys = Object.keys(lvlData.branches || {});

    gradeSelect.innerHTML = [
      `<option value="" disabled ${!preselectedGrade ? 'selected' : ''}>-- Select Grade / Branch --</option>`,
      ...keys.map(k => `<option value="${this.escapeHTML(k)}" ${preselectedGrade === k ? 'selected' : ''}>${this.escapeHTML(k)}</option>`)
    ].join('');

    if (preselectedGrade) {
      gradeSelect.value = preselectedGrade;
      this.handlePlannerGradeChange(preselectedGrade, preselectedSubjects);
    } else {
      const container = document.getElementById('planner-subjects-checkboxes');
      if (container) {
        const lang = store.getLanguage();
        container.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">${lang === 'te' ? 'సబ్జెక్టులను ఎంచుకోవడానికి పైన గ్రేడ్ లేదా బ్రాంచ్‌ను ఎంచుకోండి.' : 'Select a Grade / Branch above to choose subjects.'}</span>`;
      }
    }
  },

  handlePlannerGradeChange(gradeOrBranch, preselectedSubjects = null) {
    const levelSelect = document.getElementById('planner-level-select');
    const container = document.getElementById('planner-subjects-checkboxes');
    if (!levelSelect || !container) return;

    const level = levelSelect.value;
    if (!level || !gradeOrBranch) return;

    const curr = store.getAcademicCurriculum();
    const lvlData = curr[level];
    if (!lvlData) return;

    let subjects = [];
    if (level === 'school') subjects = (lvlData.grades || {})[gradeOrBranch] || [];
    else subjects = (lvlData.branches || {})[gradeOrBranch] || [];

    const user = store.getCurrentUser();
    const savedSubjects = (user && user.studyPlanner && user.studyPlanner.subjects) ? user.studyPlanner.subjects : (preselectedSubjects || []);

    container.innerHTML = subjects.map(s => {
      const isChecked = savedSubjects.includes(s);
      return `
        <label class="subject-checkbox-chip">
          <input type="checkbox" name="planner_subj" value="${this.escapeHTML(s)}" ${isChecked ? 'checked' : ''}>
          <span>${this.escapeHTML(s)}</span>
        </label>
      `;
    }).join('');
  },

  handleGenerateStudyPlan(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const levelEl = document.getElementById('planner-level-select');
    const gradeEl = document.getElementById('planner-grade-select');
    const hoursEl = document.getElementById('planner-hours-input');
    const dateEl = document.getElementById('planner-exam-date');
    const valMsgEl = document.getElementById('planner-validation-msg');

    const level = levelEl ? levelEl.value : '';
    const gradeOrBranch = gradeEl ? gradeEl.value : '';
    const dailyHours = hoursEl ? hoursEl.value : '';
    const examDate = dateEl ? dateEl.value : '';

    const checkedBoxes = document.querySelectorAll('input[name="planner_subj"]:checked');
    const selectedSubjects = Array.from(checkedBoxes).map(cb => cb.value);

    // Call store.generateCustomStudyPlan which performs strict validation
    const res = store.generateCustomStudyPlan(user.id, {
      level,
      gradeOrBranch,
      selectedSubjects,
      dailyHours,
      examDate,
      examName: `${gradeOrBranch} Examination`
    });

    if (!res.success) {
      if (valMsgEl) {
        valMsgEl.textContent = res.message;
        valMsgEl.style.display = 'block';
        valMsgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        alert(res.message);
      }
      return;
    }

    if (valMsgEl) valMsgEl.style.display = 'none';

    this.renderStudentPlannerTasks(store.getCurrentUser());
    const lang = store.getLanguage();
    const toastMsg = lang === 'te' 
      ? 'మీ సబ్జెక్టుల ఆధారంగా అనుకూలమైన స్టడీ ప్లాన్ సిద్ధమైంది!' 
      : 'Custom subject-based study plan generated!';
    this.showToast(toastMsg, 'success');
  },

  renderStudentPlannerTasks(user) {
    const container = document.getElementById('student-planner-items');
    if (!container) return;

    if (!user || !user.studyPlanner) {
      const titleEl = document.getElementById('planner-exam-title');
      const metaEl = document.getElementById('planner-exam-meta');
      const lang = store.getLanguage();

      if (titleEl) {
        titleEl.textContent = lang === 'te' 
          ? 'అనుకూల అధ్యయన టైమ్‌టేబుల్ (ఇంకా రూపొందించబడలేదు)' 
          : 'Personalized Study Timetable (Not Generated Yet)';
      }
      if (metaEl) {
        metaEl.textContent = lang === 'te'
          ? 'దయచేసి పైన ఉన్న అన్ని ఎంపికలను ఎంచుకుని "కస్టమ్ సబ్జెక్ట్ స్టడీ ప్లాన్ రూపొందించండి" క్లిక్ చేయండి.'
          : 'Please select all required fields above and click "Generate Custom Subject Study Plan".';
      }

      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1.5rem; background: var(--bg-card-subtle); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem;">📅</span>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
            ${lang === 'te' ? 'స్టడీ టైమ్‌టేబుల్ ఇంకా సిద్ధం కాలేదు' : 'No Study Plan Generated Yet'}
          </h4>
          <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 520px; margin: 0 auto; line-height: 1.5;">
            ${lang === 'te'
              ? 'విద్యా స్థాయి (స్కూల్ 1-12, బి.టెక్ లేదా డిప్లొమా), బ్రాంచ్, సబ్జెక్టులు, రోజువారీ గంటలు మరియు పరీక్ష తేదీ ఎంచుకుంటేనే ఇక్కడ టైమ్‌టేబుల్ కనిపిస్తుంది.'
              : 'Timetable is created strictly after selecting your Academic Stream (School 1-12, B.Tech, or Diploma), Branch, Subjects, Daily Hours, and Exam Date.'}
          </p>
        </div>
      `;
      return;
    }

    const planner = user.studyPlanner;
    const titleEl = document.getElementById('planner-exam-title');
    const metaEl = document.getElementById('planner-exam-meta');

    if (titleEl) {
      titleEl.textContent = `${planner.gradeOrBranch} - Study Routine (${planner.dailyHours} hrs/day)`;
    }
    if (metaEl) {
      metaEl.textContent = `Target Exam: ${planner.examDate} • Subjects: ${planner.subjects.join(', ')}`;
    }

    container.innerHTML = planner.schedule.map((task, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <input type="checkbox" ${task.done ? 'checked' : ''} onchange="App.handleTogglePlannerTask(${idx})" style="width: 18px; height: 18px; cursor: pointer;">
          <div>
            <div style="font-size: 0.9rem; font-weight: 600; text-decoration: ${task.done ? 'line-through' : 'none'}; color: ${task.done ? 'var(--text-muted)' : 'var(--text-main)'};">
              ${this.escapeHTML(task.subject)}: ${this.escapeHTML(task.topic)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${task.time}</div>
          </div>
        </div>
        <span class="badge ${task.done ? 'badge-success' : 'badge-warning'}">
          ${task.done ? 'Completed' : 'Upcoming'}
        </span>
      </div>
    `).join('');
  },

  handleTogglePlannerTask(taskIndex) {
    const user = store.getCurrentUser();
    if (!user) return;
    store.toggleStudyTask(user.id, taskIndex);
    this.renderStudentPlannerTasks(store.getCurrentUser());
  },

  renderForum() {
    const container = document.getElementById('student-forum-posts');
    if (!container) return;

    const posts = store.state.announcements || [];
    container.innerHTML = `
      <div style="background: var(--bg-card-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.5rem;">
          Collaborative academic discussions with your course professors and fellow students.
        </p>
        ${posts.slice(0, 2).map(p => `
          <div style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
            <strong style="font-size: 0.85rem;">${this.escapeHTML(p.title)}</strong>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0 0;">${this.escapeHTML(p.content)}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStudentLiveSessions() {
    const container = document.getElementById('student-live-sessions-list');
    if (!container) return;

    const user = store.getCurrentUser();
    const sessions = store.getStudentLiveSessions(user ? user.id : null);
    if (sessions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1.5rem; color: var(--text-muted); background: var(--bg-card-subtle); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem;">📹</span>
          <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.25rem;">
            No Live Lectures Scheduled Yet
          </h4>
          <p style="font-size: 0.85rem; max-width: 480px; margin: 0 auto 1.25rem auto; line-height: 1.5;">
            Live lectures and problem-solving clinics are conducted exclusively by your enrolled mentor professors. Once your professor schedules an online session, it will appear here with an interactive join link.
          </p>
          <button class="btn btn-secondary btn-sm" onclick="App.openJoinClassModal()">
            + Join Mentor Class with Code
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = sessions.map(s => `
      <div class="live-card-item">
        <div>
          <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-main); margin-bottom: 0.2rem;">
            ${this.escapeHTML(s.title)}
          </div>
          <div style="font-size: 0.825rem; color: var(--text-muted);">
            👨‍🏫 Conducted by: <strong>${this.escapeHTML(s.professorName)}</strong> • 📅 ${s.date} • 🕒 ${s.time}
          </div>
        </div>
        <a href="${s.meetUrl}" target="_blank" class="btn btn-sm btn-primary">
          ${store.t('student.joinLectureBtn')}
        </a>
      </div>
    `).join('');
  },

  // =========================================================================
  // 2. PROFESSOR PORTAL (The Central Platform Authority)
  // =========================================================================

  renderProfessorPortal() {
    const user = store.getCurrentUser();
    const profId = user ? user.id : null;

    // KPIs - Filtered specifically for this professor
    const classes = store.getProfessorClasses(profId);
    const doubts = store.getProfessorPendingDoubts(profId);
    const assignments = store.getAssignments();
    let pendingSubs = 0;
    assignments.forEach(a => {
      (a.submissions || []).forEach(s => {
        if (s.status === 'submitted') pendingSubs++;
      });
    });

    const clEl = document.getElementById('prof-total-classes-val');
    const dbEl = document.getElementById('prof-pending-doubts-val');
    const grEl = document.getElementById('prof-pending-grading-val');

    if (clEl) clEl.textContent = classes.length;
    if (dbEl) dbEl.textContent = doubts.length;
    if (grEl) grEl.textContent = pendingSubs;

    // Doubt Resolution Inbox
    this.renderProfessorDoubtInbox(doubts);

    // Classes Management
    this.renderProfessorClasses();

    // Professor's Live Sessions & Quizzes
    this.renderProfessorLiveAndQuizzes(profId);

    // Grading Queue
    this.renderProfessorGradingQueue();

    // Broadcast Announcements
    this.renderProfessorAnnouncements();
  },

  renderProfessorDoubtInbox(doubts) {
    const container = document.getElementById('prof-doubt-inbox-list');
    if (!container) return;

    if (doubts.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          <p>${store.t('professor.noPendingDoubts')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = doubts.map(d => `
      <div class="doubt-card" style="margin-bottom: 1rem;">
        <div class="doubt-header">
          <div>
            <span style="font-weight: 700; font-size: 0.95rem;">Question from: ${this.escapeHTML(d.studentName)}</span>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${d.createdAt}</div>
          </div>
          <span class="badge badge-warning">Awaiting Your Explanation</span>
        </div>
        <div style="padding: 0.75rem; background: var(--bg-card-subtle); border-radius: var(--radius-sm); margin: 0.5rem 0; font-size: 0.875rem;">
          <strong>Q:</strong> ${this.escapeHTML(d.question)}
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          Student reviewed initial AI solution and designated you for verified faculty explanation.
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <textarea id="prof-reply-input-${d.id}" class="form-control" rows="2" placeholder="Provide verified faculty explanation and guidance..."></textarea>
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-sm btn-primary" onclick="App.handleResolveDoubt('${d.id}')">
              ${store.t('professor.submitReplyBtn')}
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  handleResolveDoubt(doubtId) {
    const input = document.getElementById(`prof-reply-input-${doubtId}`);
    const reply = input ? input.value.trim() : '';
    if (!reply) {
      alert('Please enter your faculty response to resolve this student doubt.');
      return;
    }

    store.resolveDoubt(doubtId, reply);
    this.renderProfessorPortal();
    this.showToast('Faculty answer submitted and student doubt marked as resolved!', 'success');
  },

  renderProfessorClasses() {
    const container = document.getElementById('prof-classes-mgmt-list');
    if (!container) return;

    const user = store.getCurrentUser();
    const profId = user ? user.id : null;
    const classes = store.getProfessorClasses(profId);

    if (classes.length === 0) {
      const lang = store.getLanguage();
      const emptyMsg = lang === 'te'
        ? 'మీరు ఇంకా ఎటువంటి తరగతులను సృష్టించలేదు. మీ విద్యార్థులకు కోడ్ ఇవ్వడానికి మరియు క్విజ్‌లు కేటాయించడానికి పైన ఉన్న \'+ Create New Class\' పై క్లిక్ చేయండి.'
        : 'No classes created by you yet. Click \'+ Create New Class\' above to generate class batches and join codes.';
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem; background: var(--bg-card-subtle); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
          <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🏫</span>
          <p style="margin-bottom: 1rem;">${emptyMsg}</p>
          <button class="btn btn-primary btn-sm" onclick="App.openCreateClassModal()">
            + Create New Class
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
        ${classes.map(c => `
          <div class="class-card" style="display: flex; flex-direction: column; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin: 0;">${this.escapeHTML(c.title)}</h4>
                <span class="badge badge-info" style="font-family: monospace; font-size: 0.85rem; font-weight: 700;">Code: ${c.joinCode}</span>
              </div>
              <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                🕒 ${this.escapeHTML(c.schedule)}
              </p>
              <div style="font-size: 0.825rem; color: var(--primary); font-weight: 600; margin-bottom: 0.75rem;">
                👥 Enrolled Students: ${c.enrolledStudentIds ? c.enrolledStudentIds.length : 0}
              </div>
            </div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
              <button class="btn btn-sm btn-primary" onclick="App.openCreateQuizModal('${c.id}')" title="Create Quiz for this class">
                🎯 + Quiz
              </button>
              <button class="btn btn-sm btn-secondary" onclick="App.openScheduleLiveModal('${c.id}')" title="Schedule Live Session for this class">
                📹 + Live
              </button>
              <button class="btn btn-sm btn-secondary" onclick="App.openUploadMaterialModal('${c.id}')" title="Upload Material">
                📁 + Notes
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderProfessorLiveAndQuizzes(profId) {
    const liveContainer = document.getElementById('prof-live-sessions-list');
    const quizContainer = document.getElementById('prof-quizzes-list');

    if (liveContainer) {
      const sessions = store.getProfessorLiveSessions(profId);
      if (sessions.length === 0) {
        liveContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card-subtle);">
            <p style="margin-bottom: 0.75rem;">No live lectures scheduled by you yet.</p>
            <button class="btn btn-sm btn-secondary" onclick="App.openScheduleLiveModal()">
              + Schedule Live Lecture
            </button>
          </div>
        `;
      } else {
        liveContainer.innerHTML = sessions.map(s => {
          const targetClass = store.getClass(s.classId);
          const classTag = targetClass ? `${targetClass.title} (${targetClass.joinCode})` : 'Class Lecture';
          return `
            <div style="padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                <div style="font-weight: 700; font-size: 0.9rem;">${this.escapeHTML(s.title)}</div>
                <span class="badge badge-info" style="font-size: 0.75rem;">${this.escapeHTML(classTag)}</span>
              </div>
              <div style="font-size: 0.775rem; color: var(--text-muted); margin-bottom: 0.35rem;">${s.date} • ${s.time}</div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <a href="${s.meetUrl}" target="_blank" style="font-size: 0.775rem; color: var(--primary); text-decoration: underline;">Launch Meeting</a>
                <button class="btn btn-sm btn-danger" onclick="App.handleDeleteLiveSession('${s.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    if (quizContainer) {
      const quizzes = store.getProfessorQuizzes(profId);
      if (quizzes.length === 0) {
        quizContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); background: var(--bg-card-subtle);">
            <p style="margin-bottom: 0.75rem;">No class quizzes created by you yet.</p>
            <button class="btn btn-sm btn-secondary" onclick="App.openCreateQuizModal()">
              + Create Class Quiz
            </button>
          </div>
        `;
      } else {
        quizContainer.innerHTML = quizzes.map(q => {
          const targetClass = store.getClass(q.classId);
          const classTag = targetClass ? `${targetClass.title} (${targetClass.joinCode})` : (q.classTitle || 'Academic Class');
          return `
            <div style="padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                <strong style="font-size: 0.9rem; color: var(--text-main);">${this.escapeHTML(q.title)}</strong>
                <span class="badge badge-info" style="font-size: 0.75rem;">🏫 ${this.escapeHTML(classTag)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem;">
                <div style="font-size: 0.775rem; color: var(--text-muted);">⏱️ ${q.timeLimitMinutes} Mins • ❓ ${q.questions.length} Question(s)</div>
                <button class="btn btn-sm btn-danger" onclick="App.handleDeleteQuiz('${q.id}')" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  renderProfessorGradingQueue() {
    const tbody = document.getElementById('prof-grading-tbody');
    const user = store.getCurrentUser();
    const profId = user ? user.id : null;
    const assignments = store.getAssignments().filter(a => !profId || a.professorId === profId);

    if (tbody) {
      let rowsHtml = '';
      assignments.forEach(a => {
        (a.submissions || []).forEach(sub => {
          const isGraded = sub.status === 'graded';
          rowsHtml += `
            <tr>
              <td><strong>${this.escapeHTML(sub.studentName)}</strong></td>
              <td>${this.escapeHTML(a.title)}</td>
              <td>${sub.submittedAt}</td>
              <td>
                <span class="badge ${isGraded ? 'badge-success' : 'badge-warning'}">
                  ${isGraded ? `${sub.marks}/${a.maxMarks}` : 'Pending'}
                </span>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="App.openGradeModal('${a.id}', '${sub.id}', '${this.escapeHTML(sub.studentName)}')">
                  ${isGraded ? 'Update Grade' : 'Grade & Feedback'}
                </button>
              </td>
            </tr>
          `;
        });
      });

      if (!rowsHtml) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              No student submissions in queue.
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = rowsHtml;
      }
    }

    const asgContainer = document.getElementById('prof-assignments-list');
    if (asgContainer) {
      if (assignments.length === 0) {
        asgContainer.innerHTML = `
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            No assignments published yet. Click '+ Create New Assignment' above to publish coursework.
          </p>
        `;
      } else {
        asgContainer.innerHTML = assignments.map(a => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem; gap: 0.5rem; flex-wrap: wrap;">
            <div>
              <strong style="font-size: 0.9rem; color: var(--text-main);">${this.escapeHTML(a.title)}</strong>
              <div style="font-size: 0.775rem; color: var(--text-muted);">
                Max Marks: ${a.maxMarks} • Due Date: ${a.dueDate} • Submissions: ${(a.submissions || []).length}
              </div>
            </div>
            <button class="btn btn-sm btn-danger" onclick="App.handleDeleteAssignment('${a.id}')" style="font-size: 0.75rem; padding: 0.25rem 0.6rem;">
              🗑️ Delete Assignment
            </button>
          </div>
        `).join('');
      }
    }
  },

  renderProfessorAnnouncements() {
    const container = document.getElementById('prof-announcements-list');
    if (!container) return;

    const announcements = store.getAnnouncements();
    if (announcements.length === 0) {
      container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted);">No broadcast notices posted yet.</p>`;
      return;
    }

    container.innerHTML = announcements.map(anc => `
      <div style="background: var(--bg-card-subtle); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="font-size: 0.9rem;">${this.escapeHTML(anc.title)}</strong>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${anc.date}</span>
        </div>
        <p style="font-size: 0.825rem; color: var(--text-main); margin: 0;">${this.escapeHTML(anc.content)}</p>
      </div>
    `).join('');
  },

  submitBroadcastAnnouncement(e) {
    e.preventDefault();
    const title = (document.getElementById('broadcast-title-input').value || '').trim();
    const content = (document.getElementById('broadcast-content-input').value || '').trim();
    if (!title || !content) return;

    store.createAnnouncement(title, content);
    document.getElementById('broadcast-title-input').value = '';
    document.getElementById('broadcast-content-input').value = '';
    this.renderProfessorAnnouncements();
    this.showToast('Announcement broadcasted to enrolled students & linked parents!', 'success');
  },

  // =========================================================================
  // 3. PARENT PORTAL
  // =========================================================================

  renderParentPortal() {
    const user = store.getCurrentUser();
    const childCode = user && user.childCode ? user.childCode.trim() : '';

    const nameEl = document.getElementById('parent-child-name');
    const codeEl = document.getElementById('parent-child-code');
    const statsEl = document.getElementById('parent-child-stats');
    const digestEl = document.getElementById('parent-whatsapp-digest');
    const feedListEl = document.getElementById('parent-whatsapp-feed-list');
    const linkInput = document.getElementById('parent-link-code-input');

    const report = store.generateWeeklyReport(childCode);
    const student = report.student;

    if (student) {
      if (nameEl) nameEl.textContent = `${student.name}`;
      if (codeEl) codeEl.textContent = `Student Code: ${student.studentCode}`;
      if (statsEl) {
        statsEl.textContent = `Attendance: ${student.attendancePercentage !== undefined ? student.attendancePercentage : 0}% • Study Streak: ${student.studyStreakDays || 1} Days • Grade: ${student.averageGrade || 'Pending'}`;
      }
      if (linkInput && !linkInput.value) linkInput.value = student.studentCode;
    } else {
      if (nameEl) nameEl.textContent = store.t('parent.unlinkedTitle');
      if (codeEl) codeEl.textContent = store.t('parent.unlinkedDesc');
      if (statsEl) statsEl.textContent = 'Please enter your child\'s student code above to link their profile.';
    }

    // Render Live WhatsApp Activity & Test Alerts Feed
    if (feedListEl) {
      const notifs = store.getParentNotifications(student ? student.studentCode : null);
      if (notifs.length === 0) {
        const lang = store.getLanguage();
        const emptyFeedMsg = lang === 'te'
          ? 'ఇంకా ఎటువంటి పరీక్షలు లేదా అసైన్‌మెంట్లు నమోదు కాలేదు. విద్యార్థి క్విజ్ రాసినా లేదా అసైన్‌మెంట్ సమర్పించినా తక్షణ WhatsApp హెచ్చరికలు ఇక్కడ కనిపిస్తాయి.'
          : 'No activity alerts yet. Whenever the student writes a quiz or submits an assignment, real-time WhatsApp notifications will arrive instantly here.';
        feedListEl.innerHTML = `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: var(--bg-card-subtle); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
            <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">📱</span>
            <p style="font-size: 0.85rem; margin: 0;">${emptyFeedMsg}</p>
          </div>
        `;
      } else {
        feedListEl.innerHTML = notifs.map(n => {
          let icon = '📝';
          if (n.type === 'quiz') {
            icon = '🎯';
          } else if (n.type === 'assignment_graded') {
            icon = '⭐';
          }

          return `
            <div class="whatsapp-card" style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 0.85rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.25rem;">${icon}</span>
                  <div>
                    <strong style="font-size: 0.95rem; color: var(--text-main);">${this.escapeHTML(n.title)}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${this.escapeHTML(n.studentName)} (${n.studentCode}) • ${n.timestamp}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">${n.badgeLabel}</span>
                  ${n.percentage !== undefined ? `<span class="badge badge-info">${n.percentage}%</span>` : ''}
                  ${n.marks !== undefined ? `<span class="badge badge-warning">${n.marks}% Marks</span>` : ''}
                </div>
              </div>
              <div style="padding: 0.75rem 1rem; background: var(--bg-card); border-left: 3px solid #25D366; border-radius: var(--radius-sm); font-size: 0.825rem; color: var(--text-main); white-space: pre-wrap; line-height: 1.5; font-family: monospace;">
${this.escapeHTML(n.messageText)}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Weekly WhatsApp Digest Preview
    if (digestEl) {
      digestEl.innerHTML = `
        <div class="whatsapp-card" style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
            <span style="font-size: 1.5rem;">📱</span>
            <div>
              <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-main);">${this.escapeHTML(report.title)}</h4>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${report.channel} • Delivered in your regional language</span>
            </div>
          </div>
          <div style="padding: 1rem; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: monospace; font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; color: var(--text-main);">
${this.escapeHTML(report.greeting)}

${this.escapeHTML(report.body)}
          </div>
        </div>
      `;
    }
  },

  handleParentLinkStudent(e) {
    e.preventDefault();
    const input = document.getElementById('parent-link-code-input');
    const val = (input ? input.value : '').trim();
    if (!val) return;

    const allStudents = (store.state.users || []).filter(u => u.role === 'student');
    const student = allStudents.find(s => 
      (s.studentCode || '').toUpperCase() === val.toUpperCase() ||
      (s.identifier || '').toLowerCase() === val.toLowerCase() ||
      (s.identifier && val && s.identifier.replace(/\D/g, '') === val.replace(/\D/g, '') && val.replace(/\D/g, '').length >= 10)
    );

    if (!student) {
      alert(`No registered student found with code/mobile/email: ${val}. Please verify the details with your child.`);
      return;
    }

    const user = store.getCurrentUser();
    if (user) {
      user.childCode = student.studentCode;
      user.childIdentifier = student.identifier;
      if (!student.parentContact) {
        student.parentContact = user.identifier;
      }
      store.saveState();
    }

    this.renderParentPortal();
    this.showToast(`Successfully linked to ${student.name} (${student.studentCode})!`, 'success');
  },

  // =========================================================================
  // Modals & Action Handlers
  // =========================================================================

  openJoinClassModal() {
    if (this.joinClassModal) this.joinClassModal.classList.add('active');
  },

  submitJoinClass(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    if (!user) return;

    const input = document.getElementById('join-code-input');
    const code = (input.value || '').trim();
    const res = store.joinClassByCode(user.id, code);

    if (!res.success) {
      alert(res.message);
      return;
    }

    this.closeAllModals();
    this.renderStudentPortal();
    input.value = '';
    this.showToast(`Enrolled successfully in ${res.class.title}!`, 'success');
  },

  openCreateClassModal() {
    if (this.createClassModal) this.createClassModal.classList.add('active');
  },

  submitCreateClass(e) {
    e.preventDefault();
    const titleInput = document.getElementById('create-class-title');
    const scheduleInput = document.getElementById('create-class-schedule');
    const title = (titleInput ? titleInput.value : '').trim();
    const schedule = (scheduleInput ? scheduleInput.value : '').trim();
    if (!title) return;

    const newCls = store.createClass(title, schedule);
    if (titleInput) titleInput.value = '';
    if (scheduleInput) scheduleInput.value = '';
    this.closeAllModals();
    this.renderProfessorPortal();
    this.showToast(`Class '${newCls.title}' created! Join code: ${newCls.joinCode}`, 'success');
  },

  openUploadMaterialModal(classId) {
    const hidden = document.getElementById('upload-material-class-id');
    if (hidden) hidden.value = classId;
    if (this.uploadMaterialModal) this.uploadMaterialModal.classList.add('active');
  },

  submitUploadMaterial(e) {
    e.preventDefault();
    const classId = document.getElementById('upload-material-class-id').value;
    const title = (document.getElementById('upload-material-title').value || '').trim();
    const type = document.getElementById('upload-material-type').value;
    const url = (document.getElementById('upload-material-url').value || '').trim();

    store.uploadMaterial(classId, title, type, url);
    this.closeAllModals();
    this.renderProfessorPortal();
    this.showToast('Course material and notes uploaded successfully!', 'success');
  },

  openCreateAssignmentModal() {
    if (this.createAssignmentModal) this.createAssignmentModal.classList.add('active');
  },

  submitCreateAssignment(e) {
    e.preventDefault();
    const title = (document.getElementById('asg-title').value || '').trim();
    const desc = (document.getElementById('asg-desc').value || '').trim();
    const maxMarks = document.getElementById('asg-max-marks').value;
    const dueDate = document.getElementById('asg-due-date').value;

    store.createAssignment(null, title, desc, maxMarks, dueDate);
    this.closeAllModals();
    this.renderProfessorPortal();
    this.showToast('Assignment published to students!', 'success');
  },

  openGradeModal(asgId, subId, studentName) {
    document.getElementById('grade-asg-id').value = asgId;
    document.getElementById('grade-sub-id').value = subId;
    document.getElementById('grade-student-display').textContent = `Student: ${studentName}`;
    if (this.gradeModal) this.gradeModal.classList.add('active');
  },

  submitGrade(e) {
    e.preventDefault();
    const asgId = document.getElementById('grade-asg-id').value;
    const subId = document.getElementById('grade-sub-id').value;
    const marks = document.getElementById('grade-marks-input').value;
    const feedback = document.getElementById('grade-feedback-input').value.trim();

    store.gradeSubmission(asgId, subId, marks, feedback);
    this.closeAllModals();
    this.renderProfessorPortal();
    this.showToast(`Marks and feedback awarded: ${marks}%!`, 'success');
  },

  openScheduleLiveModal(preselectedClassId = null) {
    const user = store.getCurrentUser();
    const profId = user ? user.id : null;
    const classes = store.getProfessorClasses(profId);

    if (classes.length === 0) {
      const lang = store.getLanguage();
      const alertMsg = lang === 'te'
        ? 'మీరు ఇంకా ఎటువంటి తరగతిని సృష్టించలేదు. లైవ్ లెక్చర్ షెడ్యూల్ చేయడానికి ముందు దయచేసి మీ క్లాస్‌ను సృష్టించండి.'
        : 'You have not created any classes yet. Please create a class first before scheduling a live lecture.';
      alert(alertMsg);
      this.openCreateClassModal();
      return;
    }

    const classSelect = document.getElementById('live-class-select');
    if (classSelect) {
      classSelect.innerHTML = classes.map(c => `
        <option value="${c.id}" ${c.id === preselectedClassId ? 'selected' : ''}>
          ${this.escapeHTML(c.title)} (Code: ${c.joinCode})
        </option>
      `).join('');
      if (preselectedClassId) {
        classSelect.value = preselectedClassId;
      }
    }
    if (this.scheduleLiveModal) this.scheduleLiveModal.classList.add('active');
  },

  submitScheduleLive(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    const classId = document.getElementById('live-class-select').value;
    const title = document.getElementById('live-title-input').value.trim();
    const date = document.getElementById('live-date-input').value;
    const time = document.getElementById('live-time-input').value.trim();
    const meetUrl = document.getElementById('live-url-input').value.trim();

    store.scheduleLiveSession(user ? user.id : null, classId, title, date, time, meetUrl);
    this.closeAllModals();
    this.renderProfessorPortal();
    this.showToast('Live lecture scheduled and published for enrolled students!', 'success');
  },

  openCreateQuizModal(preselectedClassId = null) {
    const user = store.getCurrentUser();
    const profId = user ? user.id : null;
    const classes = store.getProfessorClasses(profId);

    if (classes.length === 0) {
      const lang = store.getLanguage();
      const alertMsg = lang === 'te'
        ? 'మీరు ఇంకా ఎటువంటి తరగతిని సృష్టించలేదు. మీ విద్యార్థులకు క్లాస్ క్విజ్ కేటాయించడానికి ముందు దయచేసి మీ క్లాస్‌ను సృష్టించండి.'
        : 'You have not created any classes yet. Please create a class first before creating a class quiz.';
      alert(alertMsg);
      this.openCreateClassModal();
      return;
    }

    const classSelect = document.getElementById('quiz-create-class-select');
    if (classSelect) {
      classSelect.innerHTML = classes.map(c => `
        <option value="${c.id}" ${c.id === preselectedClassId ? 'selected' : ''}>
          ${this.escapeHTML(c.title)} (Code: ${c.joinCode} • ${c.enrolledStudentIds ? c.enrolledStudentIds.length : 0} Students)
        </option>
      `).join('');
      if (preselectedClassId) {
        classSelect.value = preselectedClassId;
      }
    }
    if (this.createQuizModal) this.createQuizModal.classList.add('active');
  },

  submitCreateQuiz(e) {
    e.preventDefault();
    const user = store.getCurrentUser();
    const classId = document.getElementById('quiz-create-class-select').value;
    const titleInput = document.getElementById('quiz-create-title');
    const title = titleInput.value.trim();
    const timeLimit = document.getElementById('quiz-create-timelimit').value;

    const qText = document.getElementById('quiz-q1-text').value.trim();
    const opt0 = document.getElementById('quiz-q1-opt0').value.trim();
    const opt1 = document.getElementById('quiz-q1-opt1').value.trim();
    const opt2 = document.getElementById('quiz-q1-opt2').value.trim();
    const opt3 = document.getElementById('quiz-q1-opt3').value.trim();
    const correctIdx = parseInt(document.getElementById('quiz-q1-correct').value, 10);

    const questions = [{
      question: qText,
      options: [opt0, opt1, opt2, opt3],
      correctIndex: correctIdx
    }];

    const targetClass = store.getClass(classId);
    store.createProfessorQuiz(user ? user.id : null, classId, title, timeLimit, questions);
    titleInput.value = '';
    this.closeAllModals();
    this.renderProfessorPortal();
    const className = targetClass ? targetClass.title : 'class';
    this.showToast(`Class quiz '${title}' published for ${className}! Enrolled students can now take it.`, 'success');
  },

  openBookMeetingModal() {
    if (this.bookMeetingModal) this.bookMeetingModal.classList.add('active');
  },

  submitBookMeeting(e) {
    e.preventDefault();
    const date = document.getElementById('meeting-date-input').value;
    const time = document.getElementById('meeting-time-input').value;
    this.closeAllModals();
    this.showToast(`Faculty 1-on-1 meeting scheduled for ${date} at ${time}! Meeting invite sent via SMS.`, 'success');
  },

  openNewForumPostModal() {
    if (this.newForumModal) this.newForumModal.classList.add('active');
  },

  submitNewForumPost(e) {
    e.preventDefault();
    const title = (document.getElementById('forum-post-title-input').value || '').trim();
    const content = (document.getElementById('forum-post-content-input').value || '').trim();
    if (!title || !content) return;

    store.createAnnouncement(title, content);
    this.closeAllModals();
    this.showToast('Discussion thread created successfully!', 'success');
  },

  // --- Profile Picture Management (Gallery & Preset Avatars) ---

  openProfilePicModal() {
    const modal = document.getElementById('profile-pic-modal');
    if (!modal) return;
    this.renderPresetAvatars();
    modal.classList.add('active');
  },

  renderPresetAvatars() {
    const grid = document.getElementById('preset-avatar-grid');
    if (!grid) return;

    const presets = [
      { name: 'Scholar Alex', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&mouth=smile&eyebrows=default' },
      { name: 'Scholar Priya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&mouth=smile&eyebrows=default' },
      { name: 'Scholar Rahul', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul&mouth=smile&eyebrows=default' },
      { name: 'Scholar Ananya', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya&mouth=smile&eyebrows=default' },
      { name: 'Prof. Rao', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ProfessorKV&facialHair=beardLight' },
      { name: 'Prof. Lakshmi', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DrLakshmi&facialHair=default' },
      { name: 'Academic Mentor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AcademicMentor' },
      { name: 'Parent Guardian', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GuardianParent' },
      { name: 'AI Bot Blue', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BlueBot' },
      { name: 'AI Bot Cyber', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberTutor' },
      { name: 'Minimalist Student', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=StudySmart' },
      { name: 'Creative Scholar', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=CreativeMind' }
    ];

    grid.innerHTML = presets.map(p => `
      <div onclick="App.handleSelectPresetAvatar('${p.url}')" title="${p.name}" style="cursor: pointer; border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem; text-align: center; background: var(--bg-card); transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='scale(1.05)'" onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='scale(1)'">
        <img src="${p.url}" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; display: block; margin: 0 auto 0.25rem auto;" alt="${p.name}">
        <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-muted); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
      </div>
    `).join('');
  },

  handleSelectPresetAvatar(avatarUrl) {
    const user = store.getCurrentUser();
    if (!user) return;
    store.updateUserProfileAvatar(user.id, avatarUrl);
    if (this.roleAvatar) this.roleAvatar.src = avatarUrl;
    if (this.navUserAvatar) this.navUserAvatar.src = avatarUrl;
    this.closeAllModals();
    this.showToast('Profile picture updated successfully!', 'success');
  },

  handleProfilePicUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Selected image exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const user = store.getCurrentUser();
      if (!user) return;
      store.updateUserProfileAvatar(user.id, dataUrl);
      if (this.roleAvatar) this.roleAvatar.src = dataUrl;
      if (this.navUserAvatar) this.navUserAvatar.src = dataUrl;
      this.closeAllModals();
      this.showToast('Profile picture uploaded from device gallery!', 'success');
    };
    reader.readAsDataURL(file);
  },

  // --- Professor Deletion Actions (Quizzes, Assignments, Live Classes ONLY) ---

  handleDeleteLiveSession(sessionId) {
    const lang = store.getLanguage();
    const promptMsg = lang === 'te'
      ? 'మీరు ఖచ్చితంగా ఈ షెడ్యూల్ చేసిన లైవ్ లెక్చర్‌ను తొలగించాలనుకుంటున్నారా?'
      : 'Are you sure you want to delete this scheduled live lecture?';

    if (!confirm(promptMsg)) return;

    store.deleteLiveSession(sessionId);
    const user = store.getCurrentUser();
    this.renderProfessorLiveAndQuizzes(user ? user.id : null);
    this.showToast(lang === 'te' ? 'లైవ్ లెక్చర్ తొలగించబడింది.' : 'Live lecture deleted.', 'success');
  },

  handleDeleteQuiz(quizId) {
    const lang = store.getLanguage();
    const promptMsg = lang === 'te'
      ? 'మీరు ఖచ్చితంగా ఈ క్లాస్ క్విజ్‌ను తొలగించాలనుకుంటున్నారా?'
      : 'Are you sure you want to delete this class quiz?';

    if (!confirm(promptMsg)) return;

    store.deleteQuiz(quizId);
    const user = store.getCurrentUser();
    this.renderProfessorLiveAndQuizzes(user ? user.id : null);
    this.showToast(lang === 'te' ? 'క్లాస్ క్విజ్ తొలగించబడింది.' : 'Class quiz deleted.', 'success');
  },

  handleDeleteAssignment(assignmentId) {
    const lang = store.getLanguage();
    const promptMsg = lang === 'te'
      ? 'మీరు ఖచ్చితంగా ఈ అసైన్‌మెంట్‌ను తొలగించాలనుకుంటున్నారా?'
      : 'Are you sure you want to delete this assignment?';

    if (!confirm(promptMsg)) return;

    store.deleteAssignment(assignmentId);
    this.renderProfessorGradingQueue();
    this.showToast(lang === 'te' ? 'అసైన్‌మెంట్ తొలగించబడింది.' : 'Assignment deleted.', 'success');
  },

  handleUnenrollClass(classId) {
    const user = store.getCurrentUser();
    if (!user) return;
    const cls = store.getClass(classId);
    const title = cls ? cls.title : 'class';
    const lang = store.getLanguage();
    const promptMsg = lang === 'te'
      ? `మీరు ఖచ్చితంగా "${title}" తరగతి నుండి నిష్క్రమించాలనుకుంటున్నారా?`
      : `Are you sure you want to leave "${title}"?`;

    if (!confirm(promptMsg)) return;

    store.unenrollStudentFromClass(user.id, classId);
    const byeMsg = lang === 'te'
      ? `"${title}" తరగతి నుండి నిష్క్రమించారు. హాజరు నవీకరించబడింది.`
      : `Left class "${title}". Attendance recalculated.`;
    this.showToast(byeMsg, 'info');
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  },

  showToast(message, type = 'info') {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
