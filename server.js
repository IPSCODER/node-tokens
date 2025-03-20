// backend/server.js
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { data } = require('./data');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const users = [{ id: 1, email: 'test@example.com', password: 'password123' }];
const refreshTokens = [];

// Generate Access Token
const generateAccessToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign({ id: user.id, email: user.email }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    refreshTokens.push(refreshToken);
    return refreshToken;
};

// Login Route
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false });
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: false });
    res.json({ message: 'Logged in successfully' });
});

// Refresh Token Route
app.post('/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    
    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const newAccessToken = generateAccessToken(user);
        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: false });
        res.json({ message: 'Access token refreshed' });
    });
});

// Protected Route
app.get('/protected', (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.ACCESS_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        res.json({ message: 'Protected data accessed!', user });
    });
});

// Logout Route
app.post('/logout', (req, res) => {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.json({ message: 'Logged out successfully' });
});

app.get("/api/users",(req, res) => {
    setTimeout(() =>{
        res.send(data)
    },4000)
})

app.listen(5000, () => console.log('Server running on port 5000'));