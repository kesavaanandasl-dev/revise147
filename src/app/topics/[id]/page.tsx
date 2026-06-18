'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  Save, 
  HelpCircle,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';

type Revision = {
  id: string;
  revisionNumber: number;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  retentionRating: string | null;
};

type TopicDetailData = {
  topic: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    status: string;
    notes: string | null;
    createdAt: string;
    subject: { id: string; name: string };
    revisions: Revision[];
  };
  stats: {
    totalRevisions: number;
    completedCount: number;
    masteryScore: number;
    nextRevisionDate: string | null;
  };
};

export default function TopicDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [data, setData] = useState<TopicDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit Notes state
  const [editableNotes, setEditableNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Edit status/difficulty state
  const [status, setStatus] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const fetchTopicDetails = async () => {
    try {
      const res = await fetch(`/api/topics/${id}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setEditableNotes(result.topic.notes || '');
        setStatus(result.topic.status);
        setDifficulty(result.topic.difficulty);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetails();
  }, [id]);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          notes: editableNotes,
          status,
          difficulty
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchTopicDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm('Are you sure you want to delete this topic and all its revision history?')) return;

    try {
      const res = await fetch(`/api/topics/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading topic timeline...</p>
      </div>
    );
  }

  if (!data) return null;

  const { topic, stats } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Back navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            href="/" 
            className="p-2 rounded-xl hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">Return to Dashboard</span>
        </div>
        <button
          onClick={handleDeleteTopic}
          className="p-2 text-red-500 hover:bg-red-500/10 border border-transparent rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all"
          title="Delete Topic"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Delete Topic</span>
        </button>
      </div>

      {/* Main Stats Summary Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Info and settings */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <div>
            <span className="bg-indigo-500/10 text-indigo-500 font-extrabold px-3 py-1 rounded-full text-xs border border-indigo-500/10">
              {topic.subject.name}
            </span>
            <h1 className="text-3xl font-black mt-2 leading-tight">{topic.title}</h1>
            {topic.description && (
              <p className="text-muted-foreground text-sm mt-1.5 font-medium">{topic.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/30 border border-border/50 p-4 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Created</span>
              <span className="text-xs font-bold text-foreground">
                {new Date(topic.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Completed Runs</span>
              <span className="text-xs font-bold text-foreground">{stats.completedCount} Revisions</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground border-b border-border focus:outline-none focus:border-primary pb-0.5"
              >
                <option value="Learning">Learning</option>
                <option value="Active">Active</option>
                <option value="Mastered">Mastered</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Difficulty</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground border-b border-border focus:outline-none focus:border-primary pb-0.5"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Editable Study Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Study Notes</span>
              {saveSuccess && (
                <span className="text-xs text-green-500 font-bold animate-pulse">Notes saved successfully!</span>
              )}
            </div>
            <div className="relative">
              <textarea
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                rows={8}
                placeholder="Write summary notes, rules, formulas, or Leetcode links..."
                className="w-full bg-secondary/50 border border-border rounded-2xl p-4 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              ></textarea>
              <button
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Card: Timeline and Mastery stats */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold">Mastery Metrics</h2>
          
          {/* Mastery score meter */}
          <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl border border-border/50">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-xl">
              <Award size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mastery Score</span>
                <span className="text-sm font-black text-indigo-500">{stats.masteryScore}/100</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-border rounded-full h-2 mt-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.masteryScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Next Scheduled Revision */}
          <div className="bg-secondary/20 p-4 rounded-2xl border border-border/40 space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Next Scheduled Revision</span>
            <span className="text-sm font-black text-foreground">
              {stats.nextRevisionDate 
                ? new Date(stats.nextRevisionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Timeline completed!'
              }
            </span>
          </div>

          {/* Visual Timeline Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Revision Timeline</h3>
            <div className="relative pl-6 border-l-2 border-border/50 space-y-6 py-2">
              
              {/* Point 0: Created */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-card"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Topic Created</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(topic.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Revision nodes */}
              {topic.revisions.map((rev) => {
                const isCompleted = rev.status === 'Completed';
                
                return (
                  <div key={rev.id} className="relative">
                    {/* Bullet circle */}
                    <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-4 border-card ${
                      isCompleted ? 'bg-green-500' : 'bg-border'
                    }`}></div>
                    
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">Revision {rev.revisionNumber}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {isCompleted 
                          ? `Completed: ${new Date(rev.completedDate!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                          : `Scheduled: ${new Date(rev.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                        }
                      </span>
                      {rev.retentionRating && (
                        <div className="mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            rev.retentionRating === 'Perfect' ? 'bg-green-500/10 text-green-500' :
                            rev.retentionRating === 'Good' ? 'bg-indigo-500/10 text-indigo-500' :
                            rev.retentionRating === 'Weak' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {rev.retentionRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
