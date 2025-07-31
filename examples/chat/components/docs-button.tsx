import { Button } from './ui/button';

type ButtonStyle = 'primary' | 'main' | 'secondary';

interface DocsButtonProps {
  className?: string;
  style?: ButtonStyle;
}

const getButtonStyleClasses = (style: ButtonStyle) => {
  switch (style) {
    case 'primary':
      return {
        variant: 'blue' as const,
        className: ''
      };
    case 'main':
      return {
        variant: 'outline' as const,
        className: 'bg-black text-white border-black hover:bg-gray-800 hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100'
      };
    case 'secondary':
      return {
        variant: 'outline' as const,
        className: 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
      };
    default:
      return {
        variant: 'outline' as const,
        className: ''
      };
  }
};

export function DocsButton({ className = "", style = 'main' }: DocsButtonProps) {
  const buttonStyle = getButtonStyleClasses(style);
  
  return (
    <Button
      variant={buttonStyle.variant}
      size="sm"
      asChild
      className={`h-10 px-3 ${buttonStyle.className} ${className}`}
    >
      <a 
        href="https://pipedream.com/docs/connect/mcp/developers" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <span className="hidden font-semibold sm:inline">Read the docs</span>
      </a>
    </Button>
  );
}