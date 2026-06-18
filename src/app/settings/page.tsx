'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { 
  Settings as SettingsIcon, 
  User, 
  Moon, 
  Sun, 
  Layers, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  
  const [profileName, setProfileName] = useState('');
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [loading, setLoading] = useState(true);

  // Status logs
  const [profileStatus, setProfileStatus] = useState('');
  const [subjectStatus, setSubjectStatus] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  const fetchSettingsData = async () => {
    try {
      const [profileRes, subjectsRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/subjects')
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfileName(data.name);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() })
      });

      if (res.ok) {
        setProfileStatus('Profile updated! 🔥');
        setTimeout(() => setProfileStatus(''), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim() })
      });

      if (res.ok) {
        setNewSubjectName('');
        setSubjectStatus('Subject added!');
        fetchSettingsData();
        setTimeout(() => setSubjectStatus(''), 2000);
      } else {
        const errData = await res.json();
        setSubjectStatus(`Error: ${errData.error || 'Failed to add'}`);
        setTimeout(() => setSubjectStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportData = () => {
    // Triggers direct GET redirect to start JSON attachment download
    window.location.href = '/api/export';
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Parsing backup file...');
    try {
      const text = await file.text();
      const backupObj = JSON.parse(text);

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupObj)
      });

      if (res.ok) {
        setImportStatus('Data imported successfully! Reloading...');
        setTimeout(() => {
          setImportStatus('');
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus('Failed to import backup data.');
        setTimeout(() => setImportStatus(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setImportStatus('Invalid JSON file format.');
      setTimeout(() => setImportStatus(''), 3000);
    }
  };

  const handleResetProgress = async () => {
    if (!confirm('WARNING: This action is permanent! It will wipe all topics, revisions, study sessions, and reset your XP/streaks to 0. Are you absolutely sure?')) {
      return;
    }

    setResetStatus('Resetting system database...');
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setResetStatus('All data reset successfully! Reloading...');
        setTimeout(() => {
          setResetStatus('');
          window.location.reload();
        }, 1500);
      } else {
        setResetStatus('Reset transaction failed.');
      }
    } catch (err) {
      console.error(err);
      setResetStatus('Reset operation encountered an error.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Loading system preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <SettingsIcon className="text-indigo-500" size={24} />
          <span>System Settings</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Customize subject categories, configure backups, toggle display metrics, and manage database resets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Panel Left: Preferences & Subjects */}
        <div className="space-y-6">
          
          {/* Profile preferences */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <User size={18} className="text-indigo-500" />
              <span>Aspirant Profile</span>
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground text-xs font-extrabold py-2 px-4 rounded-xl hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Save Profile Name</span>
                {profileStatus && <span className="text-[10px] text-green-300 font-bold ml-1">{profileStatus}</span>}
              </button>
            </form>
          </div>

          {/* Subject Management */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Layers size={18} className="text-indigo-500" />
              <span>Manage Subjects</span>
            </h2>
            
            {/* List current */}
            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
              {subjects.map(s => (
                <span key={s.id} className="text-xs bg-secondary border border-border text-foreground px-3 py-1 rounded-full font-bold">
                  {s.name}
                </span>
              ))}
            </div>

            {/* Add custom */}
            <form onSubmit={handleAddSubject} className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. System Design, System Verilog"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl pl-3 pr-20 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg hover:shadow-md transition-all active:scale-95 flex items-center gap-0.5"
                >
                  <Plus size={10} />
                  <span>Add</span>
                </button>
              </div>
              {subjectStatus && <p className="text-[10px] text-indigo-500 font-bold pl-1">{subjectStatus}</p>}
            </form>
          </div>
        </div>

        {/* Panel Right: Display settings, Backup & Resets */}
        <div className="space-y-6">
          
          {/* Display & Dark mode */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Sun size={18} className="text-indigo-500" />
              <span>Interface Theme</span>
            </h2>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Toggle Mode Preferences</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-xl bg-secondary text-xs font-bold hover:bg-secondary/70 transition-all"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} className="text-yellow-500" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-indigo-500" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export & Import */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-2">
              <Download size={18} className="text-indigo-500" />
              <span>Backups & Migration</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold block">Backup Workspace Data</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Download study records as a single portable JSON file.</span>
                </div>
                <button
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-secondary border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-transparent text-xs font-bold rounded-xl transition-all"
                >
                  <Download size={14} />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border/30 pt-3">
                <div>
                  <span className="text-xs font-bold block">Restore Backup</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">Wipes current workspace and loads imported records.</span>
                </div>
                <label className="flex items-center justify-center gap-1.5 px-4 py-2 bg-secondary border border-border text-foreground hover:bg-indigo-500 hover:text-white hover:border-transparent text-xs font-bold rounded-xl transition-all cursor-pointer">
                  <Upload size={14} />
                  <span>Import JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
              {importStatus && <p className="text-[10px] text-indigo-500 font-bold text-center mt-1 animate-pulse">{importStatus}</p>}
            </div>
          </div>

          {/* Dangerous Zone */}
          <div className="bg-card border border-red-500/20 rounded-3xl p-6 shadow-lg space-y-4">
            <h2 className="text-base font-bold text-red-500 flex items-center gap-2 border-b border-red-500/10 pb-2">
              <AlertTriangle size={18} />
              <span>Dangerous Zone</span>
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold block text-foreground">Reset All Progress</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Permanently wipes all topic schedules, logs, and XP.</span>
              </div>
              <button
                onClick={handleResetProgress}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                <Trash2 size={14} />
                <span>Reset Database</span>
              </button>
            </div>
            {resetStatus && <p className="text-[10px] text-red-500 font-bold text-center animate-pulse">{resetStatus}</p>}
          </div>

        </div>

      </div>
    </div>
  );
}
