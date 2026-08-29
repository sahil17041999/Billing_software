// routes/users.js
// User & Role Privilege management routes - Admin only for administrative actions

const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// All user routes require authentication
router.use(isAuthenticated);

// ── Profile (any logged-in user) ────────────────────────────
router.get('/profile', usersController.getProfile);
router.post('/profile', usersController.updateProfile);
router.post('/profile/avatar', usersController.uploadAvatar);
router.delete('/profile/avatar', usersController.removeAvatar);
router.post('/profile/password', validate(schemas.changeOwnPassword), usersController.changeOwnPassword);

// ── User List (admin only) ───────────────────────────────────
router.get('/', isAdmin, usersController.getUsers);

// ── Roles & Privileges (admin only - must be defined before /:id) ─
router.get('/roles', isAdmin, usersController.getRoles);
router.post('/roles', isAdmin, usersController.createRole);
router.get('/roles/:id/permissions', isAdmin, usersController.getRolePermissions);
router.put('/roles/:id/permissions', isAdmin, usersController.updateRolePermissions);
router.delete('/roles/:id', isAdmin, usersController.deleteRole);

// ── Create User ─────────────────────────────────────────────
router.post('/', isAdmin, validate(schemas.createUser), usersController.createUser);

// ── Get single user ─────────────────────────────────────────
router.get('/:id', isAdmin, usersController.getUser);

// ── Update User ─────────────────────────────────────────────
router.put('/:id', isAdmin, validate(schemas.editUser), usersController.updateUser);

// ── Toggle active / inactive ────────────────────────────────
router.patch('/:id/toggle-status', isAdmin, usersController.toggleStatus);

// ── Change user password (admin resets) ─────────────────────
router.post('/:id/change-password', isAdmin, validate(schemas.changePassword), usersController.changeUserPassword);

// ── Delete user ─────────────────────────────────────────────
router.delete('/:id', isAdmin, usersController.deleteUser);

module.exports = router;
