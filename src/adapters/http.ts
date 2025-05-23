// src/adapters/http.ts
import { createClient, FetchTransport } from '@rspc/client';
import type { Procedures } from '../bindings'; // Ensure this path is correct

const getBaseUrl = () => {
  // In a Vite app, VITE_API_URL can be set in .env files
  // Default to localhost:4000 for web development
  return import.meta.env.VITE_API_URL || 'http://localhost:4000/rspc';
};

const transport = new FetchTransport(getBaseUrl());

export const httpClient = createClient<Procedures>({
  transport,
});

// Example of a generic httpCall function if not using rspc client directly for all calls
// For this project, we'll primarily use httpClient for rspc procedures.
export const httpCall = async <TResult = any, TInput = any>(
  procedure: keyof Procedures['queries'] | keyof Procedures['mutations'],
  input?: TInput,
  isQuery: boolean = true,
): Promise<TResult> => {
  try {
    if (isQuery) {
      // @ts-ignore - rspc client procedure typing can be tricky with dynamic keys
      return await httpClient.query([procedure as keyof Procedures['queries'], input]);
    } else {
      // @ts-ignore
      return await httpClient.mutation([procedure as keyof Procedures['mutations'], input]);
    }
  } catch (error) {
    console.error(`HTTP call failed for procedure ${String(procedure)}:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
};
