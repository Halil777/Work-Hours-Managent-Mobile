export async function login(email: string, password: string) {
  // TODO: backend gelende api.post('/auth/login', {email,password})
  await new Promise(r => setTimeout(r, 500));
  if (email && password) return { token: 'demo-token', user: { id: 'u1', name: 'Demo User', email } };
  throw new Error('Login failed');
}
