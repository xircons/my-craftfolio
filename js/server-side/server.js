'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Absolute path to project root (two levels up from this file)
const rootDir = path.join(__dirname, '..', '..');

// Middleware
app.use(express.json({ limit: '1mb' }));

// Serve the static site from the project root
app.use(express.static(rootDir));

// Ensure contact directory and file exist at project root
const contactDir = path.join(rootDir, 'contact');
const contactFile = path.join(contactDir, 'contact-info.json');
function ensureContactStore() {
    if (!fs.existsSync(contactDir)) {
        fs.mkdirSync(contactDir, { recursive: true });
    }
    if (!fs.existsSync(contactFile)) {
        fs.writeFileSync(contactFile, '[]', 'utf8');
    }
}
ensureContactStore();

// Append submission to JSON file
app.post('/api/contact', (req, res) => {
    try {
        ensureContactStore();
        const payload = req.body || {};
        const record = {
            name: typeof payload.name === 'string' ? payload.name : '',
            email: typeof payload.email === 'string' ? payload.email : '',
            company: typeof payload.company === 'string' ? payload.company : '',
            message: typeof payload.message === 'string' ? payload.message : '',
            submittedAt: new Date().toISOString(),
            userAgent: typeof payload.userAgent === 'string' ? payload.userAgent : ''
        };

        const raw = fs.readFileSync(contactFile, 'utf8');
        const list = JSON.parse(raw || '[]');
        list.push(record);
        fs.writeFileSync(contactFile, JSON.stringify(list, null, 2), 'utf8');

        return res.status(200).json({ ok: true, count: list.length });
    } catch (err) {
        console.error('[api/contact] failed:', err);
        return res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Craftfolio server running at http://localhost:${PORT}`);
});


