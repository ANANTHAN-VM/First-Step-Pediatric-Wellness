import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

// Define the structure for the questions with scoring info
const aswbQuestions = [
  { id: 'aswb_q1', label: 'I feel happy most of the time.', reverseScore: false },
  { id: 'aswb_q2', label: 'I often feel joyful and content.', reverseScore: false },
  { id: 'aswb_q3', label: 'I have positive feelings about my life.', reverseScore: false },
  { id: 'aswb_q4', label: 'I enjoy the little things in life.', reverseScore: false },
  { id: 'aswb_q5', label: 'I often feel sad or down.', reverseScore: true },
  { id: 'aswb_q6', label: 'I experience feelings of loneliness frequently.', reverseScore: true },
  { id: 'aswb_q7', label: 'I often feel anxious or worried.', reverseScore: true },
  { id: 'aswb_q8', label: 'I feel frustrated or angry often.', reverseScore: true },
  { id: 'aswb_q9', label: 'I am satisfied with my life as a whole.', reverseScore: false },
  { id: 'aswb_q10', label: 'I am happy with my school life.', reverseScore: false },
  { id: 'aswb_q11', label: 'I am satisfied with my relationships with family and friends.', reverseScore: false },
  { id: 'aswb_q12', label: 'Overall, I feel good about my life.', reverseScore: false },
];

const arsQuestions = {
  self: {
    title: 'SELF (22 Items)',
    subsections: [
      {
        title: 'Confidence (5 Items)',
        questions: [
          { id: 'ars_q1', label: 'I am confident that I can achieve what I set out to do.', reverseScore: false },
          { id: 'ars_q2', label: 'I feel confident that I can handle whatever comes my way.', reverseScore: false },
          { id: 'ars_q3', label: 'I am a person who can go with the flow.', reverseScore: false },
          { id: 'ars_q4', label: 'I feel confident to do things by myself.', reverseScore: false },
          { id: 'ars_q5', label: 'If I have a problem, I can work it out.', reverseScore: false },
        ]
      },
      {
        title: 'Emotional Insight (4 Items)',
        questions: [
          { id: 'ars_q6', label: 'When I am feeling down, I take extra special care of myself.', reverseScore: false },
          { id: 'ars_q7', label: 'I look for what I can learn out of bad things that happen.', reverseScore: false },
          { id: 'ars_q8', label: 'If I have a problem, I know there is someone I can talk to.', reverseScore: false },
          { id: 'ars_q9', label: 'If I can\'t handle something, I find help.', reverseScore: false },
        ]
      },
      {
        title: 'Negative Cognition (5 Items)',
        questions: [
          { id: 'ars_q10', label: 'I just can\'t let go of bad feelings.', reverseScore: true },
          { id: 'ars_q11', label: 'I can\'t stop worrying about my problems.', reverseScore: true },
          { id: 'ars_q12', label: 'I tend to think the worst is going to happen.', reverseScore: true },
          { id: 'ars_q13', label: 'I dwell on the bad things that happen.', reverseScore: true },
          { id: 'ars_q14', label: 'My feelings are out of my control.', reverseScore: true },
        ]
      },
      {
        title: 'Social Skills (4 Items)',
        questions: [
          { id: 'ars_q15', label: 'I find it hard to express myself to others.', reverseScore: true },
          { id: 'ars_q16', label: 'I can share my personal thoughts with others.', reverseScore: false },
          { id: 'ars_q17', label: 'I can express my opinions when I am in a group.', reverseScore: false },
          { id: 'ars_q18', label: 'I find it easy talking to people my age.', reverseScore: false },
        ]
      },
      {
        title: 'Empathy (4 Items)',
        questions: [
          { id: 'ars_q19', label: 'I am patient with people who can\'t do things as well as I can.', reverseScore: false },
          { id: 'ars_q20', label: 'I get frustrated when people make mistakes.', reverseScore: true },
          { id: 'ars_q21', label: 'I am easily frustrated with people.', reverseScore: true },
          { id: 'ars_q22', label: 'I expect people to live up to my standards.', reverseScore: true },
        ]
      },
    ],
  },
  family: {
    title: 'FAMILY (7 Items)',
    subsections: [
      {
        title: 'Connectedness (4 Items)',
        questions: [
          { id: 'ars_q23', label: 'I do fun things with my family.', reverseScore: false },
          { id: 'ars_q24', label: 'We do things together as a family.', reverseScore: false },
          { id: 'ars_q25', label: 'My family understands my needs.', reverseScore: false },
          { id: 'ars_q26', label: 'I get to spend enough time with my family.', reverseScore: false },
        ]
      },
      {
        title: 'Availability (3 Items)',
        questions: [
          { id: 'ars_q27', label: 'There is someone in my family I can talk to about anything.', reverseScore: false },
          { id: 'ars_q28', label: 'If I have a problem, there is someone in my family I can talk to.', reverseScore: false },
          { id: 'ars_q29', label: 'There is someone in my family that I feel particularly close to.', reverseScore: false },
        ]
      },
    ],
  },
  peers: {
    title: 'PEERS (8 Items)',
    subsections: [
      {
        title: 'Connectedness (4 Items)',
        questions: [
          { id: 'ars_q30', label: 'When I am down, I have friends that help cheer me up.', reverseScore: false },
          { id: 'ars_q31', label: 'I have a friend I can trust with my private thoughts and feelings.', reverseScore: false },
          { id: 'ars_q32', label: 'I have friends who make me laugh.', reverseScore: false },
          { id: 'ars_q33', label: 'I get to spend enough time with my friends.', reverseScore: false },
        ]
      },
      {
        title: 'Availability (4 Items)',
        questions: [
          { id: 'ars_q34', label: 'I feel left out of things.', reverseScore: true },
          { id: 'ars_q35', label: 'I wish I had more friends I felt close to.', reverseScore: true },
          { id: 'ars_q36', label: 'I find it hard to stay friends with people.', reverseScore: true },
          { id: 'ars_q37', label: 'I am happy with my friendship group.', reverseScore: false },
        ]
      },
    ],
  },
  school: {
    title: 'SCHOOL (8 Items)',
    subsections: [
      {
        title: 'Supportive Environment (4 Items)',
        questions: [
          { id: 'ars_q38', label: 'My teachers are caring and supportive of me.', reverseScore: false },
          { id: 'ars_q39', label: 'My teachers provide me with extra help if I need it.', reverseScore: false },
          { id: 'ars_q40', label: 'My teachers notice when I am doing a good job and let me know.', reverseScore: false },
          { id: 'ars_q41', label: 'There is an adult at school who I could talk to if I had a personal problem.', reverseScore: false },
        ]
      },
      {
        title: 'Connectedness (4 Items)',
        questions: [
          { id: 'ars_q42', label: 'I hate going to school.', reverseScore: true },
          { id: 'ars_q43', label: 'I am bored at school.', reverseScore: true },
          { id: 'ars_q44', label: 'My teachers expect too much of me.', reverseScore: true },
          { id: 'ars_q45', label: 'I enjoy going to school.', reverseScore: false },
        ]
      },
    ],
  },
  community: {
    title: 'COMMUNITY (4 Items)',
    subsections: [
      {
        title: 'Connectedness (4 Items)',
        questions: [
          { id: 'ars_q46', label: 'People in my neighbourhood are caring.', reverseScore: false },
          { id: 'ars_q47', label: 'The people in my neighbourhood treat other people fairly.', reverseScore: false },
          { id: 'ars_q48', label: 'I like my neighbourhood.', reverseScore: false },
          { id: 'ars_q49', label: 'The people in my neighbourhood look out for me.', reverseScore: false },
        ]
      }
    ],
  },
};

const iatQuestions = [
  { id: 'iat_q1', label: 'How often do you find that you stay online longer than you intended?' },
  { id: 'iat_q2', label: 'How often do you neglect household chores to spend more time online?' },
  { id: 'iat_q3', label: 'How often do you prefer the excitement of the Internet to intimacy with your partner?' },
  { id: 'iat_q4', label: 'How often do you form new relationships with fellow online users?' },
  { id: 'iat_q5', label: 'How often do others in your life complain to you about the amount of time you spend online?' },
  { id: 'iat_q6', label: 'How often do your grades or school work suffer because of the amount of time you spend online?' },
  { id: 'iat_q7', label: 'How often do you check your email before something else that you need to do?' },
  { id: 'iat_q8', label: 'How often does your job performance or productivity suffer because of the Internet?' },
  { id: 'iat_q9', label: 'How often do you become defensive or secretive when anyone asks you what you do online?' },
  { id: 'iat_q10', label: 'How often do you block out disturbing thoughts about your life with soothing thoughts of the Internet?' },
  { id: 'iat_q11', label: 'How often do you find yourself anticipating when you will go online again?' },
  { id: 'iat_q12', label: 'How often do you fear that life without the Internet would be boring, empty, and joyless?' },
  { id: 'iat_q13', label: 'How often do you snap, yell, or act annoyed if someone bothers you while you are online?' },
  { id: 'iat_q14', label: 'How often do you lose sleep due to being online?' },
  { id: 'iat_q15', label: 'How often do you feel preoccupied with the Internet when off-line, or fantasize about being online?' },
  { id: 'iat_q16', label: 'How often do you find yourself saying "just a few more minutes" when online?' },
  { id: 'iat_q17', label: 'How often do you try to cut down the amount of time you spend online and fail?' },
  { id: 'iat_q18', label: 'How often do you try to hide how long you\'ve been online?' },
  { id: 'iat_q19', label: 'How often do you choose to spend more time online over going out with others?' },
  { id: 'iat_q20', label: 'How often do you feel depressed, moody, or nervous when you are off-line, which goes away once you are back online?' },
];

const RadioGroup = ({ name, label, options, state, stateSetter }) => {
  const isAnswered = state.hasOwnProperty(name);
  return (
    <div className={`question-item p-4 rounded-lg transition-all duration-200 ${!isAnswered ? 'border border-red-500 bg-red-50' : 'border border-gray-300'}`}>
      <p className={`question-label font-medium mb-2 ${!isAnswered ? 'text-red-600' : 'text-gray-700'}`}>{label}</p>
      <div className="likert-options flex flex-wrap gap-3 sm:flex-row flex-col">
        {options.map((option, index) => (
          <label key={index} className="likert-option flex items-center cursor-pointer p-3 rounded-md border border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={state[name] === option.value}
              onChange={(e) => stateSetter(prev => ({ ...prev, [name]: parseInt(e.target.value) }))}
              required
              className="accent-blue-500"
            />
            <span className="ml-2">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [formData, setFormData] = useState({});
  const [aswbResponses, setAswbResponses] = useState({});
  const [arsResponses, setArsResponses] = useState({});
  const [iatResponses, setIatResponses] = useState({});
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [db, setDb] = useState(null);

  useEffect(() => {
    // Initialize Firebase
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const auth = getAuth(app);
        setDb(firestore);

        onAuthStateChanged(auth, async (user) => {
          if (!user) {
            try {
              if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
              } else {
                await signInAnonymously(auth);
              }
            } catch (authError) {
              console.error("Firebase Auth Error:", authError);
            }
          }
          setUserId(auth.currentUser?.uid || crypto.randomUUID());
          setLoading(false);
        });
      } catch (e) {
        console.error("Error initializing Firebase:", e);
        setError(`Error initializing application: ${e.message}. Please try again later.`);
        setLoading(false);
      }
    };
    initializeFirebase();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const form = document.getElementById('assessmentForm');
    const requiredInputs = form.querySelectorAll('[required]');

    let allQuestionsAnswered = true;
    let newErrors = [];

    // Reset validation styles
    document.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500', 'bg-red-50'));
    document.querySelectorAll('.text-red-600').forEach(el => el.classList.remove('text-red-600'));

    // Validate text/number/select inputs
    requiredInputs.forEach(input => {
      if (input.type !== 'radio' && (!input.value || input.value.trim() === '')) {
        allQuestionsAnswered = false;
        input.classList.add('border-red-500');
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (label) {
          label.classList.add('text-red-600');
        }
      }
    });

    // Validate radio button groups
    const allRadioNames = [
      ...aswbQuestions.map(q => q.id),
      ...Object.values(arsQuestions).flatMap(section =>
        section.subsections.flatMap(sub => sub.questions.map(q => q.id))
      ),
      ...iatQuestions.map(q => q.id),
    ];
    
    allRadioNames.forEach(name => {
      const radios = document.querySelectorAll(`input[name="${name}"]`);
      const isAnswered = Array.from(radios).some(radio => radio.checked);
      if (!isAnswered) {
        allQuestionsAnswered = false;
        const questionItem = radios[0].closest('.question-item');
        if (questionItem) {
          questionItem.classList.add('border-red-500', 'bg-red-50');
          questionItem.querySelector('.question-label')?.classList.add('text-red-600');
        }
      }
    });

    if (!allQuestionsAnswered) {
      newErrors.push("Please fill in all required fields and answer all questions before submitting. Unanswered fields are highlighted in red.");
    }
    setError(newErrors.join(' '));
    return allQuestionsAnswered;
  };

  const calculateScores = () => {
    // ASWB Score
    let aswbScore = 0;
    aswbQuestions.forEach(q => {
      const score = aswbResponses[q.id];
      if (score !== undefined) {
        aswbScore += q.reverseScore ? (6 - score) : score;
      }
    });
    const aswbInterpretation = aswbScore >= 31 ? 'Greater Well-Being' : 'Poor Well-Being';

    // ARS Score
    let arsScore = 0;
    Object.values(arsQuestions).forEach(section => {
      section.subsections.forEach(sub => {
        sub.questions.forEach(q => {
          const score = arsResponses[q.id];
          if (score !== undefined) {
            arsScore += q.reverseScore ? (6 - score) : score;
          }
        });
      });
    });
    
    let arsInterpretation = '';
    if (arsScore >= 185) { arsInterpretation = 'High Resilience'; }
    else if (arsScore >= 124) { arsInterpretation = 'Moderate Resilience'; }
    else { arsInterpretation = 'Low Resilience'; }

    // IAT Score
    let iatScore = 0;
    iatQuestions.forEach(q => {
      const score = iatResponses[q.id];
      if (score !== undefined) {
        iatScore += score;
      }
    });
    let iatInterpretation = '';
    if (iatScore >= 80) { iatInterpretation = 'Severe addiction'; }
    else if (iatScore >= 50) { iatInterpretation = 'Moderate addiction'; }
    else if (iatScore >= 31) { iatInterpretation = 'Mild addiction'; }
    else { iatInterpretation = 'Normal Internet usage'; }

    return { aswbScore, aswbInterpretation, arsScore, arsInterpretation, iatScore, iatInterpretation };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    
    const { height, weight, bp, spo2, screenTime, eyechart, brushingHabits, sleep, ...rest } = formData;
    const personalHealthData = {
        ...rest,
        heightCm: parseFloat(height),
        weightKg: parseFloat(weight),
        spo2: parseFloat(spo2),
        screenTimeHours: parseFloat(screenTime),
        eyechart: eyechart,
        brushingHabits: brushingHabits,
        sleep: sleep,
    };
    
    // BMI Calculation
    const heightM = personalHealthData.heightCm / 100;
    const bmi = personalHealthData.weightKg / (heightM * heightM);
    personalHealthData.bmi = parseFloat(bmi.toFixed(2));
    let bmiInterpretation = '';
    if (personalHealthData.bmi < 18.5) { bmiInterpretation = 'Underweight'; }
    else if (personalHealthData.bmi >= 18.5 && personalHealthData.bmi <= 24.9) { bmiInterpretation = 'Normal Range'; }
    else if (personalHealthData.bmi >= 25 && personalHealthData.bmi <= 29.9) { bmiInterpretation = 'Overweight'; }
    else if (personalHealthData.bmi >= 30) { bmiInterpretation = 'Obese'; }
    personalHealthData.bmiInterpretation = bmiInterpretation;

    // Blood Pressure Interpretation
    const bpParts = bp.split('/');
    const systolic = parseInt(bpParts[0]);
    const diastolic = parseInt(bpParts[1]);
    let bpInterpretation = '';
    if (!isNaN(systolic) && !isNaN(diastolic)) {
        if (systolic < 90 || diastolic < 60) { bpInterpretation = 'Hypotension (< 90/60 mmHg)'; }
        else if (systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80) { bpInterpretation = 'Normal Range (90/60 – 120/80 mmHg)'; }
        else if (systolic >= 130 || diastolic >= 80) { bpInterpretation = 'Hypertension (130/80 or higher mmHg)'; }
        else { bpInterpretation = 'Elevated or Borderline (Consult doctor)'; }
    } else { bpInterpretation = 'Invalid BP format'; }
    personalHealthData.bp = bp;
    personalHealthData.bpInterpretation = bpInterpretation;

    // SpO2 Interpretation
    let spo2Interpretation = '';
    if (personalHealthData.spo2 < 90) { spo2Interpretation = 'Requires Urgent Care (< 90% - Possible hypoxia)'; }
    else if (personalHealthData.spo2 < 95) { spo2Interpretation = 'Possible Hypoxia (< 95%)'; }
    else { spo2Interpretation = 'Normal (95% – 100%)'; }
    personalHealthData.spo2Interpretation = spo2Interpretation;

    // Snellen Chart Interpretation
    let eyechartInterpretation = '';
    const eyechartLower = personalHealthData.eyechart.toLowerCase();
    if (eyechartLower.includes('20/20')) { eyechartInterpretation = 'Normal Vision (20/20)'; }
    else if (eyechartLower.includes('20/25') || eyechartLower.includes('20/30') || eyechartLower.includes('20/40')) { eyechartInterpretation = 'Mild Vision Issues (20/25 – 20/40)'; }
    else if (eyechartLower.includes('20/50') || parseFloat(eyechartLower.split('/')[1]) >= 50) { eyechartInterpretation = 'Impaired Vision (20/50 or worse)'; }
    else { eyechartInterpretation = 'Unclassified (Input: ' + personalHealthData.eyechart + ')'; }
    personalHealthData.eyechartInterpretation = eyechartInterpretation;

    // Screen Time Interpretation
    let screenTimeInterpretation = '';
    if (personalHealthData.screenTimeHours < 2) { screenTimeInterpretation = 'Normal (< 2 hours/day recreational)'; }
    else if (personalHealthData.screenTimeHours > 6) { screenTimeInterpretation = 'Excessive (> 6 hours/day)'; }
    else { screenTimeInterpretation = 'Moderate (2-6 hours/day)'; }
    personalHealthData.screenTimeInterpretation = screenTimeInterpretation;

    // Sleep Interpretation
    let sleepInterpretation = '';
    if (personalHealthData.sleep === 'Adequate') { sleepInterpretation = 'Adequate (7 – 9 hours/night)'; }
    else { sleepInterpretation = 'Sleep-deprived (Not meeting 7 hours of sleep)'; }
    personalHealthData.sleepInterpretation = sleepInterpretation;

    const scores = calculateScores();

    const finalResults = {
      personalHealth: personalHealthData,
      aswb: {
        score: scores.aswbScore,
        interpretation: scores.aswbInterpretation,
        responses: aswbResponses
      },
      ars: {
        score: scores.arsScore,
        interpretation: scores.arsInterpretation,
        responses: arsResponses
      },
      iat: {
        score: scores.iatScore,
        interpretation: scores.iatInterpretation,
        responses: iatResponses
      }
    };
    setResults(finalResults);

    if (db && userId) {
      try {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const docRef = doc(collection(db, `artifacts/${appId}/users/${userId}/questionnaire_responses`));
        await setDoc(docRef, {
          timestamp: new Date(),
          ...finalResults,
        });
      } catch (e) {
        console.error("Error adding document:", e);
        setError(`Error saving responses: ${e.message}. Your scores are displayed above, but could not be saved.`);
      }
    } else {
      console.warn("Firestore not initialized or user ID not available. Responses will not be saved.");
      setError("Responses could not be saved (Firestore not ready). Your scores are displayed above.");
    }
  };

  const handlePrint = () => {
    if (window.html2pdf) {
      const element = document.getElementById('results');
      const printContent = document.createElement('div');
      printContent.style.padding = '20px';
      printContent.style.fontFamily = 'Inter, sans-serif';
      printContent.style.color = '#334155';
      printContent.style.backgroundColor = '#ffffff';
      
      const title = document.createElement('h1');
      title.textContent = 'First Step Paediatric Wellness Certificate and Report';
      title.style.textAlign = 'center';
      title.style.fontSize = '1.5rem';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '20px';
      printContent.appendChild(title);

      const resultsClone = element.cloneNode(true);
      const clonedPrintButton = resultsClone.querySelector('#printReportButton');
      if (clonedPrintButton) {
        clonedPrintButton.remove();
      }
      printContent.appendChild(resultsClone);

      const options = {
        margin: 10,
        filename: 'Paediatric_Wellness_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: true,
          dpi: 192,
          letterRendering: true,
          useCORS: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      window.html2pdf().set(options).from(printContent).save();
    } else {
      alert("Error: html2pdf.js library not loaded. Please ensure the library script tag is included.");
    }
  };

  const aswbOptions = [
    { label: '1 - Strongly Disagree', value: 1 },
    { label: '2 - Disagree', value: 2 },
    { label: '3 - Neutral', value: 3 },
    { label: '4 - Agree', value: 4 },
    { label: '5 - Strongly Agree', value: 5 },
  ];

  const aswbReversedOptions = [
    { label: '1 - Strongly Disagree', value: 5 },
    { label: '2 - Disagree', value: 4 },
    { label: '3 - Neutral', value: 3 },
    { label: '4 - Agree', value: 2 },
    { label: '5 - Strongly Agree', value: 1 },
  ];

  const arsOptions = [
    { label: '1 - Never', value: 1 },
    { label: '2 - Not often', value: 2 },
    { label: '3 - Sometimes', value: 3 },
    { label: '4 - Most of the time', value: 4 },
    { label: '5 - All the time', value: 5 },
  ];

  const arsReversedOptions = [
    { label: '1 - Never', value: 5 },
    { label: '2 - Not often', value: 4 },
    { label: '3 - Sometimes', value: 3 },
    { label: '4 - Most of the time', value: 2 },
    { label: '5 - All the time', value: 1 },
  ];
  
  const iatOptions = [
    { label: '0 - Not Applicable', value: 0 },
    { label: '1 - Rarely', value: 1 },
    { label: '2 - Occasionally', value: 2 },
    { label: '3 - Frequently', value: 3 },
    { label: '4 - Often', value: 4 },
    { label: '5 - Always', value: 5 },
  ];

  return (
    <div className="bg-gray-100 p-8 min-h-screen font-sans">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

      <div className="container max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg my-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-4">First Step Pediatric Wellness</h1>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Please provide the requested details and answer the following questions. Your responses will help assess various aspects of health and well-being.
        </p>

        {loading && (
          <div className="text-center text-blue-600 mb-4">
            <p>Loading application...</p>
          </div>
        )}

        {!loading && userId && (
          <div className="user-id-display bg-teal-100 border border-teal-300 text-teal-800 p-3 rounded-lg mb-4 text-sm break-all">
            Your User ID: {userId}
          </div>
        )}

        {error && (
          <div className="error-message bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {results ? (
          <div id="results" className="results-section space-y-6 mt-8">
            <h3 className="text-center font-bold text-3xl text-gray-900 mb-4">First Step Paediatric Wellness Certificate and Report</h3>
            
            <div id="personalHealthResults" className="category-section bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Personal & Health Overview</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <p><strong>Date of Test:</strong> {results.personalHealth.dateOfTest}</p>
                <p><strong>Student's Name:</strong> {results.personalHealth.studentName}</p>
                <p><strong>Class:</strong> {results.personalHealth.class}</p>
                <p><strong>Section:</strong> {results.personalHealth.section}</p>
                <p><strong>Date of Birth:</strong> {results.personalHealth.dateOfBirth}</p>
                <p><strong>School Name:</strong> {results.personalHealth.schoolName}</p>
                <p><strong>Height:</strong> {results.personalHealth.heightCm} cm</p>
                <p><strong>Weight:</strong> {results.personalHealth.weightKg} kg</p>
                <p><strong>BMI:</strong> {results.personalHealth.bmi} kg/m² - <span className="font-semibold text-green-700">{results.personalHealth.bmiInterpretation}</span></p>
                <p><strong>Blood Pressure:</strong> {results.personalHealth.bp} - <span className="font-semibold text-green-700">{results.personalHealth.bpInterpretation}</span></p>
                <p><strong>SpO2:</strong> {results.personalHealth.spo2}% - <span className="font-semibold text-green-700">{results.personalHealth.spo2Interpretation}</span></p>
                <p><strong>Eyechart:</strong> {results.personalHealth.eyechart} - <span className="font-semibold text-green-700">{results.personalHealth.eyechartInterpretation}</span></p>
                <p><strong>Screen Time:</strong> {results.personalHealth.screenTimeHours} hours/day - <span className="font-semibold text-green-700">{results.personalHealth.screenTimeInterpretation}</span></p>
                <p><strong>Brushing Habits:</strong> <span className="font-semibold text-green-700">{results.personalHealth.brushingHabits}</span></p>
                <p><strong>Sleep:</strong> <span className="font-semibold text-green-700">{results.personalHealth.sleepInterpretation}</span></p>
              </div>
            </div>

            <div id="aswbResult" className="category-section bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Subjective Well-being (ASWB) Results</h4>
              <p className="text-lg"><strong>Score:</strong> {results.aswb.score} - <span className="font-bold text-blue-600">{results.aswb.interpretation}</span></p>
            </div>

            <div id="arsResult" className="category-section bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Adolescents Resilience (ARS) Results</h4>
              <p className="text-lg"><strong>Score:</strong> {results.ars.score} - <span className="font-bold text-blue-600">{results.ars.interpretation}</span></p>
            </div>

            <div id="iatResult" className="category-section bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h4 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Internet Addiction (IAT) Results</h4>
              <p className="text-lg"><strong>Score:</strong> {results.iat.score} - <span className="font-bold text-blue-600">{results.iat.interpretation}</span></p>
            </div>

            <button
              id="printReportButton"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md"
              onClick={handlePrint}
            >
              Print / Download Report
            </button>
          </div>
        ) : (
          <form id="assessmentForm" onSubmit={handleSubmit} className="space-y-8">
            {/* Personal and Health Details Section */}
            <div className="question-group bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Personal & Health Details</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="form-field md:col-span-2">
                  <label htmlFor="dateOfTest" className="block text-gray-700 font-medium mb-1">Date of Test:</label>
                  <input
                    type="date"
                    id="dateOfTest"
                    name="dateOfTest"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.dateOfTest || ''}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="studentName" className="block text-gray-700 font-medium mb-1">Student's Name:</label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.studentName || ''}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="class" className="block text-gray-700 font-medium mb-1">Class:</label>
                  <input
                    type="text"
                    id="class"
                    name="class"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.class || ''}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="section" className="block text-gray-700 font-medium mb-1">Section:</label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.section || ''}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="dateOfBirth" className="block text-gray-700 font-medium mb-1">Date of Birth:</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.dateOfBirth || ''}
                    required
                  />
                </div>
                <div className="form-field md:col-span-2">
                  <label htmlFor="schoolName" className="block text-gray-700 font-medium mb-1">School Name:</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.schoolName || ''}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="height" className="block text-gray-700 font-medium mb-1">Height (cm):</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.height || ''}
                    step="0.1"
                    min="50"
                    max="250"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="weight" className="block text-gray-700 font-medium mb-1">Weight (kg):</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.weight || ''}
                    step="0.1"
                    min="10"
                    max="200"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="eyechart" className="block text-gray-700 font-medium mb-1">Eyechart (Snellen result e.g., 20/20):</label>
                  <input
                    type="text"
                    id="eyechart"
                    name="eyechart"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.eyechart || ''}
                    placeholder="e.g., 20/20"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="screenTime" className="block text-gray-700 font-medium mb-1">Screen Time (hours/day):</label>
                  <input
                    type="number"
                    id="screenTime"
                    name="screenTime"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.screenTime || ''}
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="brushingHabits" className="block text-gray-700 font-medium mb-1">Brushing Habits:</label>
                  <select
                    id="brushingHabits"
                    name="brushingHabits"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.brushingHabits || ''}
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Good (Brushing twice a day)">Good (Brushing twice a day)</option>
                    <option value="Require improvement">Require improvement</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="bp" className="block text-gray-700 font-medium mb-1">Blood Pressure (BP) (e.g., 120/80):</label>
                  <input
                    type="text"
                    id="bp"
                    name="bp"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.bp || ''}
                    placeholder="e.g., 120/80"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="spo2" className="block text-gray-700 font-medium mb-1">SpO2 (%):</label>
                  <input
                    type="number"
                    id="spo2"
                    name="spo2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.spo2 || ''}
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="sleep" className="block text-gray-700 font-medium mb-1">Sleep:</label>
                  <select
                    id="sleep"
                    name="sleep"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-blue-200 focus:border-blue-500"
                    onChange={handleInputChange}
                    value={formData.sleep || ''}
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Adequate">Adequate (7-9 hours/night)</option>
                    <option value="Not meeting 7 hours of sleep">Not meeting 7 hours of sleep</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ASWB Section */}
            <div className="question-group bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Adolescents’ Subjective Well-Being Scale (ASWB)</h2>
              <p className="text-gray-600 text-sm mb-4">Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).</p>
              <div className="space-y-4">
                {aswbQuestions.map((q) => (
                  <RadioGroup
                    key={q.id}
                    name={q.id}
                    label={q.label}
                    options={q.reverseScore ? aswbReversedOptions : aswbOptions}
                    state={aswbResponses}
                    stateSetter={setAswbResponses}
                  />
                ))}
              </div>
            </div>

            {/* ARS Section */}
            <div className="question-group bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Adolescents Resilience Scale Questionnaire (ARS)</h2>
              <p className="text-gray-600 text-sm mb-4">Rate each statement from 1 (Never) to 5 (All the time).</p>
              
              {Object.values(arsQuestions).map(section => (
                <div key={section.title} className="mt-6">
                  <h3 className="font-semibold text-lg text-gray-700 mb-3">{section.title}</h3>
                  <div className="ml-4 space-y-4">
                    {section.subsections.map(sub => (
                      <div key={sub.title}>
                        <h4 className="font-medium text-md text-gray-600 mb-2">{sub.title}</h4>
                        {sub.questions.map(q => (
                          <RadioGroup
                            key={q.id}
                            name={q.id}
                            label={q.label}
                            options={q.reverseScore ? arsReversedOptions : arsOptions}
                            state={arsResponses}
                            stateSetter={setArsResponses}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* IAT Section */}
            <div className="question-group bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-300">Internet Addiction Test (IAT)</h2>
              <p className="text-gray-600 text-sm mb-4">Rate each statement based on how often it describes you during the past month:</p>
              <div className="text-xs text-gray-500 mb-4">
                0 = Not Applicable, 1 = Rarely, 2 = Occasionally, 3 = Frequently, 4 = Often, 5 = Always
              </div>
              <div className="space-y-4">
                {iatQuestions.map((q) => (
                  <RadioGroup
                    key={q.id}
                    name={q.id}
                    label={q.label}
                    options={iatOptions}
                    state={iatResponses}
                    stateSetter={setIatResponses}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md"
            >
              Submit Assessment
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default App;
