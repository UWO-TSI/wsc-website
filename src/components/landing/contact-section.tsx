'use client';

import { motion } from 'framer-motion';
import Eyebrow from '@/components/ui/eyebrow';
import ContactForm from '@/components/contact/contact-form';
import { revealVariant, viewportConfig } from '@/lib/motion';

export default function ContactSection() {
  return (
    <section
      id="contact-form"
      style={{
        padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 8vw, 10rem)',
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      <div style={{ maxWidth: '900px', width: '100%' }}>

        {/* Header block */}
        <motion.div
          variants={revealVariant}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <Eyebrow>GET IN TOUCH</Eyebrow>

          <div className="mt-[var(--space-3)]">
            <h2
              className="font-display font-semibold italic text-[var(--color-text-primary)] leading-[1.0]"
              style={{ fontSize: 'var(--text-display)' }}
            >
              Let&apos;s talk.
            </h2>

            {/* Animated gold rule — editorial accent */}
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewportConfig}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className="block mt-[var(--space-4)] h-px origin-left"
              style={{ backgroundColor: 'var(--color-gold)', maxWidth: '3rem', opacity: 0.6 }}
            />
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="mt-[var(--space-8)]"
          variants={revealVariant}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <ContactForm />
        </motion.div>

      </div>
    </section>
  );
}
