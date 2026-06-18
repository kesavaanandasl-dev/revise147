'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Activity, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Brain,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

type AnalyticsData = {
  profile: { name: string; xp: number; currentStreak: number; longestStreak: number };
  stats: {
    topicsCount: number;
    masteredCount: number;
    retentionScore: number;
    dueTodayCount: number;
    overdueCount: number;
    totalStudyHours: number;
    weeklyStudyHours: number;
    monthlyStudyHours: number;
  };
  subjectProgress: { name: string; progress: number }[];
  topicDistribution: { name: string; value: number }[];
  studyHoursChart: { name: string; hours: number }[];
  streakCalendar: { date: string }[];
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Aggregating visual charts...</p>
      </div>
    );
  }

  if (!data) return null;

  const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#64748b'];

  // Consistency calendar grid (last 30 days)
  const renderConsistencyGrid = () => {
    const cells = [];
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 29; i >= 0; i--) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkStr = checkDate.toISOString().split('T')[0];
      
      const isCompleted = data.streakCalendar.some(s => s.date.split('T')[0] === checkStr);

      cells.push({
        date: checkDate,
        isCompleted
      });
    }

    return (
      <div className="grid grid-cols-10 gap-2 max-w-md mx-auto py-2">
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center text-[10px] font-bold ${
              cell.isCompleted
                ? 'bg-green-500/20 border-green-500/40 text-green-500 shadow-md shadow-green-500/10'
                : 'bg-secondary/40 border-border text-muted-foreground'
            }`}
            title={`${cell.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}: ${
              cell.isCompleted ? 'Revised' : 'No revisions completed'
            }`}
          >
            {cell.date.getDate()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BarChart3 className="text-indigo-500" size={24} />
          <span>Study Analytics</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Visual charts mapping topic distributions, weekly study hours, subject progression, and recall consistency.
        </p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/40 transition-all">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Topics Learned</span>
            <span className="text-lg font-black">{data.stats.topicsCount} Topics</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-success/40 transition-all">
          <div className="p-3 bg-success/10 border border-success/20 text-success rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Topics Mastered</span>
            <span className="text-lg font-black">{data.stats.masteredCount} Topics</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-orange-500/40 transition-all">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl">
            <Flame size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Current Streak</span>
            <span className="text-lg font-black">{data.profile.currentStreak} Days</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-pink-500/40 transition-all">
          <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Total Hours</span>
            <span className="text-lg font-black">{data.stats.totalStudyHours} Hours</span>
          </div>
        </div>
      </div>

      {/* Main Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: Study Hours Weekly */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" />
            <h2 className="text-base font-bold">Weekly Study hours Trend</h2>
          </div>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.studyHoursChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)'
                  }} 
                />
                <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Subject Progress */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-success" />
            <h2 className="text-base font-bold">Subject Mastery Progression</h2>
          </div>
          <div className="h-[250px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subjectProgress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)', 
                    borderColor: 'var(--border)',
                    borderRadius: '12px',
                    color: 'var(--foreground)'
                  }} 
                />
                <Bar dataKey="progress" radius={[8, 8, 0, 0]}>
                  {data.subjectProgress.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Topic Distribution */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon size={18} className="text-pink-500" />
            <h2 className="text-base font-bold">Topics Distribution by Subject</h2>
          </div>
          
          {data.topicDistribution.filter(t => t.value > 0).length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground font-semibold">
              Add topics to view subject distribution graphs.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        borderColor: 'var(--border)',
                        borderRadius: '12px',
                        color: 'var(--foreground)'
                      }} 
                    />
                    <Pie
                      data={data.topicDistribution.filter(t => t.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {data.topicDistribution.filter(t => t.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Labels list */}
              <div className="space-y-2">
                {data.topicDistribution.filter(t => t.value > 0).map((entry, idx) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span>{entry.name}</span>
                    </div>
                    <span className="text-muted-foreground">{entry.value} Topics</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Heatmap/Streak Consistency */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            <h2 className="text-base font-bold">30-Day Study Consistency</h2>
          </div>
          <p className="text-xs text-muted-foreground font-semibold">
            Track daily completions. Maintaining consistency strengthens memory retention!
          </p>
          {renderConsistencyGrid()}
        </div>

      </div>
    </div>
  );
}
