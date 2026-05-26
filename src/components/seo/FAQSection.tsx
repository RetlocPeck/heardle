'use client';

import { useState } from 'react';
import type { FAQItem } from '@/lib/utils/faqUtils';

interface FAQSectionProps {
  faqItems: FAQItem[];
}

export default function FAQSection({ faqItems }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative z-10 mt-8 sm:mt-12 px-4 pb-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold theme-text mb-4 sm:mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-3">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="backdrop-blur-md theme-glass-surface rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-[var(--icon-btn-hover-bg)] transition-colors"
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
              >
                <span className="text-sm sm:text-base font-medium theme-text pr-4">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 theme-text-muted flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-4 sm:px-6 pb-4 text-sm sm:text-base theme-text-secondary leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
