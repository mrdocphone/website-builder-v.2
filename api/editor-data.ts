// Vercel Serverless Function
// This API endpoint has been disabled as the editor functionality has been removed.

export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  return new Response(JSON.stringify({ message: 'This feature is no longer available.' }), { 
    status: 404, // 404 Not Found or 410 Gone
    headers: { 'Content-Type': 'application/json' } 
  });
}
