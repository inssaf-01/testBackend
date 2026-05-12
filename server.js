const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// fake DB
let users = [
    {
        id: 1,
        username: 'Ali',
        email: 'ali@test.com',
        password: '123456',
        role: 'USER'
    },
    {
        id: 2,
        username: 'Sara',
        email: 'sara@test.com',
        password: '123456',
        role: 'ADMIN'
    }
];


// ================= GET USERS =================
app.get('/users', (req, res) => {
    res.json(users);
});

// ================= ADD USER =================
app.post('/users', (req, res) => {

    const errors = [];

    // ================= EMAIL CHECK =================
    const emailExists = users.find(
        u => u.email === req.body.email
    );

    if (emailExists) {
        errors.push({
            field: 'email',
            message: 'Email already exists'
        });
    }

    // ================= USERNAME CHECK =================
    const usernameExists = users.find(
        u => u.username === req.body.username
    );

    if (usernameExists) {
        errors.push({
            field: 'username',
            message: 'Username already exists'
        });
    }

    // ================= RETURN ERRORS =================
    if (errors.length > 0) {

        return res.status(400).json({

            success: false,

            message: 'Validation failed',

            data: errors

        });
    }

    // ================= CREATE USER =================
    const user = {
        id: Date.now(),
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        created_at: new Date(),
        created_by: null
    };

    users.push(user);

    // ================= SUCCESS =================
    return res.status(201).json({

        success: true,

        message: 'User added successfully',

        data: user

    });
});

// ================= DELETE USER =================
app.delete('/users/:id', (req, res) => {

    users = users.filter(
        u => u.id != req.params.id
    );

    return res.json({
        success: true,
        message: 'user deleted',
    });
});


// ================= UPDATE USER =================
app.put('/users/:id', (req, res) => {

    const user = users.find(
        u => u.id == req.params.id
    );

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // EMAIL UNIQUE
    if (req.body.email) {

        const emailExists = users.find(
            u =>
                u.email === req.body.email &&
                u.id != req.params.id
        );

        // SI EMAIL EXISTE
        if (emailExists) {

            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // UPDATE EMAIL
        user.email = req.body.email;
    }

    // ROLE UPDATE
    if (req.body.role) {
        user.role = req.body.role;
    }

    // PASSWORD UPDATE
    if (req.body.newPassword && req.body.newPassword.length > 0) {

        // old password required
        if (!req.body.oldPassword) {
            return res.status(400).json({
                success: false,
                message: 'Old password required'
            });
        }

        // old password check
        if (req.body.oldPassword !== user.password) {
            return res.status(400).json({
                success: false,
                message: 'Old password incorrect'
            });
        }

        user.password = req.body.newPassword;
    }

    return res.json({
        success: true,
        message: 'User updated successfully',
        data: user
    });
});


// ================= START SERVER =================
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});