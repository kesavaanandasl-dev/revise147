'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Inbox, 
  Search, 
  Filter, 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';

type RevisionItem = {
  id: string;
  revisionNumber: number;
  scheduledDate: string;
  topic: {
    id: string;
    title: string;
    difficulty: string;
    status: string;
    subject: { name: string };
    revisions: { status: string; retentionRating: string | null }[];
  };
};

export default function RevisionInbox() {
  const [inboxData, setInboxData] = useState<{
    overdue: RevisionItem[];
    dueToday: RevisionItem[];
    upcoming: RevisionItem[];
  } | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const subjectQuery = selectedSubjectId ? `&subjectId=${selectedSubjectId}` : '';
      const difficultyQuery = selectedDifficulty ? `&difficulty=${selectedDifficulty}` : '';
      const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';

      const [inboxRes, subjectsRes] = await Promise.all([
        fetch(`/api/revisions?${subjectQuery}${difficultyQuery}${searchQuery}`),
        fetch('/api/subjects')
      ]);

      if (inboxRes.ok) {
        const data = await inboxRes.json();
        setInboxData(data);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to load inbox data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, [selectedSubjectId, selectedDifficulty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInbox();
  };

  const getPriorityBadge = (rev: RevisionItem, isOverdue: boolean) => {
    if (isOverdue) {
      return <span className="bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Critical</span>;
    }
    if (rev.topic.difficulty === 'Hard') {
      return <span className="bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">High</span>;
    }
    return <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Normal</span>;
  };

  const getPreviousRatings = (rev: RevisionItem) => {
    const completed = rev.topic.revisions.filter(r => r.status === 'Completed');
    if (completed.length === 0) return <span className="text-[10px] text-muted-foreground font-semibold">New Topic</span>;
    
    // Show emojis for previous runs
    const emojis = completed.map(r => {
      switch (r.retentionRating) {
        case 'Forgot': return '😵';
        case 'Weak': return '😕';
        case 'Good': return '🙂';
        case 'Perfect': return '😎';
        default: return '✓';
      }
    });

    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-bold mr-1">History:</span>
        <span className="text-xs">{emojis.join('')}</span>
      </div>
    );
  };

  if (loading && !inboxData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading inbox items...</p>
      </div>
    );
  }

  const renderRevisionCard = (rev: RevisionItem, isOverdue: boolean = false) => {
    return (
      <div
        key={rev.id}
        className="bg-card border border-border rounded-2xl p-4 hover:border-indigo-500/40 hover:shadow-md hover:translate-y-[-1px] transition-all flex flex-col md:flex-row justify-between md:items-center gap-4"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-secondary text-foreground text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-border">
              {rev.topic.subject.name}
            </span>
            {getPriorityBadge(rev, isOverdue)}
            <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold">
              Revision {rev.revisionNumber}
            </span>
          </div>

          <h3 className="font-extrabold text-base leading-snug pt-1 text-foreground">{rev.topic.title}</h3>
          
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar size={12} />
              <span>
                Due: {new Date(rev.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              </span>
            </span>
            {getPreviousRatings(rev)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 md:self-center">
          <Link
            href={isOverdue || new Date(rev.scheduledDate) <= new Date() ? `/revisions?id=${rev.id}` : `/topics/${rev.topic.id}`}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-secondary hover:bg-primary hover:text-primary-foreground border border-border text-foreground hover:border-transparent text-xs font-bold rounded-xl transition-all w-full md:w-auto"
          >
            <span>{isOverdue || new Date(rev.scheduledDate) <= new Date() ? 'Start Revise' : 'View Topic'}</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Inbox className="text-indigo-500" size={24} />
            <span>Revision Inbox</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Manage your study workflow exactly like an email inbox. Sort, filter, and plan.
          </p>
        </div>
        <button 
          onClick={fetchInbox} 
          className="p-2 border border-border bg-card rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-xs font-bold self-start md:self-center"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search topic or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button type="submit" className="absolute left-3 top-2.5 text-muted-foreground">
            <Search size={14} />
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {(selectedSubjectId || selectedDifficulty || searchTerm) && (
            <button
              onClick={() => {
                setSelectedSubjectId('');
                setSelectedDifficulty('');
                setSearchTerm('');
              }}
              className="text-xs text-indigo-500 font-extrabold hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Inbox Sections */}
      {inboxData ? (
        <div className="space-y-8">
          {/* Overdue */}
          {inboxData.overdue.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle size={16} />
                <span>Overdue Revisions ({inboxData.overdue.length})</span>
              </h2>
              <div className="space-y-3">
                {inboxData.overdue.map(rev => renderRevisionCard(rev, true))}
              </div>
            </div>
          )}

          {/* Due Today */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Calendar size={16} />
              <span>Due Today ({inboxData.dueToday.length})</span>
            </h2>
            {inboxData.dueToday.length === 0 ? (
              <div className="bg-card border border-border border-dashed p-6 text-center rounded-2xl text-xs text-muted-foreground font-semibold">
                No revisions scheduled for today in this folder.
              </div>
            ) : (
              <div className="space-y-3">
                {inboxData.dueToday.map(rev => renderRevisionCard(rev, false))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="space-y-3">
            <h2 className="text-sm font-black text-success uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle size={16} />
              <span>Upcoming Queue ({inboxData.upcoming.length})</span>
            </h2>
            {inboxData.upcoming.length === 0 ? (
              <div className="bg-card border border-border border-dashed p-6 text-center rounded-2xl text-xs text-muted-foreground font-semibold">
                No upcoming revisions scheduled.
              </div>
            ) : (
              <div className="space-y-3">
                {inboxData.upcoming.map(rev => renderRevisionCard(rev, false))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-card border border-border rounded-2xl">
          <span className="text-sm text-muted-foreground animate-pulse">Loading inbox list...</span>
        </div>
      )}
    </div>
  );
}
