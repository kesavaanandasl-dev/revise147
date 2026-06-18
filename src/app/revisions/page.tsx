'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Notebook, 
  Sparkles, 
  HelpCircle,
  Clock,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { getStartOfDay } from '@/lib/streak';
import Link from 'next/link';

type Revision = {
  id: string;
  revisionNumber: number;
  scheduledDate: string;
  status: string;
  topic: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    notes: string | null;
    createdAt: string;
    subject: { name: string };
  };
};

type TopicDetail = {
  topic: {
    id: string;
    title: string;
    description: string | null;
    difficulty: string;
    status: string;
    notes: string | null;
    createdAt: string;
    subject: { name: string };
    revisions: {
      id: string;
      revisionNumber: number;
      scheduledDate: string;
      completedDate: string | null;
      status: string;
      retentionRating: string | null;
    }[];
  };
  stats: {
    totalRevisions: number;
    completedCount: number;
    masteryScore: number;
    nextRevisionDate: string | null;
  };
};

export default function Revisions() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading revision queue...</p>
      </div>
    }>
      <RevisionsContent />
    </Suspense>
  );
}

function RevisionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialId = searchParams.get('id');

  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [topicDetails, setTopicDetails] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Rating states
  const [showRatingScreen, setShowRatingScreen] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/revisions?type=due');
      if (res.ok) {
        const data = await res.json();
        setRevisions(data);
        
        // Handle initial ID selection from dashboard query
        if (initialId) {
          const found = data.find((r: Revision) => r.id === initialId);
          if (found) {
            setSelectedRevision(found);
            fetchTopicDetails(found.topic.id);
          }
        } else if (data.length > 0 && !selectedRevision) {
          setSelectedRevision(data[0]);
          fetchTopicDetails(data[0].topic.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicDetails = async (topicId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/topics/${topicId}`);
      if (res.ok) {
        const data = await res.json();
        setTopicDetails(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [initialId]);

  const selectRevisionItem = (rev: Revision) => {
    setSelectedRevision(rev);
    setShowRatingScreen(false);
    setXpEarned(null);
    fetchTopicDetails(rev.topic.id);
    // Sync with router url
    router.replace(`/revisions?id=${rev.id}`);
  };

  const calculateDaysOverdue = (scheduledDate: string) => {
    const today = getStartOfDay();
    const scheduled = getStartOfDay(new Date(scheduledDate));
    const diffTime = today.getTime() - scheduled.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleCompleteRevision = async (rating: string) => {
    if (!selectedRevision) return;

    setIsSubmittingRating(true);
    try {
      const res = await fetch(`/api/revisions/${selectedRevision.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retentionRating: rating }),
      });

      if (res.ok) {
        const result = await res.json();
        setXpEarned(result.xpEarned);
        
        // Refresh queue
        const updatedRevisions = revisions.filter(r => r.id !== selectedRevision.id);
        setRevisions(updatedRevisions);

        // Reset details and focus next in queue if available
        setTimeout(() => {
          setShowRatingScreen(false);
          setXpEarned(null);
          
          if (updatedRevisions.length > 0) {
            setSelectedRevision(updatedRevisions[0]);
            fetchTopicDetails(updatedRevisions[0].topic.id);
            router.replace(`/revisions?id=${updatedRevisions[0].id}`);
          } else {
            setSelectedRevision(null);
            setTopicDetails(null);
            router.replace('/revisions');
          }
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading revision queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Today's Revision Queue</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Review your cards. Using spaced repetition guarantees your placement readiness!
        </p>
      </div>

      {revisions.length === 0 && !selectedRevision ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center text-green-500 animate-pulse">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold">You're All Caught Up!</h2>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            There are no revisions scheduled for today. Spend some time logging a study session, or add new topics in the dashboard to start schedules.
          </p>
          <Link href="/" className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:shadow-lg transition-all">
            Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Revision Items Queue List (lg: 5cols) */}
          <div className="lg:col-span-5 space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
              Active Queue ({revisions.length} Items)
            </span>
            {revisions.map((rev) => {
              const isSelected = selectedRevision?.id === rev.id;
              const daysOverdue = calculateDaysOverdue(rev.scheduledDate);
              
              return (
                <div
                  key={rev.id}
                  onClick={() => selectRevisionItem(rev)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex justify-between items-center group ${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border-border hover:border-indigo-500/50 hover:bg-secondary/40 text-foreground'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm leading-tight group-hover:underline">{rev.topic.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isSelected 
                          ? 'bg-primary-foreground/15 border-transparent text-primary-foreground' 
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}>
                        {rev.topic.subject.name}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        isSelected
                          ? 'text-primary-foreground/90'
                          : rev.topic.difficulty === 'Easy' ? 'text-green-500' :
                            rev.topic.difficulty === 'Medium' ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {rev.topic.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isSelected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      Rev {rev.revisionNumber}
                    </span>
                    {daysOverdue > 0 && (
                      <span className={`text-[9px] font-black uppercase flex items-center gap-1 px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'
                      }`}>
                        <AlertTriangle size={10} />
                        <span>{daysOverdue}d overdue</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Detailed focus study panel (lg: 7cols) */}
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 md:p-8 min-h-[50vh] relative shadow-lg">
            
            {loadingDetails ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/80 backdrop-blur-xs rounded-3xl z-10">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-muted-foreground mt-2">Loading topic details...</span>
              </div>
            ) : null}

            {selectedRevision && topicDetails ? (
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-border/50">
                  <div>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                      Subject: {topicDetails.topic.subject.name}
                    </span>
                    <h2 className="text-2xl font-black mt-1 leading-tight">{topicDetails.topic.title}</h2>
                    {topicDetails.topic.description && (
                      <p className="text-muted-foreground text-sm mt-1.5 font-medium">{topicDetails.topic.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      topicDetails.topic.difficulty === 'Easy' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      topicDetails.topic.difficulty === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                      'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}>
                      {topicDetails.topic.difficulty}
                    </span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-secondary border border-border text-muted-foreground">
                      Status: {topicDetails.topic.status}
                    </span>
                  </div>
                </div>

                {/* Main panel body depending on screen index */}
                {!showRatingScreen ? (
                  <div className="space-y-6">
                    {/* Notes Panel */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Notebook size={14} />
                        <span>Study Notes</span>
                      </div>
                      <div className="bg-secondary/40 border border-border/60 p-4 rounded-2xl min-h-[120px] text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                        {topicDetails.topic.notes || 'No study notes saved for this topic. Add details on the Topic Details page.'}
                      </div>
                    </div>

                    {/* Timeline History */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <Clock size={14} />
                        <span>Revision Timeline & History</span>
                      </div>
                      
                      <div className="space-y-2">
                        {topicDetails.topic.revisions.map((revHistory) => {
                          const isCompleted = revHistory.status === 'Completed';
                          return (
                            <div key={revHistory.id} className="flex items-center justify-between text-xs bg-secondary/20 p-2.5 rounded-xl border border-border/40 font-semibold">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                <span>Revision {revHistory.revisionNumber}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">
                                  {isCompleted 
                                    ? `Completed: ${new Date(revHistory.completedDate!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                                    : `Scheduled: ${new Date(revHistory.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                                  }
                                </span>
                                {revHistory.retentionRating && (
                                  <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${
                                    revHistory.retentionRating === 'Perfect' ? 'bg-green-500/10 text-green-500' :
                                    revHistory.retentionRating === 'Good' ? 'bg-indigo-500/10 text-indigo-500' :
                                    revHistory.retentionRating === 'Weak' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {revHistory.retentionRating}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Button: Mark Completed */}
                    <button
                      onClick={() => setShowRatingScreen(true)}
                      className="w-full bg-primary text-primary-foreground font-extrabold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all hover:bg-primary/95 active:scale-98"
                    >
                      <CheckCircle2 size={18} />
                      <span>Mark Revision Completed</span>
                    </button>
                  </div>
                ) : (
                  // Retention Rating selection screen
                  <div className="space-y-6 py-6 text-center animate-scale-in">
                    
                    {xpEarned ? (
                      // Success completed state
                      <div className="space-y-4 py-8">
                        <div className="w-16 h-16 mx-auto bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center text-green-500 shadow-lg animate-bounce">
                          <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-black">Revision Registered!</h3>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-1.5 animate-pulse">
                          <Sparkles size={14} fill="currentColor" />
                          <span>Earned +{xpEarned} XP!</span>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          Adaptive revision algorithm has re-scheduled this topic. Keep up the streak!
                        </p>
                      </div>
                    ) : (
                      // Retention voting
                      <div className="space-y-6">
                        <div className="max-w-xs mx-auto">
                          <HelpCircle size={36} className="text-primary mx-auto mb-2 animate-pulse" />
                          <h3 className="text-lg font-bold">How well do you remember this topic?</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Your selection determines the next automatic scheduled review interval.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                          {/* Forgot */}
                          <button
                            onClick={() => handleCompleteRevision('Forgot')}
                            disabled={isSubmittingRating}
                            className="p-4 rounded-2xl border border-border bg-secondary/30 hover:border-red-500/50 hover:bg-red-500/5 flex flex-col items-center gap-2 group transition-all text-left"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">😵</span>
                            <span className="font-extrabold text-sm text-foreground">Forgot</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Review again tomorrow</span>
                          </button>

                          {/* Weak */}
                          <button
                            onClick={() => handleCompleteRevision('Weak')}
                            disabled={isSubmittingRating}
                            className="p-4 rounded-2xl border border-border bg-secondary/30 hover:border-yellow-500/50 hover:bg-yellow-500/5 flex flex-col items-center gap-2 group transition-all text-left"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">😕</span>
                            <span className="font-extrabold text-sm text-foreground">Weak</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Review in 3 days</span>
                          </button>

                          {/* Good */}
                          <button
                            onClick={() => handleCompleteRevision('Good')}
                            disabled={isSubmittingRating}
                            className="p-4 rounded-2xl border border-border bg-secondary/30 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center gap-2 group transition-all text-left"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">🙂</span>
                            <span className="font-extrabold text-sm text-foreground">Good</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Review in 7 days</span>
                          </button>

                          {/* Perfect */}
                          <button
                            onClick={() => handleCompleteRevision('Perfect')}
                            disabled={isSubmittingRating}
                            className="p-4 rounded-2xl border border-border bg-secondary/30 hover:border-green-500/50 hover:bg-green-500/5 flex flex-col items-center gap-2 group transition-all text-left"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">😎</span>
                            <span className="font-extrabold text-sm text-foreground">Perfect</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">Review in 14 days</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Notebook size={48} className="text-muted-foreground/30 mb-2 animate-bounce" />
                <p className="font-bold text-sm text-muted-foreground">No Topic Selected</p>
                <p className="text-xs text-muted-foreground/80 max-w-xs mt-1">
                  Select a card from the left panel to start revising.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
