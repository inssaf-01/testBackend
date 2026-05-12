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

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
// ================= ADD USER =================
app.post('/users', (req, res) => {

    const { username, login, password, role } = req.body;

    db.query(
        "SELECT * FROM users WHERE login = ? OR username = ?",
        [login, username],
        (err, results) => {

            if (err) return res.status(500).json(err);

            const errors = [];

            const loginExists = results.some(u => u.login === login);
            const usernameExists = results.some(u => u.username === username);

            if (loginExists) {
                errors.push({
                    field: "login",
                    message: "login already exists"
                });
            }

            if (usernameExists) {
                errors.push({
                    field: "username",
                    message: "Username already exists"
                });
            }

            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message:
                        errors.length === 2
                            ? "login and username already exist"
                            : errors[0].message,
                    errors
                });
            }

            // INSERT USER
            db.query(
                "INSERT INTO users (username, login, password, role) VALUES (?, ?, ?, ?)",
                [username, login, password, role || "USER"],
                (err, result) => {

                    if (err) return res.status(500).json(err);

                    res.status(201).json({
                        success: true,
                        message: "User added successfully",
                        data: {
                            id: result.insertId,
                            username,
                            login,
                            role
                        }
                    });

                }
            );
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