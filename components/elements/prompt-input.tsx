'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatStatus } from 'ai';
import { Loader2Icon, SendIcon, SquareIcon, XIcon } from 'lucide-react';
import type {
  ComponentProps,
  HTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { Children, useEffect, useRef } from 'react';

export type PromptInputProps = HTMLAttributes<HTMLFormElement>;

export const PromptInput = ({ className, ...props }: PromptInputProps) => (
  <form
    className={cn(
      'w-full overflow-hidden rounded-xl border bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20',
      className,
    )}
    {...props}
  />
);

export type PromptInputTextareaProps = ComponentProps<typeof Textarea> & {
  minHeight?: number;
  maxHeight?: number;
  disableAutoResize?: boolean;
  resizeOnNewLinesOnly?: boolean;
};

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = 'What would you like to know?',
  minHeight = 48,
  maxHeight = 164,
  disableAutoResize = false,
  resizeOnNewLinesOnly = false,
  ...props
}: PromptInputTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea || disableAutoResize) return;

    textarea.style.height = 'auto';
    const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
    textarea.style.height = `${scrollHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [props.value]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    if (!resizeOnNewLinesOnly) {
      adjustHeight();
    } else if (e.target.value.includes('\n')) {
      adjustHeight();
    }
    onChange?.(e);
  };

  return (
    <Textarea
      ref={textareaRef}
      className={cn(
        'min-h-0 resize-none border-0 bg-transparent p-4 pb-12 shadow-none focus-visible:ring-0',
        className,
      )}
      placeholder={placeholder}
      rows={1}
      onChange={handleChange}
      style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      {...props}
    />
  );
};

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputToolbar = ({
  className,
  ...props
}: PromptInputToolbarProps) => (
  <div
    className={cn(
      'flex items-center justify-between border-t bg-muted/30 px-4 py-2',
      className,
    )}
    {...props}
  />
);

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputTools = ({
  className,
  children,
  ...props
}: PromptInputToolsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
);

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus;
  disabled?: boolean;
};

export const PromptInputSubmit = ({
  className,
  status,
  disabled,
  ...props
}: PromptInputSubmitProps) => {
  if (status === 'loading') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-8 w-8 p-0', className)}
        disabled
        {...props}
      >
        <Loader2Icon className="h-4 w-4 animate-spin" />
        <span className="sr-only">Generating response...</span>
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className={cn(
        'h-8 w-8 p-0 transition-colors hover:bg-primary hover:text-primary-foreground',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <SendIcon className="h-4 w-4" />
      <span className="sr-only">Send message</span>
    </Button>
  );
};

export type PromptInputModelSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  models: Array<{ id: string; name: string; description?: string }>;
  className?: string;
};

export const PromptInputModelSelect = ({
  value,
  onValueChange,
  models,
  className,
}: PromptInputModelSelectProps) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger
      className={cn(
        'h-8 w-fit border-0 bg-transparent px-2 text-xs font-medium shadow-none focus:ring-0',
        className,
      )}
    >
      <SelectValue />
    </SelectTrigger>
    <PromptInputModelSelectContent models={models} />
  </Select>
);

export type PromptInputModelSelectContentProps = {
  models: Array<{ id: string; name: string; description?: string }>;
};

export const PromptInputModelSelectContent = ({
  models,
}: PromptInputModelSelectContentProps) => (
  <SelectContent>
    {models.map((model) => (
      <SelectItem key={model.id} value={model.id}>
        <div className="flex flex-col">
          <span className="font-medium">{model.name}</span>
          {model.description && (
            <span className="text-xs text-muted-foreground">
              {model.description}
            </span>
          )}
        </div>
      </SelectItem>
    ))}
  </SelectContent>
);