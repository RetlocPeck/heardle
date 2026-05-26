import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center space-x-1 sm:space-x-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg 
                  className="w-4 h-4 theme-text-muted mx-1 sm:mx-2 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="theme-link transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <span 
                  className={`whitespace-nowrap ${
                    isLast ? 'theme-text font-medium' : 'theme-text-secondary'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
