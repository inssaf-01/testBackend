const db = require('../db');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {

    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({
            success: false,
            message: "Login and password required"
        });
    }

    db.query(
        "SELECT * FROM users WHERE login = ?",
        [login],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (!results.length) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const user = results[0];

            const isMatch = password === user.password;

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials"
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    role: user.role,
                    login: user.login
                },
                "SECRET_KEY_123",
                { expiresIn: "1h" }
            );

            res.json({
                success: true,
                message: "Login successful",
                token,
                user
            });
        }
    );
};