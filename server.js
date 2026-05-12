const express = require('express');
const cors = require('cors');
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// GET users
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ================= ADD USER =================
app.post('/users', (req, res) => {

    const { username, login, password, role } = req.body;

    if (!username || !login || !password) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    // 1 seule requête
    db.query(
        "INSERT INTO users (username, login, password, role) VALUES (?, ?, ?, ?)",
        [username, login, password, role || "USER"],
        (err, result) => {

            if (err) {
                console.log(err);
                // DUPLICATE KEY
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
});

// ================= DELETE USER =================
app.delete("/users/:id", (req, res) => {

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

});


// ================= UPDATE USER =================
app.put('/users/:id', (req, res) => {

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
});


// ================= START SERVER =================
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});