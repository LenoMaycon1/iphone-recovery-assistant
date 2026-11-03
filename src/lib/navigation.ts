import { Cable, History, LayoutDashboard, ShieldCheck, Settings, Stethoscope, type LucideIcon } from 'lucide-react';

export type PageId = 'dashboard' | 'connect' | 'diagnostics' | 'recovery' | 'history' | 'settings';

export interface NavigationItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'connect', label: 'Conectar iPhone', icon: Cable },
  { id: 'diagnostics', label: 'Diagnóstico', icon: Stethoscope },
  { id: 'recovery', label: 'Recuperação de Dados', icon: ShieldCheck },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings },
];
