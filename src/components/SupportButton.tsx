interface SupportButtonProps {
  variant?: 'default' | 'home';
  className?: string;
}

export default function SupportButton({ variant = 'default', className = '' }: SupportButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-xl px-4 py-2 shadow-md bg-gradient-to-r from-[#a873ff] to-[#6b7bff] text-white font-medium transition-transform duration-150 ease-out hover:scale-105 focus:outline-none focus-visible:ring focus-visible:ring-white/40 cursor-pointer";
  
  const variantClasses = variant === 'home' 
    ? "hover:shadow-lg hover:shadow-[#a873ff]/25" 
    : "";
  
  const containerClasses = variant === 'home' ? 'block' : 'hidden lg:block';
  
  return (
    <div className={containerClasses}>
      <a
        href="https://buymeacoffee.com/retloc"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buy me a coffee"
        className={`${baseClasses} ${variantClasses} ${className}`}
      >
        ❤️ Donate to the creator!
      </a>
    </div>
  );
}
