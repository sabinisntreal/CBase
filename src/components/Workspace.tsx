import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppState } from '../context/StateContext';
import { v4 as uuidv4 } from 'uuid';
import { Target, Lightbulb, ArrowRight, CheckCircle2, Circle, Play, Pause, Calendar, BookOpen, FolderTree } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format, subDays } from 'date-fns';

export function Workspace() {
  const { state, dispatch } = useAppState();

  // Local state for immediate typing feedback
  const [ideaInput, setIdeaInput] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [activeTimerTask, setActiveTimerTask] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  const captureInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  const addJournalEntry = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    dispatch(prev => {
      if (prev.journals.find(j => j.date === today)) return prev;
      return {
        ...prev,
        journals: [{ id: uuidv4(), date: today, content: '# ' + today + ' Log\n\n' }, ...prev.journals]
      };
    });
  }, [dispatch]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        captureInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        taskInputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        addJournalEntry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addJournalEntry]);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (activeTimerTask && timerSeconds > 0) {
      interval = window.setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0) {
      setActiveTimerTask(null);
      setTimerSeconds(25 * 60);
    }
    return () => window.clearInterval(interval);
  }, [activeTimerTask, timerSeconds]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveIdea = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ideaInput.trim()) {
      const newIdea = { id: uuidv4(), content: ideaInput.trim(), createdAt: Date.now() };
      dispatch(prev => ({ ...prev, ideas: [newIdea, ...prev.ideas] }));
      setIdeaInput('');
    }
  };

  const promoteIdeaToTask = (ideaId: string, content: string) => {
    const newTask = { id: uuidv4(), content, horizon: 'today' as const, completed: false, createdAt: Date.now(), subTasks: [] };
    dispatch(prev => ({
      ...prev,
      ideas: prev.ideas.filter(i => i.id !== ideaId),
      tasks: [newTask, ...prev.tasks]
    }));
  };

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskInput.trim()) {
      const newTask = { id: uuidv4(), content: newTaskInput.trim(), horizon: 'today' as const, completed: false, createdAt: Date.now(), subTasks: [] };
      dispatch(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      setNewTaskInput('');
    }
  };

  const toggleTaskCompletion = (taskId: string) => {
    dispatch(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    }));
  };

  const moveTask = (taskId: string, newHorizon: 'today' | 'tomorrow' | 'week' | 'month') => {
    dispatch(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? { ...t, horizon: newHorizon } : t)
    }));
  };

  const toggleHabit = (habitId: string, dateStr: string) => {
    dispatch(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.id === habitId) {
          const newHistory = { ...h.history, [dateStr]: !h.history[dateStr] };
          return { ...h, history: newHistory };
        }
        return h;
      })
    }));
  };

  const updateJournal = (id: string, content: string) => {
    dispatch(prev => ({
      ...prev,
      journals: prev.journals.map(j => j.id === id ? { ...j, content } : j)
    }));
  };

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    return format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
  });

  return (
    <div className="flex w-full h-screen bg-black text-white selection:bg-slate-700 selection:text-white font-sans antialiased">

      {/* Left Pane (35%) */}
      <aside className="w-[35%] min-w-[320px] max-w-[450px] h-full border-r border-slate-800 flex flex-col p-8 space-y-12">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-medium mb-2 uppercase tracking-widest text-xs">
            <Lightbulb className="w-4 h-4" />
            <span>Idea Vault</span>
          </div>
          <div className="relative">
            <input
              ref={captureInputRef}
              type="text"
              placeholder="Capture thought (CMD+I)..."
              value={ideaInput}
              onChange={(e) => setIdeaInput(e.target.value)}
              onKeyDown={handleSaveIdea}
              className="w-full bg-transparent border-b border-slate-700 pb-2 text-lg focus:outline-none focus:border-white transition-colors placeholder:text-slate-600"
            />
          </div>
          <div className="flex flex-col gap-2 mt-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {state.ideas.map(idea => (
              <div key={idea.id} className="group flex items-start gap-3 p-3 rounded bg-slate-900/30 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <p className="flex-1 text-sm text-slate-300 leading-relaxed break-words">{idea.content}</p>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                  <button onClick={() => promoteIdeaToTask(idea.id, idea.content)} className="text-slate-500 hover:text-white" title="Promote to Task">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-auto pt-8 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 font-medium mb-4 uppercase tracking-widest text-xs">
            <Target className="w-4 h-4" />
            <span>Master Goals</span>
          </div>
          <div className="space-y-3">
            {state.goals.map((goal, index) => (
              <div key={goal.id} className="flex items-center gap-3">
                <span className="text-slate-600 font-mono text-sm">{(index + 1).toString().padStart(2, '0')}</span>
                {editingGoalId === goal.id ? (
                  <input
                    type="text"
                    defaultValue={goal.content}
                    autoFocus
                    onBlur={(e) => {
                      setEditingGoalId(null);
                      dispatch(prev => ({ ...prev, goals: prev.goals.map(g => g.id === goal.id ? { ...g, content: e.target.value } : g) }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingGoalId(null);
                        dispatch(prev => ({ ...prev, goals: prev.goals.map(g => g.id === goal.id ? { ...g, content: e.currentTarget.value } : g) }));
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-sm focus:outline-none focus:border-slate-500"
                  />
                ) : (
                  <p
                    className="flex-1 text-sm font-medium hover:text-slate-300 cursor-pointer transition-colors"
                    onClick={() => setEditingGoalId(goal.id)}
                  >
                    {goal.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </aside>

      {/* Right Pane (65%) */}
      <main className="flex-1 h-full flex flex-col overflow-y-auto p-8 space-y-10 custom-scrollbar">

        {/* Horizon Planner */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-slate-400 font-medium uppercase tracking-widest text-xs mb-2">
            <Calendar className="w-4 h-4" />
            <span>Horizon Planner</span>
          </div>

          <input
            ref={taskInputRef}
            type="text"
            placeholder="New task for Today (CMD+T)..."
            value={newTaskInput}
            onChange={(e) => setNewTaskInput(e.target.value)}
            onKeyDown={handleAddTask}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-slate-600 transition-colors placeholder:text-slate-600"
          />

          <div className="grid grid-cols-4 gap-6">
            {(['today', 'tomorrow', 'week', 'month'] as const).map(horizon => (
              <div key={horizon} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-2">{horizon}</h3>
                <div className="space-y-2">
                  {state.tasks.filter(t => t.horizon === horizon).map(task => (
                    <div key={task.id} className="group relative flex items-start gap-2 p-2 rounded hover:bg-slate-900/50 transition-colors border border-transparent hover:border-slate-800">
                      <button onClick={() => toggleTaskCompletion(task.id)} className="mt-0.5 text-slate-500 hover:text-white transition-colors">
                        {task.completed ? <CheckCircle2 className="w-4 h-4 text-slate-400" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${task.completed ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                          {task.content}
                        </p>
                        {horizon === 'today' && !task.completed && (
                          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                if (activeTimerTask === task.id) {
                                  setActiveTimerTask(null);
                                } else {
                                  setActiveTimerTask(task.id);
                                  setTimerSeconds(25 * 60);
                                }
                              }}
                              className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-300"
                            >
                              {activeTimerTask === task.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              {activeTimerTask === task.id ? formatTime(timerSeconds) : '25m'}
                            </button>
                          </div>
                        )}
                        <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {['today', 'tomorrow', 'week', 'month'].filter(h => h !== horizon).map(h => (
                            <button key={h} onClick={() => moveTask(task.id, h as any)} className="text-[10px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded hover:text-white">
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Habit Matrix */}
        <section className="pt-6 border-t border-slate-800/50">
           <div className="flex items-center gap-2 text-slate-400 font-medium uppercase tracking-widest text-xs mb-4">
            <CheckCircle2 className="w-4 h-4" />
            <span>Habit Matrix</span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <div className="flex mb-2">
                <div className="w-40"></div>
                {last7Days.map(date => (
                  <div key={date} className="w-10 text-center text-[10px] text-slate-500 uppercase">
                    {format(new Date(date), 'EEE')}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {state.habits.map(habit => (
                  <div key={habit.id} className="flex items-center">
                    <div className="w-40 text-sm text-slate-400 truncate pr-4">{habit.name}</div>
                    {last7Days.map(date => {
                      const done = habit.history[date];
                      return (
                        <button
                          key={date}
                          onClick={() => toggleHabit(habit.id, date)}
                          className="w-10 flex justify-center"
                        >
                          <div className={`w-5 h-5 rounded-sm border transition-colors ${done ? 'bg-slate-300 border-slate-300' : 'bg-transparent border-slate-700 hover:border-slate-500'}`} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Lower Modules Grid */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-800/50 flex-1 min-h-[300px]">

          {/* Stream Stream (Daily Journal) */}
          <section className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-400 font-medium uppercase tracking-widest text-xs">
                <BookOpen className="w-4 h-4" />
                <span>Daily Log</span>
              </div>
              <button onClick={addJournalEntry} className="text-xs text-slate-400 hover:text-white uppercase tracking-wider">
                + New Log
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {state.journals.map(journal => (
                <div key={journal.id} className="flex flex-col h-48 bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-500">
                    {journal.date}
                  </div>
                  <textarea
                    value={journal.content}
                    onChange={(e) => updateJournal(journal.id, e.target.value)}
                    className="flex-1 w-full bg-transparent p-3 text-sm text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-slate-700"
                    placeholder="Write something..."
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Infinite Archive */}
          <section className="flex flex-col">
             <div className="flex items-center gap-2 text-slate-400 font-medium uppercase tracking-widest text-xs mb-4">
                <FolderTree className="w-4 h-4" />
                <span>Archive</span>
              </div>
              <div className="flex-1 flex gap-4 overflow-hidden">
                <div className="w-1/3 border-r border-slate-800 pr-2 overflow-y-auto custom-scrollbar">
                  {state.archiveNotes.map(note => (
                    <div key={note.id} className="text-sm text-slate-400 hover:text-white p-2 cursor-pointer hover:bg-slate-900/50 rounded transition-colors truncate">
                      {note.title}
                    </div>
                  ))}
                </div>
                <div className="w-2/3 overflow-y-auto pr-2 text-sm text-slate-300 prose prose-invert prose-sm custom-scrollbar">
                  {state.archiveNotes.length > 0 ? (
                    <ReactMarkdown>{state.archiveNotes[0].content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-600 italic">Select a note to view</p>
                  )}
                </div>
              </div>
          </section>

        </div>
      </main>
    </div>
  );
}
