const express = require('express');
const cors = require('cors');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/team/auth', require('./routes/authRoutes'));
app.use('/api/team/hostels', require('./routes/hostelRoutes'));

module.exports = app;