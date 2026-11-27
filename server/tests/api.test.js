const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { PassThrough } = require('node:stream');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key-for-automated-tests-only';
process.env.CLIENT_URL = 'https://app.example.com/, http://localhost:5173';
process.env.NODE_ENV = 'test';

const app = require('../index');
const User = require('../models/User');
const Expense = require('../models/Expense');

function inject({ method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const socket = new PassThrough();
    socket.remoteAddress = '127.0.0.1';
    const req = new http.IncomingMessage(socket);
    req.method = method;
    req.url = url;
    req.headers = {};
    for (const [k, v] of Object.entries(headers)) {
      req.headers[k.toLowerCase()] = v;
    }

    let rawBody = null;
    if (body !== null) {
      rawBody = typeof body === 'string' ? body : JSON.stringify(body);
      if (!req.headers['content-type']) req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = String(Buffer.byteLength(rawBody));
    }

    const res = new http.ServerResponse(req);
    const chunks = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    res.assignSocket(socket);

    res.write = (chunk, encoding, cb) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      return origWrite(chunk, encoding, cb);
    };
    res.end = (chunk, encoding, cb) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      const text = Buffer.concat(chunks).toString('utf8');
      let json = null;
      try { json = JSON.parse(text); } catch { /* non-JSON body */ }
      resolve({ status: res.statusCode, headers: res.getHeaders(), text, json });
      return origEnd(chunk, encoding, cb);
    };

    app.handle(req, res, reject);
    process.nextTick(() => {
      if (rawBody !== null) req.push(rawBody);
      req.push(null);
    });
  });
}

test('health endpoints respond with security headers and 503 when DB is disconnected', async () => {
  const res = await inject({ url: '/health' });
  assert.equal(res.status, 503);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.json.db, 'disconnected');

  const resApi = await inject({ url: '/api/health' });
  assert.equal(resApi.status, 503);
});

test('CORS allows normalized CLIENT_URL and blocks disallowed origins', async () => {
  const allowed = await inject({ url: '/health', headers: { Origin: 'https://app.example.com' } });
  assert.equal(allowed.headers['access-control-allow-origin'], 'https://app.example.com');

  const blocked = await inject({ url: '/health', headers: { Origin: 'https://evil.example.com' } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.json.error, 'Not allowed by CORS');
});

test('protected routes reject missing or invalid JWT tokens with 401', async () => {
  const res = await inject({ url: '/api/transactions' });
  assert.equal(res.status, 401);

  const badToken = await inject({
    url: '/api/dashboard',
    headers: { Authorization: 'Bearer invalid.jwt.token' },
  });
  assert.equal(badToken.status, 401);
});

test('malformed JSON returns 400 and unknown routes return 404', async () => {
  const badJson = await inject({
    method: 'POST',
    url: '/api/auth/login',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  assert.equal(badJson.status, 400);

  const notFound = await inject({ url: '/api/does-not-exist' });
  assert.equal(notFound.status, 404);
});

test('auth register validates input and transactions route rejects invalid date filters with 400', async () => {
  const badReg = await inject({
    method: 'POST',
    url: '/api/auth/register',
    body: { name: 'A', email: 'invalid', password: '123' },
  });
  assert.equal(badReg.status, 400);

  const origFindById = User.findById;
  const origFind = Expense.find;
  User.findById = async () => ({ _id: '507f1f77bcf86cd799439011', name: 'Test User', email: 'test@example.com', currency: 'INR' });
  try {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
    const badDate = await inject({
      url: '/api/transactions?from=not-a-date',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(badDate.status, 400);
    assert.match(badDate.json.error, /Invalid/);
  } finally {
    User.findById = origFindById;
    Expense.find = origFind;
  }
});
