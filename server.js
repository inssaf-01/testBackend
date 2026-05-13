const express = require('express');
const cors = require('cors');

const usersRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use('/users', usersRoutes);
app.use('/auth', authRoutes);

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});