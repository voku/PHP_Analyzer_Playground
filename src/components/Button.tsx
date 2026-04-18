import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', loading, variant = 'primary', children, disabled, ...props }, ref) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none text-sm px-4 py-2 border";
    
    let variantStyle = "";
    switch (variant) {
      case 'primary':
        variantStyle = "bg-blue-600 border-transparent text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600";
        break;
      case 'secondary':
        variantStyle = "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700";
        break;
      case 'outline':
        variantStyle = "border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200";
        break;
      case 'danger':
        variantStyle = "bg-red-600 border-transparent text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600";
        break;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyle} ${variantStyle} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
