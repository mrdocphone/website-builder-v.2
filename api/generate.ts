// This API endpoint has been disabled.
// The AI content generation feature was based on a legacy data model and is no longer compatible with the application.
export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  return new Response(JSON.stringify({ message: 'This feature has been permanently disabled.' }), { 
    status: 410, // 410 Gone
    headers: { 'Content-Type': 'application/json' } 
  });
}
