'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AddTopic() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await fetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
          if (data.length > 0) {
            setSelectedSubjectId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !selectedSubjectId || !difficulty) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          subjectId: selectedSubjectId,
          difficulty,
          notes,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setNotes('');
        setDescription('');
        setTimeout(() => {
          setSuccess(false);
          router.push('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to create topic:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back to Home header */}
      <div className="flex items-center gap-2">
        <Link 
          href="/" 
          className="p-2 rounded-xl hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground">Back to Dashboard</span>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 relative shadow-xl overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl"></div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-scale-in">
            <div className="w-16 h-16 bg-success/10 border border-success/30 rounded-2xl flex items-center justify-center text-success shadow-lg shadow-success/15 animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-foreground">Topic Created!</h2>
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold px-4 py-1.5 rounded-full text-sm inline-flex items-center gap-1.5">
              <Sparkles size={14} fill="currentColor" />
              <span>Gained +100 XP & Level Progress!</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              1-4-7 spaced revision schedules have been calculated and added to your revision queues automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black">Add Study Topic</h1>
              <p className="text-muted-foreground text-xs font-semibold mt-1 uppercase tracking-wider">
                Automatic 1-4-7 Spaced Repetition Scheduling
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Binary Search, Deadlocks, SQL Indexing"
                  required
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Grid: Subject & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Subject
                  </label>
                  {loadingSubjects ? (
                    <div className="h-10 bg-secondary rounded-xl animate-pulse"></div>
                  ) : (
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Description / Subtopics (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Binary search on arrays, binary search on answers, range queries"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Initial Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Paste formulas, key definitions, or custom explanations here..."
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-medium text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                ></textarea>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || loadingSubjects}
                className="w-full bg-primary text-primary-foreground font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 hover:bg-primary/95 transition-all active:scale-98 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Scheduling Revisions...' : 'Create Topic'}</span>
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
