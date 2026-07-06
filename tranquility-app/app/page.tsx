'use client';
import {
  LayoutDashboard, TrendingUp, CalendarDays, Globe,
  Leaf, Lightbulb, Settings, Flame, Star, CheckCircle,
  Sparkles, ChevronDown, Wind, Timer, BookOpen, Moon, Sun
} from 'lucide-react';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './MindEase.module.css';

type Exam = {
  id: number;
  subject: string;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  anxietyRating: number;
};

type BurnoutSignals = {
  moodTrend: number;
  sleepHours: number;
  studyHours: number;
  daysUntilNextExam: number;
  missedCheckIns: number;
};

type BurnoutAssessment = {
  score: number;
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  color: string;
  explanation: string;
  intervention: string;
};

type RecoveryDay = {
  day: number;
  title: string;
  subject: string;
  duration: string;
  recovery: string;
  intensity: string;
};

type GratitudeEntry = {
  id: number;
  date: string;
  items: string[];
};

const calculateBurnoutAssessment = (signals: BurnoutSignals): BurnoutAssessment => {
  const moodRisk = Math.max(0, Math.min(100, ((5 - signals.moodTrend) / 5) * 100));
  const sleepRisk = signals.sleepHours < 6 ? 100 : signals.sleepHours < 7 ? 70 : signals.sleepHours < 8 ? 35 : 10;
  const studyRisk = Math.max(0, Math.min(100, signals.studyHours * 12));
  const examRisk = signals.daysUntilNextExam <= 3 ? 100 : signals.daysUntilNextExam <= 7 ? 80 : signals.daysUntilNextExam <= 14 ? 45 : 15;
  const missedRisk = Math.max(0, Math.min(100, signals.missedCheckIns * 18));

  const score = Math.round(
    moodRisk * 0.25 + sleepRisk * 0.2 + studyRisk * 0.2 + examRisk * 0.2 + missedRisk * 0.15,
  );

  if (score >= 85) {
    return {
      score,
      level: 'Critical',
      color: 'var(--accent-rose)',
      explanation: 'Your current pattern suggests stress is stacking quickly across your mood, sleep, and study load.',
      intervention: 'Take a real recovery break now and protect tonight’s sleep window.',
    };
  }

  if (score >= 65) {
    return {
      score,
      level: 'High',
      color: 'var(--accent-amber)',
      explanation: 'Your burnout signals are rising and your routine is starting to feel heavy.',
      intervention: 'Reduce study pressure for one block and add a short reset before the next session.',
    };
  }

  if (score >= 35) {
    return {
      score,
      level: 'Moderate',
      color: 'var(--accent-violet)',
      explanation: 'You’re showing some warning signs, but there is still space to rebalance before it builds.',
      intervention: 'Aim for one calmer evening routine and a slightly earlier bedtime tonight.',
    };
  }

  return {
    score,
    level: 'Low',
    color: 'var(--accent-sage)',
    explanation: 'Your current mix of mood, sleep, and study signals looks steady and manageable.',
    intervention: 'Keep your routine consistent and protect one hour for rest this week.',
  };
};

const MindEase = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Read from localStorage — this is what your HTML login page writes
  const [userName, setUserName] = useState('');
  const [userYear, setUserYear] = useState('');
  // Dashboard state
  const [todayMood, setTodayMood] = useState(3);
  const [todayThoughts, setTodayThoughts] = useState('');
  const [sleepHours, setSleepHours] = useState(7);
  const [aiReflection, setAiReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);
  const [aiGreeting, setAiGreeting] = useState('');
  const [studyBreakSuggestion, setStudyBreakSuggestion] = useState('');
  const [aiNudge, setAiNudge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exams state
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examDifficulty, setExamDifficulty] = useState('medium');
  const [examAnxiety, setExamAnxiety] = useState(3);

  // Gratitude state
  const [gratitudes, setGratitudes] = useState<GratitudeEntry[]>([]);
  const [studyHistory, setStudyHistory] = useState<number[]>([6, 8, 7, 9, 8]);
  const [gratitude1, setGratitude1] = useState('');
  const [gratitude2, setGratitude2] = useState('');
  const [gratitude3, setGratitude3] = useState('');

  // Focus Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [breaksTaken, setBreaksTaken] = useState(0);

  // Breathing space state
  const [breathingActive, setBreathingActive] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState('box');
  const [breathingPhase, setBreathingPhase] = useState('inhale');

  // Wellness tab
  const [wellnessTab, setWellnessTab] = useState<'breathing' | 'timer' | 'gratitude'>('breathing');

  // Mood history
  const [moodHistory, setMoodHistory] = useState<number[]>([5, 4, 3, 4, 5, 4, 3]);

  // Settings
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('20');
  const [profileYear, setProfileYear] = useState('');

  // Exam difficulty dropdown
  const [difficultyOpen, setDifficultyOpen] = useState(false);
  const moodSliderRef = useRef<HTMLInputElement | null>(null);

  const applyMoodSliderFill = useCallback((value: number) => {
    const clampedValue = Math.min(4, Math.max(0, value));
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
    const slider = moodSliderRef.current;

    if (!slider) return;

    slider.style.background = `linear-gradient(to right, ${colors[clampedValue]} 0%, ${colors[clampedValue]} ${(clampedValue / 4) * 100}%, rgba(124,111,247,0.15) ${(clampedValue / 4) * 100}%)`;
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light';
    setIsDark(theme === 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    // ── Read user from login page bridge ──────────────────────────
    // Your HTML login page saves these keys when user clicks Continue.
    // This is how the name travels from login page into this dashboard.
    const loginAlias = localStorage.getItem('mindease_user_alias');
    const loginYear  = localStorage.getItem('mindease_user_year');
    if (loginAlias) setUserName(loginAlias);
    if (loginYear)  setUserYear(loginYear);
    // ──────────────────────────────────────────────────────────────

    const savedData = localStorage.getItem('mindease-data');
    if (savedData) {
      const data = JSON.parse(savedData);
      // Only use saved name if login page didn't provide one
      setUserName(loginAlias || data.userName || 'Friend');
      setUserYear(loginYear  || data.userYear  || 'Student');
      setTodayMood(data.todayMood || 3);
      setTodayThoughts(data.todayThoughts || '');
      setSleepHours(data.sleepHours || 7);
      setExams(data.exams || []);
      setExamAnxiety(data.examAnxiety || 3);
      setStudyHistory(data.studyHistory || [6, 8, 7, 9, 8]);
      setGratitudes(data.gratitudes || []);
      setMoodHistory(data.moodHistory || [5, 4, 3, 4, 5, 4, 3]);
      setSessionsCompleted(data.sessionsCompleted || 0);
      setTotalFocusMinutes(data.totalFocusMinutes || 0);
      setBreaksTaken(data.breaksTaken || 0);
      setProfileName(loginAlias || data.userName || 'Friend');
      setProfileYear(loginYear  || data.userYear  || 'Student');
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    const data = {
      userName,
      userYear,
      todayMood,
      todayThoughts,
      sleepHours,
      exams,
      examAnxiety,
      studyHistory,
      gratitudes,
      moodHistory,
      sessionsCompleted,
      totalFocusMinutes,
      breaksTaken,
    };
    localStorage.setItem('mindease-data', JSON.stringify(data));
  }, [userName, userYear, todayMood, todayThoughts, sleepHours, exams, studyHistory, gratitudes, moodHistory, sessionsCompleted, totalFocusMinutes, breaksTaken]);

  useEffect(() => {
    applyMoodSliderFill(todayMood);
  }, [todayMood, applyMoodSliderFill]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Timer logic
  useEffect(() => {
    if (!isTimerRunning) return;

    const timer = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            setIsBreak(true);
            setSessionsCompleted((s) => s + 1);
            setTotalFocusMinutes((m) => m + 25);
            return 5 * 60;
          } else {
            setIsBreak(false);
            setBreaksTaken((b) => b + 1);
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, isBreak]);

  // Breathing animation
  useEffect(() => {
    if (!breathingActive) return;

    const phases = {
      box: ['inhale', 'hold', 'exhale', 'hold'],
      478: ['inhale', 'hold', 'exhale'],
    };
    const durations = {
      box: [4, 4, 4, 4],
      478: [4, 7, 8],
    };

    let currentPhaseIndex = 0;
    const phaseList = phases[selectedTechnique as keyof typeof phases];
    const durationList = durations[selectedTechnique as keyof typeof durations];

    const breatheTimer = setInterval(() => {
      setBreathingPhase(phaseList[currentPhaseIndex]);
      currentPhaseIndex = (currentPhaseIndex + 1) % phaseList.length;
    }, (durationList[currentPhaseIndex] || 4) * 1000);

    return () => clearInterval(breatheTimer);
  }, [breathingActive, selectedTechnique]);

  const handleCheckIn = async () => {
    setIsSubmitting(true);

    // Build exam context for Gemini
    const examsForAI = exams.map(e => ({
      subject:    e.subject,
      days_away:  daysUntil(e.date),
      difficulty: e.difficulty,
    }));

    try {
      const response = await fetch('http://localhost:8000/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:           userName,          // ← was missing
          mood:           todayMood + 1,     // convert 0-4 to 1-5 for backend
          note:           todayThoughts,     // ← was called 'thoughts' before
          mood_history:   moodHistory,       // ← was missing
          upcoming_exams: examsForAI,        // ← was missing
          streak:         calculateStreak(), // ← was missing
          sleep_hours:    sleepHours,        // ← was missing
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // ── Use ALL 6 AI outputs, not just reflection ──────────────
        setAiReflection(data.reflection || "You're doing great.");
        setShowReflection(true);

        // Update personalised greeting in header
        if (data.greeting) {
          // Store greeting to show in dashboard header
          setAiGreeting(data.greeting);
        }

        // Show study break suggestion if returned
        if (data.activity) {
          setStudyBreakSuggestion(data.activity);
        }

        // Show nudge banner if Gemini detected a pattern
        if (data.nudge) {
          setAiNudge(data.nudge);
        }

        // Auto-select breathing technique based on mood
        if (data.breathing_rec) {
          setSelectedTechnique(data.breathing_rec); // '478', 'box', or 'calm'
        }

        // ── existing code stays ──────────────────────────────────────
        setTodayMood(todayMood);
        applyMoodSliderFill(todayMood);
        setTodayThoughts('');
        const today = new Date().getDay();
        const newHistory = [...moodHistory];
        newHistory[today] = todayMood;
        setMoodHistory(newHistory);

        const card = document.querySelector('[data-ai-card]');
        if (card) {
          card.classList.remove(styles.shimmer);
          void (card as HTMLElement).offsetWidth;
          card.classList.add(styles.shimmer);
        }
      }
    } catch (error) {
      setAiReflection("Just keep going. You've got this. 💜");
      setShowReflection(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add exam
  const handleAddExam = () => {
    if (examSubject && examDate) {
      setExams([
        ...exams,
        {
          id: Date.now(),
          subject: examSubject,
          date: examDate,
          difficulty: examDifficulty,
          anxietyRating: examAnxiety,
        },
      ]);
      setExamSubject('');
      setExamDate('');
      setExamDifficulty('medium');
      setExamAnxiety(3);
    }
  };

  // Remove exam
  const handleRemoveExam = (id: number) => {
    setExams(exams.filter((e) => e.id !== id));
  };

  // Add gratitude
  const handleSaveGratitude = () => {
    if (gratitude1 || gratitude2 || gratitude3) {
      setGratitudes([
        ...gratitudes,
        {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          items: [gratitude1, gratitude2, gratitude3],
        },
      ]);
      setGratitude1('');
      setGratitude2('');
      setGratitude3('');
    }
  };

  // Save profile
  const handleSaveProfile = () => {
    setUserName(profileName);
    setUserYear(profileYear);
  };

  // Calculate streak
  const calculateStreak = () => {
    let streak = 0;
    for (let i = moodHistory.length - 1; i >= 0; i--) {
      if (moodHistory[i] > 0) streak++;
      else break;
    }
    return streak;
  };

  // Format time for timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Days countdown for exams
  const daysUntil = (dateStr: string) => {
    const examDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Page navigation
  const navigateTo = (page: string) => {
    setCurrentPage(page);
    setSidebarOpen(false);
  };

  const streak = calculateStreak();
  const recentMoodAverage = moodHistory.slice(-3).reduce((total, mood) => total + mood, 0) / Math.max(1, moodHistory.slice(-3).length);
  const nearestExamDays = exams.length > 0 ? Math.min(...exams.map((exam) => daysUntil(exam.date))) : 30;
  const burnoutSignals = React.useMemo(
    () => ({
      moodTrend: recentMoodAverage,
      sleepHours,
      studyHours: Math.max(0, totalFocusMinutes / 60),
      daysUntilNextExam: nearestExamDays,
      missedCheckIns: Math.max(0, Math.min(7, 7 - streak)),
    }),
    [recentMoodAverage, sleepHours, totalFocusMinutes, nearestExamDays, streak],
  );
  const burnoutAssessment = React.useMemo(() => calculateBurnoutAssessment(burnoutSignals), [burnoutSignals]);
  const studyHoursThisWeek = Math.max(0, totalFocusMinutes / 60);
  const studyAverage = studyHistory.reduce((total, hours) => total + hours, 0) / Math.max(1, studyHistory.length);
  const moodDrop = Math.max(0, (moodHistory.slice(-3)[0] || 0) - (moodHistory.slice(-3).at(-1) || 0));
  const warning = React.useMemo(() => {
    const hasMoodDrop = moodDrop >= 2;
    const examSoon = nearestExamDays <= 5;
    const belowAverage = studyHoursThisWeek < studyAverage;

    if (!hasMoodDrop || !examSoon || !belowAverage) {
      return null;
    }

    const examSubject = exams[0]?.subject || 'your upcoming exam';
    const percentBelowAverage = Math.max(0, Math.round((1 - studyHoursThisWeek / Math.max(1, studyAverage)) * 100));
    return {
      moodDrop,
      examSubject,
      examDays: nearestExamDays,
      percentBelowAverage,
      message: `${userName}, your mood has dropped ${moodDrop} points this week and your ${examSubject} exam is in ${nearestExamDays} days. Your study hours are ${percentBelowAverage}% below your usual pace. Based on your pattern, this combination has preceded your lowest-performing weeks. Here is what worked for you before.`,
    };
  }, [moodDrop, nearestExamDays, studyHoursThisWeek, studyAverage, exams, userName]);

  const subjectAnxietyInsight = React.useMemo(() => {
    const mathPattern = /\b(math|mathematics)\b/i;
    const twoDaysMathExams = exams.filter((exam) => mathPattern.test(exam.subject) && daysUntil(exam.date) === 2);
    const twoDaysNonMathExams = exams.filter((exam) => !mathPattern.test(exam.subject) && daysUntil(exam.date) === 2);
    const recentMoodDrop = moodHistory.length >= 3 ? moodHistory[moodHistory.length - 3] - moodHistory[moodHistory.length - 1] : 0;

    if (!twoDaysMathExams.length || twoDaysNonMathExams.length > 0 || recentMoodDrop < 2) {
      return null;
    }

    const highAnxietyMath = twoDaysMathExams.some((exam) => exam.anxietyRating >= 4);
    if (!highAnxietyMath) {
      return null;
    }

    const subject = twoDaysMathExams[0].subject;
    return {
      subject,
      message: `${userName}, you consistently experience mood drops 2 days before ${subject} exams specifically — not before other subjects. This suggests subject-specific anxiety rather than general exam stress. Here is a targeted technique for mathematical anxiety.`,
      technique: 'Try a focused warm-up with one simple problem, then use grounding breath cycles before you start intense review.',
    };
  }, [exams, moodHistory, userName]);

  const recoveryPlan = React.useMemo<RecoveryDay[]>(() => {
    const lightestSubject = exams.find((exam) => exam.difficulty === 'easy')?.subject
      || exams.find((exam) => exam.difficulty === 'medium')?.subject
      || exams[0]?.subject
      || 'core concepts';
    const urgentSubject = exams.find((exam) => exam.difficulty === 'hard')?.subject
      || exams[0]?.subject
      || 'your next exam topic';
    const isCritical = burnoutAssessment.level === 'Critical';

    return [
      {
        day: 1,
        title: 'Light reset day',
        subject: lightestSubject,
        duration: isCritical ? '20–25 min' : '25–30 min',
        recovery: isCritical ? '10-minute walk + hydration' : 'stretch break + tea',
        intensity: 'Light',
      },
      {
        day: 2,
        title: 'Build momentum',
        subject: urgentSubject,
        duration: isCritical ? '30–35 min' : '35–45 min',
        recovery: 'Short breathing reset and a snack break',
        intensity: 'Steady',
      },
      {
        day: 3,
        title: 'Return to pace',
        subject: urgentSubject,
        duration: isCritical ? '45–60 min' : '60–75 min',
        recovery: 'Protect one evening for rest and prep',
        intensity: 'Full pace',
      },
    ];
  }, [burnoutAssessment.level, exams]);

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}</div>
              <h1 className={styles.pageTitle}>Welcome back, {userName || '...'} 👋</h1>
              <p className={styles.pageSubtitle}>
                {aiGreeting || `${userYear} · How are you holding up today?`}
              </p>
            </div>

            <div className={styles.statStrip}>
              <StatCard className={styles.statCardStreak} emoji="🔥" value={calculateStreak()} label="Day streak" delay="0ms" />
              <StatCard className={styles.statCardAvg} emoji="⭐" value={(moodHistory.reduce((a, b) => a + b, 0) / moodHistory.length).toFixed(1)} label="Week average" delay="80ms" />
              <StatCard className={styles.statCardBest} emoji="😊" value={moodHistory[new Date().getDay()] > 3 ? 'Good' : 'Okay'} label="Best day this week" delay="160ms" />
              <StatCard className={styles.statCardTotal} emoji="✓" value={moodHistory.filter((m) => m > 0).length} label="Total check-ins" delay="240ms" />
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={`${styles.glassCard} ${styles.reveal}`}>
                <h2 className={styles.cardTitle}>Today&apos;s check-in</h2>
                <p className={styles.cardSub}>Be honest — this space is only for you.</p>

                <div className={styles.moodRow}>
                  <label className={styles.moodLabel}>How are you feeling?</label>
                  <div className={styles.moodEmoji}>{['😔', '😕', '😐', '🙂', '😊'][todayMood]}</div>
                </div>

                <input
                  ref={moodSliderRef}
                  type="range"
                  min="0"
                  max="4"
                  value={todayMood}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTodayMood(val);
                    applyMoodSliderFill(val);
                  }}
                  className={styles.moodSlider}
                />

                <div className={styles.moodLabels}>
                  {['Bad', 'Rough', 'Okay', 'Good', 'Great'].map((label, idx) => (
                    <span key={idx} className={todayMood === idx ? styles.activeMoodLabel : styles.inactiveMoodLabel}>
                      {label}
                    </span>
                  ))}
                </div>

                <textarea
                  placeholder="Exams, sleep, a difficult conversation… anything at all."
                  value={todayThoughts}
                  onChange={(e) => setTodayThoughts(e.target.value)}
                  className={styles.textarea}
                />

                <button
                  onClick={handleCheckIn}
                  className={styles.primaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '✨ Getting your reflection...' : 'Share with me'}
                </button>
              </div>

              <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                <h2 className={styles.cardTitle}>Your week</h2>
                <p className={styles.cardSub}>How you&apos;ve been feeling</p>
                <div className={styles.barChart}>
                  {moodHistory.map((mood, idx) => (
                    <div key={idx} className={styles.barWrapper}>
                      <div className={styles.bar} style={{ '--mood': mood } as React.CSSProperties} />
                      <span className={styles.dayLabel}>{'SMTWTFS'[idx]}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.moodLegend}>
                  <span style={{ color: 'var(--accent-rose)' }}>🔴 Bad</span>
                  <span style={{ color: 'var(--accent-amber)' }}>🟡 Rough</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>⚪ Okay</span>
                  <span style={{ color: 'var(--accent-sage)' }}>🟢 Good</span>
                  <span style={{ color: 'var(--accent-violet)' }}>🟣 Great</span>
                </div>
              </div>
            </div>

            <div className={`${styles.glassCard} ${styles.burnoutCard} ${styles.reveal}`} style={{ '--delay': '120ms' } as React.CSSProperties}>
              <div className={styles.burnoutHeader}>
                <div>
                  <div className={styles.eyebrow}>AI WELLNESS INSIGHT</div>
                  <h2 className={styles.cardTitle}>Burnout Prediction Score</h2>
                  <p className={styles.cardSub}>Live outlook based on your recent check-ins and study rhythm.</p>
                </div>
                <div className={`${styles.burnoutBadge} ${styles[`burnoutBadge${burnoutAssessment.level}`]}`}>
                  {burnoutAssessment.level}
                </div>
              </div>

              <div className={styles.burnoutBody}>
                <div
                  className={`${styles.burnoutGauge} ${
                    burnoutAssessment.level === 'Critical' ? styles.burnoutGaugeCritical : ''
                  }`}
                  style={{ background: `conic-gradient(${burnoutAssessment.color} ${burnoutAssessment.score * 3.6}deg, rgba(255,255,255,0.16) 0deg)` }}
                >
                  <div className={styles.burnoutGaugeInner}>
                    <div className={styles.burnoutScore}>{burnoutAssessment.score}</div>
                    <div className={styles.burnoutScoreOutOf}>/100</div>
                  </div>
                </div>

                <div className={styles.burnoutInsights}>
                  <p className={styles.burnoutExplanation}>{burnoutAssessment.explanation}</p>
                  <div className={styles.burnoutAction}>{burnoutAssessment.intervention}</div>

                  <div className={styles.burnoutBreakdown}>
                    <div className={styles.burnoutMetric}>
                      <span>Sleep</span>
                      <strong>{sleepHours.toFixed(1)}h</strong>
                    </div>
                    <div className={styles.burnoutMetric}>
                      <span>Study</span>
                      <strong>{(totalFocusMinutes / 60).toFixed(1)}h</strong>
                    </div>
                    <div className={styles.burnoutMetric}>
                      <span>Next exam</span>
                      <strong>{nearestExamDays}d</strong>
                    </div>
                  </div>

                  <div className={styles.burnoutInputRow}>
                    <label className={styles.burnoutInputLabel}>Sleep tonight</label>
                    <input
                      type="range"
                      min="4"
                      max="10"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                      className={styles.burnoutSlider}
                    />
                    <span className={styles.burnoutInputValue}>{sleepHours.toFixed(1)}h</span>
                  </div>
                </div>
              </div>
            </div>

            {warning && (
              <div className={`${styles.glassCard} ${styles.warningCard} ${styles.reveal}`} style={{ '--delay': '180ms' } as React.CSSProperties}>
                <div className={styles.warningHeader}>
                  <div>
                    <div className={styles.eyebrow}>48-HOUR EARLY WARNING</div>
                    <h2 className={styles.cardTitle}>Paurva is nudging you early</h2>
                    <p className={styles.cardSub}>Your pattern is matching the signs that came before harder weeks.</p>
                  </div>
                  <div className={styles.warningBadge}>Watch now</div>
                </div>
                <p className={styles.warningText}>{warning.message}</p>
                <div className={styles.warningPillRow}>
                  <span className={styles.warningPill}>Mood drop: {warning.moodDrop} pts</span>
                  <span className={styles.warningPill}>Exam in {warning.examDays} days</span>
                  <span className={styles.warningPill}>Study pace {warning.percentBelowAverage}% below average</span>
                </div>
              </div>
            )}

            {showReflection && (
              <div className={`${styles.glassCard} ${styles.aiCard}`} data-ai-card>
                <div className={styles.aiHeader}>
                  <div className={styles.aiIcon}>✨</div>
                  <div>
                    <h2 className={styles.cardTitle}>Your AI reflection</h2>
                    <p className={styles.cardSub}>Just for you · Powered by Gemini</p>
                  </div>
                </div>
                <p className={styles.aiText}>{aiReflection}</p>
              </div>
            )}
            {/* AI Study Break Suggestion */}
            {studyBreakSuggestion && (
              <div className={`${styles.glassCard} ${styles.aiCard}`}>
                <div className={styles.aiHeader}>
                  <div className={styles.aiIcon}>🎯</div>
                  <div>
                    <h2 className={styles.cardTitle}>5-minute reset</h2>
                    <p className={styles.cardSub}>A specific activity for right now</p>
                  </div>
                </div>
                <p className={styles.aiText}>{studyBreakSuggestion}</p>
              </div>
            )}

            {/* AI Nudge Banner */}
            {aiNudge && (
              <div className={`${styles.glassCard} ${styles.warningCard}`}>
                <p style={{ fontSize: '13.5px', lineHeight: 1.7 }}>💜 {aiNudge}</p>
              </div>
            )}
          </div>
        );

      case 'mood-history':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>INSIGHTS</div>
              <h1 className={styles.pageTitle}>Mood History</h1>
              <p className={styles.pageSubtitle}>See how you&apos;ve been feeling</p>
            </div>

            <div className={styles.twoColumnGrid}>
              <StatCard emoji="📊" value={(moodHistory.reduce((a, b) => a + b, 0) / moodHistory.length).toFixed(1)} label="30-day average" delay="0ms" />
              <StatCard emoji="🔥" value={calculateStreak()} label="Best streak" delay="80ms" />
            </div>

            <div className={`${styles.glassCard} ${styles.reveal}`}>
              <h2 className={styles.cardTitle}>7-Day mood trend</h2>
              <svg className={styles.lineChart} viewBox="0 0 700 300">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-violet)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--accent-violet)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  points={moodHistory.map((mood, idx) => `${idx * 100 + 50},${250 - mood * 40}`).join(' ')}
                  fill="none"
                  stroke="var(--accent-violet)"
                  strokeWidth="3"
                  className={styles.chartLine}
                />
                <polygon
                  points={`50,250 ${moodHistory.map((mood, idx) => `${idx * 100 + 50},${250 - mood * 40}`).join(' ')} 650,250`}
                  fill="url(#chartGradient)"
                />
                {moodHistory.map((mood, idx) => (
                  <circle key={idx} cx={idx * 100 + 50} cy={250 - mood * 40} r="5" fill="var(--accent-violet)" stroke="white" strokeWidth="2" />
                ))}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                  <text key={idx} x={idx * 100 + 50} y="290" textAnchor="middle" className={styles.chartLabel}>
                    {day}
                  </text>
                ))}
              </svg>
            </div>

            <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '160ms' } as React.CSSProperties}>
              <h2 className={styles.cardTitle}>30-Day heatmap</h2>
              <div className={styles.heatmap}>
                {Array(30)
                  .fill(0)
                  .map((_, idx) => (
                    <div key={idx} className={styles.heatmapCell} style={{ '--mood': moodHistory[idx % moodHistory.length] ?? 0 } as React.CSSProperties} title={`Day ${idx + 1}: Mood level`} />
                  ))}
              </div>
            </div>
          </div>
        );

      case 'exam-planner':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>PLANNING</div>
              <h1 className={styles.pageTitle}>Exam Planner</h1>
              <p className={styles.pageSubtitle}>Stay on top of your schedule</p>
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={`${styles.glassCard} ${styles.reveal}`} style={{ position: 'relative', zIndex: 10 }}>
                <h2 className={styles.cardTitle}>Add exam</h2>
                <input
                  type="text"
                  placeholder="Subject name"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  className={styles.input}
                />
                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className={styles.input} />

                {/* Custom difficulty dropdown */}
                <div className={styles.customDropdown}>
                  <button
                    type="button"
                    className={`${styles.dropdownTrigger} ${difficultyOpen ? styles.dropdownOpen : ''}`}
                    onClick={() => setDifficultyOpen(!difficultyOpen)}
                  >
                    <span className={styles.dropdownValue}>
                      {examDifficulty === 'easy' && <><span className={styles.difficultyDot} data-level="easy" />Easy</>}
                      {examDifficulty === 'medium' && <><span className={styles.difficultyDot} data-level="medium" />Medium</>}
                      {examDifficulty === 'hard' && <><span className={styles.difficultyDot} data-level="hard" />Hard</>}
                    </span>
                    <span className={`${styles.dropdownChevron} ${difficultyOpen ? styles.chevronUp : ''}`}>›</span>
                  </button>

                  {difficultyOpen && (
                    <div className={styles.dropdownMenu}>
                      {[
                        { value: 'easy', label: 'Easy', emoji: '🟢', desc: 'Light revision needed' },
                        { value: 'medium', label: 'Medium', emoji: '🟡', desc: 'Some prep required' },
                        { value: 'hard', label: 'Hard', emoji: '🔴', desc: 'Heavy study load' },
                      ].map((opt, i) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`${styles.dropdownItem} ${examDifficulty === opt.value ? styles.dropdownItemActive : ''}`}
                          style={{ '--item-delay': `${i * 50}ms` } as React.CSSProperties}
                          onClick={() => { setExamDifficulty(opt.value); setDifficultyOpen(false); }}
                        >
                          <span className={styles.dropdownItemEmoji}>{opt.emoji}</span>
                          <div className={styles.dropdownItemText}>
                            <span className={styles.dropdownItemLabel}>{opt.label}</span>
                            <span className={styles.dropdownItemDesc}>{opt.desc}</span>
                          </div>
                          {examDifficulty === opt.value && <span className={styles.dropdownItemCheck}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.anxietyRow}>
                  <label className={styles.inputLabel}>Subject anxiety</label>
                  <div className={styles.anxietyControl}>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={examAnxiety}
                      onChange={(e) => setExamAnxiety(parseInt(e.target.value, 10))}
                      className={styles.anxietySlider}
                    />
                    <span className={styles.anxietyValue}>{examAnxiety}/5</span>
                  </div>
                  <p className={styles.microText}>How anxious does this subject make you feel?</p>
                </div>
                <button onClick={handleAddExam} className={styles.primaryButton}>
                  Add exam
                </button>
              </div>

              <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                <h2 className={styles.cardTitle}>Upcoming exams</h2>
                {exams.length === 0 ? (
                  <p className={styles.emptyState}>No exams yet — enjoy it while it lasts.</p>
                ) : (
                  <div className={styles.examList}>
                    {exams.map((exam) => (
                      <div key={exam.id} className={styles.examItem}>
                        <div className={styles.examInfo}>
                          <div className={styles.examDot} style={{ '--mood': exam.difficulty === 'easy' ? 1 : exam.difficulty === 'medium' ? 3 : 4 } as React.CSSProperties} />
                          <div>
                            <div className={styles.examName}>{exam.subject}</div>
                            <div className={styles.examDate}>{new Date(exam.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className={styles.examMeta}>
                          <span className={styles.examAnxietyBadge}>Anxiety {exam.anxietyRating}/5</span>
                        </div>
                        <div className={styles.examCountdown}>{daysUntil(exam.date)}d</div>
                        <button onClick={() => handleRemoveExam(exam.id)} className={styles.removeButton}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {subjectAnxietyInsight && (
              <div className={`${styles.glassCard} ${styles.anxietyInsightCard} ${styles.reveal}`} style={{ '--delay': '140ms' } as React.CSSProperties}>
                <div className={styles.warningHeader}>
                  <div>
                    <div className={styles.eyebrow}>EXAM ANXIETY INSIGHT</div>
                    <h2 className={styles.cardTitle}>Targeted math anxiety support</h2>
                    <p className={styles.cardSub}>Gemini found a subject-specific mood pattern.</p>
                  </div>
                  <div className={styles.warningBadge}>Subject focus</div>
                </div>
                <p className={styles.warningText}>{subjectAnxietyInsight.message}</p>
                <div className={styles.anxietyTechnique}>
                  <strong>Technique:</strong> {subjectAnxietyInsight.technique}
                </div>
              </div>
            )}

            <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '160ms' } as React.CSSProperties}>
              <h2 className={styles.cardTitle}>7-Day stress forecast</h2>
              <div className={styles.stressForecast}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const upcomingExams = exams.filter((e) => {
                    const days = daysUntil(e.date);
                    return days === idx || days === idx + 1 || (days >= idx && days <= idx + 3);
                  });
                  const stressLevel = upcomingExams.length > 0 ? (upcomingExams[0].difficulty === 'hard' ? 'high' : 'medium') : 'low';
                  const stressClass = {
                    low: styles['stress-low'],
                    medium: styles['stress-medium'],
                    high: styles['stress-high'],
                  }[stressLevel];

                  return (
                    <div key={idx} className={`${styles.stressPill} ${stressClass}`}>
                      <div className={styles.stressPillLabel}>{day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'campus-pulse':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>COMMUNITY</div>
              <h1 className={styles.pageTitle}>Campus Pulse</h1>
              <p className={styles.pageSubtitle}>How is your campus feeling today?</p>
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={`${styles.glassCard} ${styles.reveal}`}>
                <div className={styles.centerContent}>
                  <div className={styles.bigStat}>4.2</div>
                  <p className={styles.statLabel}>Campus mood score out of 5</p>
                  <div className={styles.emojiPill}>😊 Mostly good vibes</div>
                  <div className={styles.miniBarChart}>
                    {['😔', '😕', '😐', '🙂', '😊'].map((emoji, idx) => (
                      <div key={idx} className={styles.miniBar} style={{ '--mood': idx + 1 } as React.CSSProperties}>
                        <span className={styles.miniBarEmoji}>{emoji}</span>
                        <div className={styles.miniBarFill} style={{ height: `${Math.random() * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <p className={styles.microText}>Based on 342 check-ins today</p>
                </div>
              </div>

              <div className={styles.stackedCards}>
                <div className={`${styles.glassCard} ${styles.reveal}`}>
                  <h2 className={styles.cardTitle}>Your contribution</h2>
                  <div className={styles.contributionCard}>
                    <div className={styles.moodEmoji}>{['😔', '😕', '😐', '🙂', '😊'][todayMood]}</div>
                    <p className={styles.cardSub}>You shared a {['Bad', 'Rough', 'Okay', 'Good', 'Great'][todayMood]} mood today</p>
                  </div>
                </div>

                <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                  <h2 className={styles.cardTitle}>Mood breakdown</h2>
                  {[
                    { emoji: '😔', label: 'Bad', pct: 8 },
                    { emoji: '😕', label: 'Rough', pct: 15 },
                    { emoji: '😐', label: 'Okay', pct: 28 },
                    { emoji: '🙂', label: 'Good', pct: 32 },
                    { emoji: '😊', label: 'Great', pct: 17 },
                  ].map((mood, idx) => (
                    <div key={idx} className={styles.progressRow}>
                      <span className={styles.progressLabel}>
                        {mood.emoji} {mood.label}
                      </span>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ '--mood': mood.pct } as React.CSSProperties} />
                      </div>
                      <span className={styles.progressValue}>{mood.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'wellness':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>WELLNESS</div>
              <h1 className={styles.pageTitle}>Wellness Hub</h1>
              <p className={styles.pageSubtitle}>Breathe, focus, and reflect — all in one place.</p>
            </div>

            {/* Wellness Tabs */}
            <div className={styles.wellnessTabs}>
              {([
                { id: 'breathing', label: 'Breathing Space', icon: '🫁' },
                { id: 'timer', label: 'Focus Timer', icon: '⏱️' },
                { id: 'gratitude', label: 'Gratitude Journal', icon: '📝' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWellnessTab(tab.id)}
                  className={`${styles.wellnessTab} ${wellnessTab === tab.id ? styles.activeTab : ''}`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Breathing Space */}
            {wellnessTab === 'breathing' && (
              <>
                <div className={styles.techniqueGrid}>
                  {[
                    { id: 'box', name: 'Box breathing', desc: '4-4-4-4' },
                    { id: '478', name: '4-7-8 breathing', desc: 'Calming rhythm' },
                  ].map((tech) => (
                    <div
                      key={tech.id}
                      className={`${styles.techniquePill} ${selectedTechnique === tech.id ? styles.selected : ''}`}
                      onClick={() => setSelectedTechnique(tech.id)}
                    >
                      <div className={styles.techniqueEmoji}>🫁</div>
                      <div className={styles.techniqueName}>{tech.name}</div>
                      <div className={styles.techniqueDesc}>{tech.desc}</div>
                    </div>
                  ))}
                </div>
                <div className={`${styles.glassCard} ${styles.reveal}`}>
                  <div className={styles.centerContent}>
                    <div className={`${styles.breathingCircle} ${breathingActive ? styles.breathing : ''}`} style={{ '--phase': breathingPhase } as React.CSSProperties}>
                      <div className={styles.breathingInner} />
                    </div>
                    <div className={styles.phaseTimer}>{['inhale', 'hold', 'exhale'].includes(breathingPhase) ? breathingPhase.charAt(0).toUpperCase() + breathingPhase.slice(1) : 'Hold'}</div>
                    <p className={styles.phaseLabel}>{breathingPhase === 'inhale' ? 'Breathe in…' : breathingPhase === 'exhale' ? 'Breathe out…' : 'Hold…'}</p>
                    <div className={styles.buttonGroup}>
                      <button onClick={() => setBreathingActive(!breathingActive)} className={`${styles.primaryButton} ${breathingActive ? styles.active : ''}`}>
                        {breathingActive ? 'Pause' : 'Start'}
                      </button>
                      <button onClick={() => { setBreathingActive(false); setBreathingPhase('inhale'); }} className={styles.secondaryButton}>
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Focus Timer */}
            {wellnessTab === 'timer' && (
              <div className={styles.twoColumnGrid}>
                <div className={`${styles.glassCard} ${styles.reveal}`}>
                  <div className={styles.centerContent}>
                    <div className={styles.ringTimer}>
                      <svg viewBox="0 0 200 200" className={styles.timerSvg}>
                        <circle cx="100" cy="100" r="90" className={styles.timerTrack} />
                        <circle
                          cx="100" cy="100" r="90"
                          className={`${styles.timerProgress} ${isBreak ? styles.breakMode : ''}`}
                          style={{ strokeDashoffset: `${(timerSeconds / (isBreak ? 300 : 1500)) * 565}` } as React.CSSProperties}
                        />
                      </svg>
                      <div className={styles.timerDisplay}>
                        <div className={styles.timerTime}>{formatTime(timerSeconds)}</div>
                        <div className={styles.timerPhase}>{isBreak ? 'Break' : 'Focus'}</div>
                      </div>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`${styles.primaryButton} ${isTimerRunning ? styles.active : ''}`}>
                        {isTimerRunning ? 'Pause' : 'Start'}
                      </button>
                      <button onClick={() => { setIsTimerRunning(false); setTimerSeconds(isBreak ? 5 * 60 : 25 * 60); }} className={styles.secondaryButton}>
                        Reset
                      </button>
                    </div>
                    <div className={styles.timerStats}>
                      <div><div className={styles.statValue}>{sessionsCompleted}</div><div className={styles.statName}>Sessions</div></div>
                      <div><div className={styles.statValue}>{totalFocusMinutes}</div><div className={styles.statName}>Minutes</div></div>
                      <div><div className={styles.statValue}>{breaksTaken}</div><div className={styles.statName}>Breaks</div></div>
                    </div>
                  </div>
                </div>
                <div className={styles.stackedCards}>
                  <div className={`${styles.glassCard} ${styles.reveal}`}>
                    <h2 className={styles.cardTitle}>What are you studying?</h2>
                    <input type="text" placeholder="e.g., Organic Chemistry" className={styles.input} />
                    <label className={styles.inputLabel}>Session length</label>
                    <select className={styles.input}>
                      <option>25 minutes (Pomodoro)</option>
                      <option>45 minutes</option>
                      <option>90 minutes</option>
                    </select>
                  </div>
                  <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                    <h2 className={styles.cardTitle}>Today&apos;s sessions</h2>
                    <p className={styles.emptyState}>No sessions yet. Start your first one!</p>
                  </div>
                </div>
              </div>
            )}

            {/* Gratitude Journal */}
            {wellnessTab === 'gratitude' && (
              <div className={styles.twoColumnGrid}>
                <div className={`${styles.glassCard} ${styles.reveal}`}>
                  <h2 className={styles.cardTitle}>New entry</h2>
                  <input type="text" placeholder="1. Something good that happened today" value={gratitude1} onChange={(e) => setGratitude1(e.target.value)} className={styles.input} />
                  <input type="text" placeholder="2. Someone you appreciated" value={gratitude2} onChange={(e) => setGratitude2(e.target.value)} className={styles.input} />
                  <input type="text" placeholder="3. Something about yourself" value={gratitude3} onChange={(e) => setGratitude3(e.target.value)} className={styles.input} />
                  <button onClick={handleSaveGratitude} className={styles.primaryButton}>Save entry</button>
                </div>
                <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                  <h2 className={styles.cardTitle}>Past entries</h2>
                  {gratitudes.length === 0 ? (
                    <p className={styles.emptyState}>Your first entry is the hardest. What went okay today?</p>
                  ) : (
                    <div className={styles.entryList}>
                      {gratitudes.map((entry) => (
                        <div key={entry.id} className={styles.entry}>
                          <p className={styles.entryDate}>{entry.date}</p>
                          {entry.items.map((item, idx) => item && <p key={idx} className={styles.entryItem}>{['🌟', '🤝', '💪'][idx]} {item}</p>)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'resources':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>HELP</div>
              <h1 className={styles.pageTitle}>Resources</h1>
              <p className={styles.pageSubtitle}>You don&apos;t have to figure it out alone.</p>
            </div>

            <div className={`${styles.glassCard} ${styles.crisisCard} ${styles.reveal}`}>
              <div className={styles.crisisContent}>
                <div className={styles.crisisNumber}>📞 +91-9152-987-821</div>
                <div className={styles.crisisLabel}>iCall</div>
              </div>
              <div className={styles.crisisContent}>
                <div className={styles.crisisNumber}>📞 +91-9999-666-555</div>
                <div className={styles.crisisLabel}>Vandrevala Foundation</div>
              </div>
            </div>

            <div className={styles.resourceGrid}>
              {[
                { title: 'Sleep science for students', desc: 'Why 8 hours matters (and how to find time for it)', icon: '😴', color: 'var(--accent-violet)' },
                { title: 'Managing exam anxiety', desc: 'Practical strategies that actually work', icon: '🧠', color: 'var(--accent-sage)' },
                { title: 'Nutrition for brain health', desc: 'Fuel your focus without caffeine crashes', icon: '🥗', color: 'var(--accent-amber)' },
              ].map((resource, idx) => (
                <div key={idx} className={`${styles.glassCard} ${styles.resourceCard} ${styles.reveal}`} style={{ '--delay': `${idx * 80}ms`, borderLeftColor: resource.color } as React.CSSProperties}>
                  <div className={styles.resourceIcon}>{resource.icon}</div>
                  <h3 className={styles.resourceTitle}>{resource.title}</h3>
                  <p className={styles.resourceDesc}>{resource.desc}</p>
                  <a href="#" className={styles.resourceLink}>
                    Read more →
                  </a>
                </div>
              ))}
            </div>

            <div className={styles.tipGrid}>
              {[
                { title: 'The 2-minute rule', desc: 'If it takes less than 2 minutes, do it now.', icon: '⏱️' },
                { title: 'Phone-free hours', desc: 'Your brain will thank you for the break.', icon: '📵' },
                { title: 'Cold water splash', desc: 'Quick reset when you feel overwhelmed.', icon: '💧' },
                { title: 'Daylight outside', desc: 'Even 10 minutes resets your circadian rhythm.', icon: '☀️' },
              ].map((tip, idx) => (
                <div key={idx} className={`${styles.glassCard} ${styles.tipCard} ${styles.reveal}`} style={{ '--delay': `${idx * 80}ms` } as React.CSSProperties}>
                  <div className={styles.tipIcon}>{tip.icon}</div>
                  <h3 className={styles.tipTitle}>{tip.title}</h3>
                  <p className={styles.tipText}>{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <div className={styles.eyebrow}>ACCOUNT</div>
              <h1 className={styles.pageTitle}>Settings</h1>
              <p className={styles.pageSubtitle}>Manage your profile and preferences.</p>
            </div>

            <div className={styles.twoColumnGrid}>
              <div className={`${styles.glassCard} ${styles.reveal}`}>
                <h2 className={styles.cardTitle}>Profile</h2>
                <label className={styles.inputLabel}>Name</label>
                <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={styles.input} />
                <label className={styles.inputLabel}>Age</label>
                <input type="number" value={profileAge} onChange={(e) => setProfileAge(e.target.value)} className={styles.input} />
                <label className={styles.inputLabel}>Year</label>
                <input type="text" value={profileYear} onChange={(e) => setProfileYear(e.target.value)} className={styles.input} />
                <button onClick={handleSaveProfile} className={styles.primaryButton}>
                  Save changes
                </button>
              </div>

              <div className={styles.stackedCards}>
                <div className={`${styles.glassCard} ${styles.reveal}`}>
                  <h2 className={styles.cardTitle}>Appearance</h2>
                  <div className={styles.toggleRow}>
                    <span>Dark mode</span>
                    <button onClick={toggleTheme} className={`${styles.toggleSwitch} ${isDark ? styles.active : ''}`}>
                      <div className={styles.toggleSlider}>{isDark ? '🌙' : '☀️'}</div>
                      <span className={styles.toggleLabel}>{isDark ? 'Dark' : 'Light'}</span>
                    </button>
                  </div>
                </div>

                <div className={`${styles.glassCard} ${styles.reveal}`} style={{ '--delay': '80ms' } as React.CSSProperties}>
                  <h2 className={styles.cardTitle}>Data</h2>
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(localStorage.getItem('mindease-data'));
                      const element = document.createElement('a');
                      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(dataStr));
                      element.setAttribute('download', 'mindease-export.json');
                      element.click();
                    }}
                    className={styles.secondaryButton}
                  >
                    Export data
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure? This cannot be undone.')) {
                        localStorage.removeItem('mindease-data');
                        location.reload();
                      }
                    }}
                    className={styles.dangerButton}
                  >
                    Clear all data
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700&family=Inter:wght@400;500;600;700&display=swap');

        :root[data-theme="light"] {
          --bg-aurora-1: #C4B5F4;
          --bg-aurora-2: #B8E8D0;
          --bg-aurora-3: #F5D0C5;
          --text-primary: #050511;
          --text-secondary: #2C314A;
          --text-tertiary: #8090A8;
          --accent-violet: #7C6FF7;
          --accent-sage: #5B8A68;
          --accent-rose: #D4607A;
          --accent-amber: #C4813A;
          --glass-bg: rgba(255, 255, 255, 0.28);
          --glass-border: rgba(255, 255, 255, 0.45);
          --input-bg: rgba(255, 255, 255, 0.50);
          --input-border: rgba(180, 170, 220, 0.40);
          --pill-bg: rgba(255, 255, 255, 0.38);
          --pill-border: rgba(200, 190, 230, 0.50);
          background: linear-gradient(-45deg, var(--bg-aurora-1) 0%, var(--bg-aurora-2) 50%, var(--bg-aurora-3) 100%);
          background-size: 400% 400%;
          animation: aurora 18s ease-in-out infinite alternate;
        }

        :root[data-theme="dark"] {
          --bg-aurora-1: #1A0B2E;
          --bg-aurora-2: #0B2430;
          --bg-aurora-3: #3D1020;
          --text-primary: #FFFFFF;
          --text-secondary: #C4BDDD;
          --text-tertiary: #5A5278;
          --accent-violet: #9D96FF;
          --accent-sage: #76A781;
          --accent-rose: #F08FAA;
          --accent-amber: #F0A050;
          --glass-bg: rgba(15, 10, 30, 0.45);
          --glass-border: rgba(255, 255, 255, 0.08);
          --input-bg: rgba(255, 255, 255, 0.06);
          --input-border: rgba(255, 255, 255, 0.12);
          --pill-bg: rgba(255, 255, 255, 0.08);
          --pill-border: rgba(255, 255, 255, 0.14);
          background: linear-gradient(-45deg, var(--bg-aurora-1) 0%, var(--bg-aurora-2) 50%, var(--bg-aurora-3) 100%);
          background-size: 400% 400%;
          animation: aurora 18s ease-in-out infinite alternate;
        }

        @keyframes aurora {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', sans-serif; color: var(--text-primary); }
      `}</style>

      {/* Sidebar */}
      <nav className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarContent}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🧠</div>
            <span>Mind<span style={{ color: 'var(--accent-violet)' }}>Ease</span></span>
          </div>

          <div className={styles.navSection}>
            <p className={styles.navSectionLabel}>Main</p>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/> },
              { id: 'mood-history', label: 'Mood History', icon: '📈' },
              { id: 'exam-planner', label: 'Exam Planner', icon: <BookOpen size={18}/> },
              { id: 'campus-pulse', label: 'Campus Pulse', icon: <Globe size={18}/> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.navSection}>
            <p className={styles.navSectionLabel}>Wellness</p>
            <button
              onClick={() => navigateTo('wellness')}
              className={`${styles.navItem} ${currentPage === 'wellness' ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🌿</span>
              <span>Wellness Hub</span>
            </button>
          </div>

          <div className={styles.navSection}>
            <p className={styles.navSectionLabel}>Support</p>
            {[{ id: 'resources', label: 'Resources', icon: '💡' }].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.id === 'resources' && <span style={{ marginLeft: 'auto' }} className={styles.helpBadge}>!</span>}
              </button>
            ))}
            {[{ id: 'settings', label: 'Settings', icon: '⚙️' }].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`${styles.navItem} ${currentPage === item.id ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className={styles.sidebarFooter}>
            <button onClick={toggleTheme} className={`${styles.toggleSwitch} ${isDark ? styles.active : ''}`}>
              <div className={styles.toggleSlider}>{isDark ? '🌙' : '☀️'}</div>
              <span className={styles.toggleLabel}>{isDark ? 'Dark mode' : 'Light mode'}</span>
            </button>
            <div className={styles.userCard}>
              <div className={styles.userName}>{userName || 'You'}</div>
              <div className={styles.userYear}>{userYear}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`${styles.mobileMenuButton} ${sidebarOpen ? styles.menuOpen : ''}`}
      >
        ☰
      </button>

      {/* Backdrop for mobile */}
      {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

      {/* Animated blobs */}
      <div className={styles.blobContainer}>
        <svg className={styles.blob} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M150,100 Q200,50 250,100 Q300,150 250,200 Q200,250 150,200 Q100,150 150,100" fill="currentColor" opacity="0.15" />
        </svg>
        <svg className={styles.blob} style={{ '--blob-delay': '-2s', '--blob-duration': '8s' } as React.CSSProperties} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M100,150 Q150,100 200,150 Q250,200 200,250 Q150,300 100,250 Q50,200 100,150" fill="currentColor" opacity="0.12" />
        </svg>
        <svg className={styles.blob} style={{ '--blob-delay': '-4s', '--blob-duration': '10s' } as React.CSSProperties} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <path d="M200,120 Q270,100 300,170 Q320,240 260,280 Q200,300 150,260 Q120,200 200,120" fill="currentColor" opacity="0.1" />
        </svg>
      </div>

      {/* Main content */}
      <main className={styles.main}>{renderPage()}</main>
    </div>
  );
};

const StatCard = ({ emoji, value, label, delay }: { emoji: string; value: number | string; label: string; delay: string }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && typeof value === 'number') {
          let current = 0;
          const target = value;
          const increment = target / 40;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setDisplayValue(target);
              clearInterval(timer);
            } else {
              setDisplayValue(Math.floor(current));
            }
          }, 20);
        } else {
          setDisplayValue(value as never);
        }
      },
      { threshold: 0.12 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} style={{ '--delay': delay } as React.CSSProperties} className={styles.statCard}>
      <div className={styles.statEmoji}>{emoji}</div>
      <div className={styles.statNumber}>{displayValue}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
};

export default MindEase;
