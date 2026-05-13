const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');

// routes users
router.get('/', usersController.getAllUsers);
router.post('/', usersController.createUser);
router.delete('/:id', usersController.deleteUser);
router.put('/:id', usersController.updateUser);
router.get('/stats', usersController.getUserStats);

module.exports = router;