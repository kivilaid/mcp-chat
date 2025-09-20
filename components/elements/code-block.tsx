'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckIcon, CopyIcon } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const { theme } = useTheme();

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border bg-background text-foreground',
          className,
        )}
        {...props}
      >
        <div className="relative">
          <SyntaxHighlighter
            className="overflow-hidden"
            codeTagProps={{
              className: 'font-mono text-sm',
            }}
            style={theme === 'dark' ? oneDark : oneLight}
            language={language}
            showLineNumbers={showLineNumbers}
            wrapLines
            customStyle={{
              margin: 0,
              background: 'transparent',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            {code}
          </SyntaxHighlighter>
          {children}
        </div>
      </div>
    </CodeBlockContext.Provider>
  );
};

export type CodeBlockHeaderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const CodeBlockHeader = ({
  children,
  className,
  ...props
}: CodeBlockHeaderProps) => (
  <div
    className={cn(
      'flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-sm',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type CodeBlockTitleProps = HTMLAttributes<HTMLDivElement>;

export const CodeBlockTitle = ({
  children,
  className,
  ...props
}: CodeBlockTitleProps) => (
  <div
    className={cn('font-medium text-foreground', className)}
    {...props}
  >
    {children}
  </div>
);

export type CodeBlockCopyProps = ComponentProps<typeof Button>;

export const CodeBlockCopy = ({
  className,
  ...props
}: CodeBlockCopyProps) => {
  const { code } = useContext(CodeBlockContext);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 w-8 p-0', className)}
      onClick={handleCopy}
      {...props}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      <span className="sr-only">
        {copied ? 'Copied!' : 'Copy code'}
      </span>
    </Button>
  );
};

export type CodeBlockContentProps = HTMLAttributes<HTMLDivElement>;

export const CodeBlockContent = ({
  children,
  className,
  ...props
}: CodeBlockContentProps) => (
  <div className={cn('p-4', className)} {...props}>
    {children}
  </div>
);