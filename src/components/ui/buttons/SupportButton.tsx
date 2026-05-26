interface SupportButtonProps {
  variant?: 'default' | 'home';
  className?: string;
}

export default function SupportButton({ variant = 'default', className = '' }: SupportButtonProps) {
  const baseClasses = variant === 'home'
    ? "inline-flex items-center justify-center rounded-lg sm:rounded-xl px-2 sm:px-4 py-1.5 sm:py-2 backdrop-blur-xl theme-btn-secondary font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer text-xs sm:text-sm"
    : "inline-flex items-center justify-center rounded-xl px-4 py-2 backdrop-blur-xl theme-btn-secondary font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] cursor-pointer";

  const containerClasses = variant === 'home' ? 'block' : 'hidden lg:block';

  return (
    <div className={containerClasses}>
      <a
        href="https://buymeacoffee.com/retloc"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
        className={`${baseClasses} ${className}`}
      >
        {variant === 'home' ? (
          <>
            <span className="sm:hidden">❤️ Donate</span>
            <span className="hidden sm:inline">❤️ Donate to the creator!</span>
          </>
        ) : (
          "❤️ Donate to the creator!"
        )}
      </a>
    </div>
  );
}
