// Vercel Serverless Function
// Checks if the Vercel KV store is configured and connected.
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  try {
    // A simple, non-intrusive check to see if we can communicate with the KV store.
    // A get() call will throw an error if the required environment variables are not set.
    await kv.get('kv-health-check');
    
    return new Response(JSON.stringify({ isConfigured: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // If kv throws, it means environment variables for the KV store are missing.
    console.error("KV Check Failed:", error);
    return new Response(JSON.stringify({ isConfigured: false }), {
      // We return a 200 OK because the check itself executed successfully.
      // The payload indicates the outcome of the configuration check.
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
