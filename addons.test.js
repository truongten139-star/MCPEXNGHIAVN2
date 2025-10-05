const request = require('supertest');
const app = require('../src/server');

test('GET /api/addons returns array', async () => {
  const res = await request(app).get('/api/addons');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});