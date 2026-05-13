const db = require('../db');
const jwt = require('jsonwebtoken');
const { generateOTP } = require('../utils/otp.generator');
const { sendResetCodeEmail } = require('../services/mail.service');

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
// SEND RESET CODE
exports.sendResetCode = (req, res) => {
    const { login } = req.body;

    if (!login) {
        return res.status(400).json({
            success: false,
            message: 'Login is required'
        });
    }

    db.query(
        'SELECT * FROM users WHERE login = ?',
        [login],
        async (err, users) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!users.length) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = users[0];
            const code = generateOTP();

            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            db.query(
                `INSERT INTO password_reset_codes
                (user_id, reset_code, expires_at)
                VALUES (?, ?, ?)`,
                [user.id, code, expiresAt],
                async (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to save reset code'
                        });
                    }

                    try {
                        await sendResetCodeEmail(login, code);

                        res.json({
                            success: true,
                            message: 'Verification code sent successfully'
                        });
                    } catch (e) {
                        res.status(500).json({
                            success: false,
                            message: 'Email sending failed'
                        });
                    }
                }
            );
        }
    );
};

// VERIFY RESET CODE
// VERIFY RESET CODE
exports.verifyResetCode = (req, res) => {
    const { login, code } = req.body;

    // validation login
    if (!login) {
        return res.status(400).json({
            success: false,
            message: "Login is required"
        });
    }

    // validation code vide
    if (!code) {
        return res.status(400).json({
            success: false,
            message: "Verification code is required"
        });
    }

    // validation longueur code (ex: OTP sur 6 chiffres)
    if (code.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Verification code must contain 6 characters"
        });
    }

    // vérifier si user existe déjà
    db.query(
        `SELECT * FROM users WHERE login = ?`,
        [login],
        (err, users) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (!users.length) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            // vérifier si code existe même expiré / utilisé
            db.query(
                `SELECT prc.*
                 FROM password_reset_codes prc
                 JOIN users u ON u.id = prc.user_id
                 WHERE u.login = ?
                 AND prc.reset_code = ?
                 ORDER BY prc.id DESC
                 LIMIT 1`,
                [login, code],
                (err, rows) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Database error"
                        });
                    }

                    // code totalement faux
                    if (!rows.length) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid verification code"
                        });
                    }

                    const resetData = rows[0];

                    // déjà utilisé
                    if (resetData.is_used) {
                        return res.status(400).json({
                            success: false,
                            message: "This code has already been used"
                        });
                    }

                    // expiré
                    const now = new Date();
                    const expiresAt = new Date(resetData.expires_at);

                    if (expiresAt < now) {
                        return res.status(400).json({
                            success: false,
                            message: "Verification code has expired"
                        });
                    }

                    // success
                    return res.json({
                        success: true,
                        message: "Code verified successfully"
                    });
                }
            );
        }
    );
};;

// RESET PASSWORD
exports.resetPassword = (req, res) => {
    const { login, code, newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({
            success: false,
            message: 'New password is required'
        });
    }

    db.query(
        `SELECT prc.*, u.id as user_id
         FROM password_reset_codes prc
         JOIN users u ON u.id = prc.user_id
         WHERE u.login = ?
         AND prc.reset_code = ?
         AND prc.is_used = FALSE
         AND prc.expires_at > NOW()
         ORDER BY prc.id DESC
         LIMIT 1`,
        [login, code],
        (err, results) => {
            if (err || !results.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired code'
                });
            }

            const row = results[0];

            db.query(
                'UPDATE users SET password = ? WHERE id = ?',
                [newPassword, row.user_id],
                (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Password update failed'
                        });
                    }

                    db.query(
                        'UPDATE password_reset_codes SET is_used = TRUE WHERE id = ?',
                        [row.id]
                    );

                    res.json({
                        success: true,
                        message: 'Password reset successfully'
                    });
                }
            );
        }
    );
};

