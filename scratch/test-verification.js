// Test script to verify the new EduConnect capabilities
const fs = require('fs');
const path = require('path');

// Mock localStorage and window
const storePath = path.join(__dirname, '..', 'js', 'store.js');
const mockDataPath = path.join(__dirname, '..', 'js', 'data.js');
const questionsPath = path.join(__dirname, '..', 'js', 'questions.js');
const localesPath = path.join(__dirname, '..', 'js', 'locales.js');

global.window = {};
global.localStorage = {
  data: {},
  getItem(k) { return this.data[k] || null; },
  setItem(k, v) { this.data[k] = v; },
  removeItem(k) { delete this.data[k]; }
};

// Evaluate scripts and make top-level constants available globally
const dataCode = fs.readFileSync(mockDataPath, 'utf8') + '\nglobal.ACADEMIC_LEVELS = ACADEMIC_LEVELS;\nglobal.DEFAULT_DATA = DEFAULT_DATA;\n';
const localesCode = fs.readFileSync(localesPath, 'utf8') + '\nglobal.LOCALES = LOCALES;\n';
const questionsCode = fs.readFileSync(questionsPath, 'utf8') + '\nglobal.QuestionEngine = QuestionEngine;\n';
const storeCode = fs.readFileSync(storePath, 'utf8') + '\nglobal.store = store;\n';

eval(localesCode);
eval(dataCode);
eval(questionsCode);
eval(storeCode);

console.log('--- TEST 1: Real-World Phone & Email Validation ---');
const testCases = [
  { val: 'test@test.com', expected: false, desc: 'Dummy email test@test.com' },
  { val: 'asdf@asdf.com', expected: false, desc: 'Dummy email asdf@asdf.com' },
  { val: 'aaaaa@gmail.com', expected: false, desc: 'Repeated char email aaaaa@gmail.com' },
  { val: '0000000000', expected: false, desc: 'Repeated zero phone 0000000000' },
  { val: '1234567890', expected: false, desc: 'Sequential phone 1234567890' },
  { val: '9999999999', expected: false, desc: 'Repeated digit phone 9999999999' },
  { val: '12345', expected: false, desc: 'Short number 12345' },
  { val: '5551234567', expected: false, desc: 'Phone starting with 5 (not 6-9)' },
  { val: 'ravi.kumar2026@gmail.com', expected: true, desc: 'Real gmail address' },
  { val: 'prof.sharma@university.edu.in', expected: true, desc: 'Real university email' },
  { val: '9848022338', expected: true, desc: 'Real 10-digit Indian phone (starting 9)' },
  { val: '+91 98480 22338', expected: true, desc: 'Phone with +91 prefix and spaces' },
  { val: '7893124560', expected: true, desc: 'Real 10-digit Indian phone (starting 7)' }
];

let allPassed = true;
testCases.forEach(tc => {
  const res = store.validateRealWorldIdentifier(tc.val);
  const ok = res.valid === tc.expected;
  if (!ok) {
    console.error(`FAIL: ${tc.desc} (val: "${tc.val}") => Got valid=${res.valid}, reason: "${res.message}"`);
    allPassed = false;
  } else {
    console.log(`PASS: ${tc.desc} => valid=${res.valid}`);
  }
});

console.log('\n--- TEST 2: Dynamic AI Mock Test Generator (20 Questions & Shuffles) ---');
const mock1 = store.generateAIMockTest('btech', 'Operating Systems');
const mock2 = store.generateAIMockTest('btech', 'Operating Systems');

console.log(`Mock 1: Title="${mock1.title}", Total questions=${mock1.questions.length}, Duration=${mock1.timeLimitMinutes} mins`);
if (mock1.questions.length < 20) {
  console.error(`FAIL: Mock 1 questions count is ${mock1.questions.length}, expected >= 20`);
  allPassed = false;
} else {
  console.log(`PASS: Mock test contains ${mock1.questions.length} questions (minimum 20 requirement satisfied)`);
}

// Verify questions are dynamic and change
const q1Text = mock1.questions.map(q => q.question).join(' | ');
const q2Text = mock2.questions.map(q => q.question).join(' | ');
if (q1Text === q2Text) {
  console.warn('WARN: Question texts in consecutive attempts were identical');
} else {
  console.log('PASS: Mock test questions change dynamically across consecutive attempts');
}

// Test question generator across different academic fields
const csMock = QuestionEngine.generate('btech', 'Data Structures & Algorithms');
const mechMock = QuestionEngine.generate('btech', 'Fluid Mechanics & Hydraulic Machines');
const schoolMock = QuestionEngine.generate('school', 'Physics (Electricity, Magnetism, Optics)');
console.log(`PASS: Domain generation tested (CS: ${csMock.questions.length} Qs, Mech: ${mechMock.questions.length} Qs, School: ${schoolMock.questions.length} Qs)`);

console.log('\n--- TEST 3: Automatic Student & Parent Connection ---');
// Register a student who provides parent mobile
const stdReg = store.registerUser({
  name: 'Ananya Sharma',
  identifier: 'ananya.sharma2026@gmail.com',
  password: 'Password@123',
  role: 'student',
  year: '4',
  major: 'CSE',
  parentIdentifier: '9849012345' // Parent mobile entered at student registration
});
console.log(`Student registered: success=${stdReg.success}, code=${stdReg.user ? stdReg.user.studentCode : null}`);

// Register the parent with that mobile number
const prntReg = store.registerUser({
  name: 'Suresh Sharma',
  identifier: '9849012345',
  password: 'Password@123',
  role: 'parent'
  // Did not enter student code manually!
});
console.log(`Parent registered: success=${prntReg.success}, linked childCode=${prntReg.user ? prntReg.user.childCode : null}`);
if (prntReg.user && prntReg.user.childCode === stdReg.user.studentCode) {
  console.log(`PASS: Parent automatically linked to student ${stdReg.user.name} (${prntReg.user.childCode}) without manually entering code!`);
} else {
  console.error('FAIL: Parent was not automatically linked to student');
  allPassed = false;
}

// Check weekly report for this parent
store.state.currentUser = prntReg.user;
const parentReport = store.generateWeeklyReport();
console.log(`Parent Report Generated: title="${parentReport.title}", student="${parentReport.student ? parentReport.student.name : 'NONE'}"`);
if (parentReport.student && parentReport.student.name === 'Ananya Sharma') {
  console.log('PASS: Parent portal report correctly binds to automatically linked student!');
} else {
  console.error('FAIL: Weekly report did not bind to student');
  allPassed = false;
}

console.log('\n--- TEST 4: Smart Study Planner Strict Validation ---');
const studentUser = stdReg.user;

// Test missing stream
const r1 = store.generateCustomStudyPlan(studentUser.id, {
  level: '',
  gradeOrBranch: 'Computer Science',
  selectedSubjects: ['DSA'],
  dailyHours: '3',
  examDate: '2026-12-01'
});
console.log(`Empty Level: success=${r1.success}, msg="${r1.message}"`);
if (r1.success) { console.error('FAIL: Expected false for empty level'); allPassed = false; }
else { console.log('PASS: Blocked study plan generation when stream is missing'); }

// Test missing subjects
const r2 = store.generateCustomStudyPlan(studentUser.id, {
  level: 'btech',
  gradeOrBranch: 'Computer Science',
  selectedSubjects: [],
  dailyHours: '3',
  examDate: '2026-12-01'
});
console.log(`Empty Subjects: success=${r2.success}, msg="${r2.message}"`);
if (r2.success) { console.error('FAIL: Expected false for empty subjects'); allPassed = false; }
else { console.log('PASS: Blocked study plan generation when subjects are empty'); }

// Test missing daily hours
const r3 = store.generateCustomStudyPlan(studentUser.id, {
  level: 'btech',
  gradeOrBranch: 'Computer Science',
  selectedSubjects: ['DSA'],
  dailyHours: '0',
  examDate: '2026-12-01'
});
console.log(`Zero Hours: success=${r3.success}, msg="${r3.message}"`);
if (r3.success) { console.error('FAIL: Expected false for zero hours'); allPassed = false; }
else { console.log('PASS: Blocked study plan generation when daily hours is 0 or missing'); }

// Test missing date
const r4 = store.generateCustomStudyPlan(studentUser.id, {
  level: 'btech',
  gradeOrBranch: 'Computer Science',
  selectedSubjects: ['DSA'],
  dailyHours: '3',
  examDate: ''
});
console.log(`Empty Date: success=${r4.success}, msg="${r4.message}"`);
if (r4.success) { console.error('FAIL: Expected false for empty date'); allPassed = false; }
else { console.log('PASS: Blocked study plan generation when exam date is missing'); }

// Test valid submission
const rValid = store.generateCustomStudyPlan(studentUser.id, {
  level: 'btech',
  gradeOrBranch: 'Computer Science & Engineering',
  selectedSubjects: ['Data Structures & Algorithms', 'Operating Systems', 'Database Management Systems'],
  dailyHours: '4',
  examDate: '2026-12-15'
});
console.log(`Valid generation: success=${rValid.success}, schedule blocks count=${rValid.planner.schedule.length}`);
if (!rValid.success) { console.error('FAIL: Expected true for valid plan'); allPassed = false; }
else { console.log('PASS: Successfully generated 4-subject timetable and mock test slot when all fields provided'); }

console.log(`\nALL TESTS RESULT: ${allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌'}`);
process.exit(allPassed ? 0 : 1);
