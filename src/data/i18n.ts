import type { Language } from '../types/stem';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
};

export const SPEECH_LANG_CODES: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  kn: 'kn-IN',
};

export interface Dictionary {
  navUniverse: string;
  navPhysics: string;
  navSubjects: string;
  navDashboards: string;
  navResources: string;
  askMentor: string;
  heroTitle: string;
  heroSubtitle: string;
  startMissionCta: string;
  openMenuCta: string;
  exploreOfflineCta: string;
  guestAccessNote: string;
  offlineSyncNote: string;
  backToHome: string;
  curiosityPrompt: string;
  tryLaunchBtn: string;
  angleLabel: string;
  sideMenuLabel: string;
  launchPhysicsLab: string;
  exploreAllWorlds: string;
  primaryDomainLabel: string;
  physicsWorldTitle: string;
  physicsWorldDesc: string;
  supportingDomainsTitle: string;
  supportingDomainsDesc: string;
  openLab: string;
  openWorld: string;
  readAloud: string;
  stopReading: string;
  voiceInput: string;
  listening: string;
  solveNumerical: string;
  practicalLab: string;
  simulationsTab: string;
  solverTab: string;
  roleStudent: string;
  roleTeacher: string;
  roleAdmin: string;
  accessibilityLabel: string;
  highContrast: string;
  dyslexiaFont: string;
  lowPowerMode: string;
  lightTheme: string;
  darkTheme: string;
  offlineReady: string;
  onlineStatus: string;
  offlineStatus: string;
  saveOffline: string;
  savedOffline: string;
  downloadSheet: string;
  dailyChallenge: string;
  achievements: string;
  recommendedNext: string;
  streakLabel: string;
  // Simplified Mobile Home 4 Actions + Modes
  actionContinuePhysics: string;
  actionContinuePhysicsDesc: string;
  actionDownloadLesson: string;
  actionDownloadLessonDesc: string;
  actionPhysicsChallenge: string;
  actionPhysicsChallengeDesc: string;
  actionChooseLanguage: string;
  lightweight2DLabel: string;
  openOptional3D: string;
  returnTo2D: string;
  backToPhysics: string;
  // Offline & Sync States
  statusNotDownloaded: string;
  statusDownloading: string;
  statusAvailableOffline: string;
  statusWaitingSync: string;
  statusSavedLocally: string;
  statusSyncedCloud: string;
  requiresInternetNotice: string;
  // Physics controls & labs
  pauseLabel: string;
  playLabel: string;
  logReadingLabel: string;
  completeLabLabel: string;
  completedXpLabel: string;
  captionPrefix: string;
  submitQuizLabel: string;
  studentDashboardTitle: string;
  teacherDashboardTitle: string;
  adminDashboardTitle: string;
  demoDataBanner: string;
  earnedProgressTag: string;
  // 3-Line Side Menu & Home Quick Demo
  closeMenuLabel: string;
  quickDemoBadge: string;
  targetLabel: string;
  menuSectionPhysics: string;
  menuSectionSubjects: string;
  menuSectionTools: string;
  menuSectionMyLearning: string;
  menuSectionOffline: string;
  menuSectionSettings: string;
  menuPhysicsMechanics: string;
  menuPhysicsElectricity: string;
  menuPhysicsMagnetism: string;
  menuPhysicsOptics: string;
  menuPhysicsWaves: string;
  menuPhysicsEnergy: string;
  menuPhysicsPracticals: string;
  menuPhysicsSolver: string;
  menuPhysics3D: string;
  subjChemistry: string;
  subjBiology: string;
  subjMathematics: string;
  toolAudioTranscriber: string;
  menuStudentDashboard: string;
  menuTeacherDashboard: string;
  menuSchoolAdminDashboard: string;
  menuDownloadedLessons: string;
  textSizeLabel: string;
  liteModeShort: string;
  signInToSync: string;
  signingInLabel: string;
  savedOnDeviceLabel: string;
  queuedSyncSuffix: string;
  deviceSyncExplain: string;
  // Student Path & Curriculum Browser
  chooseYourClassLabel: string;
  myLearningPathLabel: string;
  changeClassBoardBtn: string;
  classLabel: string;
  boardLabel: string;
  stateLabel: string;
  sessionLabel: string;
  sessionChangeExplain: string;
  localPreferenceNote: string;
  savePathBtn: string;
  chaptersExperimentsTitle: string;
  chaptersExperimentsDesc: string;
  subjectFilterLabel: string;
  searchChaptersPlaceholder: string;
  filterAll: string;
  filterHomeSafe: string;
  filterVirtualSim: string;
  filterSchoolLab: string;
  filterOfflineSaved: string;
  relationInChapter: string;
  relationRelatedActivity: string;
  relationOfficialPractical: string;
  experimentLanguageLabel: string;
  translationMissingNotice: string;
  switchEnglishFallback: string;
  objectiveLabel: string;
  materialsLabel: string;
  safetyNoteLabel: string;
  stepsLabel: string;
  observationTableLabel: string;
  whatShouldHappenLabel: string;
  showHintLabel: string;
  whyDidThisHappenLabel: string;
  openSimulationBtn: string;
  downloadChapterOfflineBtn: string;
  savedOfflineChapterLabel: string;
  removeOfflineBtn: string;
  curriculumSourceLabel: string;
  contentBeingAddedTitle: string;
  contentBeingAddedDesc: string;
  tryClass8CbseBtn: string;
  openGeneralPhysicsBtn: string;
  requestBoardNoteLabel: string;
  requestedBoardSavedMsg: string;
  menuMyLearning: string;
  menuExperimentLibrary: string;
}

export const UI_TEXT: Record<Language, Dictionary> = {
  en: {
    navUniverse: 'Home',
    navPhysics: 'Physics',
    navSubjects: 'Other subjects',
    navDashboards: 'Dashboard',
    navResources: 'Offline lessons',
    askMentor: 'AI Mentor',
    heroTitle: 'See Physics come alive.',
    heroSubtitle:
      'Explore the interactive 3D Physics Observatory, dive into hands-on experiments and offline lessons, or open the Menu in the top-left corner anytime.',
    startMissionCta: 'Start learning Physics',
    openMenuCta: 'Menu',
    exploreOfflineCta: 'Offline lessons',
    guestAccessNote: 'Learn as a guest — progress saves on this device and can sync later if you sign in.',
    offlineSyncNote:
      'Offline mode: lessons stay available and progress saves on this device to sync later when internet returns.',
    backToHome: 'Back to Home',
    curiosityPrompt: 'Can you land the ball inside the target?',
    tryLaunchBtn: 'Try',
    angleLabel: 'Launch Angle',
    sideMenuLabel: 'Menu — Open navigation drawer',
    launchPhysicsLab: 'Continue Physics',
    exploreAllWorlds: 'Other subjects',
    primaryDomainLabel: 'Gyaan Graph · Explore Science',
    physicsWorldTitle: 'Physics World',
    physicsWorldDesc:
      'Interactive 2D & optional 3D physics labs, step-by-step numerical solver, virtual practicals, and offline-ready projectile missions.',
    supportingDomainsTitle: 'Supporting STEM Subjects',
    supportingDomainsDesc:
      'Explore Chemistry, Biology, and Mathematics lessons, activities, and quizzes alongside Physics.',
    openLab: 'Open Simulation',
    openWorld: 'Enter Subject',
    readAloud: 'Listen',
    stopReading: 'Stop Audio',
    voiceInput: 'Voice Ask',
    listening: 'Listening...',
    solveNumerical: 'Solve Step-by-Step',
    practicalLab: 'Virtual Practicals',
    simulationsTab: 'Interactive Lab',
    solverTab: 'Numerical Solver',
    roleStudent: 'Student',
    roleTeacher: 'Teacher',
    roleAdmin: 'School Admin',
    accessibilityLabel: 'Accessibility & Lite Mode',
    highContrast: 'High Contrast',
    dyslexiaFont: 'Dyslexia Spacing',
    lowPowerMode: 'Lite 2D / Reduced Motion',
    lightTheme: 'Light',
    darkTheme: 'Dark',
    offlineReady: 'Offline Ready',
    onlineStatus: 'Online',
    offlineStatus: 'Offline',
    saveOffline: 'Save Offline',
    savedOffline: 'saved offline',
    downloadSheet: 'Export File',
    dailyChallenge: 'Daily Physics Challenge',
    achievements: 'Achievements',
    recommendedNext: 'Suggested Next Step',
    streakLabel: 'Active Streak',
    actionContinuePhysics: 'Continue Physics',
    actionContinuePhysicsDesc: 'Open Projectile Mission & Labs',
    actionDownloadLesson: 'Download a Lesson',
    actionDownloadLessonDesc: 'Save Projectile pack for offline use',
    actionPhysicsChallenge: 'Play a Physics Challenge',
    actionPhysicsChallengeDesc: 'Target launch projectile challenge',
    actionChooseLanguage: 'Language',
    lightweight2DLabel: 'Fast 2D Mode (Default for Android)',
    openOptional3D: 'Open Optional 3D Observatory',
    returnTo2D: 'Switch Back to Fast 2D',
    backToPhysics: 'Back to Physics',
    statusNotDownloaded: 'Not downloaded yet',
    statusDownloading: 'Downloading...',
    statusAvailableOffline: 'Available offline',
    statusWaitingSync: 'Waiting to sync',
    statusSavedLocally: 'Saved on device',
    statusSyncedCloud: 'Synced to cloud',
    requiresInternetNotice: 'Requires internet connection',
    pauseLabel: 'Pause',
    playLabel: 'Play',
    logReadingLabel: 'Log Reading',
    completeLabLabel: 'Complete Lab',
    completedXpLabel: 'Completed',
    captionPrefix: 'Audio Transcript',
    submitQuizLabel: 'Submit Quiz',
    studentDashboardTitle: 'Student Progress & Offline Storage',
    teacherDashboardTitle: 'Teacher Classroom Console',
    adminDashboardTitle: 'School Administration Console',
    demoDataBanner: 'Sample Demo Data (Static Preview)',
    earnedProgressTag: 'Your Real Earned Progress',
    closeMenuLabel: 'Close Menu',
    quickDemoBadge: 'Interactive 2D Physics Demo',
    targetLabel: 'Target (40m)',
    menuSectionPhysics: 'Physics',
    menuSectionSubjects: 'Other subjects',
    menuSectionTools: 'Learning tools',
    menuSectionMyLearning: 'My learning',
    menuSectionOffline: 'Offline',
    menuSectionSettings: 'Settings',
    menuPhysicsMechanics: 'Mechanics & Motion',
    menuPhysicsElectricity: 'Electricity & Circuits',
    menuPhysicsMagnetism: 'Magnetism',
    menuPhysicsOptics: 'Optics',
    menuPhysicsWaves: 'Waves & Sound',
    menuPhysicsEnergy: 'Energy & Heat',
    menuPhysicsPracticals: 'Virtual Practicals',
    menuPhysicsSolver: 'Numerical Solver',
    menuPhysics3D: '3D Observatory',
    subjChemistry: 'Chemistry',
    subjBiology: 'Biology',
    subjMathematics: 'Mathematics',
    toolAudioTranscriber: 'Audio Transcriber',
    menuStudentDashboard: 'Student Dashboard',
    menuTeacherDashboard: 'Teacher Dashboard',
    menuSchoolAdminDashboard: 'School Admin Dashboard',
    menuDownloadedLessons: 'Downloaded lessons / Offline Packs',
    textSizeLabel: 'Text size',
    liteModeShort: 'Accessibility & Lite Mode',
    signInToSync: 'Sign in / Sync',
    signingInLabel: 'Signing in...',
    savedOnDeviceLabel: 'Saved on device',
    queuedSyncSuffix: 'changes saved locally to sync later',
    deviceSyncExplain: 'Progress saves on this device and syncs later if you sign in.',
    chooseYourClassLabel: 'Choose your class',
    myLearningPathLabel: 'My learning',
    changeClassBoardBtn: 'Change class / board',
    classLabel: 'Class',
    boardLabel: 'Board',
    stateLabel: 'State',
    sessionLabel: 'Academic session (optional)',
    sessionChangeExplain:
      'Chapter lists can change by board and year. For example, CBSE/NCERT introduced the new Grade 8 Science textbook ("Curiosity") for 2025–26.',
    localPreferenceNote: 'Saved on this device · Works offline · No sign-in needed',
    savePathBtn: 'Done',
    chaptersExperimentsTitle: 'Chapters & Experiments',
    chaptersExperimentsDesc:
      'Browse verified chapters, safe household activities, school-lab steps, and interactive simulations mapped to your class and board.',
    subjectFilterLabel: 'Subject',
    searchChaptersPlaceholder: 'Search chapter or experiment name...',
    filterAll: 'All',
    filterHomeSafe: 'Can do at home',
    filterVirtualSim: 'Virtual simulation',
    filterSchoolLab: 'School-lab equipment',
    filterOfflineSaved: 'Downloaded / offline',
    relationInChapter: 'In this chapter',
    relationRelatedActivity: 'Related Physics activity',
    relationOfficialPractical: 'Official practical',
    experimentLanguageLabel: 'Experiment language',
    translationMissingNotice:
      'Full translation is not yet available for part of this section—showing English.',
    switchEnglishFallback: 'Show in English',
    objectiveLabel: 'Objective',
    materialsLabel: 'Materials needed',
    safetyNoteLabel: 'Safety note',
    stepsLabel: 'Steps',
    observationTableLabel: 'Observation table',
    whatShouldHappenLabel: 'What should happen?',
    showHintLabel: 'Need a hint?',
    whyDidThisHappenLabel: 'Why did this happen?',
    openSimulationBtn: 'Open Interactive Simulation',
    downloadChapterOfflineBtn: 'Save chapter offline',
    savedOfflineChapterLabel: 'Saved offline on this device',
    removeOfflineBtn: 'Remove',
    curriculumSourceLabel: 'Curriculum source',
    contentBeingAddedTitle: 'Content being added / choose another board',
    contentBeingAddedDesc:
      'We have not yet verified the chapter list for this exact class, board, or session. We do not show unverified chapter lists.',
    tryClass8CbseBtn: 'Try verified Class 8 · CBSE (2025–26 Curiosity)',
    openGeneralPhysicsBtn: 'Explore General Physics Labs',
    requestBoardNoteLabel: 'Request this class & board on device',
    requestedBoardSavedMsg: 'Saved your syllabus request locally so you can track it.',
    menuMyLearning: 'My Learning Syllabus',
    menuExperimentLibrary: 'Experiment Library',
  },
  hi: {
    navUniverse: 'होम',
    navPhysics: 'भौतिकी',
    navSubjects: 'अन्य विषय',
    navDashboards: 'डैशबोर्ड',
    navResources: 'ऑफ़लाइन पाठ',
    askMentor: 'AI मेंटर',
    heroTitle: 'भौतिकी को जीवंत होते देखें।',
    heroSubtitle:
      'इंटरैक्टिव 3D भौतिकी वेधशाला देखें, प्रयोगशालाओं और ऑफ़लाइन पाठों का अभ्यास करें, या ऊपर बाएँ मेनू से सभी विषय खोलें।',
    startMissionCta: 'भौतिकी सीखना शुरू करें',
    openMenuCta: 'मेनू',
    exploreOfflineCta: 'ऑफ़लाइन पाठ',
    guestAccessNote: 'अतिथि के रूप में सीखें — प्रगति इस डिवाइस पर सहेजी जाती है और साइन-इन पर सिंक होती है।',
    offlineSyncNote:
      'ऑफ़लाइन मोड: सहेजे गए पाठ उपलब्ध हैं और प्रगति इंटरनेट आने पर सिंक होगी।',
    backToHome: 'होम पर लौटें',
    curiosityPrompt: 'क्या आप गेंद को लक्ष्य के अंदर पहुँचा सकते हैं?',
    tryLaunchBtn: 'आज़माएँ',
    angleLabel: 'प्रक्षेपण कोण',
    sideMenuLabel: 'मेनू — नेविगेशन खोलें',
    launchPhysicsLab: 'भौतिकी जारी रखें',
    exploreAllWorlds: 'अन्य विषय',
    primaryDomainLabel: 'Gyaan Graph · विज्ञान की खोज',
    physicsWorldTitle: 'भौतिकी जगत (Physics World)',
    physicsWorldDesc:
      'इंटरैक्टिव 2D व वैकल्पिक 3D प्रयोगशालाएँ, न्यूमेरिकल सॉल्वर, वर्चुअल प्रैक्टिकल और ऑफ़लाइन प्रक्षेप्य मिशन।',
    supportingDomainsTitle: 'सहायक STEM विषय',
    supportingDomainsDesc:
      'भौतिकी के साथ रसायन विज्ञान, जीव विज्ञान और गणित के पाठ, गतिविधियाँ और क्विज़ देखें।',
    openLab: 'प्रयोग खोलें',
    openWorld: 'विषय खोलें',
    readAloud: 'सुनें',
    stopReading: 'आवाज़ रोकें',
    voiceInput: 'बोलकर पूछें',
    listening: 'सुन रहे हैं...',
    solveNumerical: 'हल करें',
    practicalLab: 'वर्चुअल प्रैक्टिकल',
    simulationsTab: 'इंटरैक्टिव लैब',
    solverTab: 'न्यूमेरिकल सॉल्वर',
    roleStudent: 'छात्र',
    roleTeacher: 'शिक्षक',
    roleAdmin: 'प्रशासन',
    accessibilityLabel: 'सुगम्यता और लाइट मोड',
    highContrast: 'उच्च कंट्रास्ट',
    dyslexiaFont: 'आसान पठन स्पेसिंग',
    lowPowerMode: 'लाइट 2D / कम मोशन',
    lightTheme: 'लाइट',
    darkTheme: 'डार्क',
    offlineReady: 'ऑफ़लाइन उपलब्ध',
    onlineStatus: 'ऑनलाइन',
    offlineStatus: 'ऑफ़लाइन',
    saveOffline: 'ऑफ़लाइन सहेजें',
    savedOffline: 'ऑफ़लाइन सहेजे गए',
    downloadSheet: 'फ़ाइल डाउनलोड',
    dailyChallenge: 'दैनिक भौतिकी चुनौती',
    achievements: 'उपलब्धियाँ',
    recommendedNext: 'अगला सुझाया कदम',
    streakLabel: 'सक्रिय स्ट्रीक',
    actionContinuePhysics: 'भौतिकी जारी रखें',
    actionContinuePhysicsDesc: 'प्रक्षेप्य मिशन और लैब खोलें',
    actionDownloadLesson: 'पाठ डाउनलोड करें',
    actionDownloadLessonDesc: 'ऑफ़लाइन अध्ययन के लिए पैक सहेजें',
    actionPhysicsChallenge: 'भौतिकी चुनौती खेलें',
    actionPhysicsChallengeDesc: 'लक्ष्य प्रक्षेपण चुनौती',
    actionChooseLanguage: 'भाषा चुनें',
    lightweight2DLabel: 'तेज़ 2D मोड (एंड्रॉइड के लिए डिफ़ॉल्ट)',
    openOptional3D: 'वैकल्पिक 3D वेधशाला खोलें',
    returnTo2D: 'तेज़ 2D मोड पर लौटें',
    backToPhysics: 'भौतिकी पर लौटें',
    statusNotDownloaded: 'डाउनलोड नहीं हुआ',
    statusDownloading: 'डाउनलोड हो रहा है...',
    statusAvailableOffline: 'ऑफ़लाइन उपलब्ध',
    statusWaitingSync: 'सिंक की प्रतीक्षा में',
    statusSavedLocally: 'डिवाइस में सहेजा गया',
    statusSyncedCloud: 'क्लाउड से सिंक',
    requiresInternetNotice: 'इंटरनेट कनेक्शन आवश्यक है',
    pauseLabel: 'रोकें',
    playLabel: 'चलाएँ',
    logReadingLabel: 'रीडिंग दर्ज करें',
    completeLabLabel: 'लैब पूर्ण करें',
    completedXpLabel: 'पूर्ण',
    captionPrefix: 'ऑडियो पाठ (कैप्शन)',
    submitQuizLabel: 'क्विज़ सबमिट करें',
    studentDashboardTitle: 'छात्र प्रगति और ऑफ़लाइन संग्रहण',
    teacherDashboardTitle: 'शिक्षक कक्षा कंसोल',
    adminDashboardTitle: 'विद्यालय प्रशासन कंसोल',
    demoDataBanner: 'नमूना डेमो डेटा (स्थिर पूर्वावलोकन)',
    earnedProgressTag: 'आपकी वास्तविक अर्जित प्रगति',
    closeMenuLabel: 'मेनू बंद करें',
    quickDemoBadge: 'हल्का 2D भौतिकी डेमो',
    targetLabel: 'लक्ष्य (40m)',
    menuSectionPhysics: 'भौतिकी',
    menuSectionSubjects: 'अन्य विषय',
    menuSectionTools: 'सीखने के उपकरण',
    menuSectionMyLearning: 'मेरी सीख',
    menuSectionOffline: 'ऑफ़लाइन',
    menuSectionSettings: 'सेटिंग्स',
    menuPhysicsMechanics: 'यांत्रिकी और गति',
    menuPhysicsElectricity: 'विद्युत और परिपथ',
    menuPhysicsMagnetism: 'चुंबकत्व',
    menuPhysicsOptics: 'प्रकाशिकी (Optics)',
    menuPhysicsWaves: 'तरंगें और ध्वनि',
    menuPhysicsEnergy: 'ऊर्जा और ऊष्मा',
    menuPhysicsPracticals: 'वर्चुअल प्रैक्टिकल',
    menuPhysicsSolver: 'न्यूमेरिकल सॉल्वर',
    menuPhysics3D: '3D वेधशाला',
    subjChemistry: 'रसायन विज्ञान',
    subjBiology: 'जीव विज्ञान',
    subjMathematics: 'गणित',
    toolAudioTranscriber: 'ऑडियो ट्रांसक्राइबर',
    menuStudentDashboard: 'छात्र डैशबोर्ड',
    menuTeacherDashboard: 'शिक्षक डैशबोर्ड',
    menuSchoolAdminDashboard: 'स्कूल एडमिन डैशबोर्ड',
    menuDownloadedLessons: 'डाउनलोड पाठ / ऑफ़लाइन पैक',
    textSizeLabel: 'टेक्स्ट आकार',
    liteModeShort: 'सुगम्यता और लाइट मोड',
    signInToSync: 'साइन इन / सिंक',
    signingInLabel: 'साइन इन हो रहा है...',
    savedOnDeviceLabel: 'डिवाइस पर सहेजा गया',
    queuedSyncSuffix: 'बदलाव बाद में सिंक होने के लिए सहेजे गए',
    deviceSyncExplain: 'प्रगति इस डिवाइस पर सहेजी जाती है और साइन-इन करने पर सिंक होगी।',
    chooseYourClassLabel: 'अपनी कक्षा चुनें',
    myLearningPathLabel: 'मेरी सीख',
    changeClassBoardBtn: 'कक्षा / बोर्ड बदलें',
    classLabel: 'कक्षा',
    boardLabel: 'बोर्ड',
    stateLabel: 'राज्य',
    sessionLabel: 'शैक्षणिक सत्र (वैकल्पिक)',
    sessionChangeExplain:
      'बोर्ड और वर्ष के अनुसार अध्यायों की सूची बदल सकती है। जैसे CBSE/NCERT ने 2025–26 के लिए कक्षा 8 की नई विज्ञान पुस्तक ("Curiosity") लागू की है।',
    localPreferenceNote: 'इस डिवाइस पर सहेजा गया · ऑफ़लाइन काम करता है · लॉगिन आवश्यक नहीं',
    savePathBtn: 'हो गया',
    chaptersExperimentsTitle: 'अध्याय और प्रयोग',
    chaptersExperimentsDesc:
      'अपनी कक्षा और बोर्ड के अनुसार सत्यापित अध्याय, घर के सुरक्षित प्रयोग, स्कूल-लैब चरण और इंटरैक्टिव सिमुलेशन देखें।',
    subjectFilterLabel: 'विषय',
    searchChaptersPlaceholder: 'अध्याय या प्रयोग का नाम खोजें...',
    filterAll: 'सभी',
    filterHomeSafe: 'घर पर कर सकते हैं',
    filterVirtualSim: 'वर्चुअल सिमुलेशन',
    filterSchoolLab: 'स्कूल-लैब उपकरण',
    filterOfflineSaved: 'डाउनलोड / ऑफ़लाइन',
    relationInChapter: 'इस अध्याय में',
    relationRelatedActivity: 'संबंधित भौतिकी गतिविधि',
    relationOfficialPractical: 'आधिकारिक प्रैक्टिकल',
    experimentLanguageLabel: 'प्रयोग की भाषा',
    translationMissingNotice:
      'इस भाग का पूरा अनुवाद अभी उपलब्ध नहीं है — अंग्रेज़ी दिखाई जा रही है।',
    switchEnglishFallback: 'अंग्रेज़ी में देखें',
    objectiveLabel: 'उद्देश्य',
    materialsLabel: 'आवश्यक सामग्री',
    safetyNoteLabel: 'सुरक्षा निर्देश',
    stepsLabel: 'प्रयोग के चरण',
    observationTableLabel: 'अवलोकन तालिका',
    whatShouldHappenLabel: 'क्या होना चाहिए?',
    showHintLabel: 'संकेत चाहिए?',
    whyDidThisHappenLabel: 'ऐसा क्यों हुआ?',
    openSimulationBtn: 'इंटरैक्टिव सिमुलेशन खोलें',
    downloadChapterOfflineBtn: 'अध्याय ऑफ़लाइन सहेजें',
    savedOfflineChapterLabel: 'इस डिवाइस पर ऑफ़लाइन सहेजा गया',
    removeOfflineBtn: 'हटाएँ',
    curriculumSourceLabel: 'पाठ्यक्रम स्रोत',
    contentBeingAddedTitle: 'सामग्री जोड़ी जा रही है / दूसरा बोर्ड चुनें',
    contentBeingAddedDesc:
      'इस कक्षा, बोर्ड या सत्र की अध्याय सूची अभी सत्यापित नहीं हुई है। हम बिना सत्यापन वाली अध्याय सूची नहीं दिखाते।',
    tryClass8CbseBtn: 'सत्यापित कक्षा 8 · CBSE (2025–26 Curiosity) देखें',
    openGeneralPhysicsBtn: 'सामान्य भौतिकी लैब खोलें',
    requestBoardNoteLabel: 'इस कक्षा व बोर्ड का अनुरोध सहेजें',
    requestedBoardSavedMsg: 'आपका अनुरोध इस डिवाइस पर सहेज लिया गया है।',
    menuMyLearning: 'मेरी सीख (पाठ्यक्रम)',
    menuExperimentLibrary: 'प्रयोग पुस्तकालय',
  },
  kn: {
    navUniverse: 'ಮುಖಪುಟ',
    navPhysics: 'ಭೌತಶಾಸ್ತ್ರ',
    navSubjects: 'ಇತರ ವಿಷಯಗಳು',
    navDashboards: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navResources: 'ಆಫ್‌ಲೈನ್ ಪಾಠಗಳು',
    askMentor: 'AI ಮಾರ್ಗದರ್ಶಿ',
    heroTitle: 'ಭೌತಶಾಸ್ತ್ರ ಜೀವಂತವಾಗುವುದನ್ನು ನೋಡಿ.',
    heroSubtitle:
      'ಸಂವಾದಾತ್ಮಕ 3D ಭೌತಶಾಸ್ತ್ರ ವೀಕ್ಷಣಾಲಯವನ್ನು ಅನ್ವೇಷಿಸಿ, ಪ್ರಯೋಗಗಳು ಮತ್ತು ಆಫ್‌ಲೈನ್ ಪಾಠಗಳನ್ನು ಪ್ರಾರಂಭಿಸಿ, ಅಥವಾ ಮೇಲಿನ ಎಡಭಾಗದ ಮೆನು ತೆರೆಯಿರಿ.',
    startMissionCta: 'ಭೌತಶಾಸ್ತ್ರ ಕಲಿಯಲು ಪ್ರಾರಂಭಿಸಿ',
    openMenuCta: 'ಮೆನು',
    exploreOfflineCta: 'ಆಫ್‌ಲೈನ್ ಪಾಠಗಳು',
    guestAccessNote: 'ಅತಿಥಿಯಾಗಿ ಕಲಿಯಿರಿ — ಪ್ರಗತಿ ಈ ಸಾಧನದಲ್ಲೇ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಸೈನ್-ಇನ್ ಮಾಡಿದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.',
    offlineSyncNote:
      'ಆಫ್‌ಲೈನ್ ಮೋಡ್: ಪಾಠಗಳು ಲಭ್ಯವಿವೆ ಮತ್ತು ಇಂಟರ್ನೆಟ್ ಬಂದಾಗ ಪ್ರಗತಿ ಸಿಂಕ್ ಆಗುತ್ತದೆ.',
    backToHome: 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    curiosityPrompt: 'ನೀವು ಚೆಂಡನ್ನು ಗುರಿಯ ಒಳಗೆ ಇಳಿಸಬಹುದೇ?',
    tryLaunchBtn: 'ಪ್ರಯತ್ನಿಸಿ',
    angleLabel: 'ಉಡಾವಣಾ ಕೋನ',
    sideMenuLabel: 'ಮೆನು — ನ್ಯಾವಿಗೇಷನ್ ತೆರೆಯಿರಿ',
    launchPhysicsLab: 'ಭೌತಶಾಸ್ತ್ರ ಮುಂದುವರಿಸಿ',
    exploreAllWorlds: 'ಇತರ ವಿಷಯಗಳು',
    primaryDomainLabel: 'Gyaan Graph · ವಿಜ್ಞಾನವನ್ನು ಅನ್ವೇಷಿಸಿ',
    physicsWorldTitle: 'ಭೌತಶಾಸ್ತ್ರ ಲೋಕ (Physics World)',
    physicsWorldDesc:
      'ಸಂವಾದಾತ್ಮಕ 2D ಮತ್ತು ಐಚ್ಛಿಕ 3D ಪ್ರಯೋಗಾಲಯಗಳು, ಸಂಖ್ಯಾತ್ಮಕ ಪರಿಹಾರಕ, ಪ್ರಾಯೋಗಿಕ ಬೆಂಚ್ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಪ್ರಕ್ಷೇಪಕ ಮಿಷನ್.',
    supportingDomainsTitle: 'ಪೂರಕ STEM ವಿಷಯಗಳು',
    supportingDomainsDesc:
      'ಭೌತಶಾಸ್ತ್ರದೊಂದಿಗೆ ರಸಾಯನಶಾಸ್ತ್ರ, ಜೀವಶಾಸ್ತ್ರ ಮತ್ತು ಗಣಿತದ ಪಾಠಗಳು ಮತ್ತು ಕ್ವಿಜ್‌ಗಳನ್ನು ನೋಡಿ.',
    openLab: 'ಪ್ರಯೋಗ ತೆರೆಯಿರಿ',
    openWorld: 'ವಿಷಯ ತೆರೆಯಿರಿ',
    readAloud: 'ಕೇಳಿ',
    stopReading: 'ನಿಲ್ಲಿಸಿ',
    voiceInput: 'ಧ್ವನಿ ಪ್ರಶ್ನೆ',
    listening: 'ಕೇಳಲಾಗುತ್ತಿದೆ...',
    solveNumerical: 'ಹಂತ-ಹಂತವಾಗಿ ಬಿಡಿಸಿ',
    practicalLab: 'ವರ್ಚುವಲ್ ಪ್ರಾಯೋಗಿಕ',
    simulationsTab: 'ಸಂವಾದಾತ್ಮಕ ಲ್ಯಾಬ್',
    solverTab: 'ಸಂಖ್ಯಾತ್ಮಕ ಪರಿಹಾರಕ',
    roleStudent: 'ವಿದ್ಯಾರ್ಥಿ',
    roleTeacher: 'ಶಿಕ್ಷಕರು',
    roleAdmin: 'ಶಾಲಾ ಆಡಳಿತ',
    accessibilityLabel: 'ಸುಲಭ ಬಳಕೆ ಮತ್ತು ಲೈಟ್ ಮೋಡ್',
    highContrast: 'ಹೈ ಕಾಂಟ್ರಾಸ್ಟ್',
    dyslexiaFont: 'ಸುಲಭ ಓದು',
    lowPowerMode: 'ಲೈಟ್ 2D / ಕಡಿಮೆ ಚಲನೆ',
    lightTheme: 'ಬೆಳಕು',
    darkTheme: 'ಕತ್ತಲು',
    offlineReady: 'ಆಫ್‌ಲೈನ್ ಲಭ್ಯ',
    onlineStatus: 'ಆನ್‌ಲೈನ್',
    offlineStatus: 'ಆಫ್‌ಲೈನ್',
    saveOffline: 'ಆಫ್‌ಲೈನ್ ಉಳಿಸಿ',
    savedOffline: 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    downloadSheet: 'ಫೈಲ್ ಡೌನ್‌ಲೋಡ್',
    dailyChallenge: 'ದೈನಂದಿನ ಭೌತಶಾಸ್ತ್ರ ಸವಾಲು',
    achievements: 'ಸಾಧನೆಗಳು',
    recommendedNext: 'ಮುಂದಿನ ಶಿಫಾರಸು',
    streakLabel: 'ಸಕ್ರಿಯ ಸರಣಿ',
    actionContinuePhysics: 'ಭೌತಶಾಸ್ತ್ರ ಮುಂದುವರಿಸಿ',
    actionContinuePhysicsDesc: 'ಪ್ರಕ್ಷೇಪಕ ಮಿಷನ್ ಮತ್ತು ಲ್ಯಾಬ್ ತೆರೆಯಿರಿ',
    actionDownloadLesson: 'ಪಾಠ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    actionDownloadLessonDesc: 'ಆಫ್‌ಲೈನ್ ಕಲಿಕೆಗಾಗಿ ಪ್ಯಾಕ್ ಉಳಿಸಿ',
    actionPhysicsChallenge: 'ಭೌತಶಾಸ್ತ್ರ ಸವಾಲು ಆಡಿ',
    actionPhysicsChallengeDesc: 'ಗುರಿ ಉಡಾವಣೆ ಸವಾಲು',
    actionChooseLanguage: 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
    lightweight2DLabel: 'ವೇಗದ 2D ಮೋಡ್ (ಆಂಡ್ರಾಯ್ಡ್ ಡೀಫಾಲ್ಟ್)',
    openOptional3D: 'ಐಚ್ಛಿಕ 3D ಪ್ರಯೋಗಾಲಯ ತೆರೆಯಿರಿ',
    returnTo2D: 'ವೇಗದ 2D ಗೆ ಹಿಂತಿರುಗಿ',
    backToPhysics: 'ಭೌತಶಾಸ್ತ್ರಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    statusNotDownloaded: 'ಇನ್ನೂ ಡೌನ್‌ಲೋಡ್ ಆಗಿಲ್ಲ',
    statusDownloading: 'ಡೌನ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    statusAvailableOffline: 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಲಭ್ಯ',
    statusWaitingSync: 'ಸಿಂಕ್‌ಗಾಗಿ ಕಾಯುತ್ತಿದೆ',
    statusSavedLocally: 'ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    statusSyncedCloud: 'ಕ್ಲೌಡ್‌ಗೆ ಸಿಂಕ್ ಆಗಿದೆ',
    requiresInternetNotice: 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಅಗತ್ಯವಿದೆ',
    pauseLabel: 'ನಿಲ್ಲಿಸಿ',
    playLabel: 'ಚಲಾಯಿಸಿ',
    logReadingLabel: 'ರೀಡಿಂಗ್ ದಾಖಲಿಸಿ',
    completeLabLabel: 'ಲ್ಯಾಬ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    completedXpLabel: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    captionPrefix: 'ಆಡಿಯೋ ಪಠ್ಯ (ಶೀರ್ಷಿಕೆ)',
    submitQuizLabel: 'ಕ್ವಿಜ್ ಸಲ್ಲಿಸಿ',
    studentDashboardTitle: 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರಗತಿ ಮತ್ತು ಆಫ್‌ಲೈನ್ ಸಂಗ್ರಹಣೆ',
    teacherDashboardTitle: 'ಶಿಕ್ಷಕರ ತರಗತಿ ಕನ್ಸೋಲ್',
    adminDashboardTitle: 'ಶಾಲಾ ಆಡಳಿತ ಕನ್ಸೋಲ್',
    demoDataBanner: 'ಮಾದರಿ ಡೆಮೊ ಡೇಟಾ (ಪೂರ್ವವೀಕ್ಷಣೆ)',
    earnedProgressTag: 'ನಿಮ್ಮ ನಿಜವಾದ ಗಳಿಸಿದ ಪ್ರಗತಿ',
    closeMenuLabel: 'ಮೆನು ಮುಚ್ಚಿರಿ',
    quickDemoBadge: 'ಸರಳ 2D ಭೌತಶಾಸ್ತ್ರ ಡೆಮೊ',
    targetLabel: 'ಗುರಿ (40m)',
    menuSectionPhysics: 'ಭೌತಶಾಸ್ತ್ರ',
    menuSectionSubjects: 'ಇತರ ವಿಷಯಗಳು',
    menuSectionTools: 'ಕಲಿಕಾ ಸಾಧನಗಳು',
    menuSectionMyLearning: 'ನನ್ನ ಕಲಿಕೆ',
    menuSectionOffline: 'ಆಫ್‌ಲೈನ್',
    menuSectionSettings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    menuPhysicsMechanics: 'ಯಂತ್ರಶಾಸ್ತ್ರ ಮತ್ತು ಚಲನೆ',
    menuPhysicsElectricity: 'ವಿದ್ಯುತ್ ಮತ್ತು ಸರ್ಕ್ಯೂಟ್',
    menuPhysicsMagnetism: 'ಕಾಂತೀಯತೆ',
    menuPhysicsOptics: 'ದೃಗ್ವಿಜ್ಞಾನ (Optics)',
    menuPhysicsWaves: 'ತರಂಗಗಳು ಮತ್ತು ಧ್ವನಿ',
    menuPhysicsEnergy: 'ಶಕ್ತಿ ಮತ್ತು ಶಾಖ',
    menuPhysicsPracticals: 'ವರ್ಚುವಲ್ ಪ್ರಾಯೋಗಿಕ',
    menuPhysicsSolver: 'ಸಂಖ್ಯಾತ್ಮಕ ಪರಿಹಾರಕ',
    menuPhysics3D: '3D ಪ್ರಯೋಗಾಲಯ',
    subjChemistry: 'ರಸಾಯನಶಾಸ್ತ್ರ',
    subjBiology: 'ಜೀವಶಾಸ್ತ್ರ',
    subjMathematics: 'ಗಣಿತ',
    toolAudioTranscriber: 'ಆಡಿಯೋ ಟ್ರಾನ್ಸ್‌ಕ್ರೈಬರ್',
    menuStudentDashboard: 'ವಿದ್ಯಾರ್ಥಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    menuTeacherDashboard: 'ಶಿಕ್ಷಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    menuSchoolAdminDashboard: 'ಶಾಲಾ ಆಡಳಿತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    menuDownloadedLessons: 'ಡೌನ್‌ಲೋಡ್ ಪಾಠಗಳು / ಆಫ್‌ಲೈನ್ ಪ್ಯಾಕ್',
    textSizeLabel: 'ಪಠ್ಯ ಗಾತ್ರ',
    liteModeShort: 'ಸುಲಭ ಬಳಕೆ ಮತ್ತು ಲೈಟ್ ಮೋಡ್',
    signInToSync: 'ಸೈನ್ ಇನ್ / ಸಿಂಕ್',
    signingInLabel: 'ಸೈನ್ ಇನ್ ಆಗುತ್ತಿದೆ...',
    savedOnDeviceLabel: 'ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    queuedSyncSuffix: 'ಬದಲಾವಣೆಗಳು ನಂತರ ಸಿಂಕ್ ಆಗಲು ಉಳಿಸಲಾಗಿದೆ',
    deviceSyncExplain: 'ಪ್ರಗತಿ ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಯುತ್ತದೆ ಮತ್ತು ಸೈನ್ ಇನ್ ಮಾಡಿದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.',
    chooseYourClassLabel: 'ನಿಮ್ಮ ತರಗತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    myLearningPathLabel: 'ನನ್ನ ಕಲಿಕೆ',
    changeClassBoardBtn: 'ತರಗತಿ / ಮಂಡಳಿ ಬದಲಾಯಿಸಿ',
    classLabel: 'ತರಗತಿ',
    boardLabel: 'ಮಂಡಳಿ',
    stateLabel: 'ರಾಜ್ಯ',
    sessionLabel: 'ಶೈಕ್ಷಣಿಕ ವರ್ಷ (ಐಚ್ಛಿಕ)',
    sessionChangeExplain:
      'ಮಂಡಳಿ ಮತ್ತು ವರ್ಷಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಅಧ್ಯಾಯಗಳ ಪಟ್ಟಿ ಬದಲಾಗಬಹುದು. ಉದಾಹರಣೆಗೆ, CBSE/NCERT 2025–26ಕ್ಕೆ ಹೊಸ ತರಗತಿ 8 ವಿಜ್ಞಾನ ("Curiosity") ಪಠ್ಯಪುಸ್ತಕವನ್ನು ಪರಿಚಯಿಸಿದೆ.',
    localPreferenceNote: 'ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ · ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಲಭ್ಯ · ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ',
    savePathBtn: 'ಮುಗಿಯಿತು',
    chaptersExperimentsTitle: 'ಅಧ್ಯಾಯಗಳು ಮತ್ತು ಪ್ರಯೋಗಗಳು',
    chaptersExperimentsDesc:
      'ನಿಮ್ಮ ತರಗತಿ ಮತ್ತು ಮಂಡಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ಪರಿಶೀಲಿಸಿದ ಅಧ್ಯಾಯಗಳು, ಮನೆ ಪ್ರಯೋಗಗಳು, ಶಾಲಾ-ಲ್ಯಾಬ್ ಹಂತಗಳು ಮತ್ತು ಸಿಮ್ಯುಲೇಶನ್‌ಗಳನ್ನು ನೋಡಿ.',
    subjectFilterLabel: 'ವಿಷಯ',
    searchChaptersPlaceholder: 'ಅಧ್ಯಾಯ ಅಥವಾ ಪ್ರಯೋಗದ ಹೆಸರನ್ನು ಹುಡುಕಿ...',
    filterAll: 'ಎಲ್ಲಾ',
    filterHomeSafe: 'ಮನೆಯಲ್ಲಿ ಮಾಡಬಹುದು',
    filterVirtualSim: 'ವರ್ಚುವಲ್ ಸಿಮ್ಯುಲೇಶನ್',
    filterSchoolLab: 'ಶಾಲಾ-ಲ್ಯಾಬ್ ಉಪಕರಣ',
    filterOfflineSaved: 'ಡೌನ್‌ಲೋಡ್ / ಆಫ್‌ಲೈನ್',
    relationInChapter: 'ಈ ಅಧ್ಯಾಯದಲ್ಲಿ',
    relationRelatedActivity: 'ಸಂಬಂಧಿತ ಭೌತಶಾಸ್ತ್ರ ಚಟುವಟಿಕೆ',
    relationOfficialPractical: 'ಅಧಿಕೃತ ಪ್ರಾಯೋಗಿಕ',
    experimentLanguageLabel: 'ಪ್ರಯೋಗದ ಭಾಷೆ',
    translationMissingNotice:
      'ಈ ಭಾಗದ ಸಂಪೂರ್ಣ ಅನುವಾದ ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ — ಇಂಗ್ಲಿಷ್ ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    switchEnglishFallback: 'ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ನೋಡಿ',
    objectiveLabel: 'ಉದ್ದೇಶ',
    materialsLabel: 'ಬೇಕಾಗುವ ಸಾಮಗ್ರಿಗಳು',
    safetyNoteLabel: 'ಸುರಕ್ಷತಾ ಸೂಚನೆ',
    stepsLabel: 'ಹಂತಗಳು',
    observationTableLabel: 'ವೀಕ್ಷಣಾ ಕೋಷ್ಟಕ',
    whatShouldHappenLabel: 'ಏನಾಗಬೇಕು?',
    showHintLabel: 'ಸುಳಿವು ಬೇಕೇ?',
    whyDidThisHappenLabel: 'ಹೀಗೆ ಏಕೆ ಆಯಿತು?',
    openSimulationBtn: 'ಸಂವಾದಾತ್ಮಕ ಸಿಮ್ಯುಲೇಶನ್ ತೆರೆಯಿರಿ',
    downloadChapterOfflineBtn: 'ಅಧ್ಯಾಯವನ್ನು ಆಫ್‌ಲೈನ್ ಉಳಿಸಿ',
    savedOfflineChapterLabel: 'ಈ ಸಾಧನದಲ್ಲಿ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
    removeOfflineBtn: 'ತೆಗೆದುಹಾಕಿ',
    curriculumSourceLabel: 'ಪಠ್ಯಕ್ರಮದ ಮೂಲ',
    contentBeingAddedTitle: 'ವಿಷಯವನ್ನು ಸೇರಿಸಲಾಗುತ್ತಿದೆ / ಬೇರೆ ಮಂಡಳಿ ಆಯ್ಕೆಮಾಡಿ',
    contentBeingAddedDesc:
      'ಈ ತರಗತಿ, ಮಂಡಳಿ ಅಥವಾ ವರ್ಷದ ಅಧ್ಯಾಯ ಪಟ್ಟಿಯನ್ನು ಇನ್ನೂ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ. ಪರಿಶೀಲಿಸದ ಪಟ್ಟಿಗಳನ್ನು ನಾವು ತೋರಿಸುವುದಿಲ್ಲ.',
    tryClass8CbseBtn: 'ಪರಿಶೀಲಿಸಿದ ತರಗತಿ 8 · CBSE (2025–26 Curiosity) ನೋಡಿ',
    openGeneralPhysicsBtn: 'ಸಾಮಾನ್ಯ ಭೌತಶಾಸ್ತ್ರ ಲ್ಯಾಬ್ ತೆರೆಯಿರಿ',
    requestBoardNoteLabel: 'ಈ ತರಗತಿ ಮತ್ತು ಮಂಡಳಿಯನ್ನು ವಿನಂತಿಸಿ',
    requestedBoardSavedMsg: 'ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
    menuMyLearning: 'ನನ್ನ ಕಲಿಕೆ (ಪಠ್ಯಕ್ರಮ)',
    menuExperimentLibrary: 'ಪ್ರಯೋಗ ಗ್ರಂಥಾಲಯ',
  },
};
