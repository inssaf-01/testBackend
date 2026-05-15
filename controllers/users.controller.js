const db = require('../db');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');


// GET USERS avant pagination 
// exports.getAllUsers = (req, res) => {

//     db.query("SELECT id,username,login,role_id FROM users", (err, results) => {
//         if (err) return res.status(500).json(err);
//         res.json(results);
//     });
// };
exports.getAllUsers = (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.query(
        `
        SELECT id, username, login, role_id, status
        FROM users
        LIMIT ? OFFSET ?
        `,
        [limit, offset],
        (err, results) => {

            if (err) return res.status(500).json(err);

            const data = results.map(u => ({
                ...u,
                role: u.role_id
            }));

            db.query(
                "SELECT COUNT(*) as total FROM users",
                (err2, countResult) => {
                    if (err2) return res.status(500).json(err2);

                    res.json({
                        data,
                        total: countResult[0].total,
                        page,
                        limit
                    });
                }
            );
        }
    );

};
exports.getAllRoles = (req, res) => {
    db.query("SELECT id, name, description FROM roles", (err, results) => {
        if (err) return res.status(500).json(err);

        res.json({
            success: true,
            data: results
        });
    });
};

// CREATE USER
exports.createUser = async (req, res) => {

    const { username, login, password, role_id } = req.body;

    if (!username || !login || !password || !role_id) {
        return res.status(400).json({
            success: false,
            message: "Missing fields"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('req : ', req);
        console.log('res : ', res);
        db.query(
            `
            INSERT INTO users (username, login, password, role_id)
            VALUES (?, ?, ?, ?)
            `,
            [
                username,
                login,
                hashedPassword,
                Number(role_id)
            ],
            (err) => {

                if (err) {
                    console.log("MYSQL ERROR :", err);

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
        console.log(e);

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
    const { role_id } = req.body;

    if (!role_id) {
        return res.status(400).json({
            success: false,
            message: "Invalid role_id"
        });
    }

    db.query(
        "UPDATE users SET role_id = ? WHERE id = ?",
        [role_id, req.params.id],
        (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Role updated"
            });
        }
    );
};
//Statistics par role 
exports.getUserStats = (req, res) => {

    db.query(`
        SELECT r.name AS role, COUNT(u.id) AS count
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.status = 2
        GROUP BY r.name
    `, (err, results) => {

        if (err) return res.status(500).json(err);

        res.json(results);
    });
};
// Gestion des images 
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/photos';

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1E9)
            + path.extname(file.originalname);

        cb(null, uniqueName);
    }
});
exports.getProfileImage = (req, res) => {
    const userId = req.params.userId;

    db.query(
        `SELECT file_path
         FROM user_files
         WHERE user_id = ?
         AND file_type = 'PHOTO'
         ORDER BY id DESC
         LIMIT 1`,
        [userId],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (!results.length) {
                return res.status(404).json({
                    success: false,
                    message: "No profile image found"
                });
            }

            const filePath = path.resolve(results[0].file_path);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    message: "Image file not found"
                });
            }

            return res.sendFile(filePath);
        }
    );
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const ext = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        if (ext) {
            return cb(null, true);
        }

        cb(new Error("Only images are allowed"));
    }
}).single('file');
exports.uploadProfileImage = (req, res) => {

    upload(req, res, (err) => {

        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const { user_id } = req.body;

        if (!req.file || !user_id) {
            return res.status(400).json({
                success: false,
                message: "Missing file or user_id"
            });
        }

        const filePath = `uploads/photos/${req.file.filename}`;

        db.query(
            `INSERT INTO user_files
            (user_id, file_type, file_path, original_name)
            VALUES (?, 'PHOTO', ?, ?)`,
            [
                user_id,
                filePath,
                req.file.originalname
            ],
            (err) => {

                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                res.json({
                    success: true,
                    message: "Profile image uploaded successfully",
                    file_path: filePath
                });
            }
        );
    });
};
// UPDATE USER STATUS (activate / archive)

exports.updateUserStatus = (req, res) => {
    const userId = req.params.id;
    const { status } = req.body;

    // sécurité simple
    if (![0, 1, 2].includes(Number(status))) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    db.query(
        "UPDATE users SET status = ? WHERE id = ?",
        [status, userId],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            let message = "Status updated";

            if (Number(status) === 2) {
                message = "Utilisateur activé";
            }

            if (Number(status) === 0) {
                message = "Utilisateur archivé";
            }

            if (Number(status) === 1) {
                message = "Utilisateur mis en attente";
            }

            res.json({
                success: true,
                message,
                data: {
                    id: userId,
                    status
                }
            });
        }
    );
};