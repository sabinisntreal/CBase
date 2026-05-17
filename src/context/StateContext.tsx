import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { AppState } from '../types';

const INITIAL_STATE: AppState = {
  ideas: [
    { id: '1', content: 'Redesign the landing page to be dark mode', createdAt: Date.now() },
  ],
  tasks: [
    { id: 't1', content: 'Implement Redux Alternative', horizon: 'today', completed: false, createdAt: Date.now(), subTasks: [] },
    { id: 't2', content: 'Review pull requests', horizon: 'today', completed: true, createdAt: Date.now(), subTasks: [] },
    { id: 't3', content: 'Ship v2.0', horizon: 'month', completed: false, createdAt: Date.now(), subTasks: [] },
  ],
  habits: [
    { id: 'h1', name: 'Morning Run', history: {} },
    { id: 'h2', name: 'Read 20 pages', history: {} },
  ],
  goals: [
    { id: 'g1', content: 'Reach $10k MRR by Q3' },
    { id: 'g2', content: 'Run a marathon' },
  ],
  journals: [
    { id: 'j1', date: new Date().toISOString().split('T')[0], content: '# Daily Standup\n- Did X\n- Doing Y\n- Blockers: None' },
  ],
  archiveNotes: [
    { id: 'n1', title: 'Tech Specs', content: '### Architecture\nUsing React and Context API.' },
  ],
};

type StateContextType = {
  state: AppState;
  dispatch: React.Dispatch<React.SetStateAction<AppState>>;
};

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('kineticos-state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local storage state');
      }
    }
    return INITIAL_STATE;
  });

  const timerRef = useRef<number | null>(null);

  // Debounced LocalStorage sync
  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      localStorage.setItem('kineticos-state', JSON.stringify(state));
    }, 500);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [state]);

  return (
    <StateContext.Provider value={{ state, dispatch: setState }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useAppState must be used within StateProvider');
  return context;
};
