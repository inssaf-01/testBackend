const express = require('express');
const router = express.Router();
const multer = require('multer');

const usersController = require('../controllers/users.controller');

// routes users
router.get('/', usersController.getAllUsers);
router.get('/roles', usersController.getAllRoles);
router.post('/', usersController.createUser);
router.delete('/:id', usersController.deleteUser);
router.put('/:id', usersController.updateUser);
router.get('/stats', usersController.getUserStats);
router.get('/profile-image/:userId', usersController.getProfileImage);
router.post('/upload-profile-image', usersController.uploadProfileImage);
router.patch('/:id/status', (req, res, next) => { next();}, usersController.updateUserStatus);

module.exports = router;