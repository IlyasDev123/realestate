'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type AccentKey  = 'amber' | 'blue' | 'green' | 'purple' | 'rose' | 'slate';
export type SurfaceKey = 'default' | 'warm' | 'cool' | 'dark';

export interface ThemePrefs {
  accent:  AccentKey;
  surface: SurfaceKey;
  compact: boolean;
}

export interface AccentMeta  { key: AccentKey;  name: string; swatch: string; swatchDark: string }
export interface SurfaceMeta { key: SurfaceKey; name: string; desc: string; bg: string; card: string; isDark?: boolean }

export const ACCENTS: AccentMeta[] = [
  { key: 'amber',  name: 'Amber Gold',   swatch: '#904d00', swatchDark: '#f59b2b' },
  { key: 'blue',   name: 'Ocean Blue',   swatch: '#1565c0', swatchDark: '#5aabf5' },
  { key: 'green',  name: 'Forest Green', swatch: '#2e7d32', swatchDark: '#4caf78' },
  { key: 'purple', name: 'Royal Purple', swatch: '#6a1b9a', swatchDark: '#c57ee0' },
  { key: 'rose',   name: 'Rose Red',     swatch: '#c62828', swatchDark: '#f47488' },
  { key: 'slate',  name: 'Slate Steel',  swatch: '#37474f', swatchDark: '#90a4ae' },
];

export const SURFACES: SurfaceMeta[] = [
  { key: 'default', name: 'Classic Blue', desc: 'Crisp white with cool blue tints',  bg: '#f8f9ff', card: '#ffffff'  },
  { key: 'warm',    name: 'Warm Ivory',   desc: 'Soft warm tones, easy on the eyes', bg: '#faf8f4', card: '#ffffff'  },
  { key: 'cool',    name: 'Cool Slate',   desc: 'Neutral grey-blue workspace',        bg: '#f4f6f9', card: '#ffffff'  },
  { key: 'dark',    name: 'Dark Mode',    desc: 'Dark background, high contrast',     bg: '#0d1117', card: '#141b27', isDark: true },
];

const DEFAULT_PREFS: ThemePrefs = { accent: 'amber', surface: 'default', compact: false };
const STORAGE_KEY = 'rms-theme-v1';

// ─────────────────────────────────────────────────────────────────────────────
// Accent vars — LIGHT mode (used for default/warm/cool surfaces)
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT_LIGHT: Record<AccentKey, Record<string, string>> = {
  amber: {
    '--color-secondary':                  '#904d00',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#fe932c',
    '--color-on-secondary-container':     '#663500',
    '--color-secondary-fixed':            '#ffdcc3',
    '--color-secondary-fixed-dim':        '#ffb77d',
    '--color-on-secondary-fixed':         '#2f1500',
    '--color-on-secondary-fixed-variant': '#6e3900',
  },
  blue: {
    '--color-secondary':                  '#1565c0',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#42a5f5',
    '--color-on-secondary-container':     '#003380',
    '--color-secondary-fixed':            '#bbdefb',
    '--color-secondary-fixed-dim':        '#64b5f6',
    '--color-on-secondary-fixed':         '#001533',
    '--color-on-secondary-fixed-variant': '#0d47a1',
  },
  green: {
    '--color-secondary':                  '#2e7d32',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#66bb6a',
    '--color-on-secondary-container':     '#1b5e20',
    '--color-secondary-fixed':            '#c8e6c9',
    '--color-secondary-fixed-dim':        '#81c784',
    '--color-on-secondary-fixed':         '#0a2e0c',
    '--color-on-secondary-fixed-variant': '#1b5e20',
  },
  purple: {
    '--color-secondary':                  '#6a1b9a',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#ab47bc',
    '--color-on-secondary-container':     '#3d0066',
    '--color-secondary-fixed':            '#e1bee7',
    '--color-secondary-fixed-dim':        '#ba68c8',
    '--color-on-secondary-fixed':         '#1a0033',
    '--color-on-secondary-fixed-variant': '#4a148c',
  },
  rose: {
    '--color-secondary':                  '#c62828',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#ef5350',
    '--color-on-secondary-container':     '#7f0000',
    '--color-secondary-fixed':            '#ffcdd2',
    '--color-secondary-fixed-dim':        '#ef9a9a',
    '--color-on-secondary-fixed':         '#3e0000',
    '--color-on-secondary-fixed-variant': '#b71c1c',
  },
  slate: {
    '--color-secondary':                  '#37474f',
    '--color-on-secondary':               '#ffffff',
    '--color-secondary-container':        '#78909c',
    '--color-on-secondary-container':     '#1c313a',
    '--color-secondary-fixed':            '#cfd8dc',
    '--color-secondary-fixed-dim':        '#90a4ae',
    '--color-on-secondary-fixed':         '#0d1f26',
    '--color-on-secondary-fixed-variant': '#263238',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Accent vars — DARK mode (lighter/brighter, visible on dark backgrounds)
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT_DARK: Record<AccentKey, Record<string, string>> = {
  amber: {
    '--color-secondary':                  '#f59b2b',  // bright amber — high contrast on dark
    '--color-on-secondary':               '#1f0800',
    '--color-secondary-container':        '#7a3e00',
    '--color-on-secondary-container':     '#ffd9a8',
    '--color-secondary-fixed':            '#3d1e00',
    '--color-secondary-fixed-dim':        '#5c2e00',
    '--color-on-secondary-fixed':         '#ffe0b2',
    '--color-on-secondary-fixed-variant': '#ffc07a',
  },
  blue: {
    '--color-secondary':                  '#5aabf5',
    '--color-on-secondary':               '#001228',
    '--color-secondary-container':        '#0d3d7a',
    '--color-on-secondary-container':     '#b3d7fa',
    '--color-secondary-fixed':            '#082040',
    '--color-secondary-fixed-dim':        '#0a2f60',
    '--color-on-secondary-fixed':         '#d0e8fa',
    '--color-on-secondary-fixed-variant': '#7ec8f7',
  },
  green: {
    '--color-secondary':                  '#4caf78',
    '--color-on-secondary':               '#062010',
    '--color-secondary-container':        '#1a4f28',
    '--color-on-secondary-container':     '#a5d6a7',
    '--color-secondary-fixed':            '#0a2a14',
    '--color-secondary-fixed-dim':        '#12401e',
    '--color-on-secondary-fixed':         '#c8e6c9',
    '--color-on-secondary-fixed-variant': '#6dbb85',
  },
  purple: {
    '--color-secondary':                  '#c57ee0',
    '--color-on-secondary':               '#1e0038',
    '--color-secondary-container':        '#4a1070',
    '--color-on-secondary-container':     '#e6c8f5',
    '--color-secondary-fixed':            '#280850',
    '--color-secondary-fixed-dim':        '#3a1068',
    '--color-on-secondary-fixed':         '#f0d8ff',
    '--color-on-secondary-fixed-variant': '#d49dee',
  },
  rose: {
    '--color-secondary':                  '#f47488',
    '--color-on-secondary':               '#2d0008',
    '--color-secondary-container':        '#6b0020',
    '--color-on-secondary-container':     '#ffacc0',
    '--color-secondary-fixed':            '#3a000e',
    '--color-secondary-fixed-dim':        '#520018',
    '--color-on-secondary-fixed':         '#ffd7df',
    '--color-on-secondary-fixed-variant': '#f7809a',
  },
  slate: {
    '--color-secondary':                  '#90a4ae',
    '--color-on-secondary':               '#101c24',
    '--color-secondary-container':        '#243340',
    '--color-on-secondary-container':     '#c5d6e2',
    '--color-secondary-fixed':            '#101c24',
    '--color-secondary-fixed-dim':        '#1a2c3a',
    '--color-on-secondary-fixed':         '#dce8f0',
    '--color-on-secondary-fixed-variant': '#a8bec8',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Surface vars (includes primary/tertiary/error for each surface)
// ─────────────────────────────────────────────────────────────────────────────
const SURFACE_VARS: Record<SurfaceKey, Record<string, string>> = {
  default: {
    '--color-surface':                   '#f8f9ff',
    '--color-surface-dim':               '#cbdbf5',
    '--color-surface-bright':            '#f8f9ff',
    '--color-surface-container-lowest':  '#ffffff',
    '--color-surface-container-low':     '#eff4ff',
    '--color-surface-container':         '#e5eeff',
    '--color-surface-container-high':    '#dce9ff',
    '--color-surface-container-highest': '#d3e4fe',
    '--color-surface-variant':           '#d3e4fe',
    '--color-on-surface':                '#0b1c30',
    '--color-on-surface-variant':        '#44474d',
    '--color-inverse-surface':           '#213145',
    '--color-inverse-on-surface':        '#eaf1ff',
    '--color-background':                '#f8f9ff',
    '--color-on-background':             '#0b1c30',
    '--color-outline':                   '#75777e',
    '--color-outline-variant':           '#c5c6cd',
    // Primary
    '--color-primary':                   '#000000',
    '--color-on-primary':                '#ffffff',
    '--color-primary-container':         '#0d1c32',
    '--color-on-primary-container':      '#76849f',
    '--color-inverse-primary':           '#b9c7e4',
    '--color-primary-fixed':             '#d6e3ff',
    '--color-primary-fixed-dim':         '#b9c7e4',
    '--color-on-primary-fixed':          '#0d1c32',
    '--color-on-primary-fixed-variant':  '#39475f',
    // Tertiary
    '--color-tertiary':                  '#000000',
    '--color-on-tertiary':               '#ffffff',
    '--color-tertiary-container':        '#001d31',
    '--color-on-tertiary-container':     '#188ace',
    '--color-tertiary-fixed':            '#cce5ff',
    '--color-tertiary-fixed-dim':        '#93ccff',
    '--color-on-tertiary-fixed':         '#001d31',
    '--color-on-tertiary-fixed-variant': '#004b73',
    // Error
    '--color-error':                     '#ba1a1a',
    '--color-on-error':                  '#ffffff',
    '--color-error-container':           '#ffdad6',
    '--color-on-error-container':        '#93000a',
  },
  warm: {
    '--color-surface':                   '#faf8f4',
    '--color-surface-dim':               '#e8e2d8',
    '--color-surface-bright':            '#faf8f4',
    '--color-surface-container-lowest':  '#ffffff',
    '--color-surface-container-low':     '#f4f0e8',
    '--color-surface-container':         '#ece6da',
    '--color-surface-container-high':    '#e4dcce',
    '--color-surface-container-highest': '#dcd2c4',
    '--color-surface-variant':           '#dcd2c4',
    '--color-on-surface':                '#1f1a14',
    '--color-on-surface-variant':        '#4a4540',
    '--color-inverse-surface':           '#342e26',
    '--color-inverse-on-surface':        '#f4ede4',
    '--color-background':                '#faf8f4',
    '--color-on-background':             '#1f1a14',
    '--color-outline':                   '#7a7370',
    '--color-outline-variant':           '#ccc8c0',
    '--color-primary':                   '#000000',
    '--color-on-primary':                '#ffffff',
    '--color-primary-container':         '#1a100a',
    '--color-on-primary-container':      '#7a6860',
    '--color-inverse-primary':           '#b0a098',
    '--color-primary-fixed':             '#f0e4d8',
    '--color-primary-fixed-dim':         '#d8ccC0',
    '--color-on-primary-fixed':          '#1a100a',
    '--color-on-primary-fixed-variant':  '#4a3830',
    '--color-tertiary':                  '#000000',
    '--color-on-tertiary':               '#ffffff',
    '--color-tertiary-container':        '#1a120a',
    '--color-on-tertiary-container':     '#c8956a',
    '--color-tertiary-fixed':            '#f5dcc0',
    '--color-tertiary-fixed-dim':        '#ddb888',
    '--color-on-tertiary-fixed':         '#1a120a',
    '--color-on-tertiary-fixed-variant': '#5a3820',
    '--color-error':                     '#ba1a1a',
    '--color-on-error':                  '#ffffff',
    '--color-error-container':           '#ffdad6',
    '--color-on-error-container':        '#93000a',
  },
  cool: {
    '--color-surface':                   '#f4f6f9',
    '--color-surface-dim':               '#c8d4e0',
    '--color-surface-bright':            '#f4f6f9',
    '--color-surface-container-lowest':  '#ffffff',
    '--color-surface-container-low':     '#eaeff5',
    '--color-surface-container':         '#dde5ee',
    '--color-surface-container-high':    '#d1dce7',
    '--color-surface-container-highest': '#c5d3e0',
    '--color-surface-variant':           '#c5d3e0',
    '--color-on-surface':                '#101820',
    '--color-on-surface-variant':        '#3e4a56',
    '--color-inverse-surface':           '#1e2d3d',
    '--color-inverse-on-surface':        '#e8eef5',
    '--color-background':                '#f4f6f9',
    '--color-on-background':             '#101820',
    '--color-outline':                   '#6e7e8e',
    '--color-outline-variant':           '#b8c8d8',
    '--color-primary':                   '#000000',
    '--color-on-primary':                '#ffffff',
    '--color-primary-container':         '#0a1828',
    '--color-on-primary-container':      '#6880a0',
    '--color-inverse-primary':           '#a0b8d0',
    '--color-primary-fixed':             '#d0e0f0',
    '--color-primary-fixed-dim':         '#a8c0d8',
    '--color-on-primary-fixed':          '#0a1828',
    '--color-on-primary-fixed-variant':  '#304858',
    '--color-tertiary':                  '#000000',
    '--color-on-tertiary':               '#ffffff',
    '--color-tertiary-container':        '#001828',
    '--color-on-tertiary-container':     '#1890d8',
    '--color-tertiary-fixed':            '#c0e0f8',
    '--color-tertiary-fixed-dim':        '#88c8f0',
    '--color-on-tertiary-fixed':         '#001828',
    '--color-on-tertiary-fixed-variant': '#004870',
    '--color-error':                     '#ba1a1a',
    '--color-on-error':                  '#ffffff',
    '--color-error-container':           '#ffdad6',
    '--color-on-error-container':        '#93000a',
  },
  dark: {
    '--color-surface':                   '#0d1117',
    '--color-surface-dim':               '#080b10',
    '--color-surface-bright':            '#161c28',
    '--color-surface-container-lowest':  '#13171f',  // card bg
    '--color-surface-container-low':     '#181e2c',  // subtle tint
    '--color-surface-container':         '#1e2639',  // medium container
    '--color-surface-container-high':    '#242e46',  // elevated
    '--color-surface-container-highest': '#2a3650',  // highest elevation
    '--color-surface-variant':           '#2a3650',
    '--color-on-surface':                '#dce4f0',  // primary text — near-white blue
    '--color-on-surface-variant':        '#8a98b0',  // secondary text — medium grey-blue
    '--color-inverse-surface':           '#b8c6d8',
    '--color-inverse-on-surface':        '#13171f',
    '--color-background':                '#0d1117',
    '--color-on-background':             '#dce4f0',
    '--color-outline':                   '#3d4d66',
    '--color-outline-variant':           '#1e2a3d',
    // Primary — adapted for dark (navy → medium blue-grey that's visible)
    '--color-primary':                   '#b8c8e0',
    '--color-on-primary':                '#0d1c32',
    '--color-primary-container':         '#1c2d48',  // medium navy card bg
    '--color-on-primary-container':      '#a0b8d5',  // light blue-grey text
    '--color-inverse-primary':           '#5a7a9a',
    '--color-primary-fixed':             '#1a2c44',
    '--color-primary-fixed-dim':         '#14243a',
    '--color-on-primary-fixed':          '#dce4f0',  // light text
    '--color-on-primary-fixed-variant':  '#8a98b0',
    // Tertiary — cobalt, adapted
    '--color-tertiary':                  '#7ec8ff',
    '--color-on-tertiary':               '#001d31',
    '--color-tertiary-container':        '#0a2440',
    '--color-on-tertiary-container':     '#7ec8ff',  // bright blue text (visible on dark)
    '--color-tertiary-fixed':            '#0e2e4e',
    '--color-tertiary-fixed-dim':        '#0a2038',
    '--color-on-tertiary-fixed':         '#cce5ff',
    '--color-on-tertiary-fixed-variant': '#5aabf5',
    // Error — brightened for dark bg
    '--color-error':                     '#f28b82',
    '--color-on-error':                  '#1a0000',
    '--color-error-container':           '#2a1214',
    '--color-on-error-container':        '#f2aab0',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM application
// ─────────────────────────────────────────────────────────────────────────────
export function applyThemeToDOM(prefs: ThemePrefs) {
  const root = document.documentElement;
  const isDark = prefs.surface === 'dark';

  const surfVars  = SURFACE_VARS[prefs.surface]  ?? SURFACE_VARS.default;
  const accentVars = isDark
    ? (ACCENT_DARK[prefs.accent]  ?? ACCENT_DARK.amber)
    : (ACCENT_LIGHT[prefs.accent] ?? ACCENT_LIGHT.amber);

  const allVars = { ...surfVars, ...accentVars };
  Object.entries(allVars).forEach(([k, v]) => root.style.setProperty(k, v));

  // data-theme drives CSS-nested dark overrides in globals.css
  if (isDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
interface ThemeCtx {
  prefs:      ThemePrefs;
  isDark:     boolean;
  setAccent:  (a: AccentKey)  => void;
  setSurface: (s: SurfaceKey) => void;
  setCompact: (c: boolean)    => void;
  reset:      () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs,   setPrefs]   = useState<ThemePrefs>(DEFAULT_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ThemePrefs>;
        const merged: ThemePrefs = { ...DEFAULT_PREFS, ...parsed };
        setPrefs(merged);
        applyThemeToDOM(merged);
      }
    } catch { /* ignore parse errors */ }
    setMounted(true);
  }, []);

  function update(next: ThemePrefs) {
    // Add transition class for smooth color change
    document.body.classList.add('rms-theme-transition');
    setPrefs(next);
    applyThemeToDOM(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setTimeout(() => document.body.classList.remove('rms-theme-transition'), 350);
  }

  const isDark = prefs.surface === 'dark';

  return (
    <Ctx.Provider value={{
      prefs,
      isDark,
      setAccent:  (a) => update({ ...prefs, accent:  a }),
      setSurface: (s) => update({ ...prefs, surface: s }),
      setCompact: (c) => update({ ...prefs, compact: c }),
      reset:      ()  => update(DEFAULT_PREFS),
    }}>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
