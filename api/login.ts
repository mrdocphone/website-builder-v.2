// Vercel Serverless Function
// This function securely handles the login request on the server-side.
export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { username, password } = await request.json();

    // These credentials live securely on the server and are never sent to the browser.
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'password';

    if (username === adminUser && password === adminPass) {
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ success: false, message: 'Invalid username or password.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: 'Bad Request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}
