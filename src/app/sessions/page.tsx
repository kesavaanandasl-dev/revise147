'use client';

import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Sparkles,
  CalendarDays,
  CalendarRange,
  History
} from 'lucide-react';

type StudySessionItem = {
  id: string;
  date: string;
  durationMinutes: number;
  notes: string | null;
  subject: { name: string };
};

type AggregatedTime = {
  daily: number;
  weekly: number;
  monthly: number;
};

export default function StudyTracker() {
  const [sessions, setSessions] = useState<StudySessionItem[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggs, setAggs] = useState<AggregatedTime>({ daily: 0, weekly: 0, monthly: 0 });

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [xpGainedMessage, setXpGainedMessage] = useState('');

  const fetchSessionData = async () => {
    try {
      const [sessionsRes, subjectsRes, analyticsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/subjects'),
        fetch('/api/analytics')
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data);
        if (data.length > 0 && !selectedSubjectId) {
          setSelectedSubjectId(data[0].id);
        }
      }
      if (analyticsRes.ok) {
        const result = await analyticsRes.json();
        setAggs({
          daily: result.stats.weeklyStudyHours / 7, // approximate or display what we have
          weekly: result.stats.weeklyStudyHours,
          monthly: result.stats.monthlyStudyHours
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default date to today in YYYY-MM-DD
    setSessionDate(new Date().toISOString().split('T')[0]);
    fetchSessionData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !duration) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          durationMinutes: parseInt(duration),
          notes,
          date: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString()
        })
      });

      if (res.ok) {
        const result = await res.json();
        setXpGainedMessage(`Logged successfully! +${result.xpEarned} XP Gained! 🚀`);
        setNotes('');
        setDuration('30');
        
        // Refresh
        fetchSessionData();
        setTimeout(() => setXpGainedMessage(''), 2500);
      }
    } catch (err) {
      console.error('Failed to log study session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading study tracking logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <BookOpen className="text-indigo-500" size={24} />
          <span>Study Tracker</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Log study hours, track historical weekly focus metrics, and build XP.
        </p>
      </div>

      {/* Aggregate study hours grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-indigo-500/40 transition-all">
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Today's Goal</span>
            <span className="text-xl font-extrabold text-foreground">
              {Math.round(aggs.daily * 10) / 10} / 2.0 Hrs
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-success/40 transition-all">
          <div className="p-3.5 bg-success/10 border border-success/20 text-success rounded-xl">
            <CalendarDays size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Weekly Study Time</span>
            <span className="text-xl font-extrabold text-foreground">{aggs.weekly} Hours</span>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 hover:border-pink-500/40 transition-all">
          <div className="p-3.5 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl">
            <CalendarRange size={20} />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Monthly Study Time</span>
            <span className="text-xl font-extrabold text-foreground">{aggs.monthly} Hours</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form to log time (lg: 4cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-6 relative shadow-lg">
          <h2 className="text-lg font-bold mb-4">Log Study Session</h2>

          {xpGainedMessage ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 animate-scale-in">
              <div className="w-12 h-12 bg-success/15 border border-success/30 rounded-xl flex items-center justify-center text-success animate-bounce">
                <CheckCircle2 size={24} />
              </div>
              <p className="font-extrabold text-sm">{xpGainedMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Focus Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Notes on what questions were solved, or concepts learned..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2 text-xs font-semibold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground font-extrabold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-primary/30 hover:bg-primary/95 active:scale-98 transition-all disabled:opacity-50 text-xs"
              >
                <Plus size={14} />
                <span>{isSubmitting ? 'Logging...' : 'Confirm Study Log'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Historical logs list (lg: 7cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-4 shadow-lg max-h-[60vh] overflow-y-auto">
          <h2 className="text-lg font-bold flex items-center gap-1.5">
            <History size={18} className="text-muted-foreground" />
            <span>Study Logs History</span>
          </h2>
          
          {sessions.length === 0 ? (
            <div className="border border-dashed border-border p-8 rounded-2xl text-center text-xs font-semibold text-muted-foreground flex flex-col items-center gap-2">
              <BookOpen size={24} className="text-muted-foreground/30 animate-bounce" />
              <span>No study session logs recorded yet. Use the left panel to submit study logs.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div key={sess.id} className="border border-border p-4 rounded-2xl hover:border-indigo-500/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-extrabold border border-indigo-500/10">
                        {sess.subject.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {new Date(sess.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {sess.notes && (
                      <p className="text-xs font-medium text-foreground/80 mt-1.5 pl-1 italic leading-relaxed">
                        "{sess.notes}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs font-extrabold bg-secondary border border-border px-2.5 py-1 rounded-xl">
                    <Clock size={12} className="text-indigo-500" />
                    <span>{sess.durationMinutes} mins</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
