// Vercel Serverless Function
// This function checks for the existence of admin credentials on the server-side.
export const config = {
  runtime: 'edge',
};

export default function handler(request: Request) {
  const isConfigured = !!(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
  
  return new Response(
    JSON.stringify({ isConfigured }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
