'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Coins, Activity } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface UsageData {
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
}

interface UsageTrackerProps {
  usage?: UsageData;
  isVisible?: boolean;
}

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-0': { input: 3.0, output: 15.0 },
  'claude-opus-4-0': { input: 15.0, output: 75.0 },
  'claude-haiku-4-0': { input: 0.25, output: 1.25 },
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-5': { input: 10.0, output: 30.0 },
  'gpt-5-mini': { input: 2.0, output: 8.0 },
  'gpt-5-nano': { input: 0.5, output: 2.0 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
};

function calculateCost(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}

export function UsageTracker({ usage, isVisible = true }: UsageTrackerProps) {
  const [sessionUsage, setSessionUsage] = useState<UsageData>({
    tokens: { input: 0, output: 0, total: 0 },
    cost: { input: 0, output: 0, total: 0 },
    model: '',
  });

  useEffect(() => {
    if (usage) {
      const pricing = MODEL_PRICING[usage.model] || { input: 1.0, output: 3.0 };

      const inputCost = calculateCost(usage.tokens.input, pricing.input);
      const outputCost = calculateCost(usage.tokens.output, pricing.output);

      setSessionUsage(prev => ({
        tokens: {
          input: prev.tokens.input + usage.tokens.input,
          output: prev.tokens.output + usage.tokens.output,
          total: prev.tokens.total + usage.tokens.total,
        },
        cost: {
          input: prev.cost.input + inputCost,
          output: prev.cost.output + outputCost,
          total: prev.cost.total + inputCost + outputCost,
        },
        model: usage.model,
      }));
    }
  }, [usage]);

  if (!isVisible || sessionUsage.tokens.total === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-muted/50 border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Session Usage</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {sessionUsage.model || 'Unknown Model'}
            </Badge>
          </div>

          <div className="space-y-3">
            {/* Token Usage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input Tokens</span>
                <span className="text-sm font-mono">
                  {sessionUsage.tokens.input.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output Tokens</span>
                <span className="text-sm font-mono">
                  {sessionUsage.tokens.output.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Total Tokens</span>
                <span className="text-sm font-mono font-medium">
                  {sessionUsage.tokens.total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cost Breakdown</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Input Cost</span>
                <span className="text-sm font-mono">
                  ${sessionUsage.cost.input.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Output Cost</span>
                <span className="text-sm font-mono">
                  ${sessionUsage.cost.output.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="text-sm font-mono font-medium text-primary">
                  ${sessionUsage.cost.total.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}