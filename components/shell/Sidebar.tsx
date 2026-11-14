'use client';

import React from 'react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useI18n } from '@/lib/i18n/context';
import {
  Home,
  BookOpen,
  MessageSquare,
  Megaphone,
  FolderGit2,
  Briefcase,
  PiggyBank,
  HeartHandshake,
  Calendar,
  Settings,
  ShieldCheck,
  Building2,
  Award,
  HelpCircle,
  Compass,
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Parameters<ReturnType<typeof useAuth>['can']>[0];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home', labelKey: 'nav.home', defaultLabel: 'Home', icon: Home, permission: 'nav:home' },
  { href: '/learn', labelKey: 'nav.learn', defaultLabel: 'Learn', icon: BookOpen, permission: 'nav:learn' },
  { href: '/roadmap', labelKey: 'nav.roadmap', defaultLabel: 'My Roadmap', icon: Compass, permission: 'nav:learn' },
  { href: '/messages', labelKey: 'nav.messages', defaultLabel: 'Messages', icon: MessageSquare, permission: 'nav:messages' },
  { href: '/announcements', labelKey: 'nav.announcements', defaultLabel: 'Announcements', icon: Megaphone, permission: 'nav:announcements' },
  { href: '/projects', labelKey: 'nav.projects', defaultLabel: 'Projects', icon: FolderGit2, permission: 'nav:projects' },
  { href: '/careers', labelKey: 'nav.careers', defaultLabel: 'Careers', icon: Briefcase, permission: 'nav:careers' },
  { href: '/funding/my', labelKey: 'nav.myFunding', defaultLabel: 'My Funding', icon: PiggyBank, permission: 'nav:funding_my' },
  { href: '/give', labelKey: 'nav.fundingBoard', defaultLabel: 'Funding Board', icon: HeartHandshake, permission: 'nav:give' },
  { href: '/events', labelKey: 'nav.events', defaultLabel: 'Events', icon: Calendar, permission: 'nav:events' },
  { href: '/help', labelKey: 'nav.askStaff', defaultLabel: 'Ask Staff', icon: HelpCircle, permission: 'nav:help' },
  { href: '/staff', labelKey: 'nav.staffConsole', defaultLabel: 'Staff Console', icon: ShieldCheck, permission: 'nav:staff' },
  { href: '/employer', labelKey: 'nav.employerPortal', defaultLabel: 'Employer Portal', icon: Building2, permission: 'nav:employer' },
  { href: '/sponsor', labelKey: 'nav.sponsorPortal', defaultLabel: 'Sponsor Portal', icon: Award, permission: 'nav:sponsor' },
  { href: '/profile', labelKey: 'nav.profile', defaultLabel: 'Profile', icon: Settings, permission: 'nav:profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { can } = useAuth();
  const { t } = useI18n();

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible from md up) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card/60 backdrop-blur-sm min-h-[calc(100vh-4rem)] p-3">
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href));
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="truncate">{t(item.labelKey, item.defaultLabel)}</span>
              </NextLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar (visible below md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around px-2 py-1.5 shadow-lg">
        {visibleItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href));
          return (
            <NextLink
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 mb-0.5" />
              <span className="truncate max-w-[55px] text-center">{t(item.labelKey, item.defaultLabel)}</span>
            </NextLink>
          );
        })}
      </nav>
    </>
  );
}
