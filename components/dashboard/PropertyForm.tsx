'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload, Plus, X, Loader2, CheckCircle2, AlertCircle,
  Building2, MapPin, Layers3, ImagePlus,
  ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { propertiesApi, ApiError } from '@/lib/api';
import type { PropertyPayload } from '@/lib/api-types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';

// ── Types ─────────────────────────────────────────────────────────────────────
type SubmitPhase = 'idle' | 'creating' | 'uploading' | 'done';
type FileStatus  = 'pending' | 'uploading' | 'done' | 'error';

interface ImageFile {
  file: File;
  preview: string;
  status: FileStatus;
}

interface ExistingImage {
  id: string;
  url: string;
}

interface PropertyFormProps {
  propertyId?: string;
  defaults?: Partial<PropertyPayload & { imageUrls?: ExistingImage[] }>;
  agents?: { id: string; name: string }[];
  onSuccess?: () => void;
}

// ── Status config ─────────────────────────────────────────────────────────────
type StatusValue = NonNullable<PropertyPayload['status']>;

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string; active: string; inactive: string }> = [
  { value: 'draft',     label: 'Draft',     active: 'bg-slate-500  text-white border-slate-500',   inactive: 'border-outline-variant text-on-surface-variant hover:border-slate-400' },
  { value: 'available', label: 'Available', active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'border-outline-variant text-on-surface-variant hover:border-emerald-400' },
  { value: 'reserved',  label: 'Reserved',  active: 'bg-amber-500  text-white border-amber-500',   inactive: 'border-outline-variant text-on-surface-variant hover:border-amber-400' },
  { value: 'sold',      label: 'Sold',      active: 'bg-rose-600   text-white border-rose-600',    inactive: 'border-outline-variant text-on-surface-variant hover:border-rose-400' },
  { value: 'rented',    label: 'Rented',    active: 'bg-violet-600 text-white border-violet-600',  inactive: 'border-outline-variant text-on-surface-variant hover:border-violet-400' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: 1,
    title: 'Property Basics',
    subtitle: 'Define the core identity of this listing.',
    icon: Building2,
    gradFrom: 'from-secondary/10',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    accentBar: 'bg-secondary',
    tips: [
      'Use a clear, specific title buyers remember',
      'Sale vs Rent affects which search filters show it',
      'Draft status keeps the listing hidden from the public portal',
    ],
  },
  {
    number: 2,
    title: 'Location & Story',
    subtitle: 'Place the property and help buyers picture it.',
    icon: MapPin,
    gradFrom: 'from-primary-container/10',
    iconBg: 'bg-primary-container/10',
    iconColor: 'text-primary-container',
    accentBar: 'bg-primary-container',
    tips: [
      'A complete address builds buyer confidence',
      'Well-written descriptions increase enquiries by 40%',
      'Mention nearby landmarks, schools, or transport links',
    ],
  },
  {
    number: 3,
    title: 'Specifications',
    subtitle: 'Dimensions, rooms and features buyers filter by.',
    icon: Layers3,
    gradFrom: 'from-emerald-500/8',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accentBar: 'bg-emerald-500',
    tips: [
      'Accurate bedroom count improves search ranking',
      'Add amenities like Pool, Gym, and Security',
      'Marla and Kanal are the preferred area units locally',
    ],
  },
  {
    number: 4,
    title: 'Photos & Media',
    subtitle: 'High-quality photos are your strongest sales tool.',
    icon: ImagePlus,
    gradFrom: 'from-amber-500/8',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accentBar: 'bg-amber-500',
    tips: [
      'Properties with 6+ photos get 3× more views',
      'The first image becomes the cover photo on all listings',
      'Natural lighting and wide angles perform best',
    ],
  },
] as const;

// ── Style helpers ─────────────────────────────────────────────────────────────
const InputCls =
  'w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-on-surface text-sm placeholder:text-on-surface-variant/50 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all';
const LabelCls = 'block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wide uppercase';
const ErrCls   = 'mt-1.5 text-xs text-error font-medium flex items-center gap-1';

function Field({
  label, required, error, hint, children,
}: { label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LabelCls}>
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-on-surface-variant/50">{hint}</p>}
      {error && <p className={ErrCls}><AlertCircle size={11} className="shrink-0" />{error}</p>}
    </div>
  );
}

function ToggleBtn({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center capitalize transition-all ${
        active
          ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
          : 'border-outline-variant text-on-surface-variant hover:border-secondary/40 hover:text-on-surface bg-surface-container-low'
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PropertyForm({ propertyId, defaults, agents, onSuccess }: PropertyFormProps) {
  const router    = useRouter();
  const { isAdmin } = useAuth();
  const toast     = useToast();
  const isEdit    = Boolean(propertyId);

  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title:          defaults?.title ?? '',
    description:    defaults?.description ?? '',
    type:           (defaults?.type    ?? 'residential') as 'residential' | 'commercial' | 'plot',
    purpose:        (defaults?.purpose ?? 'sale')        as 'sale' | 'rent',
    price:          defaults?.price    != null ? String(defaults.price) : '',
    city:           defaults?.city     ?? '',
    address:        defaults?.address  ?? '',
    bedrooms:       defaults?.bedrooms != null ? String(defaults.bedrooms) : '',
    bathrooms:      defaults?.bathrooms != null ? String(defaults.bathrooms) : '',
    area_size:      defaults?.area_size != null ? String(defaults.area_size) : '',
    area_unit:      (defaults?.area_unit ?? 'marla') as 'sqft' | 'marla' | 'kanal',
    floor:          defaults?.floor    != null ? String(defaults.floor) : '',
    parking_spaces: defaults?.parking_spaces != null ? String(defaults.parking_spaces) : '0',
    status:         (defaults?.status  ?? 'draft') as StatusValue,
    agent_id:       defaults?.agent_id ?? '',
    is_featured:    defaults?.is_featured ?? false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amenities,      setAmenities]      = useState<string[]>(defaults?.amenities ?? []);
  const [amenityInput,   setAmenityInput]   = useState('');
  const [existingImgs,   setExistingImgs]   = useState<ExistingImage[]>(defaults?.imageUrls ?? []);
  const [removedImgIds,  setRemovedImgIds]  = useState<string[]>([]);
  const [newFiles,       setNewFiles]       = useState<ImageFile[]>([]);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [apiError,       setApiError]       = useState('');
  const [phase,          setPhase]          = useState<SubmitPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const submitting = phase === 'creating' || phase === 'uploading';
  const isPlot     = form.type === 'plot';

  function upd(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => { const n = { ...e }; delete n[key]; return n; });
  }

  function addAmenity() {
    const v = amenityInput.trim();
    if (v && !amenities.includes(v)) { setAmenities(a => [...a, v]); setAmenityInput(''); }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files     = Array.from(e.target.files ?? []);
    const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length) setApiError(`${oversized.length} file(s) exceed the 5 MB limit and were not added.`);
    else setApiError('');
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    setNewFiles(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f), status: 'pending' as FileStatus })),
    ]);
    e.target.value = '';
  }

  function removeNewFile(index: number) {
    setNewFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeExistingImage(id: string) {
    setExistingImgs(prev => prev.filter(img => img.id !== id));
    setRemovedImgIds(prev => [...prev, id]);
  }

  function validateStep(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim())
        e.title = 'Title is required.';
      else if (form.title.trim().length < 5)
        e.title = 'Title must be at least 5 characters.';
      if (!form.price || isNaN(Number(form.price)))
        e.price = 'A valid price is required.';
      else if (Number(form.price) <= 0)
        e.price = 'Price must be greater than 0.';
    }
    if (s === 2) {
      if (!form.city.trim())
        e.city = 'City is required.';
    }
    if (s === 3) {
      if (form.area_size && (isNaN(Number(form.area_size)) || Number(form.area_size) < 0))
        e.area_size = 'Area size must be a positive number.';
      if (!isPlot) {
        if (form.bedrooms && (isNaN(Number(form.bedrooms)) || Number(form.bedrooms) < 0))
          e.bedrooms = 'Bedrooms must be 0 or more.';
        if (form.bathrooms && (isNaN(Number(form.bathrooms)) || Number(form.bathrooms) < 0))
          e.bathrooms = 'Bathrooms must be 0 or more.';
      }
      if (form.parking_spaces && (isNaN(Number(form.parking_spaces)) || Number(form.parking_spaces) < 0))
        e.parking_spaces = 'Parking spaces must be 0 or more.';
    }
    return e;
  }

  function goNext() {
    const e = validateStep(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => Math.min(s + 1, STEPS.length));
  }

  function goBack() {
    setErrors({});
    setStep(s => Math.max(s - 1, 1));
  }

  // Submission is triggered only via this function (called from onClick on the Publish button),
  // never from onSubmit, so pressing Enter on any input cannot reach the backend.
  async function handlePublish() {
    if (submitting || phase === 'done') return;

    const e1 = validateStep(1);
    const e2 = validateStep(2);
    const e3 = validateStep(3);
    const all = { ...e1, ...e2, ...e3 };
    if (Object.keys(all).length) {
      setErrors(all);
      if (Object.keys(e1).length) { setStep(1); return; }
      if (Object.keys(e2).length) { setStep(2); return; }
      setStep(3);
      return;
    }

    setApiError('');
    const payload: PropertyPayload = {
      title:       form.title.trim(),
      description: form.description.trim() || undefined,
      type:        form.type,
      purpose:     form.purpose,
      price:       Number(form.price),
      city:        form.city.trim(),
      address:     form.address.trim() || undefined,
      // Building-specific fields — explicitly null for plots
      bedrooms:       isPlot ? null : (form.bedrooms  !== '' ? Number(form.bedrooms)  : null),
      bathrooms:      isPlot ? null : (form.bathrooms !== '' ? Number(form.bathrooms) : null),
      floor:          isPlot ? null : (form.floor     !== '' ? Number(form.floor)     : null),
      area_size:      form.area_size !== '' ? Number(form.area_size) : null,
      area_unit:      form.area_unit,
      parking_spaces: form.parking_spaces !== '' ? Number(form.parking_spaces) : 0,
      amenities:      amenities.length ? amenities : undefined,
      status:         form.status,
    };

    if (isAdmin) {
      payload.is_featured = form.is_featured;
      if (!isEdit && form.agent_id) payload.agent_id = form.agent_id;
    }

    try {
      setPhase('creating');

      if (isEdit && propertyId) {
        await propertiesApi.update(propertyId, payload);

        for (const imgId of removedImgIds) {
          await propertiesApi.deleteImage(propertyId, imgId);
        }

        if (newFiles.length > 0) {
          setPhase('uploading');
          setUploadProgress({ current: 0, total: newFiles.length });
          for (let i = 0; i < newFiles.length; i++) {
            setUploadProgress({ current: i + 1, total: newFiles.length });
            setNewFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f));
            try {
              await propertiesApi.uploadImages(propertyId, [newFiles[i].file]);
              setNewFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done' } : f));
            } catch {
              setNewFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
            }
          }
        }
      } else {
        // New property: atomic create + images in one multipart request
        await propertiesApi.createWithImages(payload, newFiles.map(f => f.file));
        setNewFiles(prev => prev.map(f => ({ ...f, status: 'done' })));
      }

      setPhase('done');
      toast('Property saved successfully');
      onSuccess?.();
      setTimeout(() => router.push(isAdmin ? '/admin/properties' : '/agent/properties'), 700);
    } catch (err) {
      setPhase('idle');
      if (err instanceof ApiError) {
        setApiError(err.message);
        toast(err.message, 'error');
        if (err.errors) setErrors(Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v[0]])));
      } else {
        setApiError('An unexpected error occurred.');
        toast('An unexpected error occurred.', 'error');
      }
    }
  }

  const currentStep = STEPS[step - 1];
  const StepIcon    = currentStep.icon;
  const isLastStep  = step === STEPS.length;

  return (
    // onSubmit only calls preventDefault — submission is wired to handlePublish via onClick
    <form onSubmit={e => e.preventDefault()}>

      {/* ── Step progress bar ── */}
      <div className="mb-8">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => setStep(s.number)}
                className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-xs font-bold transition-all shrink-0 ${
                  s.number < step
                    ? 'bg-secondary border-secondary text-on-secondary'
                    : s.number === step
                    ? 'border-secondary text-secondary bg-secondary/10'
                    : 'border-outline-variant text-on-surface-variant/50'
                }`}
              >
                {s.number < step ? <Check size={14} /> : s.number}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all duration-300 ${s.number < step ? 'bg-secondary' : 'bg-outline-variant/30'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {STEPS.map(s => (
            <div key={s.number} className="flex-1 text-center px-1" style={{ maxWidth: `${100 / STEPS.length}%` }}>
              <span className={`text-[10px] font-semibold leading-tight block truncate transition-colors ${
                s.number === step ? 'text-secondary' : s.number < step ? 'text-on-surface-variant/60' : 'text-on-surface-variant/30'
              }`}>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Split layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-7 min-h-[440px]">

        {/* Left: Contextual panel */}
        <div className={`lg:col-span-2 rounded-2xl bg-gradient-to-b ${currentStep.gradFrom} via-surface-container-lowest to-surface-container-lowest border border-outline-variant/15 p-7 flex flex-col`}>
          <div className="flex-1">
            <div className={`w-12 h-12 rounded-2xl ${currentStep.iconBg} flex items-center justify-center mb-5`}>
              <StepIcon size={22} className={currentStep.iconColor} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-1">
              Step {step} of {STEPS.length}
            </p>
            <h2 className="text-xl font-bold text-on-surface mb-2 tracking-tight">{currentStep.title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{currentStep.subtitle}</p>

            <div className="mt-6 space-y-3">
              {currentStep.tips.map(tip => (
                <div key={tip} className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full ${currentStep.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Check size={10} className={currentStep.iconColor} />
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step dots */}
          <div className="mt-8 pt-6 border-t border-outline-variant/15">
            <div className="flex items-center gap-2 mb-2">
              {STEPS.map(s => (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => setStep(s.number)}
                  className={`transition-all duration-200 rounded-full ${
                    s.number === step
                      ? `h-2 w-6 ${currentStep.accentBar}`
                      : s.number < step
                      ? `h-2 w-2 ${currentStep.accentBar} opacity-40`
                      : 'h-2 w-2 bg-outline-variant/40'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-on-surface-variant/40">Click any dot or circle to navigate</p>
          </div>
        </div>

        {/* Right: Form fields */}
        <div className="lg:col-span-3 flex flex-col">

          {/* API error */}
          {apiError && (
            <div className="mb-5 flex items-start gap-3 p-4 bg-error-container/60 border border-error/20 rounded-xl text-on-error-container text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* ── Step 1: Basics ── */}
          {step === 1 && (
            <div className="space-y-5 flex-1">
              {/* Title */}
              <Field label="Property Title" required error={errors.title}>
                <input
                  type="text"
                  value={form.title}
                  placeholder="e.g. Modern 3-Bedroom Villa in DHA Phase 5"
                  onChange={e => upd('title', e.target.value)}
                  className={InputCls}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Property Type */}
                <Field label="Property Type" required>
                  <div className="grid grid-cols-3 gap-2">
                    <ToggleBtn active={form.type === 'residential'} onClick={() => upd('type', 'residential')}>Residential</ToggleBtn>
                    <ToggleBtn active={form.type === 'commercial'}  onClick={() => upd('type', 'commercial')}>Commercial</ToggleBtn>
                    <ToggleBtn active={form.type === 'plot'}        onClick={() => upd('type', 'plot')}>Plot / Land</ToggleBtn>
                  </div>
                </Field>

                {/* Listing Purpose */}
                <Field label="Listing Purpose" required>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleBtn active={form.purpose === 'sale'} onClick={() => upd('purpose', 'sale')}>For Sale</ToggleBtn>
                    <ToggleBtn active={form.purpose === 'rent'} onClick={() => upd('purpose', 'rent')}>For Rent</ToggleBtn>
                  </div>
                </Field>

                {/* Price */}
                <Field label="Price (PKR)" required error={errors.price}>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    placeholder="e.g. 15000000"
                    onChange={e => upd('price', e.target.value)}
                    className={InputCls}
                  />
                </Field>

                {/* [Admin only] Assign Agent */}
                {isAdmin && !isEdit && (
                  <Field label="Assign Agent">
                    <select value={form.agent_id} onChange={e => upd('agent_id', e.target.value)} className={InputCls}>
                      <option value="">No agent assigned</option>
                      {(agents ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              {/* Property Status — visual pill selector */}
              <Field label="Property Status" required>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => upd('status', opt.value)}
                      className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        form.status === opt.value ? opt.active : `bg-surface-container-low ${opt.inactive}`
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-on-surface-variant/50">
                  {form.status === 'draft' ? 'Hidden from the public portal until published.' :
                   form.status === 'available' ? 'Visible and searchable on the public portal.' :
                   form.status === 'reserved' ? 'Marked as reserved; visible but not accepting new inquiries.' :
                   form.status === 'sold' ? 'Property has been sold and is no longer active.' :
                   'Property has been rented and is no longer active.'}
                </p>
              </Field>

              {/* [Admin only] Featured toggle */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => upd('is_featured', !form.is_featured)}
                  className="flex items-center gap-3 w-full p-3.5 rounded-xl border border-outline-variant/30 hover:border-secondary/40 transition-colors"
                >
                  <div className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${form.is_featured ? 'bg-secondary' : 'bg-outline-variant'}`}>
                    <span className={`absolute w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_featured ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-on-surface">Mark as Featured</p>
                    <p className="text-xs text-on-surface-variant">Shown prominently on the public portal</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* ── Step 2: Location & Description ── */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
              <Field label="City" required error={errors.city}>
                <input
                  type="text"
                  value={form.city}
                  placeholder="e.g. Lahore, Karachi, Islamabad"
                  onChange={e => upd('city', e.target.value)}
                  className={InputCls}
                />
              </Field>
              <Field label="Full Address">
                <input
                  type="text"
                  value={form.address}
                  placeholder="Street, area, neighbourhood"
                  onChange={e => upd('address', e.target.value)}
                  className={InputCls}
                />
              </Field>
              <div className="col-span-2">
                <Field label="Description" hint="A compelling description can significantly increase buyer interest.">
                  <textarea
                    rows={8}
                    value={form.description}
                    placeholder="Describe the property in detail — layout, highlights, neighbourhood, nearby landmarks…"
                    onChange={e => upd('description', e.target.value)}
                    className={`${InputCls} resize-none`}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* ── Step 3: Specifications ── */}
          {step === 3 && (
            <div className="space-y-6 flex-1">
              {/* Plot type notice */}
              {isPlot && (
                <div className="flex items-start gap-2.5 p-3.5 bg-surface-container rounded-xl border border-outline-variant/20">
                  <AlertCircle size={14} className="text-on-surface-variant/60 shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Bedroom, bathroom and floor fields are hidden for <strong>Plot / Land</strong> listings.
                    Only area, parking and amenities apply.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {/* Area size + unit — shown for all types */}
                <Field label="Area Size" error={errors.area_size}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.area_size}
                    placeholder="0"
                    onChange={e => upd('area_size', e.target.value)}
                    className={InputCls}
                  />
                </Field>
                <Field label="Area Unit">
                  <select value={form.area_unit} onChange={e => upd('area_unit', e.target.value)} className={InputCls}>
                    <option value="marla">Marla</option>
                    <option value="kanal">Kanal</option>
                    <option value="sqft">Sq. Ft.</option>
                  </select>
                </Field>

                {/* Parking — shown for all types */}
                <Field label="Parking Spaces" error={errors.parking_spaces}>
                  <input
                    type="number"
                    min="0"
                    value={form.parking_spaces}
                    placeholder="0"
                    onChange={e => upd('parking_spaces', e.target.value)}
                    className={InputCls}
                  />
                </Field>

                {/* Building-specific fields — hidden for plots */}
                {!isPlot && (
                  <>
                    <Field label="Bedrooms" error={errors.bedrooms}>
                      <input
                        type="number"
                        min="0"
                        value={form.bedrooms}
                        placeholder="0"
                        onChange={e => upd('bedrooms', e.target.value)}
                        className={InputCls}
                      />
                    </Field>
                    <Field label="Bathrooms" error={errors.bathrooms}>
                      <input
                        type="number"
                        min="0"
                        value={form.bathrooms}
                        placeholder="0"
                        onChange={e => upd('bathrooms', e.target.value)}
                        className={InputCls}
                      />
                    </Field>
                    <Field label="Floor" hint="0 = Ground floor">
                      <input
                        type="number"
                        value={form.floor}
                        placeholder="0"
                        onChange={e => upd('floor', e.target.value)}
                        className={InputCls}
                      />
                    </Field>
                  </>
                )}
              </div>

              {/* Amenities */}
              <div>
                <label className={LabelCls}>Amenities</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g. Swimming Pool, Gym, Security 24/7…"
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                    className={`${InputCls} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map(a => (
                      <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full text-xs font-semibold text-secondary">
                        {a}
                        <button type="button" onClick={() => setAmenities(prev => prev.filter(x => x !== a))}
                          className="text-secondary/60 hover:text-error transition-colors">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Photos ── */}
          {step === 4 && (
            <div className="space-y-5 flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-4 w-full border-2 border-dashed border-outline-variant hover:border-secondary hover:bg-secondary/5 rounded-2xl p-10 cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-secondary/10 transition-colors pointer-events-none">
                  <Upload size={24} className="text-amber-500 group-hover:text-secondary transition-colors" />
                </div>
                <div className="text-center pointer-events-none">
                  <p className="text-sm font-semibold text-on-surface">Click to upload images</p>
                  <p className="text-xs text-on-surface-variant mt-1">JPG, PNG, WebP — max 5 MB each</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {(existingImgs.length > 0 || newFiles.length > 0) && (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {existingImgs.map((img, i) => (
                    <div key={`ex-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-outline-variant/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[9px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded font-bold tracking-wide">COVER</span>
                      )}
                      <button type="button" onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {newFiles.map((item, i) => (
                    <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-outline-variant/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      {item.status === 'uploading' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 size={20} className="animate-spin text-white" />
                        </div>
                      )}
                      {item.status === 'done' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <CheckCircle2 size={20} className="text-white" />
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="absolute inset-0 bg-error/60 flex items-center justify-center">
                          <AlertCircle size={20} className="text-white" />
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <button type="button" onClick={() => removeNewFile(i)}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error">
                          <X size={12} />
                        </button>
                      )}
                      {existingImgs.length === 0 && i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[9px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded font-bold tracking-wide">COVER</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation footer ── */}
      <div className="mt-8 pt-6 border-t border-outline-variant/20 flex items-center justify-between">
        <button
          type="button"
          onClick={step === 1 ? () => router.back() : goBack}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline disabled:opacity-40 transition-all text-sm font-medium"
        >
          <ChevronLeft size={16} />
          {step === 1 ? 'Cancel' : 'Back'}
        </button>

        <div className="flex items-center gap-3">
          {submitting && (
            <span className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" />
              {phase === 'creating'
                ? (isEdit ? 'Updating…' : 'Creating…')
                : `Uploading ${uploadProgress.current}/${uploadProgress.total}…`}
            </span>
          )}

          {!isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 bg-secondary text-on-secondary px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={submitting}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-all shadow-sm min-w-[160px] justify-center ${
                phase === 'done'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-secondary text-on-secondary hover:opacity-90'
              }`}
            >
              {phase === 'done' ? (
                <><CheckCircle2 size={16} /> Done!</>
              ) : submitting ? (
                <><Loader2 size={16} className="animate-spin" />
                  {phase === 'creating'
                    ? (isEdit ? 'Updating…' : 'Creating…')
                    : `Uploading ${uploadProgress.current}/${uploadProgress.total}…`}
                </>
              ) : (
                isEdit ? 'Save Changes' : 'Publish Property'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
