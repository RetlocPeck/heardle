/**
 * FAQ utilities for generating artist-specific FAQ content and schema
 */

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Generate artist-specific FAQ items
 */
export function generateFAQItems(artistName: string, fandom?: string): FAQItem[] {
  return [
    {
      question: `How do you play ${artistName} Heardle?`,
      answer: `Listen to the intro of a ${artistName} song and try to guess the correct title from the list. You get 6 attempts, and with each wrong guess or skip, more of the song is revealed. Try to guess in as few attempts as possible!`
    },
    {
      question: 'How many guesses do I get?',
      answer: 'You get 6 guesses per game. Each guess reveals more of the song - starting with 1 second and increasing to 2, 4, 7, 10, and finally 15 seconds. The fewer guesses you need, the better your score!'
    },
    {
      question: `Is there a new ${artistName} Heardle every day?`,
      answer: `Yes! A new daily ${artistName} challenge is available every day at midnight (your local time). Come back each day to test your knowledge and maintain your streak!`
    },
    {
      question: 'Can I practice with random songs?',
      answer: 'Absolutely! Switch to Practice Mode to play unlimited random songs. This is a great way to improve your skills without affecting your daily stats.'
    },
    {
      question: 'Do I need to create an account?',
      answer: 'No account is needed! Your statistics and progress are saved locally in your browser. You can start playing immediately without any sign-up.'
    },
    {
      question: 'Can I share my results?',
      answer: `Yes! After completing a game, you can share your results with friends. The share includes your score represented by emoji blocks${fandom ? ` - perfect for sharing with fellow ${fandom}!` : '.'}`
    },
    {
      question: `What songs are included in ${artistName} Heardle?`,
      answer: `${artistName} Heardle features songs from the artist's official discography available on streaming platforms. This includes title tracks, B-sides, and singles.`
    },
  ];
}

/**
 * Generate FAQPage JSON-LD schema
 */
export function generateFAQSchema(faqItems: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
}
