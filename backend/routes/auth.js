const express = require('express');
const router = express.Router();

// Mock user data for testing
const mockUsers = [
  {
    id: 1,
    email: 'fathimasiddika62@gmail.com',
    password: 'password123',
    name: 'Fathima Siddika'
  }
];

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = 'mock-jwt-token-' + Date.now();
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Get current user
router.get('/me', (req, res) => {
  // Mock user verification
  res.json({
    user: {
      id: 1,
      email: 'fathimasiddika62@gmail.com',
      name: 'Fathima Siddika'
    }
  });
});

module.exports = router;
