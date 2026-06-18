'use client';

import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  BrainCircuit, 
  BookOpen, 
  Award, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

type ReadinessData = {
  subjectProgress: { name: string; progress: number }[];
  readiness: {
    score: number;
    status: string;
    weakest: { name: string; progress: number } | null;
    strongest: { name: string; progress: number } | null;
    recommendations: string[];
  };
};

export default function PlacementReadiness() {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to load readiness data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReadiness();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Calculating placement index...</p>
      </div>
    );
  }

  if (!data) return null;

  const { score, status, weakest, strongest, recommendations } = data.readiness;
  const progressMap = new Map(data.subjectProgress.map(s => [s.name, s.progress]));

  const getSubjectVal = (name: string) => progressMap.get(name) || 0;

  // Breakdown calculations based on user formula weights
  const dsaVal = getSubjectVal('DSA');
  const coreVal = Math.round(((getSubjectVal('DBMS') + getSubjectVal('OS') + getSubjectVal('CN')) / 3) * 10) / 10;
  const aptitudeVal = getSubjectVal('Aptitude');
  const projectVal = getSubjectVal('Projects');
  const interviewVal = Math.round(((getSubjectVal('Interview') + getSubjectVal('Resume')) / 2) * 10) / 10;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <GraduationCap className="text-indigo-500" size={24} />
          <span>Placement Readiness index</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Weighted matrix analysis indicating your interview preparation tier based on recall mastery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Radial Meter Panel */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
          {/* Backdrop shine */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl"></div>
          
          <div>
            <h2 className="text-base font-bold text-foreground mb-1.5 flex items-center gap-1">
              <Sparkles size={16} className="text-indigo-500" />
              <span>Readiness Score</span>
            </h2>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
              Calculated using standard placement subject weights (DSA 35%, Core 30%, Aptitude 15%, Projects 10%, Interview 10%).
            </p>
          </div>

          <div className="flex flex-col items-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-border" 
                  strokeWidth="6" fill="transparent" 
                />
                <circle 
                  cx="50" cy="50" r="40" 
                  className="stroke-indigo-500 transition-all duration-1000" 
                  strokeWidth="6" fill="transparent" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black">{score}</span>
                <span className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Index</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full ${
                status === 'Placement Ready' ? 'bg-green-500/10 text-green-500' :
                status === 'Interview Ready' ? 'bg-indigo-500/10 text-indigo-500' :
                status === 'Improving' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {status}
              </span>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4 flex justify-between text-xs font-bold text-muted-foreground">
            <span>Minimum Target: 85</span>
            <span className="text-indigo-500 font-black flex items-center gap-0.5">
              <span>View specs</span>
              <ArrowUpRight size={12} />
            </span>
          </div>
        </div>

        {/* Weighted breakdown list */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg flex flex-col justify-between">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <BrainCircuit size={18} className="text-indigo-500" />
            <span>Weighted Subject Matrix</span>
          </h2>

          <div className="space-y-4">
            {/* DSA */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <strong>DSA</strong>
                  <span className="text-muted-foreground text-[10px]">(Weight: 35%)</span>
                </span>
                <span className="text-indigo-500">{dsaVal}%</span>
              </div>
              <div className="w-full bg-secondary border border-border/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${dsaVal}%` }}></div>
              </div>
            </div>

            {/* Core */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <strong>Core subjects</strong>
                  <span className="text-muted-foreground text-[10px]">(Weight: 30%)</span>
                </span>
                <span className="text-indigo-500">{coreVal}%</span>
              </div>
              <div className="w-full bg-secondary border border-border/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-success h-full rounded-full" style={{ width: `${coreVal}%` }}></div>
              </div>
            </div>

            {/* Aptitude */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <strong>Aptitude & Math</strong>
                  <span className="text-muted-foreground text-[10px]">(Weight: 15%)</span>
                </span>
                <span className="text-indigo-500">{aptitudeVal}%</span>
              </div>
              <div className="w-full bg-secondary border border-border/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-pink-500 h-full rounded-full" style={{ width: `${aptitudeVal}%` }}></div>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <strong>Projects</strong>
                  <span className="text-muted-foreground text-[10px]">(Weight: 10%)</span>
                </span>
                <span className="text-indigo-500">{projectVal}%</span>
              </div>
              <div className="w-full bg-secondary border border-border/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${projectVal}%` }}></div>
              </div>
            </div>

            {/* Interview */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <strong>Interview Questions & Resume</strong>
                  <span className="text-muted-foreground text-[10px]">(Weight: 10%)</span>
                </span>
                <span className="text-indigo-500">{interviewVal}%</span>
              </div>
              <div className="w-full bg-secondary border border-border/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${interviewVal}%` }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Strongest & Weakest lists (lg: 4cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Strongest */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:border-success/30 transition-all">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Strongest Subject</span>
            {strongest ? (
              <div className="flex items-center justify-between mt-2 font-bold text-foreground text-sm">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 size={16} />
                  <span>{strongest.name}</span>
                </div>
                <span>{strongest.progress}% progress</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground block mt-1.5 font-medium">Add topic schedules to rank.</span>
            )}
          </div>

          {/* Weakest */}
          <div className="bg-card border border-border rounded-2xl p-5 hover:border-red-500/30 transition-all">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Weakest Subject</span>
            {weakest ? (
              <div className="flex items-center justify-between mt-2 font-bold text-foreground text-sm">
                <div className="flex items-center gap-1.5 text-red-500">
                  <AlertCircle size={16} />
                  <span>{weakest.name}</span>
                </div>
                <span>{weakest.progress}% progress</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground block mt-1.5 font-medium">Add topic schedules to rank.</span>
            )}
          </div>

        </div>

        {/* Right: Recommendations checklist (lg: 8cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg space-y-4">
          <h3 className="font-extrabold text-sm text-muted-foreground uppercase tracking-wider">
            Placement Prep Action Plan
          </h3>
          
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="text-sm font-semibold flex items-start gap-2.5 text-foreground/80 bg-secondary/50 p-3.5 rounded-xl border border-border/50">
                <span className="text-indigo-500 select-none pt-0.5">✦</span>
                <span>{rec}</span>
              </li>
            ))}
            {recommendations.length === 0 && (
              <li className="text-xs text-muted-foreground italic font-semibold">
                No custom checklist generated yet. Create topics and revisions to populate dashboard data.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
