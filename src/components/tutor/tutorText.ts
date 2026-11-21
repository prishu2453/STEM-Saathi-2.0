import type { Language } from '../../types/stem';

type L3 = Record<Language, string>;

export const TT = {
  title: { en: 'Smart Practice', hi: 'स्मार्ट अभ्यास', kn: 'ಸ್ಮಾರ್ಟ್ ಅಭ್ಯಾಸ' },
  subtitle: {
    en: 'An AI tutor that tracks what you understand, concept by concept, for CBSE Class 10 Physics.',
    hi: 'एक AI ट्यूटर जो CBSE कक्षा 10 भौतिकी में हर संकल्पना की आपकी समझ पर नज़र रखता है।',
    kn: 'CBSE 10ನೇ ತರಗತಿ ಭೌತಶಾಸ್ತ್ರದಲ್ಲಿ ಪ್ರತಿಯೊಂದು ಪರಿಕಲ್ಪನೆಯ ನಿಮ್ಮ ತಿಳುವಳಿಕೆಯನ್ನು ಗಮನಿಸುವ AI ಶಿಕ್ಷಕ.',
  },
  tabMap: { en: 'My concept map', hi: 'मेरा संकल्पना मानचित्र', kn: 'ನನ್ನ ಪರಿಕಲ್ಪನಾ ನಕ್ಷೆ' },
  tabDiagnostic: { en: 'Diagnostic test', hi: 'निदान परीक्षा', kn: 'ರೋಗನಿರ್ಣಯ ಪರೀಕ್ಷೆ' },
  tabPractice: { en: 'Practice', hi: 'अभ्यास', kn: 'ಅಭ್ಯಾಸ' },
  tabReview: { en: 'Review due', hi: 'आज का दोहराव', kn: 'ಪುನರಾವರ್ತನೆ' },
  tabClass: { en: 'Join class', hi: 'कक्षा से जुड़ें', kn: 'ತರಗತಿ ಸೇರಿ' },
  overall: { en: 'Overall mastery', hi: 'कुल महारत', kn: 'ಒಟ್ಟು ಪ್ರಾವೀಣ್ಯ' },
  mastered: { en: 'Mastered', hi: 'महारत', kn: 'ಕಲಿತವು' },
  gaps: { en: 'Gaps', hi: 'कमज़ोर', kn: 'ಕೊರತೆಗಳು' },
  due: { en: 'Due for review', hi: 'दोहराना है', kn: 'ಪುನರಾವರ್ತನೆ ಬಾಕಿ' },
  unseen: { en: 'Not tested yet', hi: 'अभी जाँचा नहीं', kn: 'ಇನ್ನೂ ಪರೀಕ್ಷಿಸಿಲ್ಲ' },
  learning: { en: 'Learning', hi: 'सीख रहे हैं', kn: 'ಕಲಿಯುತ್ತಿದ್ದೀರಿ' },
  gap: { en: 'Gap', hi: 'कमज़ोर', kn: 'ಕೊರತೆ' },
  inferred: { en: 'estimated from related answers', hi: 'संबंधित उत्तरों से अनुमान', kn: 'ಸಂಬಂಧಿತ ಉತ್ತರಗಳಿಂದ ಅಂದಾಜು' },
  startDiag: { en: 'Start the 12-question diagnostic', hi: '12 प्रश्नों की निदान परीक्षा शुरू करें', kn: '12 ಪ್ರಶ್ನೆಗಳ ರೋಗನಿರ್ಣಯ ಆರಂಭಿಸಿ' },
  diagIntro: {
    en: 'Each question is chosen from your previous answers, using the concept map: get an advanced idea right and we credit its foundations; miss a foundation and we check what depends on it. About 12 questions place you on all 24 concepts. No hints during the test.',
    hi: 'हर प्रश्न आपके पिछले उत्तरों और संकल्पना मानचित्र के आधार पर चुना जाता है। लगभग 12 प्रश्नों में सभी 24 संकल्पनाओं का अनुमान लग जाता है। परीक्षा के दौरान संकेत नहीं मिलेंगे।',
    kn: 'ಪ್ರತಿ ಪ್ರಶ್ನೆಯನ್ನು ನಿಮ್ಮ ಹಿಂದಿನ ಉತ್ತರಗಳು ಮತ್ತು ಪರಿಕಲ್ಪನಾ ನಕ್ಷೆಯ ಆಧಾರದಲ್ಲಿ ಆರಿಸಲಾಗುತ್ತದೆ. ಸುಮಾರು 12 ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಎಲ್ಲಾ 24 ಪರಿಕಲ್ಪನೆಗಳ ಅಂದಾಜು ಸಿಗುತ್ತದೆ. ಪರೀಕ್ಷೆಯ ವೇಳೆ ಸುಳಿವುಗಳಿಲ್ಲ.',
  },
  retakeDiag: { en: 'Retake diagnostic', hi: 'निदान परीक्षा फिर से', kn: 'ರೋಗನಿರ್ಣಯ ಮತ್ತೆ' },
  diagDone: { en: 'Diagnostic complete', hi: 'निदान परीक्षा पूरी', kn: 'ರೋಗನಿರ್ಣಯ ಪೂರ್ಣ' },
  diagDoneBody: {
    en: 'Your concept map is ready. Practice now picks your weakest concepts that you are ready for.',
    hi: 'आपका संकल्पना मानचित्र तैयार है। अब अभ्यास आपकी सबसे कमज़ोर संकल्पनाएँ चुनेगा।',
    kn: 'ನಿಮ್ಮ ಪರಿಕಲ್ಪನಾ ನಕ್ಷೆ ಸಿದ್ಧ. ಈಗ ಅಭ್ಯಾಸವು ನಿಮ್ಮ ದುರ್ಬಲ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಆರಿಸುತ್ತದೆ.',
  },
  practiceIntro: {
    en: 'Ten questions picked for you: weak concepts whose foundations you already have, reviews that are due, and ideas you got wrong before. Each question is pitched so you get about 7 in 10 right. When you finish the bank questions on a concept, the AI writes new ones at your level.',
    hi: 'आपके लिए चुने गए दस प्रश्न: कमज़ोर संकल्पनाएँ जिनकी नींव तैयार है, दोहराव, और पहले की गलत धारणाएँ। हर प्रश्न ऐसा कि लगभग 10 में से 7 सही हों। बैंक के प्रश्न खत्म होने पर AI नए प्रश्न बनाता है।',
    kn: 'ನಿಮಗಾಗಿ ಆರಿಸಿದ ಹತ್ತು ಪ್ರಶ್ನೆಗಳು: ಅಡಿಪಾಯ ಸಿದ್ಧವಿರುವ ದುರ್ಬಲ ಪರಿಕಲ್ಪನೆಗಳು, ಬಾಕಿ ಪುನರಾವರ್ತನೆಗಳು ಮತ್ತು ಹಿಂದಿನ ತಪ್ಪುಕಲ್ಪನೆಗಳು. ಸುಮಾರು 10ರಲ್ಲಿ 7 ಸರಿಯಾಗುವಂತೆ ಮಟ್ಟ. ಬ್ಯಾಂಕ್ ಪ್ರಶ್ನೆಗಳು ಮುಗಿದಾಗ AI ಹೊಸವನ್ನು ಬರೆಯುತ್ತದೆ.',
  },
  question: { en: 'Question', hi: 'प्रश्न', kn: 'ಪ್ರಶ್ನೆ' },
  of: { en: 'of', hi: 'में से', kn: 'ರಲ್ಲಿ' },
  reasoningLabel: { en: 'How did you get your answer? (helps find the real mistake)', hi: 'आपने उत्तर कैसे निकाला? (असली गलती खोजने में मदद करता है)', kn: 'ನೀವು ಉತ್ತರ ಹೇಗೆ ಪಡೆದಿರಿ? (ನಿಜವಾದ ತಪ್ಪು ಹುಡುಕಲು ಸಹಾಯ)' },
  reasoningPh: { en: 'e.g. I used R = V/I, so …', hi: 'जैसे: मैंने R = V/I लिया, तो …', kn: 'ಉದಾ: ನಾನು R = V/I ಬಳಸಿದೆ, ಆದ್ದರಿಂದ …' },
  submit: { en: 'Check answer', hi: 'उत्तर जाँचें', kn: 'ಉತ್ತರ ಪರಿಶೀಲಿಸಿ' },
  whyTitle: { en: 'Not quite. Before the answer: why did you choose this?', hi: 'सही नहीं। उत्तर से पहले: आपने यह क्यों चुना?', kn: 'ಸರಿಯಿಲ್ಲ. ಉತ್ತರಕ್ಕೂ ಮೊದಲು: ನೀವು ಇದನ್ನು ಏಕೆ ಆರಿಸಿದಿರಿ?' },
  whyBody: {
    en: 'One sentence is enough. Your reasoning tells us which idea needs fixing, not just that the answer was wrong.',
    hi: 'एक वाक्य काफ़ी है। आपके तर्क से पता चलता है कि कौन-सी समझ ठीक करनी है।',
    kn: 'ಒಂದು ವಾಕ್ಯ ಸಾಕು. ಯಾವ ಕಲ್ಪನೆಯನ್ನು ಸರಿಪಡಿಸಬೇಕು ಎಂದು ನಿಮ್ಮ ತರ್ಕ ತಿಳಿಸುತ್ತದೆ.',
  },
  checkReasoning: { en: 'Check my reasoning', hi: 'मेरा तर्क जाँचें', kn: 'ನನ್ನ ತರ್ಕ ಪರಿಶೀಲಿಸಿ' },
  skip: { en: 'Skip', hi: 'छोड़ें', kn: 'ಬಿಡಿ' },
  correct: { en: 'Correct!', hi: 'सही!', kn: 'ಸರಿ!' },
  wrong: { en: 'Not correct', hi: 'गलत', kn: 'ತಪ್ಪು' },
  answerIs: { en: 'Correct answer', hi: 'सही उत्तर', kn: 'ಸರಿಯಾದ ಉತ್ತರ' },
  fromOption: { en: 'What your choice suggests', hi: 'आपके चुनाव से क्या पता चलता है', kn: 'ನಿಮ್ಮ ಆಯ್ಕೆ ಏನು ತೋರಿಸುತ್ತದೆ' },
  fromReasoning: { en: 'What your reasoning shows', hi: 'आपका तर्क क्या दिखाता है', kn: 'ನಿಮ್ಮ ತರ್ಕ ಏನು ತೋರಿಸುತ್ತದೆ' },
  checking: { en: 'Reading your reasoning…', hi: 'आपका तर्क पढ़ रहे हैं…', kn: 'ನಿಮ್ಮ ತರ್ಕ ಓದುತ್ತಿದ್ದೇವೆ…' },
  soundReasoning: { en: 'Your reasoning is sound.', hi: 'आपका तर्क सही है।', kn: 'ನಿಮ್ಮ ತರ್ಕ ಸರಿಯಾಗಿದೆ.' },
  offlineMatch: { en: 'Matched on your words (offline check)', hi: 'आपके शब्दों से मिलान (ऑफ़लाइन जाँच)', kn: 'ನಿಮ್ಮ ಪದಗಳ ಹೊಂದಾಣಿಕೆ (ಆಫ್‌ಲೈನ್)' },
  noMatch: { en: 'No known misconception found in your words.', hi: 'आपके शब्दों में कोई ज्ञात गलत धारणा नहीं मिली।', kn: 'ನಿಮ್ಮ ಪದಗಳಲ್ಲಿ ತಿಳಿದ ತಪ್ಪುಕಲ್ಪನೆ ಸಿಗಲಿಲ್ಲ.' },
  masteryChange: { en: 'Mastery', hi: 'महारत', kn: 'ಪ್ರಾವೀಣ್ಯ' },
  next: { en: 'Next question', hi: 'अगला प्रश्न', kn: 'ಮುಂದಿನ ಪ್ರಶ್ನೆ' },
  finish: { en: 'See my map', hi: 'मेरा मानचित्र देखें', kn: 'ನನ್ನ ನಕ್ಷೆ ನೋಡಿ' },
  stop: { en: 'Stop', hi: 'रोकें', kn: 'ನಿಲ್ಲಿಸಿ' },
  generating: { en: 'You have done every question on this concept. The AI is writing a new one at your level and double-checking its answer…', hi: 'इस संकल्पना के सभी प्रश्न हो गए। AI आपके स्तर का नया प्रश्न बना रहा है…', kn: 'ಈ ಪರಿಕಲ್ಪನೆಯ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳು ಮುಗಿದಿವೆ. AI ನಿಮ್ಮ ಮಟ್ಟದ ಹೊಸ ಪ್ರಶ್ನೆ ಬರೆಯುತ್ತಿದೆ…' },
  aiQuestion: { en: 'AI-generated · answer double-checked', hi: 'AI द्वारा बनाया · उत्तर दो बार जाँचा', kn: 'AI ರಚಿತ · ಉತ್ತರ ಎರಡು ಬಾರಿ ಪರಿಶೀಲಿತ' },
  newAi: { en: 'New AI question on this concept', hi: 'इस संकल्पना पर नया AI प्रश्न', kn: 'ಈ ಪರಿಕಲ್ಪನೆಯ ಹೊಸ AI ಪ್ರಶ್ನೆ' },
  why_review: { en: 'Due for review: you would start forgetting it soon', hi: 'दोहराने का समय: जल्द भूलने लगेंगे', kn: 'ಪುನರಾವರ್ತನೆ ಸಮಯ: ಶೀಘ್ರ ಮರೆಯಬಹುದು' },
  why_weak: { en: 'One of your weakest concepts that you are ready for', hi: 'आपकी कमज़ोर संकल्पना, जिसके लिए आप तैयार हैं', kn: 'ನೀವು ಸಿದ್ಧರಿರುವ ದುರ್ಬಲ ಪರಿಕಲ್ಪನೆ' },
  why_misconception: { en: 'You showed a misconception here, so we are checking it again', hi: 'यहाँ एक गलत धारणा दिखी थी, फिर से जाँच रहे हैं', kn: 'ಇಲ್ಲಿ ತಪ್ಪುಕಲ್ಪನೆ ಕಂಡಿತ್ತು, ಮತ್ತೆ ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ' },
  why_new: { en: 'New concept: its prerequisites look solid', hi: 'नई संकल्पना: इसकी नींव मज़बूत है', kn: 'ಹೊಸ ಪರಿಕಲ್ಪನೆ: ಅದರ ಅಡಿಪಾಯ ಗಟ್ಟಿಯಾಗಿದೆ' },
  why_stretch: { en: 'Stretch question', hi: 'चुनौती प्रश्न', kn: 'ಸವಾಲಿನ ಪ್ರಶ್ನೆ' },
  redirected: { en: 'first: it is a prerequisite you have not mastered yet for', hi: 'पहले: यह इसकी नींव है जो अभी कमज़ोर है —', kn: 'ಮೊದಲು: ಇದು ಇನ್ನೂ ಕಲಿಯದ ಅಡಿಪಾಯ —' },
  practiseThis: { en: 'Practise this concept', hi: 'इस संकल्पना का अभ्यास करें', kn: 'ಈ ಪರಿಕಲ್ಪನೆ ಅಭ್ಯಾಸ ಮಾಡಿ' },
  watchStory: { en: 'Watch the 3D story', hi: '3D कहानी देखें', kn: '3D ಕಥೆ ನೋಡಿ' },
  stuckStory: { en: 'Still confusing? Watch the 3D story for this concept', hi: 'अब भी उलझन? इस संकल्पना की 3D कहानी देखें', kn: 'ಇನ್ನೂ ಗೊಂದಲವೇ? ಈ ಪರಿಕಲ್ಪನೆಯ 3D ಕಥೆ ನೋಡಿ' },
  prereqs: { en: 'Builds on', hi: 'इन पर आधारित', kn: 'ಇವುಗಳ ಮೇಲೆ ನಿಂತಿದೆ' },
  attempts: { en: 'Answers', hi: 'उत्तर', kn: 'ಉತ್ತರಗಳು' },
  accuracy: { en: 'Correct', hi: 'सही', kn: 'ಸರಿ' },
  nextReview: { en: 'Next review', hi: 'अगला दोहराव', kn: 'ಮುಂದಿನ ಪುನರಾವರ್ತನೆ' },
  seenMis: { en: 'Misconceptions seen', hi: 'देखी गई गलत धारणाएँ', kn: 'ಕಂಡ ತಪ್ಪುಕಲ್ಪನೆಗಳು' },
  topMis: { en: 'Your wrong ideas to fix', hi: 'ठीक करने वाली गलत धारणाएँ', kn: 'ಸರಿಪಡಿಸಬೇಕಾದ ತಪ್ಪುಕಲ್ಪನೆಗಳು' },
  nothingDue: { en: 'Nothing is due right now. The next review is', hi: 'अभी कुछ दोहराना नहीं है। अगला दोहराव', kn: 'ಈಗ ಏನೂ ಬಾಕಿ ಇಲ್ಲ. ಮುಂದಿನ ಪುನರಾವರ್ತನೆ' },
  nothingYet: { en: 'Answer some questions first; reviews are scheduled from your answers.', hi: 'पहले कुछ प्रश्न हल करें; दोहराव उत्तरों से तय होता है।', kn: 'ಮೊದಲು ಕೆಲವು ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ.' },
  startReview: { en: 'Start review', hi: 'दोहराव शुरू करें', kn: 'ಪುನರಾವರ್ತನೆ ಆರಂಭಿಸಿ' },
  schedule: { en: 'Review schedule', hi: 'दोहराव समय-सारणी', kn: 'ಪುನರಾವರ್ತನೆ ವೇಳಾಪಟ್ಟಿ' },
  srExplain: {
    en: 'Each concept comes back just before you would forget it. Every time you recall it correctly after a gap, the next gap gets longer (about 1 day, then 3, 7, 17…). A wrong answer brings it back the same day.',
    hi: 'हर संकल्पना भूलने से ठीक पहले वापस आती है। हर सही याद के बाद अगला अंतराल लंबा होता है (लगभग 1, 3, 7, 17 दिन…)। गलत उत्तर पर उसी दिन फिर आती है।',
    kn: 'ಪ್ರತಿ ಪರಿಕಲ್ಪನೆ ಮರೆಯುವ ಮುನ್ನವೇ ಮರಳುತ್ತದೆ. ಸರಿಯಾಗಿ ನೆನಪಿಸಿಕೊಂಡಾಗ ಮುಂದಿನ ಅಂತರ ಹೆಚ್ಚುತ್ತದೆ (ಸುಮಾರು 1, 3, 7, 17 ದಿನ…). ತಪ್ಪು ಉತ್ತರ ಅದೇ ದಿನ ಮರಳಿ ತರುತ್ತದೆ.',
  },
  now: { en: 'now', hi: 'अभी', kn: 'ಈಗ' },
  joinTitle: { en: 'Share your progress with your teacher', hi: 'अपनी प्रगति शिक्षक से साझा करें', kn: 'ನಿಮ್ಮ ಪ್ರಗತಿಯನ್ನು ಶಿಕ್ಷಕರೊಂದಿಗೆ ಹಂಚಿ' },
  joinBody: {
    en: 'Enter the class code your teacher gives you. Your concept mastery and the wrong ideas found in your answers will be visible to that teacher. You must be logged in so it reaches them.',
    hi: 'शिक्षक का दिया कक्षा कोड डालें। आपकी महारत और उत्तरों में मिली गलत धारणाएँ उस शिक्षक को दिखेंगी। इसके लिए लॉग इन होना ज़रूरी है।',
    kn: 'ಶಿಕ್ಷಕರು ನೀಡಿದ ತರಗತಿ ಕೋಡ್ ನಮೂದಿಸಿ. ನಿಮ್ಮ ಪ್ರಾವೀಣ್ಯ ಮತ್ತು ತಪ್ಪುಕಲ್ಪನೆಗಳು ಆ ಶಿಕ್ಷಕರಿಗೆ ಕಾಣುತ್ತವೆ. ಇದಕ್ಕೆ ಲಾಗಿನ್ ಆಗಿರಬೇಕು.',
  },
  classCode: { en: 'Class code', hi: 'कक्षा कोड', kn: 'ತರಗತಿ ಕೋಡ್' },
  join: { en: 'Join', hi: 'जुड़ें', kn: 'ಸೇರಿ' },
  leave: { en: 'Leave class', hi: 'कक्षा छोड़ें', kn: 'ತರಗತಿ ಬಿಡಿ' },
  joined: { en: 'You are in class', hi: 'आप इस कक्षा में हैं', kn: 'ನೀವು ಈ ತರಗತಿಯಲ್ಲಿದ್ದೀರಿ' },
  needLogin: { en: 'You are not logged in, so your teacher cannot see your progress yet.', hi: 'आप लॉग इन नहीं हैं, इसलिए शिक्षक अभी आपकी प्रगति नहीं देख सकते।', kn: 'ನೀವು ಲಾಗಿನ್ ಆಗಿಲ್ಲ, ಶಿಕ್ಷಕರು ಇನ್ನೂ ನಿಮ್ಮ ಪ್ರಗತಿ ನೋಡಲಾರರು.' },
  logIn: { en: 'Log in', hi: 'लॉग इन', kn: 'ಲಾಗಿನ್' },
  teacherLink: { en: 'Are you a teacher? Open the class dashboard', hi: 'क्या आप शिक्षक हैं? कक्षा डैशबोर्ड खोलें', kn: 'ನೀವು ಶಿಕ್ಷಕರೇ? ತರಗತಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ' },
  englishOnly: { en: '', hi: 'बैंक के प्रश्न अंग्रेज़ी में हैं; AI से नए प्रश्न हिंदी में बनते हैं।', kn: 'ಬ್ಯಾಂಕ್ ಪ್ರಶ್ನೆಗಳು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿವೆ; AI ಹೊಸ ಪ್ರಶ್ನೆಗಳನ್ನು ಕನ್ನಡದಲ್ಲಿ ರಚಿಸುತ್ತದೆ.' },
  reset: { en: 'Reset my tutor data', hi: 'मेरा ट्यूटर डेटा हटाएँ', kn: 'ನನ್ನ ಶಿಕ್ಷಕ ಡೇಟಾ ಅಳಿಸಿ' },
  resetConfirm: { en: 'Delete all Smart Practice progress on this device?', hi: 'इस डिवाइस से सारी स्मार्ट अभ्यास प्रगति हटाएँ?', kn: 'ಈ ಸಾಧನದ ಎಲ್ಲಾ ಸ್ಮಾರ್ಟ್ ಅಭ್ಯಾಸ ಪ್ರಗತಿ ಅಳಿಸುವುದೇ?' },
} satisfies Record<string, L3>;

export type TKey = keyof typeof TT;
export const tt = (k: TKey, lang: Language) => TT[k][lang] || TT[k].en;

export const STATUS_COLOR = {
  unseen: '#A59BC4',
  gap: '#E5484D',
  learning: '#F59E0B',
  mastered: '#12A150',
} as const;

export const pct = (x: number) => `${Math.round(x * 100)}%`;

export function relTime(ms: number, lang: Language) {
  const d = ms - Date.now();
  if (d <= 0) return tt('now', lang);
  const h = d / 3_600_000;
  const fmt = new Intl.RelativeTimeFormat(lang === 'en' ? 'en-IN' : lang, { numeric: 'auto' });
  if (h < 1) return fmt.format(Math.max(1, Math.round(d / 60_000)), 'minute');
  if (h < 36) return fmt.format(Math.round(h), 'hour');
  return fmt.format(Math.round(h / 24), 'day');
}
