const path = require('path');
const express = require('express');
const Sentry = require('@sentry/node');
const addonsRouter = require('./api/addons');

Sentry.init({ dsn: process.env.SENTRY_DSN || '', tracesSampleRate: 0.0 });

const app = express();
app.use(Sentry.Handlers.requestHandler());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api/addons', addonsRouter);
app.get('/health', (req, res) => res.json({ ok: true }));
app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 3000;
if (require.main === module) app.listen(port, () => console.log(`Server ${port}`));
module.exports = app;