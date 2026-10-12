'use client';

import { Check, RotateCcw, Palette, Monitor, PanelLeft, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, ACCENTS, SURFACES, AccentKey, SurfaceKey } from '@/contexts/ThemeContext';

// ── Mini dashboard preview ────────────────────────────────────────────────────
function MiniPreview({
  accentColor, bgColor, cardColor, textColor, isCurrentDark,
}: {
  accentColor: string;
  bgColor:     string;
  cardColor:   string;
  textColor:   string;
  isCurrentDark: boolean;
}) {
  const border    = isCurrentDark ? 'rgba(61,77,102,0.6)' : 'rgba(197,198,205,0.5)';
  const muted     = isCurrentDark ? 'rgba(138,152,176,0.5)' : 'rgba(68,71,77,0.3)';
  const sidebarBg = isCurrentDark ? '#141b27' : cardColor;
  const textMed   = isCurrentDark ? '#8a98b0' : 'rgba(68,71,77,0.8)';

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border transition-all duration-300"
      style={{ borderColor: border, background: bgColor, boxShadow: isCurrentDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)' }}
    >
      <div className="flex" style={{ height: '148px' }}>
        {/* Sidebar */}
        <div
          className="flex flex-col gap-1.5 p-2.5 shrink-0"
          style={{ width: '50px', background: sidebarBg, borderRight: `1px solid ${border}` }}
        >
          {/* Brand dot */}
          <div className="w-6 h-6 rounded-lg mb-1.5 flex items-center justify-center" style={{ background: accentColor }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: isCurrentDark ? '#1f0800' : '#fff' }} />
          </div>
          {[100, 70, 55, 75, 45].map((o, i) => (
            <div key={i} className="rounded-md px-1 py-0.5 flex items-center gap-1"
              style={{ background: i === 0 ? accentColor + '22' : 'transparent' }}>
              <div className="rounded-sm shrink-0" style={{ width: 7, height: 7, background: i === 0 ? accentColor : muted }} />
              <div className="rounded-full flex-1" style={{ height: 3, background: i === 0 ? accentColor + '80' : muted, opacity: o / 100 }} />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-1.5 p-2.5 overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex flex-col gap-1">
              <div className="h-2 w-20 rounded-full" style={{ background: textColor + 'cc' }} />
              <div className="h-1.5 w-14 rounded-full" style={{ background: textMed }} />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ background: accentColor + '20' }} />
              <div className="w-5 h-5 rounded-full" style={{ background: accentColor }} />
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-1 flex-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl p-1.5 flex flex-col justify-between"
                style={{
                  background: i === 0 ? accentColor + '15' : cardColor,
                  border: `1px solid ${i === 0 ? accentColor + '30' : border}`,
                }}
              >
                <div className="w-4 h-4 rounded-md" style={{ background: i === 0 ? accentColor + '30' : muted }} />
                <div>
                  <div className="h-2 rounded-full mb-0.5" style={{ width: i === 0 ? 20 : 16, background: i === 0 ? accentColor : muted }} />
                  <div className="h-1.5 w-10 rounded-full" style={{ background: muted + '80' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Chart stub */}
          <div
            className="w-full rounded-lg overflow-hidden"
            style={{ height: 32, background: cardColor, border: `1px solid ${border}` }}
          >
            <div className="h-full flex items-end px-1.5 pb-1 gap-0.5">
              {[50, 35, 70, 45, 90, 60, 80, 55, 40, 75].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    background: i === 6 ? accentColor : accentColor + (isCurrentDark ? '50' : '30'),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────
function Section({
  icon: Icon, title, desc, children,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10">
        <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-on-surface leading-tight">{title}</h3>
          <p className="text-xs text-on-surface-variant/70 mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AppearancePanel() {
  const { prefs, isDark, setAccent, setSurface, setCompact, reset } = useTheme();

  const currentAccent  = ACCENTS.find(a => a.key === prefs.accent)   ?? ACCENTS[0];
  const currentSurface = SURFACES.find(s => s.key === prefs.surface) ?? SURFACES[0];

  const previewAccent = isDark ? currentAccent.swatchDark : currentAccent.swatch;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* ── Left: live preview + tips ── */}
      <div className="lg:col-span-2 flex flex-col gap-4">

        {/* Preview card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Sparkles size={17} className="text-secondary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">Live Preview</p>
                <p className="text-xs text-on-surface-variant/60">Updates instantly</p>
              </div>
            </div>
            <button
              onClick={reset}
              title="Reset to defaults"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant/60 hover:text-secondary hover:bg-secondary/8 transition-colors"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          <MiniPreview
            accentColor={previewAccent}
            bgColor={currentSurface.bg}
            cardColor={currentSurface.isDark ? '#1e2639' : currentSurface.card}
            textColor={currentSurface.isDark ? '#dce4f0' : '#0b1c30'}
            isCurrentDark={currentSurface.isDark ?? false}
          />

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/8 text-xs font-semibold text-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: previewAccent }} />
              {currentAccent.name}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface-variant">
              {currentSurface.name}
            </span>
            {prefs.compact && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface-variant">
                Compact
              </span>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl bg-surface-container-low/40 border border-outline-variant/10 px-5 py-4 space-y-3">
          {[
            'Colour changes apply instantly across all dashboard pages.',
            'Your preferences are stored in the browser and restore on next visit.',
            'Dark mode automatically inverts hardcoded status badge colours.',
          ].map((tip) => (
            <div key={tip} className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={9} className="text-secondary" />
              </span>
              <p className="text-xs text-on-surface-variant/60 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: settings ── */}
      <div className="lg:col-span-3 flex flex-col gap-4">

        {/* Dark mode — prominent toggle at top */}
        <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all duration-300 ${
          isDark
            ? 'bg-surface-container border-outline-variant/30 shadow-lg'
            : 'bg-surface-container-lowest border-outline-variant/15 shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-secondary/20' : 'bg-surface-container-high'
            }`}>
              {isDark
                ? <Moon size={18} className="text-secondary" />
                : <Sun  size={18} className="text-on-surface-variant" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {isDark ? 'Dark Mode is On' : 'Dark Mode'}
              </p>
              <p className="text-xs text-on-surface-variant/70 mt-0.5">
                {isDark ? 'High-contrast dark workspace active' : 'Switch to a dark, eye-friendly layout'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={() => setSurface(isDark ? 'default' : 'dark')}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
              isDark ? 'bg-secondary shadow-inner' : 'bg-outline-variant/50'
            }`}
            role="switch"
            aria-checked={isDark}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                isDark ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Accent colour */}
        <Section icon={Palette} title="Accent Colour" desc="Primary action colour for buttons, badges, and active states.">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {ACCENTS.map((a) => {
              const active = prefs.accent === a.key;
              const swatch = isDark ? a.swatchDark : a.swatch;
              return (
                <button
                  key={a.key}
                  onClick={() => setAccent(a.key as AccentKey)}
                  title={a.name}
                  className={`group flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-secondary bg-secondary/5 shadow-sm'
                      : 'border-transparent hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-md transition-transform group-hover:scale-110 relative"
                    style={{ background: `linear-gradient(135deg, ${a.swatch}, ${a.swatchDark})` }}
                  >
                    {active && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check size={13} className="text-white drop-shadow" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold leading-tight text-center ${active ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {a.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Background style */}
        <Section icon={Monitor} title="Background Style" desc="Surface and container colours used throughout the layout.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SURFACES.filter(s => s.key !== 'dark').map((s) => {
              const active = prefs.surface === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSurface(s.key as SurfaceKey)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    active
                      ? 'border-secondary bg-secondary/5 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  {/* Swatch stack */}
                  <div className="relative shrink-0 w-10 h-10">
                    <div className="absolute inset-0 rounded-lg shadow-sm" style={{ background: s.bg }} />
                    <div className="absolute inset-[5px] rounded-md" style={{ background: s.card, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }} />
                    <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full"
                      style={{ background: isDark ? currentAccent.swatchDark : currentAccent.swatch }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${active ? 'text-secondary' : 'text-on-surface'}`}>
                        {s.name}
                      </span>
                      {active && (
                        <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <Check size={9} className="text-on-secondary" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant/60 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Sidebar layout */}
        <Section icon={PanelLeft} title="Sidebar Layout" desc="Switch between full labels or compact icon-only navigation.">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {(
              [
                {
                  value: false,
                  label: 'Full Labels',
                  desc: 'Icons with text labels',
                  preview: (
                    <div className="w-full space-y-1">
                      {['Dashboard', 'Properties', 'Leads'].map((l) => (
                        <div key={l} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-container/60">
                          <div className="w-3 h-3 rounded-sm bg-on-surface-variant/25 shrink-0" />
                          <div className="h-1.5 rounded-full bg-on-surface-variant/25" style={{ width: l.length * 5 }} />
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  value: true,
                  label: 'Compact Icons',
                  desc: 'Icons only, hover to see label',
                  preview: (
                    <div className="flex flex-col items-center gap-1.5 w-full">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-8 h-8 rounded-xl bg-surface-container/60 flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-sm bg-on-surface-variant/25" />
                        </div>
                      ))}
                    </div>
                  ),
                },
              ] as const
            ).map((opt) => {
              const active = prefs.compact === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => setCompact(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    active
                      ? 'border-secondary bg-secondary/5 shadow-sm'
                      : 'border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <div className="w-full flex justify-center min-h-[60px] items-center">{opt.preview}</div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span className={`text-sm font-semibold ${active ? 'text-secondary' : 'text-on-surface'}`}>
                        {opt.label}
                      </span>
                      {active && (
                        <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">
                          <Check size={9} className="text-on-secondary" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant/60">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

      </div>
    </div>
  );
}
