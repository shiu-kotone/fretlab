import { create } from 'zustand';
import type { TabId } from '../components/TabBar';

interface NavigationState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

/** Session-only (not persisted) shared tab state, so any feature can request a tab switch (e.g. chord library's "指板で見る"). */
export const useNavigationStore = create<NavigationState>((set) => ({
  activeTab: 'metronome',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
