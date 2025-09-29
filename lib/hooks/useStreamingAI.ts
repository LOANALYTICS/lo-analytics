// Custom hook for streaming AI analysis
import { useState } from 'react';
import { streamObject } from 'ai/react';

interface StreamingAIOptions {
  onComplete?: (result: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (partialResult: any) => void;
}

export function useStreamingAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const analyzeReport = async (
    slug: 'so-report' | 'clo-report', 
    data: any, 
    options?: StreamingAIOptions
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🚀 Starting streaming analysis for ${slug}...`);

      const response = await fetch('/api/ai-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let partialResult = {};

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              // Parse the streaming JSON data
              const jsonStr = line.substring(2);
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.object) {
                partialResult = { ...partialResult, ...parsed.object };
                setResult(partialResult);
                options?.onProgress?.(partialResult);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      }

      console.log(`✅ Streaming completed for ${slug}`);
      options?.onComplete?.(partialResult);
      return partialResult;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('❌ Streaming AI error:', error);
      setError(error.message);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analyzeReport,
    isLoading,
    error,
    result,
  };
}