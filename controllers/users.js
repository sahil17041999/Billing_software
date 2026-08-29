// controllers/users.js
// Full user management for multi-user billing software

const fs = require('fs');
const path = require('path');
const { User, Role, Company, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { PERMISSION_MODULES, DEFAULT_ROLE_PRESETS } = require('../config/permissions');

const AVATAR_UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  try { fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true }); } catch (e) {}
}

// ============================================================
// LIST USERS
// ============================================================
exports.getUsers = async (req, res) => {
  try {
    const companyId = req.session.companyId;

    const users = await User.findAll({
      where: { company_id: companyId },
      include: [
        { model: Role, as: 'role' },
        { model: Company, as: 'company' }
      ],
      order: [['created_at', 'DESC']]
    });

    const roles = await Role.findAll({ order: [['name', 'ASC']] });

    // Calculate user count per role
    const roleCounts = {};
    users.forEach(u => {
      const rName = u.role ? u.role.name : 'unassigned';
      roleCounts[rName] = (roleCounts[rName] || 0) + 1;
    });

    if (req.headers['accept'] && req.headers['accept'].includes('application/json')) {
      return res.json({ users, roles });
    }

    res.render('admin/users', {
      users,
      roles,
      roleCounts,
      permissionModules: PERMISSION_MODULES,
      defaultRolePresets: DEFAULT_ROLE_PRESETS,
      user: req.user,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });

  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// ============================================================
// CREATE USER (API - called from modal)
// ============================================================
exports.createUser = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const { username, email, first_name, last_name, phone, role_id, is_active } = req.body;

    // 1. Sanitize & Validate 10-digit Indian Mobile Number
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)' });
    }

    // 2. Strict Uniqueness Check: Only ONE user can register with a particular mobile number
    const existingPhone = await User.findOne({ where: { phone: cleanPhone } });
    if (existingPhone) {
      return res.status(400).json({ error: `Mobile number ${cleanPhone} is already registered. Duplicate mobile numbers are not allowed.` });
    }

    // 3. Email Uniqueness Check (if email provided)
    if (email && email.trim()) {
      const existingEmail = await User.findOne({ where: { email: email.trim() } });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email address already in use by another user' });
      }
    }

    // 4. Validate role belongs to system
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({ error: 'Invalid role selected' });
    }

    // 5. Determine unique username: default to mobile number or custom handle
    let finalUsername = (username || '').trim() || cleanPhone;
    const existingUsername = await User.findOne({ where: { username: finalUsername } });
    if (existingUsername) {
      finalUsername = cleanPhone;
      const checkAgain = await User.findOne({ where: { username: finalUsername } });
      if (checkAgain) {
        finalUsername = `user_${cleanPhone}`;
      }
    }

    // 6. Create user without requiring password
    const newUser = await User.create({
      company_id: companyId,
      username: finalUsername,
      email: email && email.trim() ? email.trim() : null,
      password_hash: null,
      first_name: first_name && first_name.trim() ? first_name.trim() : null,
      last_name: last_name && last_name.trim() ? last_name.trim() : null,
      phone: cleanPhone,
      role_id: parseInt(role_id),
      is_active: is_active !== undefined ? parseInt(is_active) : 1
    });

    const createdUser = await User.findByPk(newUser.id, {
      include: [{ model: Role, as: 'role' }]
    });

    return res.status(201).json({
      success: true,
      message: `User with mobile ${cleanPhone} registered successfully`,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        first_name: createdUser.first_name,
        last_name: createdUser.last_name,
        phone: createdUser.phone,
        role: createdUser.role ? createdUser.role.name : '',
        role_id: createdUser.role_id,
        is_active: createdUser.is_active,
        created_at: createdUser.created_at
      }
    });

  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
};

// ============================================================
// GET SINGLE USER (API)
// ============================================================
exports.getUser = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const userId = req.params.id;

    const user = await User.findOne({
      where: { id: userId, company_id: companyId },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      role_id: user.role_id,
      role: user.role ? user.role.name : '',
      is_active: user.is_active,
      last_login: user.last_login
    });

  } catch (error) {
    console.error('getUser error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// UPDATE USER (API - from modal)
// ============================================================
exports.updateUser = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const targetId = req.params.id;
    const { email, first_name, last_name, phone, role_id, is_active } = req.body;

    // Prevent non-admin from editing other admins
    const targetUser = await User.findOne({
      where: { id: targetId, company_id: companyId },
      include: [{ model: Role, as: 'role' }]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting the last admin
    if (targetUser.role && targetUser.role.name === 'admin') {
      const adminCount = await User.count({
        where: {
          company_id: companyId,
          is_active: 1
        },
        include: [{
          model: Role,
          as: 'role',
          where: { name: 'admin' },
          required: true
        }]
      });

      const newRole = await Role.findByPk(role_id);
      if (newRole && newRole.name !== 'admin' && adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot change role: at least one admin must remain active' });
      }
    }

    // Email uniqueness check
    if (email) {
      const existingEmail = await User.findOne({
        where: { email, id: { [Op.ne]: targetId } }
      });
      if (existingEmail) {
        return res.status(400).json({ error: 'Email address already in use by another user' });
      }
    }

    // Phone sanitization, Indian 10-digit validation, and uniqueness check
    let cleanPhone = (phone || '').toString().trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) cleanPhone = cleanPhone.substring(2);
    else if (cleanPhone.length > 10 && cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

    if (cleanPhone) {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)' });
      }
      const existingPhone = await User.findOne({
        where: { phone: cleanPhone, id: { [Op.ne]: targetId } }
      });
      if (existingPhone) {
        return res.status(400).json({ error: `Mobile number ${cleanPhone} is already in use by another user account` });
      }
    } else {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    await targetUser.update({
      email: email ? email.trim() : null,
      first_name: first_name ? first_name.trim() : null,
      last_name: last_name ? last_name.trim() : null,
      phone: cleanPhone,
      role_id: parseInt(role_id),
      is_active: is_active !== undefined ? parseInt(is_active) : targetUser.is_active
    });

    return res.json({
      success: true,
      message: `User "${targetUser.username}" updated successfully`
    });

  } catch (error) {
    console.error('updateUser error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

// ============================================================
// TOGGLE USER STATUS (activate / deactivate)
// ============================================================
exports.toggleStatus = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const targetId = req.params.id;

    // Prevent self-deactivation
    if (parseInt(targetId) === req.session.userId) {
      return res.status(400).json({ error: 'You cannot deactivate your own account' });
    }

    const targetUser = await User.findOne({
      where: { id: targetId, company_id: companyId },
      include: [{ model: Role, as: 'role' }]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating last admin
    if (targetUser.role && targetUser.role.name === 'admin' && targetUser.is_active) {
      const activeAdminCount = await User.count({
        where: { company_id: companyId, is_active: 1 },
        include: [{
          model: Role,
          as: 'role',
          where: { name: 'admin' },
          required: true
        }]
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last admin account' });
      }
    }

    const newStatus = targetUser.is_active ? 0 : 1;
    await targetUser.update({ is_active: newStatus });

    return res.json({
      success: true,
      is_active: newStatus,
      message: `User "${targetUser.username}" ${newStatus ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('toggleStatus error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// CHANGE USER PASSWORD (admin action)
// ============================================================
exports.changeUserPassword = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const targetId = req.params.id;
    const { new_password } = req.body;

    const targetUser = await User.findOne({
      where: { id: targetId, company_id: companyId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(new_password, salt);

    await User.update(
      { password_hash: hashed },
      { where: { id: targetId, company_id: companyId }, hooks: false }
    );

    return res.json({
      success: true,
      message: `Password for "${targetUser.username}" changed successfully`
    });

  } catch (error) {
    console.error('changeUserPassword error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// DELETE USER (soft delete - deactivate permanently)
// ============================================================
exports.deleteUser = async (req, res) => {
  try {
    const companyId = req.session.companyId;
    const targetId = req.params.id;

    if (parseInt(targetId) === req.session.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const targetUser = await User.findOne({
      where: { id: targetId, company_id: companyId },
      include: [{ model: Role, as: 'role' }]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting last admin
    if (targetUser.role && targetUser.role.name === 'admin') {
      const adminCount = await User.count({
        where: { company_id: companyId },
        include: [{
          model: Role,
          as: 'role',
          where: { name: 'admin' },
          required: true
        }]
      });

      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account' });
      }
    }

    await targetUser.destroy();

    return res.json({
      success: true,
      message: `User "${targetUser.username}" deleted successfully`
    });

  } catch (error) {
    console.error('deleteUser error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// OWN PROFILE - GET
// ============================================================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const profile = await User.findByPk(userId, {
      include: [
        { model: Role, as: 'role' },
        { model: Company, as: 'company' }
      ]
    });

    if (!profile) {
      return res.redirect('/admin/login');
    }

    res.render('admin/profile', {
      profile,
      user: req.user,
      successMessage: req.query.success || null,
      errorMessage: req.query.error || null
    });

  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).render('error', { error: error.message });
  }
};

// ============================================================
// OWN PROFILE - UPDATE
// ============================================================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { email, first_name, last_name, phone } = req.body;

    // Email uniqueness check
    if (email) {
      const existing = await User.findOne({
        where: { email, id: { [Op.ne]: userId } }
      });
      if (existing) {
        return res.status(400).json({ error: 'Email address already in use' });
      }
    }

    const currentUser = await User.findByPk(userId);
    await currentUser.update({
      email: email || null,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email,
        phone: currentUser.phone
      }
    });

  } catch (error) {
    console.error('updateProfile error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// OWN PROFILE - UPLOAD AVATAR
// ============================================================
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { avatarData, avatarUrl } = req.body;

    let savedPath = '';

    if (avatarData && avatarData.startsWith('data:image/')) {
      const matches = avatarData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ success: false, error: 'Invalid image format' });
      }

      let ext = matches[1].toLowerCase();
      if (ext === 'svg+xml') ext = 'svg';
      if (ext === 'jpeg') ext = 'jpg';

      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `user-avatar-${userId}-${Date.now()}.${ext}`;
      const fullPath = path.join(AVATAR_UPLOAD_DIR, filename);

      fs.writeFileSync(fullPath, buffer);
      savedPath = `/uploads/avatars/${filename}`;
    } else if (avatarUrl && (avatarUrl.startsWith('/') || avatarUrl.startsWith('http'))) {
      savedPath = avatarUrl.trim();
    } else {
      return res.status(400).json({ success: false, error: 'Please provide a valid image file.' });
    }

    const user = await User.findByPk(userId);
    if (user) {
      // Clean up previous custom avatar file if present
      if (user.avatar && user.avatar.startsWith('/uploads/avatars/')) {
        const oldFile = path.join(__dirname, '..', 'public', user.avatar);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) { /* ignore */ }
        }
      }
      await user.update({ avatar: savedPath });
    }

    return res.json({
      success: true,
      avatar: savedPath,
      message: 'Profile photo updated successfully!'
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// OWN PROFILE - REMOVE AVATAR
// ============================================================
exports.removeAvatar = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findByPk(userId);

    if (user && user.avatar) {
      if (user.avatar.startsWith('/uploads/avatars/')) {
        const oldFile = path.join(__dirname, '..', 'public', user.avatar);
        if (fs.existsSync(oldFile)) {
          try { fs.unlinkSync(oldFile); } catch (e) { /* ignore */ }
        }
      }
      await user.update({ avatar: null });
    }

    return res.json({
      success: true,
      message: 'Profile photo removed successfully.'
    });
  } catch (error) {
    console.error('Error removing avatar:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// CHANGE OWN PASSWORD
// ============================================================
exports.changeOwnPassword = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { current_password, new_password } = req.body;

    const currentUser = await User.findByPk(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = await currentUser.verifyPassword(current_password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(new_password, salt);

    await User.update(
      { password_hash: hashed },
      { where: { id: userId }, hooks: false }
    );

    return res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('changeOwnPassword error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET ROLES (for dropdowns and role management)
// ============================================================
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    return res.json({ roles });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// GET SINGLE ROLE & ITS PERMISSIONS
// ============================================================
exports.getRolePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    return res.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions || []
      },
      permissionModules: PERMISSION_MODULES,
      defaultPresets: DEFAULT_ROLE_PRESETS
    });
  } catch (error) {
    console.error('getRolePermissions error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// UPDATE ROLE PRIVILEGES / PERMISSIONS
// ============================================================
exports.updateRolePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { permissions, description } = req.body;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    let finalPermissions = Array.isArray(permissions) ? permissions : [];
    
    // Protect admin role from being locked out
    if (role.name.toLowerCase() === 'admin' && !finalPermissions.includes('*')) {
      finalPermissions.push('*');
    }

    const updatePayload = { permissions: finalPermissions };
    if (description !== undefined) {
      updatePayload.description = description;
    }

    await role.update(updatePayload);

    return res.json({
      success: true,
      message: `Privileges for role "${role.name}" updated successfully`,
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions
      }
    });
  } catch (error) {
    console.error('updateRolePermissions error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// CREATE NEW CUSTOM ROLE
// ============================================================
exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const cleanName = (name || '').trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const existingRole = await Role.findOne({ where: { name: cleanName } });
    if (existingRole) {
      return res.status(400).json({ error: `Role "${cleanName}" already exists` });
    }

    const finalPermissions = Array.isArray(permissions) ? permissions : ['dashboard.view'];

    const newRole = await Role.create({
      name: cleanName,
      description: description || null,
      permissions: finalPermissions,
      is_active: 1
    });

    return res.status(201).json({
      success: true,
      message: `Role "${cleanName}" created successfully with assigned privileges`,
      role: newRole
    });
  } catch (error) {
    console.error('createRole error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// DELETE CUSTOM ROLE
// ============================================================
exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const systemRoles = ['admin', 'manager', 'cashier', 'accountant', 'warehouse'];
    if (systemRoles.includes(role.name.toLowerCase())) {
      return res.status(400).json({ error: `Cannot delete built-in system role "${role.name}"` });
    }

    const usersWithRole = await User.count({ where: { role_id: roleId } });
    if (usersWithRole > 0) {
      return res.status(400).json({
        error: `Cannot delete role "${role.name}". It is assigned to ${usersWithRole} user(s). Reassign them first.`
      });
    }

    await role.destroy();

    return res.json({
      success: true,
      message: `Role "${role.name}" deleted successfully`
    });
  } catch (error) {
    console.error('deleteRole error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ============================================================
// REALTIME DUPLICATE CHECK FOR USERS (Phone / Email / Username)
// ============================================================
exports.checkDuplicate = async (req, res) => {
  try {
    const q = req.query || {};
    const b = req.body || {};
    const field = (q.field || b.field || '').toLowerCase().trim();
    const id = q.id || b.id || null;

    let value = q.value !== undefined ? q.value : b.value;
    if (value === undefined && field && q[field] !== undefined) {
      value = q[field];
    } else if (value === undefined && field && b[field] !== undefined) {
      value = b[field];
    }

    if (!value || String(value).trim() === '') return res.json(true);
    let cleanVal = String(value).trim();

    if (field === 'phone') {
      cleanVal = cleanVal.replace(/[^0-9]/g, '');
      if (cleanVal.length > 10 && cleanVal.startsWith('91')) cleanVal = cleanVal.substring(2);
      else if (cleanVal.length > 10 && cleanVal.startsWith('0')) cleanVal = cleanVal.substring(1);
      if (!cleanVal) return res.json(true);

      const where = { phone: cleanVal };
      if (id) where.id = { [Op.ne]: id };
      const exists = await User.findOne({ where });
      if (exists) {
        return res.json(`Mobile number "${cleanVal}" is already registered.`);
      }
    } else if (field === 'email') {
      const where = {
        email: { [Op.like]: cleanVal }
      };
      if (id) where.id = { [Op.ne]: id };
      const exists = await User.findOne({ where });
      if (exists) {
        return res.json(`Email address "${cleanVal}" is already in use.`);
      }
    } else if (field === 'username') {
      const where = {
        username: { [Op.like]: cleanVal }
      };
      if (id) where.id = { [Op.ne]: id };
      const exists = await User.findOne({ where });
      if (exists) {
        return res.json(`Username "${cleanVal}" is already taken.`);
      }
    }

    return res.json(true);
  } catch (err) {
    console.error('User checkDuplicate error:', err);
    return res.json(true);
  }
};

