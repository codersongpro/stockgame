"use client";

import { create } from "zustand";
import { getLearningMission } from "@/lib/data/learning/chapters";
import { rejectRecommendation } from "@/lib/learning/adaptation";
import {
  chooseMissionOption,
  createLearningProfile,
  startMission,
} from "@/lib/learning/missionEngine";
import { loadLearningProgress, saveLearningProgress } from "@/lib/learning/progress";
import type { LearningProfile, MissionAttempt, MissionResult, SupportMode } from "@/lib/learning/types";

const LEARNING_SAVE_KEY = "uc-learning-progress";

interface LearningStore {
  profile: LearningProfile | null;
  attempt: MissionAttempt | null;
  result: MissionResult | null;
  feedback: string | null;
  load: () => void;
  createProfile: (displayName: string) => void;
  beginMission: (missionId: string) => boolean;
  choose: (optionId: string) => void;
  retry: () => void;
  rejectRecommendedMode: (mode: SupportMode) => void;
}

function persist(profile: LearningProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEARNING_SAVE_KEY, saveLearningProgress(profile));
  } catch {
    /* ignore quota errors */
  }
}

function readProfile(): LearningProfile | null {
  if (typeof window === "undefined") return null;
  return loadLearningProgress(window.localStorage.getItem(LEARNING_SAVE_KEY));
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  profile: null,
  attempt: null,
  result: null,
  feedback: null,

  load: () => {
    const profile = readProfile();
    if (profile) set({ profile });
  },

  createProfile: (displayName) => {
    const profile = createLearningProfile(displayName);
    persist(profile);
    set({ profile, attempt: null, result: null, feedback: null });
  },

  beginMission: (missionId) => {
    let profile = get().profile ?? readProfile();
    const mission = getLearningMission(missionId);
    if (!mission) return false;
    if (!profile) profile = createLearningProfile("");
    if (!profile.unlockedMissionIds.includes(missionId) && !profile.completedMissionIds.includes(missionId)) {
      return false;
    }
    set({ profile, attempt: startMission(mission, profile), result: null, feedback: null });
    return true;
  },

  choose: (optionId) => {
    const attempt = get().attempt;
    if (!attempt || get().result) return;
    const state = chooseMissionOption(attempt, optionId);
    persist(state.profile);
    set({
      profile: state.profile,
      attempt: state.attempt,
      result: state.result,
      feedback: state.feedback,
    });
  },

  retry: () => {
    const attempt = get().attempt;
    if (!attempt) return;
    const profile = get().profile ?? attempt.profile;
    set({
      attempt: startMission(attempt.mission, profile),
      result: null,
      feedback: null,
    });
  },

  rejectRecommendedMode: (mode) => {
    const profile = get().profile ?? readProfile();
    if (!profile) return;
    const updated = rejectRecommendation(profile, mode);
    persist(updated);
    set({ profile: updated });
  },
}));
