import { request, type FullConfig } from '@playwright/test';

const apiUrl = process.env.TEST_API_URL ?? 'http://localhost:3000';
const email = process.env.TEST_USER_EMAIL ?? 'student@test.nl';
const password = process.env.TEST_USER_PASSWORD ?? 'Test1234!';

export default async function globalSetup(_config: FullConfig) {
  const api = await request.newContext({ baseURL: apiUrl });

  const response = await api.post('/auth/register', {
    data: {
      name: 'Playwright Student',
      email,
      password,
      role: 'STUDENT'
    }
  });

  if (!response.ok() && response.status() !== 409) {
    throw new Error(
      `Testgebruiker kon niet worden aangemaakt (${response.status()}): ${await response.text()}`
    );
  }

  await api.dispose();
}