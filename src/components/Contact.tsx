import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { SocialIcon } from './Icons';
import { MagneticWrapper } from '../motion/MotionPrimitives';
import {
  BlackHoleButton,
  FinalMagicOverlay,
  RealityDimensionSection,
} from '../motion/ExperimentalEngine';
import { ParticleSectionTitle } from '../motion/ParticleSectionHeader';
import { EASE_CINEMATIC, VIEWPORT_CONFIG } from '../motion/motionSystem';
import { useIsBookSnapshot } from '../motion/BookSnapshotContext';

interface ContactProps {
  preselectedService?: string;
}

interface FormValues {
  name: string;
  email: string;
  service: string;
  budget: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  server?: string;
}

export const Contact: React.FC<ContactProps> = ({ preselectedService }) => {
  const { cms } = useSiteConfig();
  const rawReduceMotion = useReducedMotion();
  const isBookSnapshot = useIsBookSnapshot();
  const shouldReduceMotion = rawReduceMotion || isBookSnapshot;
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [magicActive, setMagicActive] = useState(false);

  const visibleServices = cms.services.items.filter((s) => s.visible !== false);
  const budgetOptions =
    cms.contactInfo.budgetOptions.length > 0
      ? cms.contactInfo.budgetOptions
      : ['Under $5,000', '$5,000 – $15,000', '$15,000 – $30,000', '$30,000+'];
  const visibleSocials = cms.contactInfo.socials.filter((s) => s.visible !== false);

  const defaultServiceTitle = visibleServices[0]?.title || 'Web Development';

  const [form, setForm] = useState<FormValues>({
    name: '',
    email: '',
    service: preselectedService || defaultServiceTitle,
    budget: budgetOptions[0] || '',
    message: '',
  });

  useEffect(() => {
    if (preselectedService) {
      setForm((prev) => ({ ...prev, service: preselectedService }));
      setSubmitted(false);
    }
  }, [preselectedService]);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(cms.contactInfo.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      window.location.href = `mailto:${cms.contactInfo.email}`;
    }
  };

  const triggerMagicAndFocus = () => {
    setSubmitted(false);
    setMagicActive(true);
  };

  const handleMagicComplete = () => {
    setMagicActive(false);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const validate = (values: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!values.name.trim() || values.name.trim().length < 2) {
      nextErrors.name = 'Please enter your name (at least 2 characters).';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.email.trim() || !emailPattern.test(values.email.trim())) {
      nextErrors.email = 'Please provide a valid email address.';
    }
    if (!values.message.trim() || values.message.trim().length < 10) {
      nextErrors.message = 'Please share a brief overview of at least 10 characters.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setShakeKey((k) => k + 1);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(json.error || 'Could not send message.');
      }
      setSubmitted(true);
    } catch (err) {
      setErrors({
        server: err instanceof Error ? err.message : 'Unable to submit inquiry right now.',
      });
      setShakeKey((k) => k + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setErrors({});
    setForm({
      name: '',
      email: '',
      service: preselectedService || defaultServiceTitle,
      budget: budgetOptions[0] || '',
      message: '',
    });
  };

  return (
    <>
      <FinalMagicOverlay active={magicActive} onComplete={handleMagicComplete} />

      <RealityDimensionSection
        id="contact"
        className="py-24 sm:py-32 bg-[#050505]/35 border-b border-white/[0.06] overflow-hidden z-10"
      >
        {!shouldReduceMotion && (
          <motion.div
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            className="pointer-events-none absolute -bottom-64 -left-48 w-[560px] h-[560px] rounded-full border border-white/[0.04]"
          />
        )}

        <div className="relative mx-auto max-w-[1360px] px-6 sm:px-10">
          <div className="mb-10">
            <ParticleSectionTitle
              word={
                !cms.contactInfo.sectionLabel || cms.contactInfo.sectionLabel === 'CONTACT'
                  ? "LET'S CREATE"
                  : cms.contactInfo.sectionLabel
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-8">
              <div>
                <h3 className="font-display text-3xl sm:text-4xl md:text-[46px] font-bold tracking-tight leading-[1.08] text-white">
                  {cms.contactInfo.heading}
                </h3>
                <motion.p
                  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={VIEWPORT_CONFIG}
                  transition={{ duration: 0.5, delay: 0.16, ease: EASE_CINEMATIC }}
                  className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-400"
                >
                  {cms.contactInfo.subheading}
                </motion.p>
              </div>

              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_CONFIG}
                transition={{ duration: 0.5, delay: 0.22, ease: EASE_CINEMATIC }}
                className="flex flex-wrap items-center gap-4"
              >
                <MagneticWrapper strength={0.28}>
                  <BlackHoleButton
                    onClick={triggerMagicAndFocus}
                    className="group overflow-hidden px-7 py-3.5 text-sm font-semibold bg-white text-black rounded-full hover:shadow-[0_0_32px_rgba(255,255,255,0.3)] transition-shadow duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span>Start a Project</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </BlackHoleButton>
                </MagneticWrapper>

                <MagneticWrapper strength={0.22}>
                  <motion.button
                    type="button"
                    data-gravity="avoid"
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-medium text-zinc-100 border border-white/20 rounded-full hover:bg-white/[0.06] hover:border-white/45 transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        <span>Email Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-zinc-400" />
                        <span>Get In Touch</span>
                      </>
                    )}
                  </motion.button>
                </MagneticWrapper>
              </motion.div>

              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={VIEWPORT_CONFIG}
                transition={{ duration: 0.5, delay: 0.28, ease: EASE_CINEMATIC }}
                className="pt-8 border-t border-white/[0.08] space-y-4"
              >
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <a
                    href={`mailto:${cms.contactInfo.email}`}
                    className="hover:text-white transition-colors underline-offset-4 hover:underline"
                  >
                    {cms.contactInfo.email}
                  </a>
                </div>

                {cms.contactInfo.phone && (
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                    <a
                      href={`tel:${cms.contactInfo.phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {cms.contactInfo.phone}
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{cms.contactInfo.location}</span>
                </div>

                <div className="pt-3 flex flex-wrap items-center gap-3">
                  {visibleSocials.map((social) => (
                    <MagneticWrapper key={social.id} strength={0.22}>
                      <motion.a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.94 }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-white/[0.1] bg-[#0B0B0D] text-xs font-medium text-zinc-300 hover:text-black hover:bg-white hover:border-white transition-colors duration-200"
                      >
                        <SocialIcon
                          platform={social.platform}
                          customIconUrl={social.customIconUrl}
                          className="w-3.5 h-3.5"
                        />
                        <span>{social.label}</span>
                      </motion.a>
                    </MagneticWrapper>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              key={shakeKey}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20, filter: 'blur(4px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              animate={
                shakeKey > 0 && !shouldReduceMotion
                  ? { x: [-6, 6, -4, 4, 0], transition: { duration: 0.32 } }
                  : undefined
              }
              viewport={VIEWPORT_CONFIG}
              transition={{ duration: 0.55, delay: 0.1, ease: EASE_CINEMATIC }}
              className="lg:col-span-7"
            >
              <div
                data-gravity="gather"
                className="relative p-6 sm:p-10 rounded-3xl bg-[#0A0A0C]/75 backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.24] transition-colors duration-300 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
              >
                <AnimatePresence>
                  {isSubmitting && !shouldReduceMotion && (
                    <motion.div
                      aria-hidden="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="pointer-events-none absolute inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: [0.5, 1.25, 0.9], opacity: [0.4, 1, 0.9] }}
                        transition={{ duration: 0.68, ease: EASE_CINEMATIC }}
                        className="w-12 h-12 rounded-full border border-white/70 bg-white/15 shadow-[0_0_40px_rgba(255,255,255,0.45)]"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: EASE_CINEMATIC }}
                    className="py-12 text-center space-y-5 relative"
                  >
                    <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                      {!shouldReduceMotion && (
                        <>
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0.9 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 1.2, ease: EASE_CINEMATIC }}
                            className="pointer-events-none absolute inset-0 rounded-full border border-white/60"
                          />
                          <motion.span
                            initial={{ scale: 0.8, opacity: 0.7 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            transition={{ duration: 1.2, delay: 0.15, ease: EASE_CINEMATIC }}
                            className="pointer-events-none absolute inset-0 rounded-full border border-white/40"
                          />
                        </>
                      )}
                      <div className="relative w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_32px_rgba(255,255,255,0.35)]">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                    </div>
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white">
                      Inquiry Received
                    </h3>
                    <p className="max-w-md mx-auto text-sm sm:text-base text-zinc-400 leading-relaxed">
                      Thank you, {form.name}. Your message regarding{' '}
                      <span className="text-zinc-100">{form.service}</span> has been delivered to
                      the studio inbox. I typically respond within one business day.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 text-xs font-semibold bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"
                      >
                        Send Another Message
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {errors.server && (
                      <div className="p-3.5 rounded-xl border border-white/40 bg-white/5 text-xs text-zinc-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errors.server}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-xs font-medium text-zinc-300 mb-2"
                        >
                          Full Name
                        </label>
                        <input
                          ref={nameInputRef}
                          id="contact-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => {
                            setForm({ ...form, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: undefined });
                          }}
                          placeholder="Jane Doe"
                          aria-invalid={Boolean(errors.name)}
                          className={`w-full px-4 py-3 rounded-xl bg-[#060607] border text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-200 ${
                            errors.name ? 'border-white/75' : 'border-white/[0.1]'
                          }`}
                        />
                        {errors.name && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-200">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-white" />
                            <span>{errors.name}</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-xs font-medium text-zinc-300 mb-2"
                        >
                          Email Address
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm({ ...form, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: undefined });
                          }}
                          placeholder="jane@company.com"
                          aria-invalid={Boolean(errors.email)}
                          className={`w-full px-4 py-3 rounded-xl bg-[#060607] border text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-200 ${
                            errors.email ? 'border-white/75' : 'border-white/[0.1]'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-200">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-white" />
                            <span>{errors.email}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="contact-service"
                          className="block text-xs font-medium text-zinc-300 mb-2"
                        >
                          Service Needed
                        </label>
                        <select
                          id="contact-service"
                          value={form.service}
                          onChange={(e) => setForm({ ...form, service: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-[#060607] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-200"
                        >
                          {visibleServices.map((svc) => (
                            <option key={svc.id} value={svc.title} className="bg-[#0A0A0C]">
                              {svc.title}
                            </option>
                          ))}
                          <option value="Custom Project" className="bg-[#0A0A0C]">
                            Custom Project
                          </option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="contact-budget"
                          className="block text-xs font-medium text-zinc-300 mb-2"
                        >
                          Estimated Investment
                        </label>
                        <select
                          id="contact-budget"
                          value={form.budget}
                          onChange={(e) => setForm({ ...form, budget: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-[#060607] border border-white/[0.1] text-sm text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-200"
                        >
                          {budgetOptions.map((opt) => (
                            <option key={opt} value={opt} className="bg-[#0A0A0C]">
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-xs font-medium text-zinc-300 mb-2"
                      >
                        Project Details
                      </label>
                      <textarea
                        id="contact-message"
                        rows={5}
                        value={form.message}
                        onChange={(e) => {
                          setForm({ ...form, message: e.target.value });
                          if (errors.message) setErrors({ ...errors, message: undefined });
                        }}
                        placeholder="Tell me about your timeline, goals, and what we're building together..."
                        aria-invalid={Boolean(errors.message)}
                        className={`w-full px-4 py-3 rounded-xl bg-[#060607] border text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/25 transition-all duration-200 resize-y ${
                          errors.message ? 'border-white/75' : 'border-white/[0.1]'
                        }`}
                      />
                      {errors.message && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-200">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-white" />
                          <span>{errors.message}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="text-xs text-zinc-500">
                        {cms.contactInfo.responseNote || 'Response time: within 24 hours'}
                      </span>
                      <MagneticWrapper strength={0.24}>
                        <motion.button
                          type="submit"
                          data-gravity="avoid"
                          disabled={isSubmitting}
                          whileTap={{ scale: 0.96 }}
                          className="group relative overflow-hidden inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold bg-white text-black rounded-full hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] disabled:opacity-60 transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <span className="pointer-events-none absolute -inset-full bg-gradient-to-r from-transparent via-black/15 to-transparent rotate-12 translate-x-[-130%] group-hover:translate-x-[130%] transition-transform duration-700" />
                          <span className="relative z-10">
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                          </span>
                          <ArrowRight className="relative z-10 w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </motion.button>
                      </MagneticWrapper>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </RealityDimensionSection>
    </>
  );
};
