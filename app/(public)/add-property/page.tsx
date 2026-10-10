'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Plus, X, CheckCircle2 } from 'lucide-react';
import { PropertyType, PropertyStatus } from '@/lib/types';

interface FormData {
  title: string;
  type: PropertyType | '';
  status: PropertyStatus | '';
  price: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  floors: string;
  garage: string;
  yearBuilt: string;
  description: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  agentTitle: string;
}

const initialForm: FormData = {
  title: '', type: '', status: '', price: '',
  address: '', city: '', state: '', zip: '',
  bedrooms: '', bathrooms: '', area: '', floors: '', garage: '', yearBuilt: '',
  description: '',
  agentName: '', agentEmail: '', agentPhone: '', agentTitle: '',
};

const InputCls = 'w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all';
const LabelCls = 'block text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-2';
const SectionCls = 'bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-5';

export default function AddPropertyPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function update(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function addFeature() {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures((f) => [...f, trimmed]);
      setFeatureInput('');
    }
  }

  function removeFeature(f: string) {
    setFeatures((prev) => prev.filter((x) => x !== f));
  }

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    const urls = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...urls]);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setImages((prev) => [...prev, ...urls]);
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.type) errs.type = 'Select a property type';
    if (!form.status) errs.status = 'Select a listing status';
    if (!form.price || isNaN(Number(form.price))) errs.price = 'Enter a valid price';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.area || isNaN(Number(form.area))) errs.area = 'Enter valid area';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.agentName.trim()) errs.agentName = 'Agent name is required';
    if (!form.agentEmail.trim()) errs.agentEmail = 'Agent email is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-surface-container-low min-h-screen pt-20 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center py-20">
          <div className="w-20 h-20 bg-secondary-fixed/40 border border-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-secondary" />
          </div>
          <h1 className="font-display text-4xl font-light text-on-surface mb-3">Listing Submitted!</h1>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
            Your property has been submitted for review. Our team will verify the details and publish your listing within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setForm(initialForm); setFeatures([]); setImages([]); }}
              className="px-6 py-3 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-colors"
            >
              Add Another Property
            </button>
            <Link href="/properties" className="px-6 py-3 border border-outline-variant text-on-surface rounded-xl text-sm font-medium hover:bg-surface-container transition-colors">
              Browse Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low min-h-screen pt-20">
      {/* Page Header */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <Link href="/properties" className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-4 w-fit">
            <ArrowLeft size={14} />
            Back to Listings
          </Link>
          <p className="text-xs text-secondary tracking-widest uppercase font-semibold mb-1">New Listing</p>
          <h1 className="font-display text-4xl font-light text-on-surface">Add Property</h1>
          <p className="text-on-surface-variant text-sm mt-2">Fill in the details below to list your property on EstateLux.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Basic Info */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">1</span>
            Basic Information
          </h2>
          <div className={SectionCls}>
            <div>
              <label className={LabelCls}>Property Title</label>
              <input
                type="text"
                placeholder="e.g. The Meridian Penthouse"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className={InputCls}
              />
              {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LabelCls}>Property Type</label>
                <select
                  value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                  className={InputCls}
                >
                  <option value="">Select type...</option>
                  <option value="villa">Villa</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="studio">Studio</option>
                </select>
                {errors.type && <p className="text-xs text-error mt-1">{errors.type}</p>}
              </div>

              <div>
                <label className={LabelCls}>Listing Status</label>
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={InputCls}
                >
                  <option value="">Select status...</option>
                  <option value="for-sale">For Sale</option>
                  <option value="for-rent">For Rent</option>
                </select>
                {errors.status && <p className="text-xs text-error mt-1">{errors.status}</p>}
              </div>
            </div>

            <div>
              <label className={LabelCls}>
                Price {form.status === 'for-rent' ? '(per month)' : ''}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                <input
                  type="number"
                  placeholder="0"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  className={`${InputCls} pl-8`}
                />
              </div>
              {errors.price && <p className="text-xs text-error mt-1">{errors.price}</p>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">2</span>
            Location
          </h2>
          <div className={SectionCls}>
            <div>
              <label className={LabelCls}>Street Address</label>
              <input
                type="text"
                placeholder="1200 Wilshire Blvd, Unit 4200"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className={InputCls}
              />
              {errors.address && <p className="text-xs text-error mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className={LabelCls}>City</label>
                <input
                  type="text"
                  placeholder="Los Angeles"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className={InputCls}
                />
                {errors.city && <p className="text-xs text-error mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className={LabelCls}>State</label>
                <input
                  type="text"
                  placeholder="CA"
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  className={InputCls}
                />
                {errors.state && <p className="text-xs text-error mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className={LabelCls}>ZIP Code</label>
                <input
                  type="text"
                  placeholder="90025"
                  value={form.zip}
                  onChange={(e) => update('zip', e.target.value)}
                  className={InputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">3</span>
            Property Details
          </h2>
          <div className={SectionCls}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {[
                { key: 'bedrooms' as const, label: 'Bedrooms', placeholder: '4' },
                { key: 'bathrooms' as const, label: 'Bathrooms', placeholder: '3' },
                { key: 'area' as const, label: 'Area (sq ft)', placeholder: '2500' },
                { key: 'floors' as const, label: 'Floors', placeholder: '2' },
                { key: 'garage' as const, label: 'Garage (cars)', placeholder: '2' },
                { key: 'yearBuilt' as const, label: 'Year Built', placeholder: '2020' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={LabelCls}>{label}</label>
                  <input
                    type="number"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className={InputCls}
                  />
                  {errors[key] && <p className="text-xs text-error mt-1">{errors[key]}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description & Features */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">4</span>
            Description &amp; Features
          </h2>
          <div className={SectionCls}>
            <div>
              <label className={LabelCls}>Property Description</label>
              <textarea
                rows={5}
                placeholder="Describe the property, its unique features, neighborhood, and highlights..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                className={`${InputCls} resize-none`}
              />
              {errors.description && <p className="text-xs text-error mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className={LabelCls}>Features &amp; Amenities</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g. Private Pool, Smart Home..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  className={`${InputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-4 py-3 bg-secondary text-on-secondary rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-fixed/40 border border-secondary/20 rounded-full text-xs text-secondary"
                    >
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(f)}
                        className="hover:text-on-surface transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">5</span>
            Property Images
          </h2>
          <div className={SectionCls}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleImageDrop}
              className="border-2 border-dashed border-outline-variant rounded-xl p-10 text-center hover:border-secondary/40 transition-colors"
            >
              <Upload size={28} className="text-on-surface-variant mx-auto mb-3" />
              <p className="text-on-surface text-sm font-medium mb-1">Drag &amp; drop images here</p>
              <p className="text-on-surface-variant text-xs mb-4">PNG, JPG, WebP — up to 10 images</p>
              <label className="cursor-pointer px-5 py-2.5 border border-outline-variant rounded-xl text-sm text-on-surface-variant hover:text-on-surface hover:border-secondary/40 transition-colors">
                Browse Files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error"
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-secondary text-on-secondary text-xs rounded-lg font-medium">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Agent Info */}
        <div>
          <h2 className="font-display text-2xl font-light text-on-surface mb-5 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-sm font-semibold flex items-center justify-center">6</span>
            Agent Information
          </h2>
          <div className={SectionCls}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={LabelCls}>Agent Name</label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.agentName}
                  onChange={(e) => update('agentName', e.target.value)}
                  className={InputCls}
                />
                {errors.agentName && <p className="text-xs text-error mt-1">{errors.agentName}</p>}
              </div>
              <div>
                <label className={LabelCls}>Title</label>
                <input
                  type="text"
                  placeholder="Senior Listing Agent"
                  value={form.agentTitle}
                  onChange={(e) => update('agentTitle', e.target.value)}
                  className={InputCls}
                />
              </div>
              <div>
                <label className={LabelCls}>Email</label>
                <input
                  type="email"
                  placeholder="agent@email.com"
                  value={form.agentEmail}
                  onChange={(e) => update('agentEmail', e.target.value)}
                  className={InputCls}
                />
                {errors.agentEmail && <p className="text-xs text-error mt-1">{errors.agentEmail}</p>}
              </div>
              <div>
                <label className={LabelCls}>Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (310) 555-0000"
                  value={form.agentPhone}
                  onChange={(e) => update('agentPhone', e.target.value)}
                  className={InputCls}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 pb-8">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-secondary text-on-secondary rounded-xl text-sm font-semibold hover:opacity-90 transition-colors tracking-wide shadow-md"
          >
            Submit Listing →
          </button>
          <Link
            href="/properties"
            className="w-full sm:w-auto px-8 py-4 border border-outline-variant text-on-surface-variant rounded-xl text-sm font-medium hover:border-secondary/40 hover:text-on-surface transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
