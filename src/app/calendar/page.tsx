'use client';

import React, { useEffect, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

type CalendarRevision = {
  id: string;
  revisionNumber: number;
  scheduledDate: string;
  completedDate: string | null;
  status: string;
  topic: {
    id: string;
    title: string;
    subject: { name: string };
  };
};

export default function RevisionCalendar() {
  const [revisions, setRevisions] = useState<CalendarRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const fetchCalendarRevisions = async () => {
    try {
      const res = await fetch('/api/revisions');
      if (res.ok) {
        const data = await res.json();
        // Flatten grouped API structure if returned as grouped or list
        if (data.overdue && data.dueToday && data.upcoming) {
          const flat = [...data.overdue, ...data.dueToday, ...data.upcoming];
          setRevisions(flat);
        } else {
          // If flat array is returned from completed or other queries
          setRevisions(data);
        }
      }
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarRevisions();
  }, []);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const days = [];
  
  // Previous month filling days
  for (let i = firstDayIndex; i > 0; i--) {
    days.push({
      day: prevLastDay - i + 1,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevLastDay - i + 1)
    });
  }

  // Current month days
  for (let i = 1; i <= lastDay; i++) {
    days.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month filling days
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getRevisionsForDate = (date: Date) => {
    return revisions.filter(rev => {
      // If completed, match completed date. Otherwise, match scheduled date.
      const matchDateStr = rev.completedDate || rev.scheduledDate;
      const revDate = new Date(matchDateStr);
      
      return revDate.getFullYear() === date.getFullYear() &&
             revDate.getMonth() === date.getMonth() &&
             revDate.getDate() === date.getDate();
    });
  };

  const getIndicators = (dayRevisions: CalendarRevision[]) => {
    if (dayRevisions.length === 0) return null;
    
    let hasCompleted = false;
    let hasUpcoming = false;
    let hasMissed = false;

    const today = new Date();
    today.setHours(0,0,0,0);

    dayRevisions.forEach(rev => {
      if (rev.status === 'Completed') {
        hasCompleted = true;
      } else {
        const sched = new Date(rev.scheduledDate);
        sched.setHours(0,0,0,0);
        if (sched.getTime() < today.getTime()) {
          hasMissed = true;
        } else {
          hasUpcoming = true;
        }
      }
    });

    return (
      <div className="flex items-center gap-1 mt-1 justify-center">
        {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Completed"></span>}
        {hasUpcoming && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Upcoming"></span>}
        {hasMissed && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Missed"></span>}
      </div>
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const selectedDayRevisions = selectedDate ? getRevisionsForDate(selectedDate) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <CalendarIcon className="text-indigo-500" size={24} />
          <span>Revision Calendar</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Visual schedule showing completed, upcoming, and overdue study modules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Card: Calendar grid (lg: 8cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-secondary/30">
              <button 
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Grid Headers */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-foreground border-b border-border/50 pb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, idx) => {
              const dayRevisions = getRevisionsForDate(cell.date);
              const isSelected = selectedDate && cell.date.toDateString() === selectedDate.toDateString();
              const isToday = cell.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`min-h-[72px] p-2 flex flex-col justify-between border rounded-2xl cursor-pointer hover:border-indigo-500/50 hover:bg-secondary/20 transition-all ${
                    !cell.isCurrentMonth ? 'text-muted-foreground/45 border-transparent' : 'border-border/40'
                  } ${
                    isSelected ? 'bg-indigo-500/10 border-indigo-500! glow-active' : ''
                  } ${
                    isToday ? 'border-dashed border-indigo-500' : ''
                  }`}
                >
                  <span className={`text-xs font-bold ${
                    isToday && !isSelected ? 'text-indigo-500' : 'text-foreground'
                  }`}>
                    {cell.day}
                  </span>
                  
                  {/* Indicators for revisions */}
                  {getIndicators(dayRevisions)}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-muted-foreground justify-center pt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span>Missed / Overdue</span>
            </div>
          </div>
        </div>

        {/* Right Card: Revisions detail for selected day (lg: 4cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-lg min-h-[40vh] space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-muted-foreground uppercase tracking-wider">
              Agenda for Day
            </h3>
            <span className="text-base font-black text-foreground mt-1 block">
              {selectedDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          {selectedDayRevisions.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-2xl p-4">
              <span className="text-2xl mb-1 select-none">🗓️</span>
              <p className="text-xs font-semibold text-muted-foreground">No tasks scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {selectedDayRevisions.map((rev) => {
                const isCompleted = rev.status === 'Completed';
                const today = new Date();
                today.setHours(0,0,0,0);
                const sched = new Date(rev.scheduledDate);
                sched.setHours(0,0,0,0);
                const isOverdue = !isCompleted && sched.getTime() < today.getTime();

                return (
                  <div 
                    key={rev.id}
                    className="border border-border p-3.5 rounded-2xl hover:border-indigo-500/30 transition-all space-y-2 text-left"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="bg-secondary text-foreground px-2 py-0.5 rounded-full border border-border">
                        {rev.topic.subject.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-black ${
                        isCompleted ? 'bg-green-500/10 text-green-500' :
                        isOverdue ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {isCompleted ? 'Completed' : isOverdue ? 'Missed' : 'Upcoming'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-foreground leading-tight pt-1">{rev.topic.title}</h4>
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Revision Run {rev.revisionNumber}
                      </span>
                      
                      <Link 
                        href={isCompleted ? `/topics/${rev.topic.id}` : `/revisions?id=${rev.id}`}
                        className="text-[10px] text-indigo-500 font-black hover:underline flex items-center gap-0.5"
                      >
                        <span>{isCompleted ? 'View details' : 'Revise now'}</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
