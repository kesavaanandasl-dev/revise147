'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  Brain, 
  CalendarClock, 
  AlertTriangle,
  Plus,
  Play,
  History,
  TrendingUp,
  X,
  Clock,
  ExternalLink
} from 'lucide-react';

type AnalyticsData = {
  profile: { name: string; xp: number; currentStreak: number; longestStreak: number };
  stats: {
    topicsCount: number;
    masteredCount: number;
    retentionScore: number;
    dueTodayCount: number;
    overdueCount: number;
    totalStudyHours: number;
  };
  subjectProgress: { name: string; progress: number }[];
  readiness: { score: number; status: string; recommendations: string[] };
};

type RevisionItem = {
  id: string;
  revisionNumber: number;
  scheduledDate: string;
  topic: {
    id: string;
    title: string;
    difficulty: string;
    subject: { name: string };
  };
};

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Welcome');
  
  // Study Session Log modal state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [duration, setDuration] = useState('30');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  const [sessionSuccessMessage, setSessionSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      const [analyticsRes, revisionsRes, subjectsRes] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/revisions?type=due'),
        fetch('/api/subjects')
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setData(analyticsData);
      }
      if (revisionsRes.ok) {
        const revisionsData = await revisionsRes.json();
        setRevisions(revisionsData.slice(0, 5)); // show top 5 in queue
      }
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);
        if (subjectsData.length > 0) {
          setSelectedSubjectId(subjectsData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Determine greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !duration) return;

    setIsSubmittingSession(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          durationMinutes: parseInt(duration),
          notes: sessionNotes,
          date: new Date().toISOString()
        })
      });

      if (res.ok) {
        const result = await res.json();
        setSessionSuccessMessage(`Logged! Earned +${result.xpEarned} XP! 🔥`);
        setSessionNotes('');
        setDuration('30');
        // Reload data
        loadData();
        setTimeout(() => {
          setIsLogModalOpen(false);
          setSessionSuccessMessage('');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading study analytics...</p>
      </div>
    );
  }

  const stats = data?.stats;
  const profile = data?.profile;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 p-6 rounded-3xl border border-indigo-500/20 glow-active">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {greeting}, <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">{profile?.name || 'Aspirant'}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-medium">
            Your placement readiness score is <strong className="text-indigo-500">{data?.readiness.score}/100</strong>. Keep pushing!
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/revisions"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
          >
            <Play size={16} fill="currentColor" />
            <span>Start Revision</span>
          </Link>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-secondary text-sm font-semibold transition-all active:scale-95"
          >
            <Clock size={16} />
            <span>Log Study Time</span>
          </button>
        </div>
      </div>

      {/* Grid of Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Streak */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-orange-500/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Streak</span>
            <Flame className="text-orange-500" size={20} fill="currentColor" />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{profile?.currentStreak || 0}</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1">
              Best: {profile?.longestStreak || 0}d
            </span>
          </div>
        </div>

        {/* Topics Learned */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Learned</span>
            <BookOpen className="text-indigo-500" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{stats?.topicsCount || 0}</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1">Total Topics</span>
          </div>
        </div>

        {/* Topics Mastered */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-success/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Mastered</span>
            <CheckCircle2 className="text-success" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{stats?.masteredCount || 0}</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1">
              {stats?.topicsCount ? Math.round((stats.masteredCount / stats.topicsCount) * 100) : 0}% rate
            </span>
          </div>
        </div>

        {/* Retention Score */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-pink-500/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Retention</span>
            <Brain className="text-pink-500" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{stats?.retentionScore || 0}%</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1">Recall Index</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Due Today</span>
            <CalendarClock className="text-primary" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{stats?.dueTodayCount || 0}</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1">Pending</span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-destructive/50 transition-all hover:translate-y-[-2px]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Overdue</span>
            <AlertTriangle className="text-destructive" size={20} />
          </div>
          <div className="mt-4">
            <span className="text-2xl font-black">{stats?.overdueCount || 0}</span>
            <span className="text-xs font-semibold text-muted-foreground block mt-1 text-destructive font-bold">
              Needs attention
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Sections split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left and Middle column: Revisions & Readiness */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Revision Queue */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame size={20} className="text-orange-500 fill-orange-500" />
                <h2 className="text-lg font-bold">Today's Revision Queue</h2>
              </div>
              <Link href="/revisions" className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1">
                <span>View Full Queue</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {revisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-xl">
                <CheckCircle2 size={36} className="text-success mb-2" />
                <p className="font-semibold text-sm">You are all caught up!</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Add more study topics to auto-generate 1-4-7 scheduled reminders.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {revisions.map((rev) => (
                  <Link 
                    key={rev.id} 
                    href={`/revisions?id=${rev.id}`}
                    className="flex items-center justify-between py-3 hover:bg-secondary/40 px-2 rounded-xl transition-all group"
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold group-hover:text-primary transition-colors text-sm">{rev.topic.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-semibold">
                          {rev.topic.subject.name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          rev.topic.difficulty === 'Easy' ? 'text-green-500' :
                          rev.topic.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {rev.topic.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2.5 py-0.5 rounded-full font-bold">
                        Rev {rev.revisionNumber}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Placement Readiness index */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-500" />
                <h2 className="text-lg font-bold">Placement Readiness</h2>
              </div>
              <Link href="/readiness" className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1">
                <span>Readiness Dashboard</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Readiness Radial Indicator */}
              <div className="flex flex-col items-center justify-center p-4 border border-border rounded-2xl bg-secondary/30">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* SVG Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-border" 
                      strokeWidth="8" fill="transparent" 
                    />
                    <circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-indigo-500 transition-all duration-1000" 
                      strokeWidth="8" fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * (data?.readiness.score || 0)) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black">{data?.readiness.score}</span>
                    <span className="text-[10px] text-muted-foreground font-bold"> readiness</span>
                  </div>
                </div>
                <span className={`mt-3 text-xs font-black uppercase px-2.5 py-0.5 rounded-full ${
                  data?.readiness.status === 'Placement Ready' ? 'bg-green-500/10 text-green-500' :
                  data?.readiness.status === 'Interview Ready' ? 'bg-indigo-500/10 text-indigo-500' :
                  data?.readiness.status === 'Improving' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {data?.readiness.status}
                </span>
              </div>

              {/* Subject recommendations & weakest list */}
              <div className="md:col-span-2 space-y-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weekly Recommendations</span>
                <ul className="space-y-2">
                  {data?.readiness.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm font-semibold flex items-start gap-2 text-foreground/80 bg-secondary/50 p-2.5 rounded-xl border border-border/50">
                      <span className="text-indigo-500 select-none">✦</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Subject progress list */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">Subject Progress</h2>
            <div className="space-y-4">
              {data?.subjectProgress.map((sub) => (
                <div key={sub.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span>{sub.name}</span>
                    <span className="text-indigo-500">{sub.progress}%</span>
                  </div>
                  {/* Progress Line */}
                  <div className="w-full bg-secondary border border-border rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.progress >= 85 ? 'bg-green-500' :
                        sub.progress >= 60 ? 'bg-indigo-500' :
                        sub.progress >= 35 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${sub.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Guide */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Revise147 Mechanics</h3>
            <div className="text-xs leading-relaxed space-y-2 text-muted-foreground font-medium">
              <p>🎯 <strong>1-4-7 Spaced Repetition:</strong> When you add a topic, our system creates automatic reminders for tomorrow (+1d), next Monday (+4d), and next Thursday (+7d).</p>
              <p>🧬 <strong>Adaptive Scheduling:</strong> Rating a revision as "Weak" schedules another revision in 3 days, while rating it "Perfect" pushes it out by 14 days to test long term recall.</p>
              <p>💎 <strong>Gamification:</strong> Gain XP for revision completions and study session logs to scale up your level. Keep your streak active by finishing at least 1 revision daily.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log Study Session Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full relative shadow-2xl animate-scale-in">
            <button 
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary border border-border text-muted-foreground hover:text-foreground"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-extrabold mb-4">Log Study Session</h2>
            
            {sessionSuccessMessage ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-2 animate-bounce" />
                <p className="font-bold text-lg">{sessionSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleLogSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Study Notes (Optional)</label>
                  <textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    rows={3}
                    placeholder="Wrote Trees traversal code, solved 3 Leetcode questions."
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSession}
                  className="w-full bg-primary text-primary-foreground font-bold py-2.5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingSession ? 'Saving Log...' : 'Confirm Session Log'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
