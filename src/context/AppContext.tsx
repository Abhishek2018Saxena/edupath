import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, AnalysisResult, Activity, Achievement, ProgressState, Theme } from '@/types';
import mockAnalysis from '@/data/mockAnalysis';

const STORAGE_KEYS = {
  user: 'edupath_user',
  users: 'edupath_users',
  analysis: 'edupath_analysis',
  progress: 'edupath_progress',
  activities: 'edupath_activities',
  achievements: 'edupath_achievements',
  theme: 'edupath_theme',
  demoMode: 'edupath_demo_mode',
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_analysis', title: 'First Analysis', description: 'Analyzed your first resume', icon: 'FileSearch', unlocked: false },
  { id: 'first_learning_day', title: 'First Learning Day', description: 'Completed your first learning day', icon: 'BookOpen', unlocked: false },
  { id: 'three_day_streak', title: '3-Day Streak', description: 'Maintained a 3-day learning streak', icon: 'Flame', unlocked: false },
  { id: 'roadmap_started', title: 'Roadmap Started', description: 'Started your personalized roadmap', icon: 'Map', unlocked: false },
  { id: 'week_completed', title: 'Week Completed', description: 'Completed all 7 days of your plan', icon: 'Trophy', unlocked: false },
  { id: 'first_project', title: 'First Project', description: 'Started your first recommended project', icon: 'Rocket', unlocked: false },
];

const DEFAULT_PROGRESS: ProgressState = {
  completedDays: [],
  roadmapStageProgress: {},
  projectStarted: false,
  reportGenerated: false,
  streak: 0,
  lastCompletedDay: null,
};

interface AppContextValue {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  signUp: (data: { name: string; email: string; password: string }) => { success: boolean; error?: string };
  signIn: (data: { email: string; password: string; remember: boolean }) => { success: boolean; error?: string };
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Analysis
  analysis: AnalysisResult | null;
  isDemoMode: boolean;
  setAnalysis: (result: AnalysisResult, isDemo: boolean) => void;
  clearAnalysis: () => void;

  // Progress
  progress: ProgressState;
  toggleDayComplete: (day: number) => void;
  setRoadmapStageProgress: (stageIndex: number, progress: number) => void;
  startProject: () => void;
  markReportGenerated: () => void;

  // Activities
  activities: Activity[];
  addActivity: (type: Activity['type'], label: string) => void;

  // Achievements
  achievements: Achievement[];

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Simple hash for prototype password storage (not production-grade)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadFromStorage<User | null>(STORAGE_KEYS.user, null));
  const [analysis, setAnalysisState] = useState<AnalysisResult | null>(() =>
    loadFromStorage<AnalysisResult | null>(STORAGE_KEYS.analysis, null)
  );
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => loadFromStorage<boolean>(STORAGE_KEYS.demoMode, false));
  const [progress, setProgress] = useState<ProgressState>(() => loadFromStorage<ProgressState>(STORAGE_KEYS.progress, DEFAULT_PROGRESS));
  const [activities, setActivities] = useState<Activity[]>(() => loadFromStorage<Activity[]>(STORAGE_KEYS.activities, []));
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    loadFromStorage<Achievement[]>(STORAGE_KEYS.achievements, DEFAULT_ACHIEVEMENTS)
  );
  const [theme, setTheme] = useState<Theme>(() => loadFromStorage<Theme>(STORAGE_KEYS.theme, 'light'));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    saveToStorage(STORAGE_KEYS.theme, theme);
  }, [theme]);

  // Persist state
  useEffect(() => saveToStorage(STORAGE_KEYS.user, user), [user]);
  useEffect(() => saveToStorage(STORAGE_KEYS.analysis, analysis), [analysis]);
  useEffect(() => saveToStorage(STORAGE_KEYS.demoMode, isDemoMode), [isDemoMode]);
  useEffect(() => saveToStorage(STORAGE_KEYS.progress, progress), [progress]);
  useEffect(() => saveToStorage(STORAGE_KEYS.activities, activities), [activities]);
  useEffect(() => saveToStorage(STORAGE_KEYS.achievements, achievements), [achievements]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) => {
      const existing = prev.find((a) => a.id === id);
      if (!existing || existing.unlocked) return prev;
      return prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a));
    });
  }, []);

  const addActivity = useCallback((type: Activity['type'], label: string) => {
    setActivities((prev) => {
      const activity: Activity = {
        id: `${type}-${Date.now()}`,
        type,
        label,
        timestamp: Date.now(),
      };
      return [activity, ...prev].slice(0, 30);
    });
  }, []);

  const signUp = useCallback((data: { name: string; email: string; password: string }): { success: boolean; error?: string } => {
    const users = loadFromStorage<Record<string, { user: User; passwordHash: string }>>(STORAGE_KEYS.users, {});
    const emailKey = data.email.toLowerCase();
    if (users[emailKey]) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
      createdAt: Date.now(),
    };
    users[emailKey] = { user: newUser, passwordHash: simpleHash(data.password) };
    saveToStorage(STORAGE_KEYS.users, users);
    setUser(newUser);
    return { success: true };
  }, []);

  const signIn = useCallback((data: { email: string; password: string; remember: boolean }): { success: boolean; error?: string } => {
    const users = loadFromStorage<Record<string, { user: User; passwordHash: string }>>(STORAGE_KEYS.users, {});
    const emailKey = data.email.toLowerCase();
    const record = users[emailKey];
    if (!record || record.passwordHash !== simpleHash(data.password)) {
      return { success: false, error: 'Invalid email or password.' };
    }
    setUser(record.user);
    return { success: true };
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const setAnalysis = useCallback((result: AnalysisResult, isDemo: boolean) => {
    setAnalysisState(result);
    setIsDemoMode(isDemo);
    addActivity('resume_analyzed', `Resume analyzed for ${result.target_role || 'target role'}`);
    addActivity('skill_gaps_identified', `${result.skill_gaps?.length || 0} skill gaps identified`);
    unlockAchievement('first_analysis');
  }, [addActivity, unlockAchievement]);

  const clearAnalysis = useCallback(() => {
    setAnalysisState(null);
    setIsDemoMode(false);
    setProgress(DEFAULT_PROGRESS);
    setActivities([]);
    setAchievements(DEFAULT_ACHIEVEMENTS);
  }, []);

  const toggleDayComplete = useCallback((day: number) => {
    setProgress((prev) => {
      const isComplete = prev.completedDays.includes(day);
      const completedDays = isComplete
        ? prev.completedDays.filter((d) => d !== day)
        : [...prev.completedDays, day];

      // Streak calculation
      let streak = prev.streak;
      let lastCompletedDay = prev.lastCompletedDay;
      if (!isComplete) {
        const today = new Date().toDateString();
        if (prev.lastCompletedDay !== today) {
          streak = prev.streak + 1;
          lastCompletedDay = today;
        }
      } else {
        streak = Math.max(0, prev.streak - 1);
      }

      return { ...prev, completedDays, streak, lastCompletedDay };
    });
  }, []);

  // Update achievements when progress changes
  useEffect(() => {
    if (progress.completedDays.length >= 1) unlockAchievement('first_learning_day');
    if (progress.streak >= 3) unlockAchievement('three_day_streak');
    if (progress.completedDays.length >= 7) unlockAchievement('week_completed');
  }, [progress.completedDays, progress.streak, unlockAchievement]);

  const setRoadmapStageProgress = useCallback((stageIndex: number, prog: number) => {
    setProgress((prev) => ({
      ...prev,
      roadmapStageProgress: { ...prev.roadmapStageProgress, [stageIndex]: prog },
    }));
    if (prog > 0) unlockAchievement('roadmap_started');
  }, [unlockAchievement]);

  const startProject = useCallback(() => {
    setProgress((prev) => ({ ...prev, projectStarted: true }));
    addActivity('project_started', 'Started recommended project');
    unlockAchievement('first_project');
  }, [addActivity, unlockAchievement]);

  const markReportGenerated = useCallback(() => {
    setProgress((prev) => ({ ...prev, reportGenerated: true }));
    addActivity('report_generated', 'Career report generated');
  }, [addActivity]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value: AppContextValue = {
    user,
    isAuthenticated: Boolean(user),
    signUp,
    signIn,
    signOut,
    updateUser,
    analysis,
    isDemoMode,
    setAnalysis,
    clearAnalysis,
    progress,
    toggleDayComplete,
    setRoadmapStageProgress,
    startProject,
    markReportGenerated,
    activities,
    addActivity,
    achievements,
    theme,
    toggleTheme,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { mockAnalysis };
