export type Priority = 'High' | 'Medium' | 'Low';

export interface SkillGap {
  skill: string;
  priority: Priority;
  current_level: string;
  required_level: string;
  evidence: string;
  learning_objective: string;
}

export interface RoadmapStage {
  stage?: string;
  title?: string;
  description?: string;
  skills?: string[];
  learning_objectives?: string[];
  practice_activity?: string;
  estimated_duration?: string;
  duration?: string;
  resources?: string[];
}

export interface DayPlan {
  day?: number;
  topic?: string;
  title?: string;
  learning_objective?: string;
  objective?: string;
  tasks?: string[];
  practice_activity?: string;
  estimated_time?: string;
  estimated_duration?: string;
  skills_covered?: string[];
}

export interface RecommendedProject {
  title?: string;
  name?: string;
  description?: string;
  difficulty?: string;
  duration?: string;
  skills_practiced?: string[];
  skills?: string[];
  why_recommended?: string;
  why?: string;
  suggested_features?: string[];
  features?: string[];
  expected_outcome?: string;
  outcome?: string;
}

export interface AnalysisResult {
  status?: string;
  target_role?: string;
  candidate_summary?: string;
  current_skills?: string[];
  skills_demonstrated?: string[];
  skills_partially_demonstrated?: string[];
  missing_skills?: string[];
  skill_gaps?: SkillGap[];
  learning_roadmap?: RoadmapStage[];
  seven_day_plan?: DayPlan[];
  recommended_project?: RecommendedProject;
  next_steps?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  targetRole?: string;
  experience?: string;
  careerGoal?: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  type:
    | 'resume_analyzed'
    | 'skill_gaps_identified'
    | 'roadmap_started'
    | 'learning_day_completed'
    | 'project_started'
    | 'report_generated';
  label: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface ProgressState {
  completedDays: number[];
  roadmapStageProgress: Record<number, number>;
  projectStarted: boolean;
  reportGenerated: boolean;
  streak: number;
  lastCompletedDay: string | null;
}

export type Theme = 'light' | 'dark';
