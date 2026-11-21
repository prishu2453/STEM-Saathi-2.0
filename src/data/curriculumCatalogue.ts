import { findBoardRecord } from '../../shared/syllabus';
import type { ExperimentId } from './physicsExperiments';
import type {
  AcademicSession,
  ActivityModeFilter,
  CurriculumSubjectFilter,
  EducationBoard,
  ExperimentRelationType,
  Language,
  LearningPathPreference,
  PartialLocalizedList,
  PartialLocalizedText,
  SchoolClass,
  SupportingWorldId,
} from '../types/stem';

export interface CurriculumObservationTable {
  columns: PartialLocalizedList;
  sampleRows: string[][];
}

export interface CurriculumExperiment {
  id: string;
  relationType: ExperimentRelationType;
  activityMode: Exclude<ActivityModeFilter, 'all' | 'offline-saved'>;
  linkedSimExperiment?: ExperimentId;
  linkedSupportingWorld?: SupportingWorldId;
  title: PartialLocalizedText;
  objective: PartialLocalizedText;
  materials: PartialLocalizedList;
  safetyNote: PartialLocalizedText;
  steps: PartialLocalizedList;
  observationTable: CurriculumObservationTable;
  predictionQuestion: PartialLocalizedText;
  predictionOptions: PartialLocalizedList;
  predictionCorrectIndex: number;
  hints: PartialLocalizedList;
  whyItHappens: PartialLocalizedText;
}

export interface CurriculumChapter {
  id: string;
  chapterNumber: number;
  title: PartialLocalizedText;
  primarySubject: CurriculumSubjectFilter;
  topicTag: PartialLocalizedText;
  textbookName: string;
  conceptSummary: PartialLocalizedText;
  experiments: CurriculumExperiment[];
}

export interface SyllabusCatalogueEntry {
  id: string;
  board: EducationBoard;
  stateName?: string;
  classLevel: SchoolClass;
  session: AcademicSession;
  verificationStatus: 'verified-sample' | 'unverified-pending';
  bookTitle: string;
  coverageNote: PartialLocalizedText;
  sourceTitle: string;
  sourceUrl: string;
  secondarySourceTitle?: string;
  secondarySourceUrl?: string;
  lastVerified: string;
  chapters: CurriculumChapter[];
}

export {
  SCHOOL_CLASSES,
  EDUCATION_BOARDS,
  STATE_BOARD_STATES,
  ACADEMIC_SESSIONS,
  DEFAULT_LEARNING_PATH,
  resolveLocalizedText,
  resolveLocalizedList,
  getCurriculumPackId,
  formatLearningPathSummary,
} from './learningPathCore';
import { EDUCATION_BOARDS, resolveLocalizedText, resolveLocalizedList } from './learningPathCore';

export const SYLLABUS_CATALOGUES: SyllabusCatalogueEntry[] = [
  {
    id: 'cbse-class-8-2025-26',
    board: 'cbse',
    classLevel: 8,
    session: '2025-26',
    verificationStatus: 'verified-sample',
    bookTitle: 'Curiosity — Class 8 Science (NCERT 2025–26)',
    coverageNote: {
      en: 'Verified sample path: all 13 chapters of the new NCERT Class 8 Science ("Curiosity") textbook introduced for 2025–26, mapped to hands-on home experiments and existing Gyaan Graph simulations. Mathematics chapter list is still being added.',
      hi: 'सत्यापित नमूना पथ: 2025–26 के लिए जारी नई NCERT कक्षा 8 विज्ञान ("Curiosity") पाठ्यपुस्तक के सभी 13 अध्याय, जिन्हें घर के सुरक्षित प्रयोगों और Gyaan Graph सिमुलेशन से जोड़ा गया है। गणित के अध्याय अभी जोड़े जा रहे हैं।',
      kn: 'ಪರಿಶೀಲಿಸಿದ ಮಾದರಿ ಮಾರ್ಗ: 2025–26ಕ್ಕೆ ಪರಿಚಯಿಸಲಾದ ಹೊಸ NCERT ತರಗತಿ 8 ವಿಜ್ಞಾನ ("Curiosity") ಪಠ್ಯಪುಸ್ತಕದ ಎಲ್ಲಾ 13 ಅಧ್ಯಾಯಗಳು. ಗಣಿತ ಅಧ್ಯಾಯಗಳನ್ನು ಇನ್ನೂ ಸೇರಿಸಲಾಗುತ್ತಿದೆ.',
    },
    sourceTitle: 'CBSE Academic Circular Acad-48/2025 (New NCERT Class 8 Curiosity)',
    sourceUrl: 'https://cbseacademic.nic.in/web_material/Circulars/2025/48_Circular_2025.pdf',
    secondarySourceTitle: 'NCERT Class 8 Curiosity Textbook Catalogue',
    secondarySourceUrl: 'https://ncert.nic.in/textbook.php?hecu1=0-12',
    lastVerified: '2025–26 academic session',
    chapters: [
      {
        id: 'curiosity-ch01',
        chapterNumber: 1,
        title: {
          en: 'Exploring the Investigative World of Science',
          hi: 'विज्ञान की खोजी दुनिया की सैर',
          kn: 'ವಿಜ್ಞಾನದ ಅನ್ವೇಷಣಾ ಲೋಕದ ಪರಿಚಯ',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Scientific Inquiry & Fair Testing',
          hi: 'वैज्ञानिक खोज और निष्पक्ष परीक्षण',
          kn: 'ವೈಜ್ಞಾನಿಕ ಅನ್ವೇಷಣೆ ಮತ್ತು ಪರೀಕ್ಷೆ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Science starts by asking careful "why" and "how" questions, changing one variable at a time (a fair test), and writing clear observations with units.',
          hi: 'विज्ञान ध्यान से "क्यों" और "कैसे" पूछने, एक समय में केवल एक चर बदलने (निष्पक्ष परीक्षण), और मात्रकों के साथ साफ अवलोकन लिखने से शुरू होता है।',
          kn: 'ವಿಜ್ಞಾನವು "ಏಕೆ" ಮತ್ತು "ಹೇಗೆ" ಎಂದು ಕೇಳುವುದು, ಒಂದೇ ಬಾರಿಗೆ ಒಂದು ಅಂಶವನ್ನು ಮಾತ್ರ ಬದಲಾಯಿಸಿ ಪರೀಕ್ಷಿಸುವುದು ಮತ್ತು ಸರಿಯಾದ ಘಟಕಗಳೊಂದಿಗೆ ದಾಖಲಿಸುವುದರಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch01-pendulum',
            relationType: 'related-activity',
            activityMode: 'home-safe',
            linkedSimExperiment: 'mechanics',
            title: {
              en: 'Fair Test at Home: Simple String & Coin Pendulum',
              hi: 'घर पर निष्पक्ष परीक्षण: धागे और सिक्के का पेंडुलम',
              kn: 'ಮನೆಯಲ್ಲಿ ಸರಳ ಪರೀಕ್ಷೆ: ದಾರ ಮತ್ತು ನಾಣ್ಯದ ಲೋಲಕ',
            },
            objective: {
              en: 'Test whether changing string length (cm) changes the time (s) for 10 swings while keeping coin weight the same.',
              hi: 'जाँचें कि सिक्के का भार समान रखते हुए धागे की लंबाई (cm) बदलने से 10 दोलनों का समय (s) बदलता है या नहीं।',
              kn: 'ನಾಣ್ಯದ ತೂಕವನ್ನು ಸ್ಥಿರವಾಗಿಟ್ಟು, ದಾರದ ಉದ್ದವನ್ನು (cm) ಬದಲಾಯಿಸಿದರೆ 10 ತೂಗುಯ್ಯಾಲೆಗಳ ಸಮಯ (s) ಬದಲಾಗುತ್ತದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ.',
            },
            materials: {
              en: ['Cotton thread (60 cm)', '1 coin or metal washer', 'Tape', 'Ruler (cm)', 'Phone stopwatch (s)'],
              hi: ['सूती धागा (60 cm)', '1 सिक्का या वॉशर', 'टेप', 'पैमाना (cm)', 'फोन स्टॉपवॉच (s)'],
              kn: ['ಹತ್ತಿ ದಾರ (60 cm)', '1 ನಾಣ್ಯ ಅಥವಾ ವಾಷರ್', 'ಟೇಪ್', 'ಅಳತೆ ಪಟ್ಟಿ (cm)', 'ಫೋನ್ ಸ್ಟಾಪ್‌ವಾಚ್ (s)'],
            },
            safetyNote: {
              en: 'Tie the coin tightly with tape so it does not slip while swinging. Keep clear of faces and glass.',
              hi: 'सिक्के को टेप से कसकर बाँधें ताकि झूलते समय वह फिसले नहीं। काँच और आँखों से दूरी रखें।',
              kn: 'ನಾಣ್ಯವು ಜಾರಿಹೋಗದಂತೆ ಟೇಪ್‌ನಿಂದ ಗಟ್ಟಿಯಾಗಿ ಕಟ್ಟಿ. ಗಾಜಿನ ವಸ್ತುಗಳು ಮತ್ತು ಮುಖದಿಂದ ದೂರವಿರಿ.',
            },
            steps: {
              en: [
                'Tie the coin to a 25 cm thread and tape the top to a table edge.',
                'Pull the coin gently sideways by 5 cm, release without pushing, and time 10 full swings in seconds (s).',
                'Shorten or lengthen the thread to 50 cm using the same coin, and time 10 swings again.',
                'Divide each time by 10 to compare the time for 1 swing (time period T in s).',
              ],
              hi: [
                'सिक्के को 25 cm धागे से बाँधें और ऊपर का सिरा मेज़ के किनारे पर टेप से चिपकाएँ।',
                'सिक्के को धीरे से 5 cm एक तरफ खींचकर बिना धक्का दिए छोड़ें और 10 पूरे दोलनों का समय (s) मापें।',
                'उसी सिक्के के साथ धागे की लंबाई 50 cm करें और फिर से 10 दोलनों का समय मापें।',
                'दोनों समय को 10 से भाग देकर 1 दोलन का समय (आवर्तकाल T, s में) तुलना करें।',
              ],
              kn: [
                '25 cm ದಾರಕ್ಕೆ ನಾಣ್ಯವನ್ನು ಕಟ್ಟಿ ಮೇಜಿನ ಅಂಚಿಗೆ ಟೇಪ್‌ನಿಂದ ಅಂಟಿಸಿ.',
                'ನಾಣ್ಯವನ್ನು 5 cm ಪಕ್ಕಕ್ಕೆ ಎಳೆದು ತಳ್ಳದೆ ಬಿಡಿ ಮತ್ತು 10 ಪೂರ್ಣ ಆಂದೋಲನಗಳ ಸಮಯವನ್ನು (s) ಅಳೆಯಿರಿ.',
                'ಅದೇ ನಾಣ್ಯದೊಂದಿಗೆ ದಾರದ ಉದ್ದವನ್ನು 50 cm ಗೆ ಬದಲಾಯಿಸಿ ಮತ್ತೆ 10 ಆಂದೋಲನಗಳ ಸಮಯವನ್ನು ಅಳೆಯಿರಿ.',
                'ಪ್ರತಿ ಸಮಯವನ್ನು 10ರಿಂದ ಭಾಗಿಸಿ 1 ಆಂದೋಲನದ ಸಮಯವನ್ನು (T, ಸೆಕೆಂಡುಗಳಲ್ಲಿ) ಹೋಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Trial', 'Thread Length (cm)', 'Time for 10 swings (s)', 'Time for 1 swing (s)'],
                hi: ['प्रयास', 'धागे की लंबाई (cm)', '10 दोलनों का समय (s)', '1 दोलन का समय (s)'],
                kn: ['ಪ್ರಯತ್ನ', 'ದಾರದ ಉದ್ದ (cm)', '10 ಆಂದೋಲನಗಳ ಸಮಯ (s)', '1 ಆಂದೋಲನದ ಸಮಯ (s)'],
              },
              sampleRows: [
                ['1', '25 cm', '10.0 s', '1.00 s'],
                ['2', '50 cm', '14.2 s', '1.42 s'],
              ],
            },
            predictionQuestion: {
              en: 'What should happen when you make the thread longer (from 25 cm to 50 cm)?',
              hi: 'जब आप धागे को लंबा (25 cm से 50 cm) करेंगे तो क्या होना चाहिए?',
              kn: 'ದಾರವನ್ನು ಉದ್ದ ಮಾಡಿದಾಗ (25 cm ನಿಂದ 50 cm ಗೆ) ಏನಾಗಬೇಕು?',
            },
            predictionOptions: {
              en: [
                'Each swing becomes slower (takes more time)',
                'Each swing becomes much faster',
                'The time stays exactly the same',
              ],
              hi: [
                'प्रत्येक दोलन धीमा हो जाएगा (अधिक समय लगेगा)',
                'प्रत्येक दोलन बहुत तेज़ हो जाएगा',
                'समय बिल्कुल वही रहेगा',
              ],
              kn: [
                'ಪ್ರತಿ ಆಂದೋಲನ ನಿಧಾನವಾಗುತ್ತದೆ (ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ)',
                'ಪ್ರತಿ ಆಂದೋಲನ ಬಹಳ ವೇಗವಾಗುತ್ತದೆ',
                'ಸಮಯವು ನಿಖರವಾಗಿ ಒಂದೇ ಇರುತ್ತದೆ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Think about a tall playground swing vs a short swing.',
                'A longer string travels along a wider arc under the same gravity g.',
              ],
              hi: [
                'बड़े झूले और छोटे झूले की गति के बारे में सोचें।',
                'लंबा धागा समान गुरुत्व g के साथ बड़े चाप में झूलता है, इसलिए एक चक्कर में ज़्यादा समय लगता है।',
              ],
              kn: [
                'ಉದ್ದದ ಜೋಕಾಲಿ ಮತ್ತು ಚಿಕ್ಕ ಜೋಕಾಲಿಯ ವೇಗವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ.',
                'ಉದ್ದವಾದ ದಾರವು ಒಂದೇ ಗುರುತ್ವಾಕರ್ಷಣೆ g ಅಡಿಯಲ್ಲಿ ದೊಡ್ಡ ಕಮಾನಿನಲ್ಲಿ ಚಲಿಸುವುದರಿಂದ ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'In a fair test we changed only the length. A longer string has to swing along a larger path at the same downward pull of gravity, so each swing takes more time.',
              hi: 'इस निष्पक्ष परीक्षण में हमने केवल लंबाई बदली। लंबे धागे को समान गुरुत्वाकर्षण में बड़े रास्ते से गुजरना पड़ता है, इसलिए एक दोलन में अधिक समय लगता है।',
              kn: 'ಈ ಪರೀಕ್ಷೆಯಲ್ಲಿ ನಾವು ಉದ್ದವನ್ನು ಮಾತ್ರ ಬದಲಾಯಿಸಿದ್ದೇವೆ. ಉದ್ದವಾದ ದಾರವು ಅದೇ ಗುರುತ್ವಾಕರ್ಷಣೆಯಲ್ಲಿ ದೊಡ್ಡ ದಾರಿಯನ್ನು ಕ್ರಮಿಸಬೇಕಾದ್ದರಿಂದ ಪ್ರತಿ ಆಂದೋಲನಕ್ಕೆ ಹೆಚ್ಚು ಸಮಯ ಬೇಕಾಗುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch04',
        chapterNumber: 4,
        title: {
          en: 'Electricity: Magnetic and Heating Effects',
          hi: 'विद्युत: चुंबकीय और ऊष्मीय प्रभाव',
          kn: 'ವಿದ್ಯುತ್: ಕಾಂತೀಯ ಮತ್ತು ಉಷ್ಣ ಪರಿಣಾಮಗಳು',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Electric Current, Electromagnets & Heating',
          hi: 'विद्युत धारा, विद्युतचुंबक और ऊष्मण',
          kn: 'ವಿದ್ಯುತ್ ಪ್ರವಾಹ, ವಿದ್ಯುತ್ಕಾಂತ ಮತ್ತು ತಾಪನ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Electric current flowing in a wire warms the conductor (heating effect) and creates a magnetic field around the wire (magnetic effect). Coiling insulated wire around an iron nail makes a temporary electromagnet.',
          hi: 'तार में विद्युत धारा बहने से तार गर्म होता है (ऊष्मीय प्रभाव) और उसके चारों ओर चुंबकीय क्षेत्र बनता है (चुंबकीय प्रभाव)। लोहे की कील पर तार लपेटने से अस्थायी विद्युतचुंबक बनता है।',
          kn: 'ತಂತಿಯಲ್ಲಿ ವಿದ್ಯುತ್ ಪ್ರವಹಿಸಿದಾಗ ತಂತಿ ಬಿಸಿಯಾಗುತ್ತದೆ (ಉಷ್ಣ ಪರಿಣಾಮ) ಮತ್ತು ಅದರ ಸುತ್ತ ಕಾಂತೀಯ ಕ್ಷೇತ್ರ ಉಂಟಾಗುತ್ತದೆ (ಕಾಂತೀಯ ಪರಿಣಾಮ). ಕಬ್ಬಿಣದ ಮೊಳೆಯ ಸುತ್ತ ತಂತಿ ಸುತ್ತಿದರೆ ವಿದ್ಯುತ್ಕಾಂತ ತಯಾರಾಗುತ್ತದೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch04-electromagnet',
            relationType: 'in-chapter',
            activityMode: 'home-safe',
            linkedSimExperiment: 'magnetism',
            title: {
              en: 'Make an Electromagnet with a 1.5 V Cell & Iron Nail',
              hi: '1.5 V सेल और लोहे की कील से विद्युतचुंबक बनाएँ',
              kn: '1.5 V ಸೆಲ್ ಮತ್ತು ಕಬ್ಬಿಣದ ಮೊಳೆಯಿಂದ ವಿದ್ಯುತ್ಕಾಂತ ತಯಾರಿಸಿ',
            },
            objective: {
              en: 'Observe how wrapping more insulated copper wire turns around an iron nail increases how many paper clips it attracts.',
              hi: 'देखें कि लोहे की कील पर ताँबे के तार के फेरे बढ़ाने से वह कितनी अधिक पेपर क्लिप खींचती है।',
              kn: 'ಕಬ್ಬಿಣದ ಮೊಳೆಯ ಮೇಲೆ ತಾಮ್ರದ ತಂತಿಯ ಸುತ್ತುಗಳನ್ನು ಹೆಚ್ಚಿಸಿದಂತೆ ಅದು ಎಷ್ಟು ಹೆಚ್ಚು ಪೇಪರ್ ಕ್ಲಿಪ್‌ಗಳನ್ನು ಆಕರ್ಷಿಸುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ.',
            },
            materials: {
              en: ['1.5 V AA cell (never wall socket)', 'Insulated copper wire (1 m)', '1 iron nail', '8–10 steel paper clips'],
              hi: ['1.5 V AA सेल (कभी दीवार के सॉकेट का उपयोग न करें)', 'ताँबे का इंसुलेटेड तार (1 m)', '1 लोहे की कील', '8–10 स्टील पेपर क्लिप'],
              kn: ['1.5 V AA ಬ್ಯಾಟರಿ (ಎಂದಿಗೂ ಮನೆಯ ವಿದ್ಯುತ್ ಸಾಕೆಟ್ ಬಳಸಬೇಡಿ)', 'ಇನ್ಸುಲೇಟೆಡ್ ತಾಮ್ರದ ತಂತಿ (1 m)', '1 ಕಬ್ಬಿಣದ ಮೊಳೆ', '8–10 ಪೇಪರ್ ಕ್ಲಿಪ್‌ಗಳು'],
            },
            safetyNote: {
              en: 'Use ONLY a 1.5 V dry cell. Disconnect the wire after 5–10 seconds so the wire and cell do not overheat.',
              hi: 'केवल 1.5 V ड्राई सेल का उपयोग करें। तार और सेल गर्म न हों, इसलिए 5–10 सेकंड बाद तार हटा दें।',
              kn: 'ಕೇವಲ 1.5 V ಡ್ರೈ ಸೆಲ್ ಮಾತ್ರ ಬಳಸಿ. ತಂತಿ ಮತ್ತು ಬ್ಯಾಟರಿ ಹೆಚ್ಚು ಬಿಸಿಯಾಗದಂತೆ 5–10 ಸೆಕೆಂಡುಗಳ ನಂತರ ತಂತಿಯನ್ನು ಬೇರ್ಪಡಿಸಿ.',
            },
            steps: {
              en: [
                'Wrap 15 tight turns of insulated wire around the iron nail, leaving free ends stripped.',
                'Connect the ends briefly to the 1.5 V cell and count how many paper clips stick to the nail tip.',
                'Disconnect, wrap 30 turns on the same nail, reconnect briefly, and count paper clips again.',
                'Disconnect and check if the clips fall off once the current stops.',
              ],
              hi: [
                'लोहे की कील पर इंसुलेटेड तार के 15 कसे हुए फेरे लपेटें और दोनों सिरों से आवरण हटाएँ।',
                'दोनों सिरों को थोड़ी देर के लिए 1.5 V सेल से जोड़ें और गिनें कि कील से कितनी पेपर क्लिप चिपकती हैं।',
                'तार हटाकर उसी कील पर 30 फेरे लपेटें, फिर से जोड़ें और क्लिप गिनें।',
                'तार हटाकर देखें कि धारा रुकते ही क्लिप गिरती हैं या नहीं।',
              ],
              kn: [
                'ಕಬ್ಬಿಣದ ಮೊಳೆಯ ಮೇಲೆ ತಾಮ್ರದ ತಂತಿಯನ್ನು 15 ಬಾರಿ ಗಟ್ಟಿಯಾಗಿ ಸುತ್ತಿ ಮತ್ತು ತುದಿಗಳ ಹೊದಿಕೆ ತೆಗೆಯಿರಿ.',
                'ತುದಿಗಳನ್ನು ಸ್ವಲ್ಪ ಸಮಯ 1.5 V ಸೆಲ್‌ಗೆ ಜೋಡಿಸಿ ಮೊಳೆಗೆ ಎಷ್ಟು ಪೇಪರ್ ಕ್ಲಿಪ್‌ಗಳು ಅಂಟಿಕೊಳ್ಳುತ್ತವೆ ಎಂದು ಎಣಿಸಿ.',
                'ತಂತಿ ಬೇರ್ಪಡಿಸಿ ಅದೇ ಮೊಳೆಯ ಮೇಲೆ 30 ಸುತ್ತುಗಳನ್ನು ಸುತ್ತಿ, ಮತ್ತೆ ಜೋಡಿಸಿ ಕ್ಲಿಪ್‌ಗಳನ್ನು ಎಣಿಸಿ.',
                'ವಿದ್ಯುತ್ ನಿಂತ ತಕ್ಷಣ ಕ್ಲಿಪ್‌ಗಳು ಕೆಳಗೆ ಬೀಳುತ್ತವೆಯೇ ಎಂದು ಗಮನಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Test', 'Coil Turns (N)', 'Cell Voltage (V)', 'Clips Picked Up'],
                hi: ['परीक्षण', 'फेरों की संख्या (N)', 'सेल वोल्टेज (V)', 'चिपकी क्लिप'],
                kn: ['ಪರೀಕ್ಷೆ', 'ಸುತ್ತುಗಳ ಸಂಖ್ಯೆ (N)', 'ವೋಲ್ಟೇಜ್ (V)', 'ಅಂಟಿಕೊಂಡ ಕ್ಲಿಪ್‌ಗಳು'],
              },
              sampleRows: [
                ['1', '15 turns', '1.5 V', '2 clips'],
                ['2', '30 turns', '1.5 V', '5 clips'],
                ['3 (Off)', '30 turns', '0 V', '0 clips'],
              ],
            },
            predictionQuestion: {
              en: 'What should happen when you double the wire turns from 15 to 30?',
              hi: 'जब आप तार के फेरे 15 से दोगुने करके 30 कर देंगे, तो क्या होना चाहिए?',
              kn: 'ತಂತಿಯ ಸುತ್ತುಗಳನ್ನು 15ರಿಂದ 30ಕ್ಕೆ ದ್ವಿಗುಣಗೊಳಿಸಿದಾಗ ಏನಾಗಬೇಕು?',
            },
            predictionOptions: {
              en: [
                'The nail becomes a stronger magnet and picks up more clips',
                'The nail stops attracting any clips',
                'The clips get pushed away',
              ],
              hi: [
                'कील अधिक शक्तिशाली चुंबक बनेगी और ज़्यादा क्लिप उठाएगी',
                'कील कोई क्लिप नहीं खींचेगी',
                'क्लिप दूर धकेली जाएँगी',
              ],
              kn: [
                'ಮೊಳೆ ಹೆಚ್ಚು ಬಲವಾದ ಕಾಂತವಾಗಿ ಹೆಚ್ಚು ಕ್ಲಿಪ್‌ಗಳನ್ನು ಎತ್ತುತ್ತದೆ',
                'ಮೊಳೆ ಯಾವುದೇ ಕ್ಲಿಪ್ ಆಕರ್ಷಿಸುವುದಿಲ್ಲ',
                'ಕ್ಲಿಪ್‌ಗಳು ದೂರ ತಳ್ಳಲ್ಪಡುತ್ತವೆ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Every loop of current adds a little magnetic push in the same direction.',
                'More turns N means stronger combined magnetic strength.',
              ],
              hi: [
                'धारा का हर एक फेरा एक ही दिशा में थोड़ा चुंबकीय बल जोड़ता है।',
                'ज़्यादा फेरे N होने से कुल चुंबकीय शक्ति बढ़ जाती है।',
              ],
              kn: [
                'ಪ್ರತಿ ಸುತ್ತಿನ ವಿದ್ಯುತ್ ಪ್ರವಾಹವು ಒಂದೇ ದಿಕ್ಕಿನಲ್ಲಿ ಕಾಂತೀಯ ಶಕ್ತಿಯನ್ನು ಸೇರಿಸುತ್ತದೆ.',
                'ಹೆಚ್ಚು ಸುತ್ತುಗಳು N ಎಂದರೆ ಹೆಚ್ಚು ಬಲವಾದ ಕಾಂತೀಯ ಕ್ಷೇತ್ರ.',
              ],
            },
            whyItHappens: {
              en: 'Moving electric charges create a magnetic field. Each loop of wire adds to the field inside the iron nail, so more turns make a stronger temporary magnet until current stops.',
              hi: 'चलते हुए विद्युत आवेश चुंबकीय क्षेत्र बनाते हैं। तार का हर फेरा कील के भीतर चुंबकीय क्षेत्र को बढ़ाता है, और धारा बंद होते ही यह अस्थायी चुंबकत्व समाप्त हो जाता है।',
              kn: 'ಚಲಿಸುವ ವಿದ್ಯುತ್ ಆವೇಶಗಳು ಕಾಂತೀಯ ಕ್ಷೇತ್ರವನ್ನು ಉಂಟುಮಾಡುತ್ತವೆ. ಪ್ರತಿ ಸುತ್ತು ಮೊಳೆಯ ಒಳಗೆ ಕಾಂತೀಯ ಬಲವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ ಮತ್ತು ವಿದ್ಯುತ್ ನಿಂತಾಗ ಅದು ನಿಲ್ಲುತ್ತದೆ.',
            },
          },
          {
            id: 'curiosity-ch04-circuit-sim',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSimExperiment: 'electricity',
            title: {
              en: "Interactive Circuit Lab: Series vs Parallel & Ohm's Law",
              hi: 'इंटरैक्टिव परिपथ लैब: श्रेणी व समानांतर और ओम का नियम',
              kn: 'ಸಂವಾದಾತ್ಮಕ ಸರ್ಕ್ಯೂಟ್ ಲ್ಯಾಬ್: ಸರಣಿ, ಸಮಾನಾಂತರ ಮತ್ತು ಓಮ್ ನಿಯಮ',
            },
            objective: {
              en: 'Compare how changing voltage (V) and connecting resistors in series vs parallel changes circuit current (A).',
              hi: 'देखें कि वोल्टेज (V) बदलने और प्रतिरोधों को श्रेणी व समानांतर में जोड़ने से धारा (A) कैसे बदलती है।',
              kn: 'ವೋಲ್ಟೇಜ್ (V) ಬದಲಾಯಿಸಿದಾಗ ಮತ್ತು ರೋಧಕಗಳನ್ನು ಸರಣಿ ಅಥವಾ ಸಮಾನಾಂತರವಾಗಿ ಜೋಡಿಸಿದಾಗ ವಿದ್ಯುತ್ ಪ್ರವಾಹ (A) ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ ಎಂದು ಹೋಲಿಸಿ.',
            },
            materials: {
              en: ['Gyaan Graph Interactive Circuit Simulator (works offline)'],
              hi: ['Gyaan Graph इंटरैक्टिव परिपथ सिम्युलेटर (ऑफ़लाइन कार्यशील)'],
              kn: ['Gyaan Graph ಸಂವಾದಾತ್ಮಕ ಸರ್ಕ್ಯೂಟ್ ಸಿಮ್ಯುಲೇಟರ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual simulation — safe for testing high voltages and short-branch currents without overheating.',
              hi: 'वर्चुअल सिम्युलेटर — बिना गर्म हुए वोल्टेज और धारा की जाँच करने के लिए पूरी तरह सुरक्षित।',
              kn: 'ವರ್ಚುವಲ್ ಸಿಮ್ಯುಲೇಟರ್ — ಬಿಸಿಯಾಗುವ ಭಯವಿಲ್ಲದೆ ಸುರಕ್ಷಿತವಾಗಿ ಪರೀಕ್ಷಿಸಬಹುದು.',
            },
            steps: {
              en: [
                'Open the interactive simulation and keep Voltage at 12 V in Series mode (R₁ = 10 Ω, R₂ = 20 Ω).',
                'Read equivalent resistance R_eq (Ω) and current I (A) in the Calculation tab.',
                'Switch to Parallel mode and compare total current I (A).',
              ],
              hi: [
                'इंटरैक्टिव सिमुलेशन खोलें और श्रेणी (Series) मोड में वोल्टेज 12 V (R₁ = 10 Ω, R₂ = 20 Ω) रखें।',
                'गणना टैब में कुल प्रतिरोध R_eq (Ω) और धारा I (A) पढ़ें।',
                'समानांतर (Parallel) मोड चुनें और कुल धारा I (A) की तुलना करें।',
              ],
              kn: [
                'ಸಿಮ್ಯುಲೇಷನ್ ತೆರೆದು ಸರಣಿ (Series) ಕ್ರಮದಲ್ಲಿ ವೋಲ್ಟೇಜ್ 12 V (R₁ = 10 Ω, R₂ = 20 Ω) ಇರಿಸಿ.',
                'ಲೆಕ್ಕಾಚಾರ ಟ್ಯಾಬ್‌ನಲ್ಲಿ ಒಟ್ಟು ರೋಧ R_eq (Ω) ಮತ್ತು ಪ್ರವಾಹ I (A) ಓದಿ.',
                'ಸಮಾನಾಂತರ (Parallel) ಕ್ರಮಕ್ಕೆ ಬದಲಾಯಿಸಿ ಒಟ್ಟು ವಿದ್ಯುತ್ ಪ್ರವಾಹವನ್ನು ಹೋಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Circuit Mode', 'Voltage (V)', 'R_eq (Ω)', 'Current I (A)'],
                hi: ['परिपथ प्रकार', 'वोल्टेज (V)', 'कुल प्रतिरोध (Ω)', 'धारा I (A)'],
                kn: ['ಸರ್ಕ್ಯೂಟ್ ವಿಧಾನ', 'ವೋಲ್ಟೇಜ್ (V)', 'ಒಟ್ಟು ರೋಧ (Ω)', 'ಪ್ರವಾಹ I (A)'],
              },
              sampleRows: [
                ['Series (10 Ω + 20 Ω)', '12 V', '30.00 Ω', '0.40 A'],
                ['Parallel (10 Ω || 20 Ω)', '12 V', '6.67 Ω', '1.80 A'],
              ],
            },
            predictionQuestion: {
              en: 'In which connection does more current flow from the 12 V battery?',
              hi: '12 V बैटरी से किस जुड़ाव में अधिक विद्युत धारा प्रवाहित होगी?',
              kn: '12 V ಬ್ಯಾಟರಿಯಿಂದ ಯಾವ ಜೋಡಣೆಯಲ್ಲಿ ಹೆಚ್ಚು ವಿದ್ಯುತ್ ಪ್ರವಹಿಸುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'Parallel circuit (two separate paths reduce total resistance)',
                'Series circuit (one long path reduces total resistance)',
                'Both always draw equal current',
              ],
              hi: [
                'समानांतर परिपथ (दो अलग रास्ते कुल प्रतिरोध घटाते हैं)',
                'श्रेणी परिपथ (एक लंबा रास्ता कुल प्रतिरोध घटाता है)',
                'दोनों में हमेशा बराबर धारा होती है',
              ],
              kn: [
                'ಸಮಾನಾಂತರ ಸರ್ಕ್ಯೂಟ್ (ಎರಡು ದಾರಿಗಳು ಒಟ್ಟು ರೋಧವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತವೆ)',
                'ಸರಣಿ ಸರ್ಕ್ಯೂಟ್ (ಒಂದೇ ಉದ್ದದ ದಾರಿ ರೋಧವನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ)',
                'ಎರಡರಲ್ಲೂ ಒಂದೇ ಪ್ರವಾಹ ಇರುತ್ತದೆ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Two open gates let more people pass than one narrow line of two gates.',
                'With I = V / R_eq, lower resistance means higher current.',
              ],
              hi: [
                'दो अलग दरवाज़ों से लोग एक के बाद एक दरवाज़े की तुलना में ज़्यादा तेज़ी से निकलते हैं।',
                'I = V / R_eq के अनुसार कम प्रतिरोध का अर्थ अधिक धारा है।',
              ],
              kn: [
                'ಎರಡು ಪ್ರತ್ಯೇಕ ದಾರಿಗಳು ಒಂದೇ ಉದ್ದದ ದಾರಿಗಿಂತ ಹೆಚ್ಚು ಸುಲಭವಾಗಿ ಪ್ರವಾಹಕ್ಕೆ ಅವಕಾಶ ನೀಡುತ್ತವೆ.',
                'I = V / R_eq ಪ್ರಕಾರ ರೋಧ ಕಡಿಮೆಯಾದರೆ ಪ್ರವಾಹ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'Adding a parallel branch gives electrons an extra path to flow through, lowering total resistance from 30 Ω to 6.67 Ω and letting more current flow.',
              hi: 'समानांतर शाखा जोड़ने से आवेशों को बहने का एक अतिरिक्त रास्ता मिलता है, जिससे कुल प्रतिरोध 30 Ω से घटकर 6.67 Ω रह जाता है और अधिक धारा बहती है।',
              kn: 'ಸಮಾನಾಂತರ ಶಾಖೆ ಸೇರಿಸುವುದರಿಂದ ಎಲೆಕ್ಟ್ರಾನ್‌ಗಳಿಗೆ ಹೆಚ್ಚುವರಿ ಮಾರ್ಗ ಸಿಗುತ್ತದೆ; ಇದರಿಂದ ಒಟ್ಟು ರೋಧ 30 Ω ನಿಂದ 6.67 Ω ಗೆ ಇಳಿದು ಹೆಚ್ಚು ಪ್ರವಾಹ ಹರಿಯುತ್ತದೆ.',
            },
          },
          {
            id: 'curiosity-ch04-heating-bench',
            relationType: 'in-chapter',
            activityMode: 'school-lab',
            linkedSimExperiment: 'electricity',
            title: {
              en: 'School Lab: Heating Effect in a Nichrome Wire Coil',
              hi: 'स्कूल लैब: नाइक्रोम तार कुंडली में ऊष्मीय प्रभाव',
              kn: 'ಶಾಲಾ ಪ್ರಯೋಗಾಲಯ: ನೈಕ್ರೋಮ್ ತಂತಿಯ ಉಷ್ಣ ಪರಿಣಾಮ',
            },
            objective: {
              en: 'Observe how passing current from a 3 V school battery through a thin nichrome wire warms the wire compared to thick copper leads.',
              hi: 'देखें कि 3 V स्कूल बैटरी से पतले नाइक्रोम तार में धारा प्रवाहित करने पर वह मोटे ताँबे के तार से अधिक गर्म क्यों होता है।',
              kn: '3 V ಶಾಲಾ ಬ್ಯಾಟರಿಯಿಂದ ತೆಳುವಾದ ನೈಕ್ರೋಮ್ ತಂತಿಯಲ್ಲಿ ವಿದ್ಯುತ್ ಹರಿದಾಗ ಅದು ದಪ್ಪ ತಾಮ್ರದ ತಂತಿಗಿಂತ ಏಕೆ ಹೆಚ್ಚು ಬಿಸಿಯಾಗುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ.',
            },
            materials: {
              en: ['2 × 1.5 V cell holder (3 V)', '10 cm nichrome wire (high resistance)', 'Insulated copper connecting wires', 'Plug key switch', 'Laboratory thermometer'],
              hi: ['2 × 1.5 V सेल होल्डर (3 V)', '10 cm नाइक्रोम तार', 'ताँबे के संयोजक तार', 'स्विच (कुंजी)', 'प्रयोगशाला थर्मामीटर'],
              kn: ['2 × 1.5 V ಸೆಲ್ ಹೋಲ್ಡರ್ (3 V)', '10 cm ನೈಕ್ರೋಮ್ ತಂತಿ', 'ತಾಮ್ರದ ಸಂಪರ್ಕ ತಂತಿಗಳು', 'ಸ್ವಿಚ್ ಕೀ', 'ಪ್ರಯೋಗಾಲಯ ಥರ್ಮಾಮೀಟರ್'],
            },
            safetyNote: {
              en: 'Do not touch the bare nichrome wire while the switch is closed. Switch OFF after 20 seconds and test under teacher supervision.',
              hi: 'स्विच चालू रहते समय नाइक्रोम तार को न छुएँ। 20 सेकंड बाद स्विच बंद करें और शिक्षक की देखरेख में प्रयोग करें।',
              kn: 'ಸ್ವಿಚ್ ಆನ್ ಇರುವಾಗ ನೈಕ್ರೋಮ್ ತಂತಿಯನ್ನು ಮುಟ್ಟಬೇಡಿ. 20 ಸೆಕೆಂಡುಗಳ ನಂತರ ಆಫ್ ಮಾಡಿ ಮತ್ತು ಶಿಕ್ಷಕರ ಮೇಲ್ವಿಚಾರಣೆಯಲ್ಲಿ ಪರೀಕ್ಷಿಸಿ.',
            },
            steps: {
              en: [
                'Connect the nichrome wire between two insulated terminals in series with the switch and 3 V cell holder.',
                'Record room temperature (°C) near the coil before closing the switch.',
                'Close the switch for 20 seconds, open it, and read the thermometer (°C) right next to the nichrome wire.',
              ],
              hi: [
                'स्विच और 3 V सेल होल्डर के श्रेणीक्रम में दोनों टर्मिनलों के बीच नाइक्रोम तार जोड़ें।',
                'स्विच बंद करने से पहले कुंडली के पास कमरे का तापमान (°C) दर्ज करें।',
                '20 सेकंड के लिए स्विच चालू करें, फिर बंद करके थर्मामीटर (°C) का पाठ्यांक पढ़ें।',
              ],
              kn: [
                'ಸ್ವಿಚ್ ಮತ್ತು 3 V ಬ್ಯಾಟರಿಯೊಂದಿಗೆ ನೈಕ್ರೋಮ್ ತಂತಿಯನ್ನು ಸರಣಿ ಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ.',
                'ಸ್ವಿಚ್ ಹಾಕುವ ಮೊದಲು ಕೋಣೆಯ ತಾಪಮಾನವನ್ನು (°C) ದಾಖಲಿಸಿ.',
                '20 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಸ್ವಿಚ್ ಹಾಕಿ, ನಂತರ ಆಫ್ ಮಾಡಿ ಥರ್ಮಾಮೀಟರ್ ರೀಡಿಂಗ್ (°C) ಓದಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Time ON (s)', 'Wire Type', 'Temperature (°C)'],
                hi: ['चालू समय (s)', 'तार प्रकार', 'तापमान (°C)'],
                kn: ['ಸಮಯ (s)', 'ತಂತಿ ವಿಧ', 'ತಾಪಮಾನ (°C)'],
              },
              sampleRows: [
                ['0 s', 'Nichrome coil', '26.0 °C'],
                ['20 s', 'Nichrome coil', '34.5 °C'],
              ],
            },
            predictionQuestion: {
              en: 'Which wire heats up more when the same current flows for 20 seconds?',
              hi: '20 सेकंड तक समान धारा बहने पर कौन-सा तार अधिक गर्म होगा?',
              kn: '20 ಸೆಕೆಂಡುಗಳ ಕಾಲ ಒಂದೇ ವಿದ್ಯುತ್ ಪ್ರವಹಿಸಿದಾಗ ಯಾವ ತಂತಿ ಹೆಚ್ಚು ಬಿಸಿಯಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'The higher-resistance nichrome wire',
                'The thick low-resistance copper wire',
                'Neither wire changes temperature',
              ],
              hi: [
                'अधिक प्रतिरोध वाला नाइक्रोम तार',
                'मोटा कम प्रतिरोध वाला ताँबे का तार',
                'किसी का भी तापमान नहीं बदलता',
              ],
              kn: [
                'ಹೆಚ್ಚು ರೋಧವಿರುವ ನೈಕ್ರೋಮ್ ತಂತಿ',
                'ಕಡಿಮೆ ರೋಧವಿರುವ ದಪ್ಪ ತಾಮ್ರದ ತಂತಿ',
                'ಯಾವ ತಂತಿಯೂ ಬಿಸಿಯಾಗುವುದಿಲ್ಲ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: ['Electric heaters and toasters use nichrome coils because higher resistance converts more electrical energy into heat.'],
              hi: ['हीटर और टोस्टर में नाइक्रोम का उपयोग इसलिए होता है क्योंकि अधिक प्रतिरोध अधिक ऊष्मा पैदा करता है।'],
              kn: ['ಹೀಟರ್‌ಗಳಲ್ಲಿ ನೈಕ್ರೋಮ್ ಬಳಸಲಾಗುತ್ತದೆ ಏಕೆಂದರೆ ಹೆಚ್ಚು ರೋಧವು ಹೆಚ್ಚು ಶಾಖವನ್ನು ಉತ್ಪಾದಿಸುತ್ತದೆ.'],
            },
            whyItHappens: {
              en: 'As electrons push through high-resistance nichrome, electrical energy transfers into thermal vibration of atoms, warming the wire (P = I²R).',
              hi: 'उच्च प्रतिरोध वाले नाइक्रोम से गुजरते समय विद्युत ऊर्जा ऊष्मीय ऊर्जा में बदलती है, जिससे तार गर्म हो जाता है (P = I²R)।',
              kn: 'ಹೆಚ್ಚು ರೋಧವಿರುವ ನೈಕ್ರೋಮ್ ತಂತಿಯಲ್ಲಿ ಎಲೆಕ್ಟ್ರಾನ್‌ಗಳು ಹರಿಯುವಾಗ ವಿದ್ಯುತ್ ಶಕ್ತಿಯು ಶಾಖ ಶಕ್ತಿಯಾಗಿ ಬದಲಾಗುತ್ತದೆ (P = I²R).',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch05',
        chapterNumber: 5,
        title: {
          en: 'Exploring Forces',
          hi: 'बलों की खोज',
          kn: 'ಬಲಗಳ ಅನ್ವೇಷಣೆ',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Push, Pull, Friction & Gravity',
          hi: 'धक्का, खिंचाव, घर्षण और गुरुत्वाकर्षण',
          kn: 'ತಳ್ಳುವಿಕೆ, ಎಳೆಯುವಿಕೆ, ಘರ್ಷಣೆ ಮತ್ತು ಗುರುತ್ವಾಕರ್ಷಣೆ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'A force is a push or pull that can change an object’s speed, direction, or shape. Contact forces (muscular, friction) act through touch, while non-contact forces (gravity, magnetic, electrostatic) act across space.',
          hi: 'बल वह धक्का या खिंचाव है जो किसी वस्तु की चाल, दिशा या आकार बदल सकता है। संपर्क बल छूने से लगते हैं, जबकि गुरुत्वाकर्षण और चुंबकीय बल बिना छुए दूर से कार्य करते हैं।',
          kn: 'ಬಲವು ವಸ್ತುವಿನ ವೇಗ, ದಿಕ್ಕು ಅಥವಾ ಆಕಾರವನ್ನು ಬದಲಾಯಿಸುವ ತಳ್ಳುವಿಕೆ ಅಥವಾ ಎಳೆಯುವಿಕೆಯಾಗಿದೆ. ಘರ್ಷಣೆ ಸ್ಪರ್ಶ ಬಲವಾಗಿದ್ದರೆ, ಗುರುತ್ವಾಕರ್ಷಣೆ ಮತ್ತು ಕಾಂತೀಯತೆ ಅಸ್ಪರ್ಶ ಬಲಗಳಾಗಿವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch05-projectile',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSimExperiment: 'mechanics',
            title: {
              en: 'Gravity & Motion Lab: Ball Throw Trajectory Mission',
              hi: 'गुरुत्व व गति लैब: गेंद फेंकने का प्रक्षेप पथ मिशन',
              kn: 'ಗುರುತ್ವ ಮತ್ತು ಚಲನೆ ಲ್ಯಾಬ್: ಚೆಂಡು ಎಸೆಯುವ ಪಥ ಮಿಷನ್',
            },
            objective: {
              en: 'Investigate how gravity pulls a thrown ball downward into a curved path and how launch angle changes distance (m).',
              hi: 'समझें कि गुरुत्वाकर्षण फेंकी गई गेंद को नीचे खींचकर वक्र पथ कैसे बनाता है और कोण बदलने से दूरी (m) कैसे बदलती है।',
              kn: 'ಗುರುತ್ವಾಕರ್ಷಣೆಯು ಎಸೆದ ಚೆಂಡನ್ನು ಕೆಳಕ್ಕೆ ಎಳೆದು ವಕ್ರಪಥವನ್ನು ಹೇಗೆ ರಚಿಸುತ್ತದೆ ಮತ್ತು ಕೋನದಿಂದ ದೂರ (m) ಹೇಗೆ ಬದಲಾಗುತ್ತದೆ ಎಂದು ಪರೀಕ್ಷಿಸಿ.',
            },
            materials: {
              en: ['Gyaan Graph Projectile Mission Simulation (works offline)'],
              hi: ['Gyaan Graph प्रक्षेप्य मिशन सिम्युलेटर (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಪ್ರಕ್ಷೇಪಕ ಮಿಷನ್ ಸಿಮ್ಯುಲೇಟರ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual experiment — ideal motion without air resistance is assumed and stated in the simulation.',
              hi: 'वर्चुअल प्रयोग — इसमें वायु प्रतिरोध रहित आदर्श गति दिखाई जाती है।',
              kn: 'ವರ್ಚುವಲ್ ಪ್ರಯೋಗ — ಗಾಳಿಯ ಪ್ರತಿರೋಧವಿಲ್ಲದ ಆದರ್ಶ ಚಲನೆಯನ್ನು ತೋರಿಸುತ್ತದೆ.',
            },
            steps: {
              en: [
                'Open Projectile Motion in Physics Labs and set speed v₀ = 24 m/s and gravity g = 9.81 m/s².',
                'Test angles 30°, 45°, and 60° and note the horizontal range R (m) and peak height H (m).',
                'Change ball mass (kg) and verify whether ideal vacuum range changes.',
              ],
              hi: [
                'भौतिकी लैब में प्रक्षेप्य गति खोलें और चाल v₀ = 24 m/s व गुरुत्व g = 9.81 m/s² सेट करें।',
                '30°, 45°, और 60° कोण पर क्षैतिज परास R (m) और अधिकतम ऊँचाई H (m) दर्ज करें।',
                'गेंद का द्रव्यमान (kg) बदलकर जाँचें कि आदर्श परास बदलता है या नहीं।',
              ],
              kn: [
                'ಭೌತಶಾಸ್ತ್ರ ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಪ್ರಕ್ಷೇಪಕ ಚಲನೆಯನ್ನು ತೆರೆದು v₀ = 24 m/s ಮತ್ತು g = 9.81 m/s² ಹೊಂದಿಸಿ.',
                '30°, 45°, ಮತ್ತು 60° ಕೋನಗಳಲ್ಲಿ ದೂರ R (m) ಮತ್ತು ಗರಿಷ್ಠ ಎತ್ತರ H (m) ದಾಖಲಿಸಿ.',
                'ಚೆಂಡಿನ ದ್ರವ್ಯರಾಶಿಯನ್ನು (kg) ಬದಲಾಯಿಸಿ ದೂರ ಬದಲಾಗುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Angle (θ)', 'Speed (m/s)', 'Max Height (m)', 'Range (m)'],
                hi: ['कोण (θ)', 'चाल (m/s)', 'अधिकतम ऊँचाई (m)', 'दूरी / परास (m)'],
                kn: ['ಕೋನ (θ)', 'ವೇಗ (m/s)', 'ಗರಿಷ್ಠ ಎತ್ತರ (m)', 'ದೂರ (m)'],
              },
              sampleRows: [
                ['30°', '24 m/s', '7.34 m', '50.86 m'],
                ['45°', '24 m/s', '14.68 m', '58.72 m'],
                ['60°', '24 m/s', '22.02 m', '50.86 m'],
              ],
            },
            predictionQuestion: {
              en: 'Which launch angle gives the longest horizontal distance on flat ground (ignoring air)?',
              hi: 'समतल मैदान पर (हवा को अनदेखा करने पर) किस कोण से गेंद सबसे दूर जाएगी?',
              kn: 'ಸಮತಟ್ಟಾದ ನೆಲದ ಮೇಲೆ (ಗಾಳಿ ಇಲ್ಲದಿದ್ದಾಗ) ಯಾವ ಕೋನದಲ್ಲಿ ಚೆಂಡು ಅತಿ ಹೆಚ್ಚು ದೂರ ಹೋಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['45°', '15°', '75°'],
              hi: ['45°', '15°', '75°'],
              kn: ['45°', '15°', '75°'],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Too low (15°) hits the ground too quickly; too steep (75°) goes high but barely moves forward.',
                '45° balances forward speed and hang-time in the air.',
              ],
              hi: [
                'बहुत कम कोण (15°) पर गेंद जल्दी जमीन पर गिरती है; बहुत ऊँचा कोण (75°) ऊपर तो जाता है पर आगे कम बढ़ता है।',
                '45° आगे बढ़ने की चाल और हवा में रहने के समय के बीच सबसे अच्छा संतुलन बनाता है।',
              ],
              kn: [
                'ಬಹಳ ಕಡಿಮೆ ಕೋನ (15°) ಬೇಗ ನೆಲಕ್ಕೆ ಬೀಳುತ್ತದೆ; ಬಹಳ ಎತ್ತರದ ಕೋನ (75°) ಮುಂದಕ್ಕೆ ಕಡಿಮೆ ಹೋಗುತ್ತದೆ.',
                '45° ಮುಂದಿನ ವೇಗ ಮತ್ತು ಗಾಳಿಯಲ್ಲಿ ಇರುವ ಸಮಯದ ನಡುವೆ ಸಮತೋಲನ ನೀಡುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'Gravity is a non-contact downward force that slows the vertical climb and pulls the ball back down, while forward motion keeps carrying it horizontally.',
              hi: 'गुरुत्वाकर्षण एक असंपर्क बल है जो गेंद को लगातार नीचे खींचता है, जबकि क्षैतिज वेग उसे आगे बढ़ाता रहता है। 45° पर दोनों का संतुलन अधिकतम दूरी देता है।',
              kn: 'ಗುರುತ್ವಾಕರ್ಷಣೆಯು ಚೆಂಡನ್ನು ಕೆಳಕ್ಕೆ ಎಳೆಯುವ ಅಸ್ಪರ್ಶ ಬಲವಾಗಿದೆ; ಸಮತಲ ವೇಗವು ಅದನ್ನು ಮುಂದಕ್ಕೆ ಕೊಂಡೊಯ್ಯುತ್ತದೆ. 45° ನಲ್ಲಿ ಗರಿಷ್ಠ ದೂರ ಸಿಗುತ್ತದೆ.',
            },
          },
          {
            id: 'curiosity-ch05-friction',
            relationType: 'in-chapter',
            activityMode: 'home-safe',
            title: {
              en: 'Compare Friction on Smooth Floor vs Cloth Towel',
              hi: 'चिकने फर्श बनाम तौलिये पर घर्षण बल की तुलना',
              kn: 'ನಯವಾದ ನೆಲ ಮತ್ತು ಟವೆಲ್ ಮೇಲೆ ಘರ್ಷಣೆಯ ಹೋಲಿಕೆ',
            },
            objective: {
              en: 'See how rough and smooth surfaces change the distance a rolling ball or coin slides.',
              hi: 'देखें कि खुरदरी और चिकनी सतहें लुढ़कती गेंद या सिक्के की दूरी को कैसे बदलती हैं।',
              kn: 'ನಯವಾದ ಮತ್ತು ಒರಟಾದ ಮೇಲ್ಮೈಗಳು ಉರುಳುವ ಚೆಂಡಿನ ದೂರವನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುತ್ತವೆ ಎಂದು ನೋಡಿ.',
            },
            materials: {
              en: ['1 marble or small ball', 'A flat book for a low ramp', 'Smooth tile/tabletop', 'Cotton towel or mat', 'Ruler or tape (cm)'],
              hi: ['1 कंचा या छोटी गेंद', 'ढलान बनाने के लिए एक किताब', 'चिकना फर्श/मेज़', 'सूती तौलिया या चटाई', 'पैमाना (cm)'],
              kn: ['1 ಗೋಲಿ ಅಥವಾ ಸಣ್ಣ ಚೆಂಡು', 'ಇಳಿಜಾರಿಗೆ ಒಂದು ಪುಸ್ತಕ', 'ನಯವಾದ ನೆಲ/ಮೇಜು', 'ಹತ್ತಿ ಟವೆಲ್ ಅಥವಾ ಚಾಪೆ', 'ಅಳತೆ ಪಟ್ಟಿ (cm)'],
            },
            safetyNote: {
              en: 'Pick up marbles after testing so nobody slips on them.',
              hi: 'प्रयोग के बाद कंचे या गेंद को तुरंत उठा लें ताकि कोई फिसले नहीं।',
              kn: 'ಪರೀಕ್ಷೆಯ ನಂತರ ಗೋಲಿಗಳನ್ನು ಎತ್ತಿಡಿ, ಯಾರೂ ಜಾರಿ ಬೀಳದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.',
            },
            steps: {
              en: [
                'Prop one edge of a flat notebook on another book to make a gentle ramp.',
                'Release the ball from the exact same mark onto a bare smooth floor and measure stopping distance (cm).',
                'Spread a cotton towel right at the bottom of the ramp, release from the same mark, and measure distance (cm).',
              ],
              hi: [
                'एक किताब को दूसरी किताब पर टिकाकर छोटा ढलान बनाएँ।',
                'गेंद को एक ही निशान से चिकने फर्श पर छोड़ें और रुकने की दूरी (cm) मापें।',
                'ढलान के नीचे सूती तौलिया बिछाएँ, उसी निशान से गेंद छोड़ें और दूरी (cm) मापें।',
              ],
              kn: [
                'ಒಂದು ಪುಸ್ತಕದ ಅಂಚನ್ನು ಇನ್ನೊಂದು ಪುಸ್ತಕದ ಮೇಲೆ ಇಟ್ಟು ಸಣ್ಣ ಇಳಿಜಾರು ಮಾಡಿ.',
                'ಒಂದೇ ಗುರುತಿನಿಂದ ನಯವಾದ ನೆಲದ ಮೇಲೆ ಚೆಂಡನ್ನು ಬಿಟ್ಟು ನಿಂತ ದೂರವನ್ನು (cm) ಅಳೆಯಿರಿ.',
                'ಇಳಿಜಾರಿನ ಕೆಳಗೆ ಹತ್ತಿ ಟವೆಲ್ ಹಾಸಿ, ಅದೇ ಗುರುತಿನಿಂದ ಚೆಂಡು ಬಿಟ್ಟು ದೂರವನ್ನು (cm) ಅಳೆಯಿರಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Surface Type', 'Ramp Height (cm)', 'Stopping Distance (cm)'],
                hi: ['सतह का प्रकार', 'ढलान की ऊँचाई (cm)', 'रुकने की दूरी (cm)'],
                kn: ['ಮೇಲ್ಮೈ ವಿಧ', 'ಇಳಿಜಾರಿನ ಎತ್ತರ (cm)', 'ನಿಂತ ದೂರ (cm)'],
              },
              sampleRows: [
                ['Smooth tile / wood', '5 cm', '145 cm'],
                ['Cotton towel', '5 cm', '38 cm'],
              ],
            },
            predictionQuestion: {
              en: 'On which surface will the ball stop sooner?',
              hi: 'किस सतह पर गेंद जल्दी रुकेगी?',
              kn: 'ಯಾವ ಮೇಲ್ಮೈಯಲ್ಲಿ ಚೆಂಡು ಬೇಗ ನಿಲ್ಲುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'On the cotton towel (higher friction)',
                'On the smooth floor (higher friction)',
                'Exact same distance on both',
              ],
              hi: [
                'सूती तौलिये पर (अधिक घर्षण)',
                'चिकने फर्श पर (अधिक घर्षण)',
                'दोनों पर बिल्कुल समान दूरी',
              ],
              kn: [
                'ಹತ್ತಿ ಟವೆಲ್ ಮೇಲೆ (ಹೆಚ್ಚು ಘರ್ಷಣೆ)',
                'ನಯವಾದ ನೆಲದ ಮೇಲೆ (ಹೆಚ್ಚು ಘರ್ಷಣೆ)',
                'ಎರಡರಲ್ಲೂ ಒಂದೇ ದೂರ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Look closely at the bumps and threads on the towel compared to smooth tile.',
                'Rougher surfaces interlock more with the moving ball and oppose motion.',
              ],
              hi: [
                'चिकने फर्श की तुलना में तौलिये के उभार और रेशों को ध्यान से देखें।',
                'खुरदरी सतह गेंद की गति का अधिक विरोध करती है।',
              ],
              kn: [
                'ನಯವಾದ ನೆಲಕ್ಕೆ ಹೋಲಿಸಿದರೆ ಟವೆಲ್‌ನ ದಾರಗಳು ಮತ್ತು ಒರಟುತನವನ್ನು ಗಮನಿಸಿ.',
                'ಒರಟಾದ ಮೇಲ್ಮೈ ಚೆಂಡಿನ ಚಲನೆಯನ್ನು ಹೆಚ್ಚು ತಡೆಯುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'Friction is a contact force that opposes motion. Tiny bumps on the cotton towel rub harder against the ball than the smooth floor, slowing it down much faster.',
              hi: 'घर्षण एक संपर्क बल है जो गति का विरोध करता है। तौलिये की खुरदरी सतह चिकने फर्श की तुलना में अधिक घर्षण लगाती है, जिससे गेंद जल्दी रुक जाती है।',
              kn: 'ಘರ್ಷಣೆಯು ಚಲನೆಯನ್ನು ವಿರೋಧಿಸುವ ಸ್ಪರ್ಶ ಬಲವಾಗಿದೆ. ಟವೆಲ್‌ನ ಒರಟು ಮೇಲ್ಮೈ ನಯವಾದ ನೆಲಕ್ಕಿಂತ ಹೆಚ್ಚು ಘರ್ಷಣೆ ಉಂಟುಮಾಡುವುದರಿಂದ ಚೆಂಡು ಬೇಗ ನಿಲ್ಲುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch06',
        chapterNumber: 6,
        title: {
          en: 'Pressure, Winds, Storms, and Cyclones',
          hi: 'दाब, पवन, तूफ़ान और चक्रवात',
          kn: 'ಒತ್ತಡ, ಗಾಳಿ, ಬಿರುಗಾಳಿ ಮತ್ತು ಚಂಡಮಾರುತಗಳು',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Fluid Pressure & Moving Air',
          hi: 'द्रव व वायु दाब और पवन',
          kn: 'ದ್ರವ ಮತ್ತು ಗಾಳಿಯ ಒತ್ತಡ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Pressure is force divided by area (P = F / A). Liquids and air exert pressure in all directions, and fast-moving air reduces pressure—driving winds and storms from high-pressure to low-pressure regions.',
          hi: 'दाब = बल / क्षेत्रफल (P = F / A)। द्रव और वायु सभी दिशाओं में दाब डालते हैं। तेज़ बहती हवा दाब कम करती है, जिससे हवा उच्च दाब से निम्न दाब की ओर चलती है।',
          kn: 'ಒತ್ತಡ ಎಂದರೆ ಬಲ ಭಾಗಿಸು ವಿಸ್ತೀರ್ಣ (P = F / A). ದ್ರವ ಮತ್ತು ಗಾಳಿ ಎಲ್ಲಾ ದಿಕ್ಕುಗಳಲ್ಲಿ ಒತ್ತಡ ಹಾಕುತ್ತವೆ. ವೇಗವಾಗಿ ಬೀಸುವ ಗಾಳಿಯು ಕಡಿಮೆ ಒತ್ತಡವನ್ನು ಉಂಟುಮಾಡುತ್ತದೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch06-bottle-pressure',
            relationType: 'in-chapter',
            activityMode: 'home-safe',
            linkedSimExperiment: 'thermodynamics',
            title: {
              en: 'Water Pressure vs Depth in a Plastic Bottle',
              hi: 'प्लास्टिक बोतल में गहराई के साथ जल दाब की जाँच',
              kn: 'ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲಿಯಲ್ಲಿ ಆಳಕ್ಕೆ ಅನುಗುಣವಾಗಿ ನೀರಿನ ಒತ್ತಡ',
            },
            objective: {
              en: 'Check whether water spurts farthest from the bottom hole or the top hole of a bottle.',
              hi: 'देखें कि बोतल के सबसे निचले छेद से पानी दूर गिरता है या ऊपरी छेद से।',
              kn: 'ಬಾಟಲಿಯ ಮೇಲಿನ ರಂಧ್ರಕ್ಕಿಂತ ಕೆಳಗಿನ ರಂಧ್ರದಿಂದ ನೀರು ಹೆಚ್ಚು ದೂರ ಹಾರುತ್ತದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
            },
            materials: {
              en: ['1 clear plastic bottle (1 L)', 'Push-pin or compass point (with adult help)', 'Masking tape', 'Water & tray/bucket'],
              hi: ['1 पारदर्शी प्लास्टिक बोतल (1 L)', 'पिन (बड़ों की सहायता से)', 'टेप', 'पानी और बाल्टी/ट्रे'],
              kn: ['1 ಪ್ಲಾಸ್ಟಿಕ್ ಬಾಟಲಿ (1 L)', 'ಪಿನ್ (ದೊಡ್ಡವರ ಸಹಾಯದಿಂದ)', 'ಟೇಪ್', 'ನೀರು ಮತ್ತು ಬಕೆಟ್/ಟ್ರೇ'],
            },
            safetyNote: {
              en: 'Ask an adult to make the small holes in the bottle safely. Wipe spilled water immediately.',
              hi: 'बोतल में छेद बड़ों की निगरानी में करें। गिरा हुआ पानी तुरंत पोंछें।',
              kn: 'ಬಾಟಲಿಯಲ್ಲಿ ರಂಧ್ರ ಮಾಡಲು ದೊಡ್ಡವರ ಸಹಾಯ ಪಡೆಯಿರಿ. ಚೆಲ್ಲಿದ ನೀರನ್ನು ತಕ್ಷಣ ಒರೆಸಿ.',
            },
            steps: {
              en: [
                'Make three small holes stacked vertically on one side of the bottle (top, middle, bottom) and cover them with tape.',
                'Fill the bottle with water up to the neck and place it at the edge of a tray.',
                'Peel off the tape cleanly and measure how far each water stream lands (cm).',
              ],
              hi: [
                'बोतल के एक तरफ ऊपर से नीचे तीन छोटे छेद बनाएँ (ऊपरी, बीच, निचला) और टेप से बंद करें।',
                'बोतल में पानी भरें और उसे ट्रे के किनारे रखें।',
                'टेप हटाएँ और मापें कि हर छेद से पानी की धार कितनी दूर (cm) गिरती है।',
              ],
              kn: [
                'ಬಾಟಲಿಯ ಒಂದು ಬದಿಯಲ್ಲಿ ಮೇಲಿಂದ ಕೆಳಕ್ಕೆ ಮೂರು ಸಣ್ಣ ರಂಧ್ರಗಳನ್ನು ಮಾಡಿ ಟೇಪ್‌ನಿಂದ ಮುಚ್ಚಿ.',
                'ಬಾಟಲಿಯಲ್ಲಿ ನೀರು ತುಂಬಿ ಟ್ರೇ ಅಂಚಿನಲ್ಲಿ ಇರಿಸಿ.',
                'ಟೇಪ್ ತೆಗೆದು ಪ್ರತಿ ರಂಧ್ರದಿಂದ ನೀರಿನ ಧಾರೆ ಎಷ್ಟು ದೂರ (cm) ಬೀಳುತ್ತದೆ ಎಂದು ಅಳೆಯಿರಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Hole Position', 'Depth Below Surface (cm)', 'Stream Distance (cm)'],
                hi: ['छेद की स्थिति', 'सतह से गहराई (cm)', 'धार की दूरी (cm)'],
                kn: ['ರಂಧ್ರದ ಸ್ಥಾನ', 'ಮೇಲ್ಮೈಯಿಂದ ಆಳ (cm)', 'ನೀರಿನ ದೂರ (cm)'],
              },
              sampleRows: [
                ['Top hole', '4 cm', '6 cm'],
                ['Middle hole', '10 cm', '13 cm'],
                ['Bottom hole', '16 cm', '19 cm'],
              ],
            },
            predictionQuestion: {
              en: 'Which hole shoots water the farthest out?',
              hi: 'किस छेद से पानी सबसे दूर तक जाएगा?',
              kn: 'ಯಾವ ರಂಧ್ರದಿಂದ ನೀರು ಅತಿ ಹೆಚ್ಚು ದೂರಕ್ಕೆ ಸಿಂಪಡಿಸುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'The bottom hole (most water weight above it)',
                'The top hole (closest to the air)',
                'All three holes shoot the exact same distance',
              ],
              hi: [
                'सबसे निचला छेद (ऊपर पानी का भार सबसे अधिक)',
                'सबसे ऊपरी छेद (हवा के पास)',
                'तीनों से बिल्कुल समान दूरी पर',
              ],
              kn: [
                'ಕೆಳಗಿನ ರಂಧ್ರ (ಮೇಲೆ ಹೆಚ್ಚು ನೀರಿನ ತೂಕವಿದೆ)',
                'ಮೇಲಿನ ರಂಧ್ರ (ಗಾಳಿಗೆ ಹತ್ತಿರವಾಗಿದೆ)',
                'ಮೂರರಿಂದಲೂ ಒಂದೇ ದೂರಕ್ಕೆ ಹಾರುತ್ತದೆ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Think about carrying 1 book on your head vs 5 books stacked.',
                'Deeper water has a taller column of water pressing down from above.',
              ],
              hi: [
                '1 किताब बनाम 5 किताबों का वज़न ऊपर रखने जैसा सोचें।',
                'अधिक गहराई पर ऊपर मौजूद पानी का स्तंभ ज़्यादा दाब डालता है।',
              ],
              kn: [
                'ತಲೆಯ ಮೇಲೆ 1 ಪುಸ್ತಕ ಇಡುವುದು ಮತ್ತು 5 ಪುಸ್ತಕಗಳನ್ನು ಇಡುವುದನ್ನು ಹೋಲಿಸಿ.',
                'ಆಳ ಹೆಚ್ಚಾದಂತೆ ಮೇಲಿರುವ ನೀರಿನ ಭಾರದಿಂದ ಒತ್ತಡ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'Water pressure increases with depth because the weight of all the water above pushes downward and sideways, forcing the bottom jet out fastest.',
              hi: 'गहराई बढ़ने के साथ जल दाब बढ़ता है क्योंकि ऊपर के पूरे पानी का भार नीचे की ओर धक्का देता है, जिससे निचले छेद से धार सबसे तेज़ निकलती है।',
              kn: 'ಆಳ ಹೆಚ್ಚಾದಂತೆ ಮೇಲಿನ ನೀರಿನ ತೂಕ ಕೆಳಕ್ಕೂ ಪಕ್ಕಕ್ಕೂ ಒತ್ತುವುದರಿಂದ ಕೆಳಗಿನ ರಂಧ್ರದಿಂದ ನೀರು ಅತಿ ವೇಗವಾಗಿ ಮತ್ತು ದೂರಕ್ಕೆ ಬೀಳುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch10',
        chapterNumber: 10,
        title: {
          en: 'Light: Mirrors and Lenses',
          hi: 'प्रकाश: दर्पण और लेंस',
          kn: 'ಬೆಳಕು: ದರ್ಪಣಗಳು ಮತ್ತು ಮಸೂರಗಳು',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Reflection, Refraction, Mirrors & Lenses',
          hi: 'परावर्तन, अपवर्तन, दर्पण और लेंस',
          kn: 'ಪ್ರತಿಫಲನ, ವಕ್ರೀಭವನ, ದರ್ಪಣ ಮತ್ತು ಮಸೂರಗಳು',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Curved mirrors (concave and convex) reflect light to converge or diverge rays, while lenses (convex and concave) refract (bend) light passing through transparent glass or water.',
          hi: 'गोलीय दर्पण (अवतल व उत्तल) प्रकाश को परावर्तित कर किरणों को मिलाते या फैलाते हैं, जबकि लेंस पारदर्शी माध्यम से गुजरते समय प्रकाश को अपवर्तित (मोड़ते) करते हैं।',
          kn: 'ವಕ್ರ ದರ್ಪಣಗಳು (ನಿಮ್ನ ಮತ್ತು ಪೀನ) ಬೆಳಕನ್ನು ಪ್ರತಿಫಲಿಸುತ್ತವೆ, ಆದರೆ ಮಸೂರಗಳು ಪಾರದರ್ಶಕ ಗಾಜು ಅಥವಾ ನೀರಿನ ಮೂಲಕ ಬೆಳಕನ್ನು ವಕ್ರೀಭವನ (ಬಾಗುವಂತೆ) ಮಾಡುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch10-spoon-mirror',
            relationType: 'in-chapter',
            activityMode: 'home-safe',
            title: {
              en: 'Steel Spoon Mirror: Concave (Inner) vs Convex (Back)',
              hi: 'स्टील चम्मच दर्पण: अवतल (भीतरी) बनाम उत्तल (बाहरी)',
              kn: 'ಸ್ಟೀಲ್ ಚಮಚ ದರ್ಪಣ: ನಿಮ್ನ (ಒಳಗೆ) ಮತ್ತು ಪೀನ (ಹೊರಗೆ)',
            },
            objective: {
              en: 'Observe how the inner (concave) and outer (convex) curved sides of a shiny steel spoon change your reflection.',
              hi: 'देखें कि चमकदार स्टील के चम्मच की भीतरी (अवतल) और बाहरी (उत्तल) सतह पर प्रतिबिंब कैसे बदलता है।',
              kn: 'ಹೊಳೆಯುವ ಸ್ಟೀಲ್ ಚಮಚದ ಒಳ (ನಿಮ್ನ) ಮತ್ತು ಹೊರ (ಪೀನ) ಬದಿಗಳಲ್ಲಿ ನಿಮ್ಮ ಪ್ರತಿಬಿಂಬ ಹೇಗೆ ಕಾಣುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ.',
            },
            materials: {
              en: ['1 clean shiny steel spoon', 'Bright room window or torch light'],
              hi: ['1 साफ चमकदार स्टील का चम्मच', 'रोशन खिड़की या टॉर्च की रोशनी'],
              kn: ['1 ಸ್ವಚ್ಛವಾದ ಹೊಳೆಯುವ ಸ್ಟೀಲ್ ಚಮಚ', 'ಬೆಳಕಿರುವ ಕಿಟಕಿ ಅಥವಾ ಟಾರ್ಚ್'],
            },
            safetyNote: {
              en: 'Never point a mirror or shiny spoon directly into bright sunlight toward your eyes.',
              hi: 'दर्पण या चमकदार चम्मच से तेज धूप को कभी सीधे आँखों में परावर्तित न करें।',
              kn: 'ದರ್ಪಣ ಅಥವಾ ಚಮಚದಿಂದ ನೇರವಾಗಿ ಸೂರ್ಯನ ಬೆಳಕನ್ನು ಕಣ್ಣುಗಳ ಕಡೆಗೆ ಪ್ರತಿಫಲಿಸಬೇಡಿ.',
            },
            steps: {
              en: [
                'Hold the curved back (outer side) of the spoon about 20 cm from your face and look at your image.',
                'Now flip to the hollow inner side at 25 cm away and note whether the image is upright or upside down.',
                'Slowly bring the hollow inner side very close (3–4 cm) to your nose and notice what changes!',
              ],
              hi: [
                'चम्मच के उभरे हुए बाहरी हिस्से को चेहरे से 20 cm दूर रखकर अपना प्रतिबिंब देखें।',
                'अब खोखले भीतरी हिस्से को 25 cm दूर रखें और देखें कि प्रतिबिंब सीधा है या उल्टा।',
                'धीरे-धीरे भीतरी हिस्से को नाक के बहुत पास (3–4 cm) लाएँ और बदलाव देखें।',
              ],
              kn: [
                'ಚಮಚದ ಉಬ್ಬಿದ ಹೊರಭಾಗವನ್ನು ಮುಖದಿಂದ 20 cm ದೂರ ಹಿಡಿದು ಪ್ರತಿಬಿಂಬ ನೋಡಿ.',
                'ಈಗ ಒಳಗಿನ ಗುಳಿ ಭಾಗವನ್ನು 25 cm ದೂರದಲ್ಲಿ ಹಿಡಿದು ಚಿತ್ರ ನೇರವಾಗಿದೆಯೇ ಅಥವಾ ತಲೆಕೆಳಗಾಗಿದೆಯೇ ನೋಡಿ.',
                'ಒಳಭಾಗವನ್ನು ನಿಧಾನವಾಗಿ ಮೂಗಿನ ಹತ್ತಿರ (3–4 cm) ತಂದು ಬದಲಾವಣೆಯನ್ನು ಗಮನಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Spoon Side', 'Distance from Face', 'Image Size & Orientation'],
                hi: ['चम्मच की सतह', 'चेहरे से दूरी', 'प्रतिबिंब का आकार व दिशा'],
                kn: ['ಚಮಚದ ಬದಿ', 'ಮುಖದಿಂದ ದೂರ', 'ಪ್ರತಿಬಿಂಬದ ಗಾತ್ರ ಮತ್ತು ದಿಕ್ಕು'],
              },
              sampleRows: [
                ['Outer (Convex)', '20 cm', 'Smaller & upright'],
                ['Inner (Concave)', '25 cm', 'Upside down (inverted)'],
                ['Inner (Concave)', '3 cm', 'Magnified & upright'],
              ],
            },
            predictionQuestion: {
              en: 'When looking into the hollow inner side from 25 cm away, how does your face look?',
              hi: '25 cm दूर से चम्मच की भीतरी (अवतल) सतह में आपका चेहरा कैसा दिखेगा?',
              kn: '25 cm ದೂರದಿಂದ ಚಮಚದ ಒಳ (ನಿಮ್ನ) ಬದಿಯಲ್ಲಿ ನಿಮ್ಮ ಮುಖ ಹೇಗೆ ಕಾಣುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'Upside down (inverted)',
                'Always upright and tiny',
                'Completely invisible',
              ],
              hi: [
                'उल्टा (सिर नीचे)',
                'हमेशा सीधा और बहुत छोटा',
                'बिल्कुल दिखाई नहीं देगा',
              ],
              kn: [
                'ತಲೆಕೆಳಗಾಗಿ (Inverted)',
                'ಯಾವಾಗಲೂ ನೇರ ಮತ್ತು ಚಿಕ್ಕದಾಗಿ',
                'ಸಂಪೂರ್ಣವಾಗಿ ಕಾಣಿಸುವುದಿಲ್ಲ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'The hollow spoon curves inward like a concave mirror.',
                'Beyond the focal point, reflected rays cross each other before reaching your eyes.',
              ],
              hi: [
                'चम्मच का भीतरी हिस्सा अवतल दर्पण की तरह अंदर मुड़ा होता है।',
                'फोकस बिंदु के बाहर परावर्तित किरणें आपस में कटती हैं, जिससे प्रतिबिंब उल्टा बनता है।',
              ],
              kn: [
                'ಚಮಚದ ಒಳಭಾಗ ನಿಮ್ನ ದರ್ಪಣದಂತೆ ಒಳಕ್ಕೆ ಬಾಗಿದೆ.',
                'ಫೋಕಸ್ ಬಿಂದುವಿನ ಆಚೆಗೆ ಬೆಳಕಿನ ಕಿರಣಗಳು ಒಂದನ್ನೊಂದು ದಾಟುವುದರಿಂದ ಚಿತ್ರ ತಲೆಕೆಳಗಾಗುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'The outer surface (convex mirror) spreads light rays outward, always forming a smaller upright view (like bike side mirrors). The inner surface (concave mirror) brings rays to a focus, inverting distant objects and magnifying very close ones.',
              hi: 'बाहरी उत्तल सतह किरणों को फैलाती है, इसलिए प्रतिबिंब छोटा व सीधा बनता है (वाहन साइड मिरर की तरह)। भीतरी अवतल सतह किरणों को मोड़ती है, जिससे दूर का प्रतिबिंब उल्टा और बहुत पास की वस्तु बड़ी दिखती है।',
              kn: 'ಹೊರ ಪೀನ ಮೇಲ್ಮೈ ಕಿರಣಗಳನ್ನು ಹರಡುವುದರಿಂದ ಚಿಕ್ಕ ಮತ್ತು ನೇರ ಪ್ರತಿಬಿಂಬ (ವಾಹನಗಳ ಸೈಡ್ ಮಿರರ್‌ನಂತೆ) ಕಾಣುತ್ತದೆ. ಒಳ ನಿಮ್ನ ಮೇಲ್ಮೈ ದೂರದ ವಸ್ತುವನ್ನು ತಲೆಕೆಳಗಾಗಿ ಮತ್ತು ಹತ್ತಿರದ ವಸ್ತುವನ್ನು ದೊಡ್ಡದಾಗಿ ತೋರಿಸುತ್ತದೆ.',
            },
          },
          {
            id: 'curiosity-ch10-snell-sim',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSimExperiment: 'optics',
            title: {
              en: "Refraction Lab: Light Bending & Snell's Law",
              hi: 'अपवर्तन लैब: प्रकाश का मुड़ना और स्नेल का नियम',
              kn: 'ವಕ್ರೀಭವನ ಲ್ಯಾಬ್: ಬೆಳಕಿನ ಬಾಗುವಿಕೆ ಮತ್ತು ಸ್ನೆಲ್ ನಿಯಮ',
            },
            objective: {
              en: 'Measure how light bends when moving between air (n = 1.00), water (n = 1.33), and glass (n = 1.52).',
              hi: 'मापें कि हवा (n = 1.00), पानी (n = 1.33) और काँच (n = 1.52) के बीच प्रकाश कितना मुड़ता है।',
              kn: 'ಗಾಳಿ (1.00), ನೀರು (1.33) ಮತ್ತು ಗಾಜು (1.52) ನಡುವೆ ಬೆಳಕು ಹೇಗೆ ಬಾಗುತ್ತದೆ ಎಂದು ಅಳೆಯಿರಿ.',
            },
            materials: {
              en: ['Gyaan Graph Interactive Optics Simulation (works offline)'],
              hi: ['Gyaan Graph इंटरैक्टिव प्रकाशिकी सिम्युलेटर (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಸಂವಾದಾತ್ಮಕ ದೃಗ್ವಿಜ್ಞಾನ ಸಿಮ್ಯುಲೇಟರ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual laser beam — safe to test any angle without eye hazard.',
              hi: 'वर्चुअल लेज़र किरण — आँखों को बिना किसी खतरे के किसी भी कोण का परीक्षण करें।',
              kn: 'ವರ್ಚುವಲ್ ಲೇಸರ್ ಕಿರಣ — ಕಣ್ಣುಗಳಿಗೆ ಯಾವುದೇ ಅಪಾಯವಿಲ್ಲದೆ ಎಲ್ಲಾ ಕೋನಗಳನ್ನು ಪರೀಕ್ಷಿಸಬಹುದು.',
            },
            steps: {
              en: [
                'Open Optics in Physics Labs and set Medium 1 to Air (1.00) and Medium 2 to Glass (1.52).',
                'Slide Incidence Angle θ₁ to 30° and read the refracted angle θ₂.',
                'Now swap (Medium 1 = Glass 1.52, Medium 2 = Air 1.00) and increase θ₁ past 42° to see Total Internal Reflection.',
              ],
              hi: [
                'भौतिकी लैब में प्रकाशिकी खोलें और माध्यम 1 = हवा (1.00), माध्यम 2 = काँच (1.52) चुनें।',
                'आपतन कोण θ₁ = 30° सेट करके अपवर्तन कोण θ₂ पढ़ें।',
                'अब माध्यम 1 = काँच (1.52) और माध्यम 2 = हवा (1.00) करके θ₁ को 42° से बढ़ाएँ और पूर्ण आंतरिक परावर्तन देखें।',
              ],
              kn: [
                'ಭೌತಶಾಸ್ತ್ರ ಲ್ಯಾಬ್‌ನಲ್ಲಿ ದೃಗ್ವಿಜ್ಞಾನ ತೆರೆದು ಮಾಧ್ಯಮ 1 = ಗಾಳಿ (1.00), ಮಾಧ್ಯಮ 2 = ಗಾಜು (1.52) ಹೊಂದಿಸಿ.',
                'ಆಪಾತ ಕೋನ θ₁ = 30° ಇಟ್ಟು ವಕ್ರೀಭವನ ಕೋನ θ₂ ಓದಿ.',
                'ಈಗ ಮಾಧ್ಯಮಗಳನ್ನು ಬದಲಾಯಿಸಿ θ₁ ಅನ್ನು 42° ಗಿಂತ ಹೆಚ್ಚಿಸಿ ಸಂಪೂರ್ಣ ಆಂತರಿಕ ಪ್ರತಿಫಲನ ನೋಡಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Path', 'θ₁ (Incidence)', 'Result / θ₂'],
                hi: ['दिशा', 'θ₁ (आपतन कोण)', 'परिणाम / θ₂'],
                kn: ['ಮಾರ್ಗ', 'θ₁ (ಆಪಾತ ಕೋನ)', 'ಫಲಿತಾಂಶ / θ₂'],
              },
              sampleRows: [
                ['Air (1.00) → Glass (1.52)', '30°', '19.2° (bends toward normal)'],
                ['Glass (1.52) → Air (1.00)', '45°', 'Total Internal Reflection'],
              ],
            },
            predictionQuestion: {
              en: 'When light enters glass (denser) from air (rarer), which way does the ray bend?',
              hi: 'जब प्रकाश हवा से काँच (सघन माध्यम) में जाता है, तो किरण किस ओर मुड़ती है?',
              kn: 'ಬೆಳಕು ಗಾಳಿಯಿಂದ ಗಾಜಿನೊಳಗೆ (ಸಾಂದ್ರ ಮಾಧ್ಯಮ) ಪ್ರವೇಶಿಸಿದಾಗ ಕಿರಣ ಯಾವ ಕಡೆಗೆ ಬಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'Toward the normal line',
                'Away from the normal line',
                'Turns straight backward at 180°',
              ],
              hi: [
                'अभिलंब (normal) की ओर झुकती है',
                'अभिलंब से दूर हटती है',
                '180° पीछे मुड़ जाती है',
              ],
              kn: [
                'ಲಂಬ ರೇಖೆಯ (Normal) ಕಡೆಗೆ ಬಾಗುತ್ತದೆ',
                'ಲಂಬ ರೇಖೆಯಿಂದ ದೂರ ಬಾಗುತ್ತದೆ',
                '180° ಹಿಂದಕ್ಕೆ ತಿರುಗುತ್ತದೆ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Light slows down inside glass compared to air.',
                'Slower speed in a denser medium pulls θ₂ closer to the normal line.',
              ],
              hi: [
                'हवा की तुलना में काँच में प्रकाश की चाल धीमी हो जाती है।',
                'धीमी चाल होने के कारण किरण अभिलंब के करीब मुड़ती है।',
              ],
              kn: [
                'ಗಾಳಿಗೆ ಹೋಲಿಸಿದರೆ ಗಾಜಿನೊಳಗೆ ಬೆಳಕಿನ ವೇಗ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
                'ವೇಗ ಕಡಿಮೆಯಾದಾಗ ಕಿರಣ ಲಂಬ ರೇಖೆಯ ಹತ್ತಿರಕ್ಕೆ ಬಾಗುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'Light slows down as it enters a higher-refractive-index material like glass or water, causing the wavefront to pivot toward the normal line.',
              hi: 'काँच या पानी जैसे सघन माध्यम में प्रकाश की चाल कम हो जाती है, जिससे किरण अभिलंब की ओर मुड़ जाती है। यही सिद्धांत लेंस में भी काम करता है।',
              kn: 'ಗಾಜು ಅಥವಾ ನೀರಿನಂತಹ ಸಾಂದ್ರ ಮಾಧ್ಯಮದಲ್ಲಿ ಬೆಳಕಿನ ವೇಗ ಕಡಿಮೆಯಾಗುವುದರಿಂದ ಕಿರಣ ಲಂಬ ರೇಖೆಯ ಕಡೆಗೆ ಬಾಗುತ್ತದೆ.',
            },
          },
          {
            id: 'curiosity-ch10-lens-bench',
            relationType: 'in-chapter',
            activityMode: 'school-lab',
            linkedSimExperiment: 'optics',
            title: {
              en: 'School Lab: Focusing a Distant Window with a Convex Lens',
              hi: 'स्कूल लैब: उत्तल लेंस से दूर की खिड़की का प्रतिबिंब बनाना',
              kn: 'ಶಾಲಾ ಪ್ರಯೋಗಾಲಯ: ಪೀನ ಮಸೂರದಿಂದ ದೂರದ ಕಿಟಕಿಯ ಪ್ರತಿಬಿಂಬ ಪಡೆಯುವುದು',
            },
            objective: {
              en: 'Measure the focal length (cm) of a convex glass lens by forming a sharp image of a distant tree or window on a white paper screen.',
              hi: 'सफेद कागज पर दूर की खिड़की या पेड़ का स्पष्ट प्रतिबिंब बनाकर उत्तल लेंस की फोकस दूरी (cm) मापें।',
              kn: 'ಬಿಳಿ ಕಾಗದದ ಮೇಲೆ ದೂರದ ಕಿಟಕಿ ಅಥವಾ ಮರದ ಸ್ಪಷ್ಟ ಪ್ರತಿಬಿಂಬವನ್ನು ಪಡೆದು ಪೀನ ಮಸೂರದ ಸಂಗಮ ದೂರವನ್ನು (cm) ಅಳೆಯಿರಿ.',
            },
            materials: {
              en: ['1 convex lens on stand', 'White cardboard screen', 'Meter scale (cm)', 'Distant bright window (not direct Sun)'],
              hi: ['स्टैंड सहित 1 उत्तल लेंस', 'सफेद गत्ते का पर्दा', 'मीटर पैमाना (cm)', 'दूर स्थित रोशन खिड़की (सीधे सूर्य की ओर नहीं)'],
              kn: ['ಸ್ಟ್ಯಾಂಡ್ ಸಹಿತ 1 ಪೀನ ಮಸೂರ', 'ಬಿಳಿ ಕಾರ್ಡ್‌ಬೋರ್ಡ್ ಪರದೆ', 'ಮೀಟರ್ ಅಳತೆಪಟ್ಟಿ (cm)', 'ದೂರದ ಬೆಳಕಿರುವ ಕಿಟಕಿ (ನೇರ ಸೂರ್ಯನಲ್ಲ)'],
            },
            safetyNote: {
              en: 'NEVER focus direct sunlight onto paper or skin with a magnifying convex lens—it can start a fire or burn eyes.',
              hi: 'कभी भी उत्तल लेंस से सीधे सूर्य की रोशनी को कागज या त्वचा पर केंद्रित न करें—आग लग सकती है।',
              kn: 'ಎಂದಿಗೂ ಪೀನ ಮಸೂರದಿಂದ ನೇರ ಸೂರ್ಯನ ಬೆಳಕನ್ನು ಕಾಗದ ಅಥವಾ ಚರ್ಮದ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸಬೇಡಿ.',
            },
            steps: {
              en: [
                'Face a bright distant window or tree inside a shaded room.',
                'Hold the convex lens in front of the white paper screen and slide the screen slowly back and forth.',
                'Stop where the image on the paper looks sharpest, and measure lens-to-screen distance in cm.',
              ],
              hi: [
                'कमरे के अंदर किसी रोशन खिड़की या दूर के पेड़ की ओर मुँह करें।',
                'सफेद पर्दे के सामने उत्तल लेंस रखें और पर्दे को धीरे-धीरे आगे-पीछे खिसकाएँ।',
                'जहाँ सबसे स्पष्ट उल्टा प्रतिबिंब बने, वहाँ लेंस से पर्दे की दूरी cm में मापें।',
              ],
              kn: [
                'ಕೋಣೆಯ ಒಳಗಿನಿಂದ ದೂರದ ಬೆಳಕಿರುವ ಕಿಟಕಿ ಅಥವಾ ಮರದ ಕಡೆಗೆ ಮಸೂರವನ್ನು ಹಿಡಿಯಿರಿ.',
                'ಬಿಳಿ ಪರದೆಯ ಮುಂದೆ ಪೀನ ಮಸೂರವನ್ನು ಇಟ್ಟು ಪರದೆಯನ್ನು ನಿಧಾನವಾಗಿ ಮುಂದೆ-ಹಿಂದೆ ಸರಿಸಿ.',
                'ಸ್ಪಷ್ಟವಾದ ತಲೆಕೆಳಗಾದ ಚಿತ್ರ ಕಾಣಿಸಿದಾಗ ಮಸೂರದಿಂದ ಪರದೆಯ ದೂರವನ್ನು cm ನಲ್ಲಿ ಅಳೆಯಿರಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Trial', 'Distant Object', 'Sharp Image Distance f (cm)', 'Orientation'],
                hi: ['प्रयास', 'दूर की वस्तु', 'फोकस दूरी f (cm)', 'प्रतिबिंब दिशा'],
                kn: ['ಪ್ರಯತ್ನ', 'ದೂರದ ವಸ್ತು', 'ಸಂಗಮ ದೂರ f (cm)', 'ಪ್ರತಿಬಿಂಬದ ದಿಕ್ಕು'],
              },
              sampleRows: [
                ['1', 'School gate tree', '15.0 cm', 'Inverted & real'],
                ['2', 'Bright window', '15.2 cm', 'Inverted & real'],
              ],
            },
            predictionQuestion: {
              en: 'How does the distant window look on the white paper screen?',
              hi: 'सफेद कागज के पर्दे पर दूर की खिड़की कैसी दिखाई देगी?',
              kn: 'ಬಿಳಿ ಕಾಗದದ ಪರದೆಯ ಮೇಲೆ ದೂರದ ಕಿಟಕಿ ಹೇಗೆ ಕಾಣಿಸುತ್ತದೆ?',
            },
            predictionOptions: {
              en: [
                'Real, smaller, and upside down (inverted)',
                'Virtual and larger than the window',
                'No light passes through glass',
              ],
              hi: [
                'वास्तविक, छोटा और उल्टा',
                'आभासी और खिड़की से बड़ा',
                'काँच से प्रकाश नहीं गुजरता',
              ],
              kn: [
                'ನೈಜ, ಚಿಕ್ಕದು ಮತ್ತು ತಲೆಕೆಳಗಾಗಿ',
                'ಕಿಟಕಿಗಿಂತ ದೊಡ್ಡದಾಗಿ',
                'ಗಾಜಿನ ಮೂಲಕ ಬೆಳಕು ಹಾದುಹೋಗುವುದಿಲ್ಲ',
              ],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: ['Parallel rays from a far object meet at the lens’s focal plane and cross upside down.'],
              hi: ['दूर की वस्तु से आने वाली समानांतर किरणें फोकस पर मिलकर उल्टा वास्तविक प्रतिबिंब बनाती हैं।'],
              kn: ['ದೂರದ ವಸ್ತುವಿನ ಸಮಾನಾಂತರ ಕಿರಣಗಳು ಸಂಗಮ ಬಿಂದುವಿನಲ್ಲಿ ಸೇರಿ ತಲೆಕೆಳಗಾದ ನೈಜ ಚಿತ್ರವನ್ನು ರಚಿಸುತ್ತವೆ.'],
            },
            whyItHappens: {
              en: 'A convex lens is thicker at the middle, bending incoming parallel rays inward so they converge onto the screen at focal length f.',
              hi: 'उत्तल लेंस बीच से मोटा होता है, इसलिए यह समानांतर किरणों को अंदर मोड़कर फोकस दूरी f पर पर्दे पर केंद्रित कर देता है।',
              kn: 'ಪೀನ ಮಸೂರವು ಮಧ್ಯದಲ್ಲಿ ದಪ್ಪವಾಗಿರುವುದರಿಂದ ಸಮಾನಾಂತರ ಕಿರಣಗಳನ್ನು ಒಳಕ್ಕೆ ಬಾಗಿಸಿ ಸಂಗಮ ದೂರ f ನಲ್ಲಿ ಪರದೆಯ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch11',
        chapterNumber: 11,
        title: {
          en: 'Keeping Time with the Skies',
          hi: 'आसमान से समय की पहचान',
          kn: 'ಆಕಾಶದೊಂದಿಗೆ ಸಮಯದ ಲೆಕ್ಕಾಚಾರ',
        },
        primarySubject: 'physics',
        topicTag: {
          en: 'Shadows, Moon Phases, Earth Rotation & Orbits',
          hi: 'परछाईं, चंद्र कलाएँ, पृथ्वी का घूर्णन और कक्षाएँ',
          kn: 'ನೆರಳು, ಚಂದ್ರನ ಕಲೆಗಳು, ಭೂಮಿಯ ಭ್ರಮಣೆ ಮತ್ತು ಕಕ್ಷೆ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Earth spins on its axis once every 24 hours and orbits the Sun once a year, while the Moon orbits Earth—creating daily shadow shifts, lunar phases, calendars, and seasonal cycles.',
          hi: 'पृथ्वी अपनी धुरी पर 24 घंटे में घूमती है और सूर्य की परिक्रमा करती है, जबकि चंद्रमा पृथ्वी की परिक्रमा करता है—जिससे परछाइयाँ, चंद्र कलाएँ और मौसम बदलते हैं।',
          kn: 'ಭೂಮಿಯು 24 ಗಂಟೆಗಳಲ್ಲಿ ತನ್ನ ಅಕ್ಷದ ಮೇಲೆ ತಿರುಗುತ್ತದೆ ಮತ್ತು ಸೂರ್ಯನನ್ನು ಸುತ್ತುತ್ತದೆ, ಚಂದ್ರನು ಭೂಮಿಯನ್ನು ಸುತ್ತುತ್ತದೆ—ಇದರಿಂದ ನೆರಳಿನ ಬದಲಾವಣೆ ಮತ್ತು ಚಂದ್ರನ ಕಲೆಗಳು ಉಂಟಾಗುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch11-sundial',
            relationType: 'in-chapter',
            activityMode: 'home-safe',
            title: {
              en: 'Track Sun Shadow Length & Direction Outside (Sundial)',
              hi: 'धूप में परछाईं की लंबाई व दिशा मापें (धूपघड़ी)',
              kn: 'ಹೊರಗೆ ಬಿಸಿಲಿನಲ್ಲಿ ನೆರಳಿನ ಉದ್ದ ಮತ್ತು ದಿಕ್ಕನ್ನು ಅಳೆಯಿರಿ (ಸೂರ್ಯಗಡಿಯಾರ)',
            },
            objective: {
              en: 'Measure how a stick’s shadow shrinks toward noon and switches direction from west to east as Earth rotates.',
              hi: 'मापें कि पृथ्वी के घूमने से सुबह से दोपहर तक छड़ी की परछाईं छोटी कैसे होती है और दिशा कैसे बदलती है।',
              kn: 'ಭೂಮಿಯ ತಿರುಗುವಿಕೆಯಿಂದ ಬೆಳಗ್ಗೆಯಿಂದ ಮಧ್ಯಾಹ್ನದವರೆಗೆ ಕೋಲಿನ ನೆರಳು ಹೇಗೆ ಚಿಕ್ಕದಾಗುತ್ತದೆ ಮತ್ತು ದಿಕ್ಕು ಬದಲಾಗುತ್ತದೆ ಎಂದು ಅಳೆಯಿರಿ.',
            },
            materials: {
              en: ['1 straight stick or pencil (15 cm)', 'Flat cardboard or sunny courtyard', 'Chalk or pen', 'Ruler (cm)', 'Watch / clock'],
              hi: ['1 सीधी छड़ी या पेंसिल (15 cm)', 'समतल गत्ता या आँगन', 'चॉक या पेन', 'पैमाना (cm)', 'घड़ी'],
              kn: ['1 ನೇರ ಕಡ್ಡಿ ಅಥವಾ ಪೆನ್ಸಿಲ್ (15 cm)', 'ಸಮತಟ್ಟಾದ ಕಾರ್ಡ್‌ಬೋರ್ಡ್ ಅಥವಾ ಅಂಗಳ', 'ಚಾಕ್ ಅಥವಾ ಪೆನ್', 'ಅಳತೆ ಪಟ್ಟಿ (cm)', 'ಗಡಿಯಾರ'],
            },
            safetyNote: {
              en: 'Never look directly at the Sun while tracking shadows! Look only at the shadow on the ground.',
              hi: 'परछाईं मापते समय कभी सीधे सूर्य की ओर न देखें! केवल जमीन पर बनी परछाईं देखें।',
              kn: 'ನೆರಳನ್ನು ಅಳೆಯುವಾಗ ಎಂದಿಗೂ ನೇರವಾಗಿ ಸೂರ್ಯನನ್ನು ನೋಡಬೇಡಿ! ನೆಲದ ಮೇಲಿನ ನೆರಳನ್ನು ಮಾತ್ರ ನೋಡಿ.',
            },
            steps: {
              en: [
                'Stand a 15 cm pencil upright on flat cardboard in a sunny spot around 9:00 AM.',
                'Mark the tip of the shadow with chalk/pen and measure its length in cm.',
                'Without moving the cardboard, measure the shadow again at 12:00 PM (noon) and 3:00 PM.',
              ],
              hi: [
                'सुबह लगभग 9:00 बजे धूप में समतल गत्ते पर 15 cm लंबी पेंसिल सीधी खड़ा करें।',
                'परछाईं के सिरे पर निशान लगाएँ और उसकी लंबाई cm में मापें।',
                'गत्ते को हिलाए बिना दोपहर 12:00 बजे और 3:00 बजे फिर से लंबाई और दिशा मापें।',
              ],
              kn: [
                'ಬೆಳಗ್ಗೆ 9:00 ಗಂಟೆಗೆ ಬಿಸಿಲಿನಲ್ಲಿ ಕಾರ್ಡ್‌ಬೋರ್ಡ್ ಮೇಲೆ 15 cm ಪೆನ್ಸಿಲ್ ಅನ್ನು ನೇರವಾಗಿ ನಿಲ್ಲಿಸಿ.',
                'ನೆರಳಿನ ತುದಿಯನ್ನು ಗುರುತಿಸಿ ಅದರ ಉದ್ದವನ್ನು cm ನಲ್ಲಿ ಅಳೆಯಿರಿ.',
                'ಕಾರ್ಡ್‌ಬೋರ್ಡ್ ಅನ್ನು ಅಲುಗಾಡಿಸದೆ ಮಧ್ಯಾಹ್ನ 12:00 ಮತ್ತು 3:00 ಗಂಟೆಗೆ ಮತ್ತೆ ಉದ್ದ ಮತ್ತು ದಿಕ್ಕನ್ನು ಅಳೆಯಿರಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Time of Day', 'Stick Height (cm)', 'Shadow Length (cm)', 'Shadow Points Toward'],
                hi: ['समय', 'छड़ी की ऊँचाई (cm)', 'परछाईं की लंबाई (cm)', 'परछाईं की दिशा'],
                kn: ['ಸಮಯ', 'ಕಡ್ಡಿಯ ಎತ್ತರ (cm)', 'ನೆರಳಿನ ಉದ್ದ (cm)', 'ನೆರಳಿನ ದಿಕ್ಕು'],
              },
              sampleRows: [
                ['09:00 AM', '15 cm', '22 cm', 'West'],
                ['12:00 PM', '15 cm', '4 cm', 'Shortest (near N/S)'],
                ['03:00 PM', '15 cm', '20 cm', 'East'],
              ],
            },
            predictionQuestion: {
              en: 'At which time is the shadow shortest?',
              hi: 'दिन के किस समय परछाईं सबसे छोटी होती है?',
              kn: 'ದಿನದ ಯಾವ ಸಮಯದಲ್ಲಿ ನೆರಳು ಅತಿ ಚಿಕ್ಕದಾಗಿರುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['Around 12:00 PM (local noon)', 'At 8:00 AM morning', 'At 5:00 PM evening'],
              hi: ['लगभग दोपहर 12:00 बजे', 'सुबह 8:00 बजे', 'शाम 5:00 बजे'],
              kn: ['ಮಧ್ಯಾಹ್ನ 12:00 ಗಂಟೆಯ ಸುಮಾರಿಗೆ', 'ಬೆಳಗ್ಗೆ 8:00 ಗಂಟೆಗೆ', 'ಸಂಜೆ 5:00 ಗಂಟೆಗೆ'],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: [
                'Think about how high the Sun appears in the sky at noon vs morning.',
                'Higher light overhead casts a shorter shadow beneath the stick.',
              ],
              hi: [
                'सोचें कि सुबह की तुलना में दोपहर में सूर्य सिर के कितने ऊपर होता है।',
                'सिर के ठीक ऊपर प्रकाश होने पर परछाईं सबसे छोटी बनती है।',
              ],
              kn: [
                'ಬೆಳಗ್ಗೆಗಿಂತ ಮಧ್ಯಾಹ್ನ ಸೂರ್ಯ ಆಕಾಶದಲ್ಲಿ ಎಷ್ಟು ಎತ್ತರದಲ್ಲಿರುತ್ತಾನೆ ಎಂದು ಯೋಚಿಸಿ.',
                'ಬೆಳಕು ನೇರವಾಗಿ ಮೇಲಿಂದ ಬಿದ್ದಾಗ ನೆರಳು ಚಿಕ್ಕದಾಗುತ್ತದೆ.',
              ],
            },
            whyItHappens: {
              en: 'As Earth spins from west to east, the Sun appears to climb higher until noon (making shadows shortest) and then move toward the west (swinging shadows eastward).',
              hi: 'पृथ्वी के पश्चिम से पूर्व घूमने के कारण सूर्य दोपहर तक ऊपर चढ़ता दिखता है (जिससे परछाईं सबसे छोटी होती है) और फिर पश्चिम की ओर जाता है।',
              kn: 'ಭೂಮಿಯು ಪಶ್ಚಿಮದಿಂದ ಪೂರ್ವಕ್ಕೆ ತಿರುಗುವುದರಿಂದ ಸೂರ್ಯನು ಮಧ್ಯಾಹ್ನದವರೆಗೆ ಎತ್ತರಕ್ಕೆ ಏರುವಂತೆ ಕಾಣುತ್ತಾನೆ ಮತ್ತು ನೆರಳು ಅತಿ ಚಿಕ್ಕದಾಗುತ್ತದೆ.',
            },
          },
        ],
      },
      // Chemistry & Biology chapters in NCERT Class 8 Curiosity (2025-26)
      {
        id: 'curiosity-ch02',
        chapterNumber: 2,
        title: {
          en: 'The Invisible Living World: Beyond Our Naked Eye',
          hi: 'अदृश्य सजीव संसार: हमारी खुली आँखों से परे',
          kn: 'ಕಣ್ಣಿಗೆ ಕಾಣದ ಜೀವ ಜಗತ್ತು',
        },
        primarySubject: 'biology',
        topicTag: {
          en: 'Cells, Microorganisms & Magnifiers',
          hi: 'कोशिकाएँ, सूक्ष्मजीव और आवर्धक',
          kn: 'ಜೀವಕೋಶಗಳು, ಸೂಕ್ಷ್ಮಜೀವಿಗಳು ಮತ್ತು ಮಸೂರ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Microorganisms and plant/animal cells are too small for the naked eye and need lenses/microscopes. Cells take in water across membranes (osmosis) and carry out life processes.',
          hi: 'सूक्ष्मजीव और कोशिकाएँ खुली आँखों से दिखाई नहीं देतीं और इन्हें देखने के लिए लेंस/सूक्ष्मदर्शी चाहिए। कोशिकाएँ झिल्ली के पार जल का आदान-प्रदान करती हैं।',
          kn: 'ಸೂಕ್ಷ್ಮಜೀವಿಗಳು ಮತ್ತು ಜೀವಕೋಶಗಳು ಬರಿಗಣ್ಣಿಗೆ ಕಾಣುವುದಿಲ್ಲ; ಮಸೂರ ಅಥವಾ ಸೂಕ್ಷ್ಮದರ್ಶಕದ ಅಗತ್ಯವಿದೆ. ಜೀವಕೋಶಗಳು ಪೊರೆಯ ಮೂಲಕ ನೀರನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch02-osmosis',
            relationType: 'related-activity',
            activityMode: 'home-safe',
            linkedSupportingWorld: 'biology',
            title: {
              en: 'Soaked Raisins & Turgor (Water Entering Cells)',
              hi: 'भीगी किशमिश प्रयोग (कोशिकाओं में जल प्रवेश)',
              kn: 'ನೆನೆಸಿದ ಒಣದ್ರಾಕ್ಷಿ ಪ್ರಯೋಗ (ಕೋಶಗಳಲ್ಲಿ ನೀರು ಪ್ರವೇಶ)',
            },
            objective: {
              en: 'Observe how dried raisins swell in plain water as water moves through cell coverings.',
              hi: 'देखें कि सादे पानी में रखने पर सूखी किशमिश कैसे फूल जाती है।',
              kn: 'ಶುದ್ಧ ನೀರಿನಲ್ಲಿ ಒಣದ್ರಾಕ್ಷಿ ಹೇಗೆ ಉಬ್ಬುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ.',
            },
            materials: {
              en: ['5 dry raisins', '1 small cup of clean drinking water', 'Spoon'],
              hi: ['5 सूखी किशमिश', '1 कप साफ पीने का पानी', 'चम्मच'],
              kn: ['5 ಒಣದ್ರಾಕ್ಷಿ', '1 ಕಪ್ ಶುದ್ಧ ನೀರು', 'ಚಮಚ'],
            },
            safetyNote: {
              en: 'Use clean cups and drinking water.',
              hi: 'साफ कप और पीने योग्य पानी का उपयोग करें।',
              kn: 'ಸ್ವಚ್ಛವಾದ ಕಪ್ ಮತ್ತು ಕುಡಿಯುವ ನೀರನ್ನು ಬಳಸಿ.',
            },
            steps: {
              en: [
                'Place 5 dry raisins in a cup of plain water.',
                'Wait 2 hours and compare their size and firmness with dry raisins.',
              ],
              hi: [
                'सादे पानी के कप में 5 सूखी किशमिश डालें।',
                '2 घंटे बाद सूखी किशमिश से उनके आकार और कसाव की तुलना करें।',
              ],
              kn: [
                'ಶುದ್ಧ ನೀರಿನ ಕಪ್‌ನಲ್ಲಿ 5 ಒಣದ್ರಾಕ್ಷಿಗಳನ್ನು ಹಾಕಿ.',
                '2 ಗಂಟೆಗಳ ನಂತರ ಅವುಗಳ ಗಾತ್ರ ಮತ್ತು ಗಟ್ಟಿತನವನ್ನು ಹೋಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Time', 'Raisin Condition'],
                hi: ['समय', 'किशमिश की स्थिति'],
                kn: ['ಸಮಯ', 'ಒಣದ್ರಾಕ್ಷಿ ಸ್ಥಿತಿ'],
              },
              sampleRows: [
                ['0 min', 'Wrinkled & flat'],
                ['120 min', 'Plump & swollen'],
              ],
            },
            predictionQuestion: {
              en: 'What happens to dry raisins left in plain water for 2 hours?',
              hi: '2 घंटे सादे पानी में रखने पर सूखी किशमिश के साथ क्या होगा?',
              kn: '2 ಗಂಟೆ ನೀರಿನಲ್ಲಿ ಇಟ್ಟ ಒಣದ್ರಾಕ್ಷಿಗೆ ಏನಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['They absorb water and swell up', 'They shrink even smaller', 'They dissolve completely'],
              hi: ['वे पानी सोखकर फूल जाएँगी', 'वे और सिकुड़ जाएँगी', 'वे पूरी तरह घुल जाएँगी'],
              kn: ['ಅವು ನೀರನ್ನು ಹೀರಿ ಉಬ್ಬುತ್ತವೆ', 'ಅವು ಇನ್ನೂ ಕುಗ್ಗುತ್ತವೆ', 'ಅವು ಸಂಪೂರ್ಣ ಕರಗುತ್ತವೆ'],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: ['Water moves from where water is plentiful (outside) to where sugars are concentrated (inside).'],
              hi: ['पानी बाहर से अधिक शर्करा वाले भीतरी भाग की ओर जाता है।'],
              kn: ['ನೀರು ಹೊರಗಿನಿಂದ ಒಳಗಿನ ಸಿಹಿ ಭಾಗದ ಕಡೆಗೆ ಚಲಿಸುತ್ತದೆ.'],
            },
            whyItHappens: {
              en: 'By osmosis, water crosses the raisin’s semi-permeable skin into the sugar-rich cells, making them swell.',
              hi: 'परासरण (osmosis) द्वारा पानी किशमिश की अर्धपारगम्य झिल्ली पार करके भीतर जाता है और उसे फुला देता है।',
              kn: 'ಆಸ್ಮೋಸಿಸ್ ಮೂಲಕ ನೀರು ಒಣದ್ರಾಕ್ಷಿಯ ಪೊರೆಯನ್ನು ದಾಟಿ ಒಳಗೆ ಹೋಗಿ ಅದನ್ನು ಉಬ್ಬಿಸುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch03',
        chapterNumber: 3,
        title: {
          en: 'Health: The Ultimate Treasure',
          hi: 'स्वास्थ्य: सबसे बड़ा खजाना',
          kn: 'ಆರೋಗ್ಯ: ಅತ್ಯುತ್ತಮ ಸಂಪತ್ತು',
        },
        primarySubject: 'biology',
        topicTag: {
          en: 'Nutrition, Hygiene & Disease Prevention',
          hi: 'पोषण, स्वच्छता और रोग निवारण',
          kn: 'ಪೋಷಣೆ, ಸ್ವಚ್ಛತೆ ಮತ್ತು ರೋಗ ತಡೆಗಟ್ಟುವಿಕೆ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Good health includes physical, mental, and social well-being. Balanced nutrition, clean water, vaccines, and hand hygiene protect against communicable and deficiency illnesses.',
          hi: 'अच्छे स्वास्थ्य में शारीरिक, मानसिक और सामाजिक कल्याण शामिल हैं। संतुलित आहार, स्वच्छ जल, टीके और हाथ की स्वच्छता रोगों से बचाती है।',
          kn: 'ಉತ್ತಮ ಆರೋಗ್ಯವು ದೈಹಿಕ ಮತ್ತು ಮಾನಸಿಕ ಕ್ಷೇಮವನ್ನು ಒಳಗೊಂಡಿದೆ. ಸಮತೋಲಿತ ಆಹಾರ, ಶುದ್ಧ ನೀರು, ಲಸಿಕೆ ಮತ್ತು ಕೈ ಸ್ವಚ್ಛತೆ ರೋಗಗಳಿಂದ ರಕ್ಷಿಸುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch03-bio-sim',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSupportingWorld: 'biology',
            title: {
              en: 'Biology World: Plant Nutrition & Stomata Quiz',
              hi: 'जीव विज्ञान जगत: पोषण और रंध्र गतिविधि',
              kn: 'ಜೀವಶಾಸ್ತ್ರ ಲೋಕ: ಸಸ್ಯ ಪೋಷಣೆ ಮತ್ತು ಸ್ಟೊಮಾಟಾ ಚಟುವಟಿಕೆ',
            },
            objective: {
              en: 'Explore Biology World lessons and complete the 3-question biology check.',
              hi: 'जीव विज्ञान जगत के पाठ देखें और 3 प्रश्नों की जाँच पूरी करें।',
              kn: 'ಜೀವಶಾಸ್ತ್ರ ಲೋಕದ ಪಾಠಗಳನ್ನು ನೋಡಿ ಮತ್ತು 3 ಪ್ರಶ್ನೆಗಳ ಕ್ವಿಜ್ ಪೂರ್ಣಗೊಳಿಸಿ.',
            },
            materials: {
              en: ['Gyaan Graph Biology World (works offline)'],
              hi: ['Gyaan Graph जीव विज्ञान जगत (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಜೀವಶಾಸ್ತ್ರ ಲೋಕ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Digital learning module — safe for offline study.',
              hi: 'डिजिटल अध्ययन मॉड्यूल — ऑफ़लाइन उपयोग के लिए सुरक्षित।',
              kn: 'ಡಿಜಿಟಲ್ ಕಲಿಕಾ ಘಟಕ — ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಬಳಸಬಹುದು.',
            },
            steps: {
              en: ['Open Biology World to adjust sunlight & moisture and answer the biology quiz.'],
              hi: ['जीव विज्ञान जगत खोलें, सूर्य के प्रकाश व नमी को समायोजित करें और क्विज़ हल करें।'],
              kn: ['ಜೀವಶಾಸ್ತ್ರ ಲೋಕ ತೆರೆದು ಸೂರ್ಯನ ಬೆಳಕು ಮತ್ತು ತೇವಾಂಶ ಬದಲಾಯಿಸಿ ಕ್ವಿಜ್ ಉತ್ತರಿಸಿ.'],
            },
            observationTable: {
              columns: { en: ['Condition', 'Expected Flow'], hi: ['स्थिति', 'अपेक्षित प्रवाह'], kn: ['ಸ್ಥಿತಿ', 'ನಿರೀಕ್ಷಿತ ಹರಿವು'] },
              sampleRows: [['Stomata Open + High Moisture', 'High water transport']],
            },
            predictionQuestion: {
              en: 'What happens to plant water uptake when stomata close tightly?',
              hi: 'जब पौधे के रंध्र (स्टोमेटा) बंद हो जाते हैं तो जल अवशोषण पर क्या असर होता है?',
              kn: 'ಸಸ್ಯದ ಸ್ಟೊಮಾಟಾ ಮುಚ್ಚಿದಾಗ ನೀರಿನ ಸಾಗಣೆಗೆ ಏನಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['Water upward flow drops sharply', 'Water upward flow triples', 'Leaves turn into stone'],
              hi: ['जल का ऊपर की ओर प्रवाह तेजी से घटता है', 'प्रवाह तीन गुना बढ़ता है', 'पत्ते पत्थर बन जाते हैं'],
              kn: ['ನೀರಿನ ಮೇಲ್ಮುಖ ಹರಿವು ತೀವ್ರವಾಗಿ ಕಡಿಮೆಯಾಗುತ್ತದೆ', 'ಹರಿವು ಮೂರು ಪಟ್ಟು ಹೆಚ್ಚಾಗುತ್ತದೆ', 'ಎಲೆಗಳು ಕಲ್ಲಾಗುತ್ತವೆ'],
            },
            predictionCorrectIndex: 0,
            hints: { en: ['Transpiration from open pores pulls water upward.'], hi: ['खुले रंध्रों से वाष्पोत्सर्जन जल को ऊपर खींचता है।'], kn: ['ತೆರೆದ ರಂಧ್ರಗಳಿಂದ ಆವಿಯಾಗುವಿಕೆ ನೀರನ್ನು ಮೇಲಕ್ಕೆ ಎಳೆಯುತ್ತದೆ.'] },
            whyItHappens: {
              en: 'Open stomata allow transpiration pull; closing them slows water loss and upward xylem flow.',
              hi: 'खुले रंध्रों से वाष्पोत्सर्जन खिंचाव होता है; बंद होने पर जल हानि और जाइलम प्रवाह धीमा होता है।',
              kn: 'ತೆರೆದ ಸ್ಟೊಮಾಟಾ ನೀರನ್ನು ಮೇಲಕ್ಕೆ ಎಳೆಯಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ; ಮುಚ್ಚಿದಾಗ ಹರಿವು ನಿಧಾನವಾಗುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch07',
        chapterNumber: 7,
        title: {
          en: 'Particulate Nature of Matter',
          hi: 'पदार्थ की कणीय प्रकृति',
          kn: 'ದ್ರವ್ಯದ ಕಣ ಸ್ವಭಾವ',
        },
        primarySubject: 'chemistry',
        topicTag: {
          en: 'Solids, Liquids, Gases & Particle Spacing',
          hi: 'ठोस, द्रव, गैस और कणों की दूरी',
          kn: 'ಘನ, ದ್ರವ, ಅನಿಲ ಮತ್ತು ಕಣಗಳ ಅಂತರ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'All matter is made of tiny moving particles with spaces between them. Gas particles have the largest spaces and move fastest when heated.',
          hi: 'सभी पदार्थ अत्यंत छोटे गतिशील कणों से बने होते हैं जिनके बीच रिक्त स्थान होता है। गैसों में कण सबसे दूर और गर्म करने पर सबसे तेज़ चलते हैं।',
          kn: 'ಎಲ್ಲಾ ದ್ರವ್ಯವೂ ಚಲಿಸುವ ಸಣ್ಣ ಕಣಗಳಿಂದ ಮಾಡಲ್ಪಟ್ಟಿದೆ. ಅನಿಲ ಕಣಗಳ ನಡುವೆ ಅತಿ ಹೆಚ್ಚು ಅಂತರವಿದ್ದು ಬಿಸಿ ಮಾಡಿದಾಗ ವೇಗವಾಗಿ ಚಲಿಸುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch07-gas-chamber',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSimExperiment: 'thermodynamics',
            title: {
              en: 'Particle Speed & Gas Pressure Chamber Simulation',
              hi: 'कण गति और गैस दाब कक्ष सिमुलेशन',
              kn: 'ಕಣಗಳ ವೇಗ ಮತ್ತು ಅನಿಲ ಒತ್ತಡ ಸಿಮ್ಯುಲೇಷನ್',
            },
            objective: {
              en: 'Watch how raising temperature (K) or squeezing volume (L) makes gas particles collide more often and raise pressure (kPa).',
              hi: 'देखें कि तापमान (K) बढ़ाने या आयतन (L) घटाने से कणों की टक्कर और दाब (kPa) कैसे बढ़ते हैं।',
              kn: 'ತಾಪಮಾನ (K) ಹೆಚ್ಚಿಸಿದಾಗ ಅಥವಾ ಗಾತ್ರ (L) ಕುಗ್ಗಿಸಿದಾಗ ಅನಿಲ ಕಣಗಳ ಡಿಕ್ಕಿ ಮತ್ತು ಒತ್ತಡ (kPa) ಹೇಗೆ ಹೆಚ್ಚಾಗುತ್ತದೆ ಎಂದು ನೋಡಿ.',
            },
            materials: {
              en: ['Gyaan Graph Ideal Gas Chamber Simulation (works offline)'],
              hi: ['Gyaan Graph आदर्श गैस सिमुलेशन (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಆದರ್ಶ ಅನಿಲ ಸಿಮ್ಯುಲೇಷನ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual chamber — test high pressures safely without pressurized canisters.',
              hi: 'वर्चुअल कक्ष — बिना किसी वास्तविक दबाव सिलेंडर के सुरक्षित परीक्षण।',
              kn: 'ವರ್ಚುವಲ್ ಚೇಂಬರ್ — ಸುರಕ್ಷಿತವಾಗಿ ಹೆಚ್ಚಿನ ಒತ್ತಡವನ್ನು ಪರೀಕ್ಷಿಸಬಹುದು.',
            },
            steps: {
              en: [
                'Open Energy & Thermodynamics in Physics Labs.',
                'Keep volume at 4.0 L and raise temperature from 250 K to 450 K; note pressure (kPa).',
                'Then reduce volume from 4.0 L to 2.0 L and watch particle collisions double.',
              ],
              hi: [
                'भौतिकी लैब में ऊर्जा व ऊष्मागतिकी खोलें।',
                'आयतन 4.0 L रखकर तापमान 250 K से 450 K करें और दाब (kPa) नोट करें।',
                'फिर आयतन 4.0 L से 2.0 L करें और टक्करों की संख्या देखें।',
              ],
              kn: [
                'ಭೌತಶಾಸ್ತ್ರ ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಉಷ್ಣಗತಿಶಾಸ್ತ್ರ ತೆರೆಯಿರಿ.',
                'ಗಾತ್ರವನ್ನು 4.0 L ಇರಿಸಿ ತಾಪಮಾನವನ್ನು 250 K ನಿಂದ 450 K ಗೆ ಏರಿಸಿ ಒತ್ತಡ (kPa) ಗಮನಿಸಿ.',
                'ನಂತರ ಗಾತ್ರವನ್ನು 4.0 L ನಿಂದ 2.0 L ಗೆ ಇಳಿಸಿ ಕಣಗಳ ಡಿಕ್ಕಿ ದ್ವಿಗುಣವಾಗುವುದನ್ನು ನೋಡಿ.',
              ],
            },
            observationTable: {
              columns: {
                en: ['Volume (L)', 'Temperature (K)', 'Pressure (kPa)'],
                hi: ['आयतन (L)', 'तापमान (K)', 'दाब (kPa)'],
                kn: ['ಗಾತ್ರ (L)', 'ತಾಪಮಾನ (K)', 'ಒತ್ತಡ (kPa)'],
              },
              sampleRows: [
                ['4.0 L', '300 K', '935.3 kPa'],
                ['2.0 L', '300 K', '1870.7 kPa'],
              ],
            },
            predictionQuestion: {
              en: 'What happens to gas pressure if you push the piston down to halve the space?',
              hi: 'यदि पिस्टन दबाकर गैस का आयतन आधा कर दिया जाए तो दाब का क्या होगा?',
              kn: 'ಪಿಸ್ಟನ್ ಒತ್ತಿ ಅನಿಲದ ಗಾತ್ರವನ್ನು ಅರ್ಧದಷ್ಟು ಕಡಿಮೆ ಮಾಡಿದರೆ ಒತ್ತಡಕ್ಕೆ ಏನಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['Pressure doubles', 'Pressure becomes zero', 'Pressure drops to half'],
              hi: ['दाब दोगुना हो जाएगा', 'दाब शून्य हो जाएगा', 'दाब आधा हो जाएगा'],
              kn: ['ಒತ್ತಡ ದ್ವಿಗುಣವಾಗುತ್ತದೆ', 'ಒತ್ತಡ ಶೂನ್ಯವಾಗುತ್ತದೆ', 'ಒತ್ತಡ ಅರ್ಧವಾಗುತ್ತದೆ'],
            },
            predictionCorrectIndex: 0,
            hints: {
              en: ['Same number of moving particles in half the space hit the walls twice as often.'],
              hi: ['आधे स्थान में उतने ही कण दीवारों से दोगुनी बार टकराते हैं।'],
              kn: ['ಅರ್ಧ ಜಾಗದಲ್ಲಿ ಅಷ್ಟೇ ಕಣಗಳು ಗೋಡೆಗಳಿಗೆ ಎರಡು ಪಟ್ಟು ಹೆಚ್ಚು ಬಾರಿ ಡಿಕ್ಕಿ ಹೊಡೆಯುತ್ತವೆ.'],
            },
            whyItHappens: {
              en: 'Gas pressure comes from particles hitting the container walls. Shrinking volume packs particles closer so they strike walls twice as frequently.',
              hi: 'गैस दाब कणों के दीवारों से टकराने से बनता है। जगह आधी करने पर कण दोगुनी बार टकराते हैं, जिससे दाब दोगुना होता है।',
              kn: 'ಅನಿಲದ ಕಣಗಳು ಗೋಡೆಗೆ ಡಿಕ್ಕಿ ಹೊಡೆಯುವುದರಿಂದ ಒತ್ತಡ ಉಂಟಾಗುತ್ತದೆ. ಸ್ಥಳ ಕಡಿಮೆಯಾದಾಗ ಡಿಕ್ಕಿಗಳು ದ್ವಿಗುಣಗೊಂಡು ಒತ್ತಡ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch08',
        chapterNumber: 8,
        title: {
          en: 'Nature of Matter: Elements, Compounds, and Mixtures',
          hi: 'पदार्थ की प्रकृति: तत्व, यौगिक और मिश्रण',
          kn: 'ದ್ರವ್ಯದ ಸ್ವಭಾವ: ಧಾತುಗಳು, ಸಂಯುಕ್ತಗಳು ಮತ್ತು ಮಿಶ್ರಣಗಳು',
        },
        primarySubject: 'chemistry',
        topicTag: {
          en: 'Elements, Compounds & Mixtures',
          hi: 'तत्व, यौगिक और मिश्रण',
          kn: 'ಧಾತುಗಳು, ಸಂಯುಕ್ತಗಳು ಮತ್ತು ಮಿಶ್ರಣಗಳು',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Elements contain one type of atom, compounds bond elements in fixed ratios with new properties, and mixtures combine substances physically so they can be separated.',
          hi: 'तत्व एक ही प्रकार के परमाणु से बनते हैं, यौगिक निश्चित अनुपात में रासायनिक बंध से बनते हैं, जबकि मिश्रण भौतिक रूप से मिले होते हैं।',
          kn: 'ಧಾತುಗಳು ಒಂದೇ ರೀತಿಯ ಪರಮಾಣುಗಳಿಂದ ಕೂಡಿರುತ್ತವೆ, ಸಂಯುಕ್ತಗಳು ನಿಗದಿತ ಅನುಪಾತದಲ್ಲಿ ರಾಸಾಯನಿಕವಾಗಿ ಬಂಧಿತವಾಗಿರುತ್ತವೆ ಮತ್ತು ಮಿಶ್ರಣಗಳನ್ನು ಭೌತಿಕವಾಗಿ ಬೇರ್ಪಡಿಸಬಹುದು.',
        },
        experiments: [
          {
            id: 'curiosity-ch08-chem-world',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSupportingWorld: 'chemistry',
            title: {
              en: 'Chemistry World: Bonding & Neutralization Explorer',
              hi: 'रसायन विज्ञान जगत: रासायनिक बंध व pH गतिविधि',
              kn: 'ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ: ಬಂಧ ಮತ್ತು pH ಅನ್ವೇಷಕ',
            },
            objective: {
              en: 'Review chemical bonding vs mixtures and test acid-base neutralization in Chemistry World.',
              hi: 'रासायनिक बंध व मिश्रण समझें और रसायन विज्ञान जगत में अम्ल-क्षार उदासीनीकरण का अभ्यास करें।',
              kn: 'ರಾಸಾಯನಿಕ ಬಂಧ ಮತ್ತು ಮಿಶ್ರಣಗಳನ್ನು ಅರಿತು ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕದಲ್ಲಿ pH ಪ್ರಯೋಗ ಮಾಡಿ.',
            },
            materials: {
              en: ['Gyaan Graph Chemistry World (works offline)'],
              hi: ['Gyaan Graph रसायन विज्ञान जगत (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual chemistry lab — no corrosive acids handled.',
              hi: 'वर्चुअल रसायन लैब — किसी तेज़ाब को छूने की आवश्यकता नहीं।',
              kn: 'ವರ್ಚುವಲ್ ರಸಾಯನಶಾಸ್ತ್ರ ಲ್ಯಾಬ್ — ಸುರಕ್ಷಿತ ಅಭ್ಯಾಸ.',
            },
            steps: {
              en: ['Open Chemistry World, read the bonding card, and solve the 3-question check.'],
              hi: ['रसायन विज्ञान जगत खोलें, बंधन पाठ पढ़ें और 3 प्रश्नों का क्विज़ हल करें।'],
              kn: ['ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ ತೆರೆದು ಪಾಠ ಓದಿ ಮತ್ತು 3 ಪ್ರಶ್ನೆಗಳ ಕ್ವಿಜ್ ಉತ್ತರಿಸಿ.'],
            },
            observationTable: {
              columns: { en: ['Matter Type', 'Separation'], hi: ['पदार्थ प्रकार', 'पृथक्करण'], kn: ['ದ್ರವ್ಯ ವಿಧ', 'ಬೇರ್ಪಡಿಸುವಿಕೆ'] },
              sampleRows: [
                ['Mixture (Salt + Sand)', 'Physical (Dissolve + Filter)'],
                ['Compound (Water H₂O)', 'Chemical reaction needed'],
              ],
            },
            predictionQuestion: {
              en: 'Can you separate iron filings mixed with sand using a magnet?',
              hi: 'क्या आप रेत में मिले लोहे के बुरादे को चुंबक से अलग कर सकते हैं?',
              kn: 'ಮರಳಿನಲ್ಲಿ ಬೆರೆತಿರುವ ಕಬ್ಬಿಣದ ಚೂರುಗಳನ್ನು ಆಯಸ್ಕಾಂತದಿಂದ ಬೇರ್ಪಡಿಸಬಹುದೇ?',
            },
            predictionOptions: {
              en: ['Yes — it is a physical mixture', 'No — iron and sand form a single compound', 'Only by boiling the sand'],
              hi: ['हाँ — यह एक भौतिक मिश्रण है', 'नहीं — यह रासायनिक यौगिक है', 'केवल उबालकर'],
              kn: ['ಹೌದು — ಇದು ಭೌತಿಕ ಮಿಶ್ರಣವಾಗಿದೆ', 'ಇಲ್ಲ — ಇದು ರಾಸಾಯನಿಕ ಸಂಯುಕ್ತ', 'ಕುದಿಸುವುದರಿಂದ ಮಾತ್ರ'],
            },
            predictionCorrectIndex: 0,
            hints: { en: ['Iron keeps its magnetic property inside a mixture.'], hi: ['मिश्रण में लोहा अपना चुंबकीय गुण बनाए रखता है।'], kn: ['ಮಿಶ್ರಣದಲ್ಲಿ ಕಬ್ಬಿಣ ತನ್ನ ಕಾಂತೀಯ ಗುಣವನ್ನು ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ.'] },
            whyItHappens: {
              en: 'In a mixture, components keep their individual properties and are not chemically bonded, so physical tools like magnets or filters separate them.',
              hi: 'मिश्रण में घटक अपने गुण बनाए रखते हैं, इसलिए चुंबक या छानने जैसे भौतिक तरीकों से उन्हें अलग किया जा सकता है।',
              kn: 'ಮಿಶ್ರಣದಲ್ಲಿ ಪದಾರ್ಥಗಳು ತಮ್ಮ ಗುಣಗಳನ್ನು ಉಳಿಸಿಕೊಳ್ಳುವುದರಿಂದ ಆಯಸ್ಕಾಂತ ಅಥವಾ ಶೋಧನೆಯಿಂದ ಬೇರ್ಪಡಿಸಬಹುದು.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch09',
        chapterNumber: 9,
        title: {
          en: 'The Amazing World of Solutes, Solvents, and Solutions',
          hi: 'विलेय, विलायक और विलयन की अद्भुत दुनिया',
          kn: 'ದ್ರಾವ್ಯ, ದ್ರಾವಕ ಮತ್ತು ದ್ರಾವಣಗಳ ಅದ್ಭುತ ಲೋಕ',
        },
        primarySubject: 'chemistry',
        topicTag: {
          en: 'Solubility, Concentration & Acids/Bases',
          hi: 'विलेयता, सांद्रता और अम्ल-क्षार',
          kn: 'ದ್ರಾವ್ಯತೆ, ಸಾರತೆ ಮತ್ತು ಆಮ್ಲ-ಕ್ಷಾರಗಳು',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'A solute dissolves in a solvent (like water) to form a uniform solution. Warm water usually dissolves solids faster, and pH measures how acidic or basic an aqueous solution is.',
          hi: 'विलेय, विलायक (जैसे जल) में घुलकर समांगी विलयन बनाता है। गर्म पानी में ठोस जल्दी घुलते हैं और pH विलयन की अम्लीयता या क्षारीयता बताता है।',
          kn: 'ದ್ರಾವ್ಯವು ದ್ರಾವಕದಲ್ಲಿ (ನೀರಿನಲ್ಲಿ) ಕರಗಿ ದ್ರಾವಣವಾಗುತ್ತದೆ. ಬಿಸಿ ನೀರಿನಲ್ಲಿ ಘನವಸ್ತುಗಳು ಬೇಗ ಕರಗುತ್ತವೆ ಮತ್ತು pH ದ್ರಾವಣದ ಆಮ್ಲೀಯತೆಯನ್ನು ಅಳೆಯುತ್ತದೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch09-ph-sandbox',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSupportingWorld: 'chemistry',
            title: {
              en: 'Chemistry World: Aqueous Acid–Base pH Sandbox',
              hi: 'रसायन विज्ञान जगत: जलीय अम्ल-क्षार pH लैब',
              kn: 'ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ: ದ್ರಾವಣದ pH ಪ್ರಯೋಗ',
            },
            objective: {
              en: 'Mix equal volumes of 0.1 M acid and base solutions to hit neutral pH 7.0.',
              hi: '0.1 M अम्ल और क्षार विलयन मिलाकर उदासीन pH 7.0 प्राप्त करें।',
              kn: '0.1 M ಆಮ್ಲ ಮತ್ತು ಕ್ಷಾರ ದ್ರಾವಣಗಳನ್ನು ಬೆರೆಸಿ ತಟಸ್ಥ pH 7.0 ಪಡೆಯಿರಿ.',
            },
            materials: {
              en: ['Gyaan Graph Chemistry World pH Sandbox (works offline)'],
              hi: ['Gyaan Graph रसायन pH सैंडबॉक्स (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ರಸಾಯನಶಾಸ್ತ್ರ pH ಸ್ಯಾಂಡ್‌ಬಾಕ್ಸ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Virtual titration — safe for learning pH scale without chemical splashes.',
              hi: 'वर्चुअल अनुमापन — बिना रसायन छलकने के डर के सुरक्षित अभ्यास।',
              kn: 'ವರ್ಚುವಲ್ ಟೈಟ್ರೇಶನ್ — ರಾಸಾಯನಿಕ ಸಿಂಪಡಿಸುವ ಅಪಾಯವಿಲ್ಲದೆ ಸುರಕ್ಷಿತ ಅಭ್ಯಾಸ.',
            },
            steps: {
              en: [
                'Open Chemistry World and set 0.1 M HCl to 25 mL.',
                'Slide 0.1 M NaOH to 25 mL and check the pH bar.',
              ],
              hi: [
                'रसायन विज्ञान जगत खोलें और 0.1 M HCl को 25 mL पर सेट करें।',
                '0.1 M NaOH को 25 mL पर लाएँ और pH पट्टी देखें।',
              ],
              kn: [
                'ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ ತೆರೆದು 0.1 M HCl ಅನ್ನು 25 mL ಗೆ ಹೊಂದಿಸಿ.',
                '0.1 M NaOH ಅನ್ನು 25 mL ಗೆ ತಂದು pH ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: { en: ['Acid (mL)', 'Base (mL)', 'pH'], hi: ['अम्ल (mL)', 'क्षार (mL)', 'pH'], kn: ['ಆಮ್ಲ (mL)', 'ಕ್ಷಾರ (mL)', 'pH'] },
              sampleRows: [
                ['25 mL', '15 mL', '1.60 (Acidic)'],
                ['25 mL', '25 mL', '7.00 (Neutral)'],
              ],
            },
            predictionQuestion: {
              en: 'What is the pH when 25 mL of 0.1 M HCl meets 25 mL of 0.1 M NaOH?',
              hi: 'जब 25 mL (0.1 M HCl) और 25 mL (0.1 M NaOH) मिलते हैं, तो pH क्या होगा?',
              kn: '25 mL (0.1 M HCl) ಮತ್ತು 25 mL (0.1 M NaOH) ಸೇರಿದಾಗ pH ಎಷ್ಟಾಗುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['pH 7.0 (Neutral)', 'pH 1.0 (Strong acid)', 'pH 14.0 (Strong base)'],
              hi: ['pH 7.0 (उदासीन)', 'pH 1.0 (प्रबल अम्ल)', 'pH 14.0 (प्रबल क्षार)'],
              kn: ['pH 7.0 (ತಟಸ್ಥ)', 'pH 1.0 (ಬಲವಾದ ಆಮ್ಲ)', 'pH 14.0 (ಬಲವಾದ ಕ್ಷಾರ)'],
            },
            predictionCorrectIndex: 0,
            hints: { en: ['Equal moles of strong acid and strong base neutralize each other.'], hi: ['समान मोल के प्रबल अम्ल और क्षार एक-दूसरे को उदासीन करते हैं।'], kn: ['ಸಮಪ್ರಮಾಣದ ಆಮ್ಲ ಮತ್ತು ಕ್ಷಾರ ಪರಸ್ಪರ ತಟಸ್ಥಗೊಳಿಸುತ್ತವೆ.'] },
            whyItHappens: {
              en: 'Acid H⁺ ions combine with base OH⁻ ions to form water (H₂O) and salt (NaCl), landing at neutral pH 7.0.',
              hi: 'अम्ल के H⁺ आयन और क्षार के OH⁻ आयन मिलकर जल (H₂O) और लवण (NaCl) बनाते हैं, जिससे विलयन pH 7.0 पर उदासीन हो जाता है।',
              kn: 'ಆಮ್ಲದ H⁺ ಮತ್ತು ಕ್ಷಾರದ OH⁻ ಅಯಾನುಗಳು ಸೇರಿ ನೀರು ಮತ್ತು ಉಪ್ಪನ್ನು ಉಂಟುಮಾಡುವುದರಿಂದ ದ್ರಾವಣ pH 7.0 ತಲುಪುತ್ತದೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch12',
        chapterNumber: 12,
        title: {
          en: 'How Nature Works in Harmony',
          hi: 'प्रकृति तालमेल में कैसे काम करती है',
          kn: 'ಪ್ರಕೃತಿ ಸಾಮರಸ್ಯದಿಂದ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ',
        },
        primarySubject: 'biology',
        topicTag: {
          en: 'Ecosystems, Plants & Food Webs',
          hi: 'पारिस्थितिकी तंत्र, पौधे और खाद्य जाल',
          kn: 'ಪರಿಸರ ವ್ಯವಸ್ಥೆ, ಸಸ್ಯಗಳು ಮತ್ತು ಆಹಾರ ಜಾಲ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Living organisms depend on sunlight, water, soil minerals, and each other in balanced ecosystems. Plants capture solar energy through photosynthesis to feed food webs.',
          hi: 'जीवित प्राणी सूर्य के प्रकाश, जल, मिट्टी के खनिजों और एक-दूसरे पर निर्भर रहते हैं। पौधे प्रकाश संश्लेषण द्वारा ऊर्जा पकड़कर खाद्य जाल का आधार बनते हैं।',
          kn: 'ಜೀವಿಗಳು ಸೂರ್ಯನ ಬೆಳಕು, ನೀರು, ಖನಿಜಗಳು ಮತ್ತು ಪರಸ್ಪರ ಅವಲಂಬಿತವಾಗಿವೆ. ಸಸ್ಯಗಳು ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ ಮೂಲಕ ಆಹಾರ ಜಾಲಕ್ಕೆ ಶಕ್ತಿ ನೀಡುತ್ತವೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch12-xylem-sim',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSupportingWorld: 'biology',
            title: {
              en: 'Biology World: Photosynthesis & Vascular Transport',
              hi: 'जीव विज्ञान जगत: प्रकाश संश्लेषण व जल संवहन',
              kn: 'ಜೀವಶಾಸ್ತ್ರ ಲೋಕ: ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಮತ್ತು ಜಲ ಸಾಗಣೆ',
            },
            objective: {
              en: 'See how sunlight and soil moisture drive plant sugar production and water flow.',
              hi: 'देखें कि सूर्य का प्रकाश और मिट्टी की नमी पौधे में शर्करा और जल प्रवाह को कैसे चलाती है।',
              kn: 'ಸೂರ್ಯನ ಬೆಳಕು ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶ ಸಸ್ಯದ ಆಹಾರ ಮತ್ತು ನೀರಿನ ಹರಿವನ್ನು ಹೇಗೆ ನಡೆಸುತ್ತವೆ ಎಂದು ನೋಡಿ.',
            },
            materials: {
              en: ['Gyaan Graph Biology World Simulator (works offline)'],
              hi: ['Gyaan Graph जीव विज्ञान सिम्युलेटर (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಜೀವಶಾಸ್ತ್ರ ಸಿಮ್ಯುಲೇಟರ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Safe virtual simulation.',
              hi: 'सुरक्षित वर्चुअल सिमुलेशन।',
              kn: 'ಸುರಕ್ಷಿತ ವರ್ಚುವಲ್ ಸಿಮ್ಯುಲೇಷನ್.',
            },
            steps: {
              en: ['Open Biology World and vary Sunlight Intensity and Soil Moisture sliders.'],
              hi: ['जीव विज्ञान जगत खोलें और सूर्य के प्रकाश व मिट्टी की नमी के स्लाइडर बदलें।'],
              kn: ['ಜೀವಶಾಸ್ತ್ರ ಲೋಕ ತೆರೆದು ಬೆಳಕು ಮತ್ತು ತೇವಾಂಶ ಸ್ಲೈಡರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ.'],
            },
            observationTable: {
              columns: { en: ['Sunlight', 'Soil Moisture', 'Phloem Sugar'], hi: ['धूप', 'मिट्टी नमी', 'शर्करा उत्पादन'], kn: ['ಬೆಳಕು', 'ತೇವಾಂಶ', 'ಸಕ್ಕರೆ ಉತ್ಪಾದನೆ'] },
              sampleRows: [['90%', '80%', '88 units']],
            },
            predictionQuestion: {
              en: 'Which plant tissue carries water up from roots to leaves?',
              hi: 'जड़ों से पत्तियों तक पानी कौन-सा ऊतक ले जाता है?',
              kn: 'ಬೇರುಗಳಿಂದ ಎಲೆಗಳಿಗೆ ನೀರನ್ನು ಸಾಗಿಸುವ ಅಂಗಾಂಶ ಯಾವುದು?',
            },
            predictionOptions: {
              en: ['Xylem', 'Phloem', 'Bark'],
              hi: ['जाइलम (Xylem)', 'फ्लोएम (Phloem)', 'छाल'],
              kn: ['ಕ್ಸೈಲಂ (Xylem)', 'ಫ್ಲೋಯಂ (Phloem)', 'ತೊಗಟೆ'],
            },
            predictionCorrectIndex: 0,
            hints: { en: ['Xylem carries water; Phloem carries food (sugar).'], hi: ['जाइलम जल ले जाता है; फ्लोएम भोजन ले जाता है।'], kn: ['ಕ್ಸೈಲಂ ನೀರನ್ನು ಸಾಗಿಸುತ್ತದೆ; ಫ್ಲೋಯಂ ಆಹಾರವನ್ನು ಸಾಗಿಸುತ್ತದೆ.'] },
            whyItHappens: {
              en: 'Xylem vessels act like tiny continuous pipes pulling water and minerals upward from soil to leaves.',
              hi: 'जाइलम नलिकाएँ मिट्टी से पत्तियों तक जल व खनिजों को ऊपर खींचती हैं।',
              kn: 'ಕ್ಸೈಲಂ ನಾಳಗಳು ಮಣ್ಣಿನಿಂದ ಎಲೆಗಳಿಗೆ ನೀರು ಮತ್ತು ಖನಿಜಗಳನ್ನು ಮೇಲಕ್ಕೆ ಎಳೆಯುತ್ತವೆ.',
            },
          },
        ],
      },
      {
        id: 'curiosity-ch13',
        chapterNumber: 13,
        title: {
          en: 'Our Home: Earth, a Unique Life-Sustaining Planet',
          hi: 'हमारा घर: पृथ्वी, जीवन को सँभालने वाला अनोखा ग्रह',
          kn: 'ನಮ್ಮ ಮನೆ: ಭೂಮಿ, ಜೀವ ಪೋಷಿಸುವ ವಿಶಿಷ್ಟ ಗ್ರಹ',
        },
        primarySubject: 'biology',
        topicTag: {
          en: 'Atmosphere, Water Cycle & Planet Balance',
          hi: 'वायुमंडल, जल चक्र और पृथ्वी का संतुलन',
          kn: 'ವಾಯುಮಂಡಲ, ಜಲಚಕ್ರ ಮತ್ತು ಗ್ರಹದ ಸಮತೋಲನ',
        },
        textbookName: 'Curiosity (NCERT Class 8 Science)',
        conceptSummary: {
          en: 'Earth lies at a balanced distance from the Sun with liquid water, an atmosphere rich in nitrogen and oxygen, and gravity strong enough to hold air and oceans.',
          hi: 'पृथ्वी सूर्य से संतुलित दूरी पर है, जहाँ तरल जल, ऑक्सीजन-युक्त वायुमंडल और हवा को थामने वाला गुरुत्वाकर्षण मौजूद है।',
          kn: 'ಭೂಮಿಯು ಸೂರ್ಯನಿಂದ ಸರಿಯಾದ ದೂರದಲ್ಲಿದ್ದು ದ್ರವ ರೂಪದ ನೀರು, ವಾಯುಮಂಡಲ ಮತ್ತು ಅದನ್ನು ಹಿಡಿದಿಡುವ ಗುರುತ್ವಾಕರ್ಷಣೆಯನ್ನು ಹೊಂದಿದೆ.',
        },
        experiments: [
          {
            id: 'curiosity-ch13-gravity-compare',
            relationType: 'related-activity',
            activityMode: 'virtual-sim',
            linkedSimExperiment: 'mechanics',
            title: {
              en: 'Compare Gravity on Earth (9.81 m/s²) vs Moon (1.62 m/s²)',
              hi: 'पृथ्वी (9.81 m/s²) बनाम चंद्रमा (1.62 m/s²) के गुरुत्व की तुलना',
              kn: 'ಭೂಮಿ (9.81 m/s²) ಮತ್ತು ಚಂದ್ರನ (1.62 m/s²) ಗುರುತ್ವ ಹೋಲಿಕೆ',
            },
            objective: {
              en: 'See why Earth’s stronger gravity keeps an atmosphere while lower gravity lets objects fly much farther.',
              hi: 'देखें कि पृथ्वी का मजबूत गुरुत्व वायुमंडल को कैसे थामता है और कम गुरुत्व में वस्तु कितनी दूर जाती है।',
              kn: 'ಭೂಮಿಯ ಬಲವಾದ ಗುರುತ್ವವು ವಾಯುಮಂಡಲವನ್ನು ಹೇಗೆ ಹಿಡಿದಿಡುತ್ತದೆ ಮತ್ತು ಕಡಿಮೆ ಗುರುತ್ವದಲ್ಲಿ ವಸ್ತು ಎಷ್ಟು ದೂರ ಹಾರುತ್ತದೆ ಎಂದು ನೋಡಿ.',
            },
            materials: {
              en: ['Gyaan Graph Mechanics Simulation (works offline)'],
              hi: ['Gyaan Graph यांत्रिकी सिमुलेशन (ऑफ़लाइन उपलब्ध)'],
              kn: ['Gyaan Graph ಯಂತ್ರಶಾಸ್ತ್ರ ಸಿಮ್ಯುಲೇಷನ್ (ಆಫ್‌ಲೈನ್ ಲಭ್ಯ)'],
            },
            safetyNote: {
              en: 'Safe virtual comparison.',
              hi: 'सुरक्षित वर्चुअल तुलना।',
              kn: 'ಸುರಕ್ಷಿತ ವರ್ಚುವಲ್ ಹೋಲಿಕೆ.',
            },
            steps: {
              en: [
                'Open Projectile Motion, keep Angle 45° and Speed 20 m/s.',
                'Compare Range on Earth (g = 9.81 m/s²) vs Moon (g = 1.62 m/s²).',
              ],
              hi: [
                'प्रक्षेप्य गति खोलें, कोण 45° और चाल 20 m/s रखें।',
                'पृथ्वी (9.81 m/s²) और चंद्रमा (1.62 m/s²) पर दूरी की तुलना करें।',
              ],
              kn: [
                'ಪ್ರಕ್ಷೇಪಕ ಚಲನೆ ತೆರೆದು ಕೋನ 45° ಮತ್ತು ವೇಗ 20 m/s ಇರಿಸಿ.',
                'ಭೂಮಿ (9.81 m/s²) ಮತ್ತು ಚಂದ್ರನ (1.62 m/s²) ಮೇಲೆ ದೂರವನ್ನು ಹೋಲಿಸಿ.',
              ],
            },
            observationTable: {
              columns: { en: ['World', 'Gravity (m/s²)', 'Range at 20 m/s, 45°'], hi: ['पिंड', 'गुरुत्व (m/s²)', 'दूरी'], kn: ['ಲೋಕ', 'ಗುರುತ್ವ (m/s²)', 'ದೂರ'] },
              sampleRows: [
                ['Earth', '9.81 m/s²', '40.8 m'],
                ['Moon', '1.62 m/s²', '246.9 m'],
              ],
            },
            predictionQuestion: {
              en: 'With the same throw speed, how does range on the Moon compare to Earth?',
              hi: 'समान चाल से फेंकने पर चंद्रमा पर दूरी पृथ्वी की तुलना में कैसी होगी?',
              kn: 'ಅದೇ ವೇಗದಲ್ಲಿ ಎಸೆದಾಗ ಚಂದ್ರನ ಮೇಲೆ ದೂರವು ಭೂಮಿಗೆ ಹೋಲಿಸಿದರೆ ಹೇಗಿರುತ್ತದೆ?',
            },
            predictionOptions: {
              en: ['About 6 times farther on the Moon', '6 times shorter on the Moon', 'Exact same distance'],
              hi: ['चंद्रमा पर लगभग 6 गुना अधिक दूर', 'चंद्रमा पर 6 गुना कम', 'बिल्कुल समान'],
              kn: ['ಚಂದ್ರನ ಮೇಲೆ ಸುಮಾರು 6 ಪಟ್ಟು ಹೆಚ್ಚು ದೂರ', '6 ಪಟ್ಟು ಕಡಿಮೆ', 'ನಿಖರವಾಗಿ ಒಂದೇ'],
            },
            predictionCorrectIndex: 0,
            hints: { en: ['Moon gravity (1.62) is about one-sixth of Earth gravity (9.81).'], hi: ['चंद्रमा का गुरुत्व (1.62) पृथ्वी (9.81) का लगभग छठा हिस्सा है।'], kn: ['ಚಂದ್ರನ ಗುರುತ್ವ (1.62) ಭೂಮಿಯ (9.81) ಆರನೇ ಒಂದು ಭಾಗದಷ್ಟಿದೆ.'] },
            whyItHappens: {
              en: 'Because Moon gravity is ~6× weaker, downward pull is gentler and the object stays in flight 6× longer—just as Earth’s stronger gravity keeps gas molecules from escaping into space.',
              hi: 'चंद्रमा का गुरुत्व ~6 गुना कम होने से वस्तु 6 गुना अधिक समय हवा में रहती है—इसी कारण पृथ्वी का मजबूत गुरुत्व हमारे वायुमंडल की गैसों को रोककर रखता है।',
              kn: 'ಚಂದ್ರನ ಗುರುತ್ವ ~6 ಪಟ್ಟು ಕಡಿಮೆ ಇರುವುದರಿಂದ ವಸ್ತು 6 ಪಟ್ಟು ಹೆಚ್ಚು ದೂರ ಹಾರುತ್ತದೆ—ಅದೇ ರೀತಿ ಭೂಮಿಯ ಬಲವಾದ ಗುರುತ್ವವು ವಾಯುಮಂಡಲವನ್ನು ಹಿಡಿದಿಡುತ್ತದೆ.',
            },
          },
        ],
      },
    ],
  },
];

export function findSyllabusCatalogue(path: LearningPathPreference): SyllabusCatalogueEntry | null {
  const staticMatch = SYLLABUS_CATALOGUES.find(
    (cat) =>
      cat.board === path.board &&
      cat.classLevel === path.classLevel &&
      cat.session === path.session &&
      (path.board !== 'state' || cat.stateName === path.stateName)
  );
  if (staticMatch) {
    return staticMatch;
  }

  const record = findBoardRecord(path.classLevel, path.board, path.stateName, path.session);
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    board: record.board,
    stateName: record.stateName,
    classLevel: record.classLevel,
    session: path.session,
    verificationStatus: 'verified-sample',
    bookTitle: record.textbookName,
    coverageNote: record.coverageNote,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
    secondarySourceTitle: record.secondarySourceTitle,
    secondarySourceUrl: record.secondarySourceUrl,
    lastVerified: record.lastVerified,
    chapters: record.chapters.map((ch) => ({
      id: ch.id,
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      primarySubject: ch.primarySubject,
      topicTag: ch.topicTag,
      textbookName: ch.textbookName,
      conceptSummary: ch.conceptSummary,
      experiments: ch.experiments.map((exp) => ({
        id: exp.id,
        relationType: exp.relationType,
        activityMode: exp.activityMode,
        linkedSimExperiment: exp.linkedSimExperiment,
        linkedSupportingWorld: exp.linkedSupportingWorld,
        title: exp.title,
        objective: exp.objective,
        materials: exp.materials,
        safetyNote: exp.safetyNote,
        steps: exp.steps,
        observationTable: exp.observationTable,
        predictionQuestion: exp.predictionQuestion,
        predictionOptions: exp.predictionOptions,
        predictionCorrectIndex: exp.predictionCorrectIndex,
        hints: exp.hints,
        whyItHappens: exp.whyItHappens,
      })),
    })),
  };
}
