const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { corsOptions, requireTrustedOrigin } = require('./config/security');

const app = express();
app.set('trust proxy', 1);

// The API only serves JSON, so the default CSP is tightened to deny everything.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requireTrustedOrigin);

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/team/auth', require('./routes/authRoutes'));
app.use('/api/team/sub-admins', require('./routes/subAdminRoutes'));
app.use('/api/team/hostels', require('./routes/hostelRoutes'));

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
app.use((err, req, res, next) => {
  if (err && err.message && err.message.startsWith('Origin not allowed')) {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Server error' });
});

module.exports = app;