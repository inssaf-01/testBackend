const db = require('../db');

// GET USERS
exports.getAllUsers = (req, res) => {

    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

// CREATE USER
exports.createUser = (req, res) => {

    const { username, login, password, role } = req.body;

    if (!username || !login || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    db.query(
        "INSERT INTO users (username, login, password, role) VALUES (?, ?, ?, ?)",
        [username, login, password, role || "USER"],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {

                    if (err.message.includes("username")) {
                        return res.status(400).json({
                            success: false,
                            message: "username already exists"
                        });
                    }

                    if (err.message.includes("login")) {
                        return res.status(400).json({
                            success: false,
                            message: "login already exists"
                        });
                    }
                }

                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: {
                    id: result.insertId,
                    username,
                    login,
                    role
                }
            });
        }
    );
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