const db = require('../db');
const bcrypt = require('bcrypt');

// GET USERS
exports.getAllUsers = (req, res) => {

    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// CREATE USER
exports.createUser = async (req, res) => {

    const { username, login, password, role } = req.body;

    if (!username || !login || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }
    try {
        // 🔐 HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (username, login, password, role) VALUES (?, ?, ?, ?)",
            [username, login, hashedPassword, role || "USER"],
            (err, result) => {

                if (err) {
                    if (err.code === "ER_DUP_ENTRY") {
                        return res.status(400).json({
                            success: false,
                            message: "User already exists"
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "User created successfully"
                });
            }
        );

    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Hashing error"
        });
    }
};

// DELETE USER
exports.deleteUser = (req, res) => {

    db.query(
        "DELETE FROM users WHERE id = ?",
        [req.params.id],
        (err) => {

            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "User deleted"
            });
        }
    );
};

// UPDATE USER ROLE
exports.updateUser = (req, res) => {

    const { role } = req.body;

    db.query(
        "UPDATE users SET role = ? WHERE id = ?",
        [role, req.params.id],
        (err) => {

            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Role updated",
                data: {
                    id: req.params.id,
                    role
                }
            });
        }
    );
};