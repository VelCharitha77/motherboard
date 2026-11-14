'use client';

import React, { useState } from 'react';
import NextLink from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import { db } from '@/lib/data';
import {
  BookOpen,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Award,
  Sparkles,
  Search,
} from 'lucide-react';
import { CatalogItem, CatalogItemType } from '@/lib/data/types';

export default function StaffCatalogPage() {
  const { currentUser, can } = useAuth();
  const { t } = useI18n();

  const paths = db.roadmap.listCareerPaths();
  const catalog = db.roadmap.listCatalog();

  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CatalogItemType>('techmoms_program');
  const [level, setLevel] = useState<CatalogItem['level']>('starter');
  const [durationWeeks, setDurationWeeks] = useState(9);
  const [weeklyHours, setWeeklyHours] = useState(7);
  const [costRange, setCostRange] = useState('$1,500');
  const [skillsText, setSkillsText] = useState('');
  const [openToNonAlumni, setOpenToNonAlumni] = useState(true);

  if (!can('nav:staff')) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Staff Access Restricted</h2>
        <NextLink href="/" className="text-xs font-bold text-primary hover:underline">
          Return to Landing
        </NextLink>
      </div>
    );
  }

  const filteredCatalog = catalog.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.skillsTaught.some((s) => s.toLowerCase().includes(q));
    }
    return true;
  });

  const handleOpenEdit = (item: CatalogItem) => {
    setSelectedItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setType(item.type);
    setLevel(item.level);
    setDurationWeeks(item.durationWeeks);
    setWeeklyHours(item.weeklyHours);
    setCostRange(item.costRange);
    setSkillsText(item.skillsTaught.join(', '));
    setOpenToNonAlumni(item.openToNonAlumni);
    setIsEditing(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const skills = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
    db.roadmap.upsertCatalogItem({
      ...selectedItem,
      title,
      description,
      type,
      level,
      durationWeeks: Number(durationWeeks),
      weeklyHours: Number(weeklyHours),
      costRange,
      skillsTaught: skills,
      openToNonAlumni,
    });
    setIsEditing(false);
    alert('Catalog item updated successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <NextLink href="/staff" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </NextLink>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Staff Course & Pathway Catalog</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Maintain the official catalog of Tech-Moms programs, certifications, external courses, and career pathways.
          </p>
        </div>
      </div>

      {/* Catalog Search & Grid */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by title or skill tag..."
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold capitalize">
                    {item.level}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border/40">
                  <div className="flex justify-between">
                    <span>Duration & Hours:</span>
                    <span className="font-semibold text-foreground">{item.durationWeeks} wks • ~{item.weeklyHours} hrs/wk</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost:</span>
                    <span className="font-semibold text-foreground">{item.costRange}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{item.openToNonAlumni ? 'Open to All' : 'Alumni Only'}</span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(item)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Edit Item →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Edit Catalog Item</h3>
            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Weekly Hours</label>
                  <input
                    type="number"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cost Range</label>
                  <input
                    type="text"
                    value={costRange}
                    onChange={(e) => setCostRange(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Skills Taught (Comma separated)</label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={openToNonAlumni}
                  onChange={(e) => setOpenToNonAlumni(e.target.checked)}
                  className="rounded border-border text-primary"
                />
                <span className="font-semibold text-foreground">Open to non-alumni applicants</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition shadow-sm"
                >
                  Save Catalog Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
