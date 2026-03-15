const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const isDev = process.env.NODE_ENV !== 'production';

const normalizeAccountType = (raw) => {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'developer' || value === 'company') {
    return value;
  }
  return '';
};

const deriveAccountTypeAndUserType = ({ accountType, userType }) => {
  const normalizedAccountType = normalizeAccountType(accountType);
  const normalizedUserType = String(userType || '').trim().toLowerCase();

  if (normalizedAccountType === 'developer') {
    return { accountType: 'developer', userType: 'employee' };
  }
  if (normalizedAccountType === 'company') {
    return { accountType: 'company', userType: 'company' };
  }
  if (normalizedUserType === 'employee') {
    return { accountType: 'developer', userType: 'employee' };
  }
  if (normalizedUserType === 'company') {
    return { accountType: 'company', userType: 'company' };
  }
  return { accountType: '', userType: '' };
};

const serializeUser = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  type: user.user_type,
  accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
  isPremium: user.is_premium,
  profileCompleted: Boolean(user.profile_completed),

  bio: user.bio || '',
  socials: user.socials || '',
  profileImage: user.profile_image || '',
  phone: user.phone || '',
  address: user.address || '',

  name: user.name || '',
  education: user.education || '',
  vocationalCourse: user.vocational_course || '',
  desiredJob: user.desired_job || '',
  birthday: user.birthday ? new Date(user.birthday).toISOString().slice(0, 10) : '',
  age: user.age == null ? '' : String(user.age),
  sex: user.sex || '',

  companyName: user.company_name || '',
  industry: user.industry || '',
  companySize: user.company_size || '',
  website: user.website || '',
  hiringFor: user.hiring_for || '',
});

const computeProfileCompleted = (userType, merged, accountType) => {
  const resolvedAccountType = String(accountType || merged?.account_type || '').trim().toLowerCase();

  if (resolvedAccountType === 'company' || userType === 'company') {
    return Boolean(
      String(merged.company_name || '').trim() &&
        String(merged.address || '').trim() &&
        String(merged.industry || '').trim() &&
        String(merged.company_size || '').trim() &&
        String(merged.email || '').trim()
    );
  }

  return Boolean(
    String(merged.name || '').trim() &&
      String(merged.username || '').trim() &&
      String(merged.address || '').trim() &&
      String(merged.education || '').trim() &&
      String(merged.desired_job || '').trim() &&
      String(merged.phone || '').trim() &&
      String(merged.email || '').trim()
  );
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      username: user.username,
      userType: user.user_type,
      accountType: user.account_type || (user.user_type === 'company' ? 'company' : 'developer'),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    const { username, email, password, userType, accountType } = req.body;
    const derived = deriveAccountTypeAndUserType({ accountType, userType });
    if (!derived.userType || !derived.accountType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account type',
      });
    }

    // Check if user already exists
    const userExists = await client.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (userExists.rows.length > 0) {
      const existingUser = userExists.rows[0];
      if (existingUser.email === email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already registered' 
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (id, username, email, password, user_type, account_type) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [crypto.randomUUID(), username, email, hashedPassword, derived.userType, derived.accountType]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    const { email, password } = req.body;

    // Find user by email
    const result = await client.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user);

    const computedProfileCompleted = computeProfileCompleted(user.user_type, user, user.account_type);
    if (computedProfileCompleted !== Boolean(user.profile_completed)) {
      try {
        await client.query('UPDATE users SET profile_completed = $1 WHERE id = $2', [computedProfileCompleted, user.id]);
        user.profile_completed = computedProfileCompleted;
      } catch (error) {
        console.error('Failed to persist profile_completed on login:', error);
      }
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  let client;
  
  try {
    client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = result.rows[0];
    const computedProfileCompleted = computeProfileCompleted(user.user_type, user, user.account_type);
    if (computedProfileCompleted !== Boolean(user.profile_completed)) {
      try {
        const updated = await client.query('UPDATE users SET profile_completed = $1 WHERE id = $2 RETURNING *', [
          computedProfileCompleted,
          req.user.id,
        ]);
        if (updated.rows.length) {
          return res.json({
            success: true,
            user: serializeUser(updated.rows[0]),
          });
        }
      } catch (error) {
        console.error('Failed to persist profile_completed on /me:', error);
      }
    }

    res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Get public profile by user id
// @route   GET /api/auth/profile/:id
// @access  Private
const getPublicProfile = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const { id } = req.params;

    const result = await client.query(
      `SELECT id, username, email, user_type, is_premium, created_at,
              profile_completed, bio, socials, profile_image, address,
              education, desired_job, company_name, industry, company_size, website, hiring_for
       FROM users
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    return res.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        email: user.email,
        type: user.user_type,
        isPremium: user.is_premium,
        profileCompleted: Boolean(user.profile_completed),
        bio: user.bio || '',
        socials: user.socials || '',
        profileImage: user.profile_image || '',
        address: user.address || '',
        education: user.education || '',
        desiredJob: user.desired_job || '',
        companyName: user.company_name || '',
        industry: user.industry || '',
        companySize: user.company_size || '',
        website: user.website || '',
        hiringFor: user.hiring_for || '',
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Search users and companies
// @route   GET /api/auth/search?q=...
// @access  Private
const searchUsers = async (req, res) => {
  let client;

  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ success: true, results: [] });
    }

    client = await pool.connect();
    const searchPattern = `%${query}%`;

    const result = await client.query(
      `SELECT id, username, email, user_type, is_premium, profile_completed, profile_image
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1)
         AND id <> $2
       ORDER BY
         CASE
           WHEN username ILIKE $3 THEN 0
           WHEN email ILIKE $3 THEN 1
           ELSE 2
         END,
         username ASC
       LIMIT 12`,
      [searchPattern, req.user.id, `${query}%`]
    );

    const results = result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      type: row.user_type,
      isPremium: row.is_premium,
      profileCompleted: Boolean(row.profile_completed),
      profileImage: row.profile_image || '',
    }));

    return res.json({ success: true, results });
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during search',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// @desc    Update current user's profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateMyProfile = async (req, res) => {
  let client;

  try {
    client = await pool.connect();
    const currentResult = await client.query('SELECT * FROM users WHERE id = $1', [req.user.id]);

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const current = currentResult.rows[0];
    const updates = req.body || {};

    const fieldMap = {
      username: 'username',
      bio: 'bio',
      socials: 'socials',
      profileImage: 'profile_image',
      phone: 'phone',
      address: 'address',

      name: 'name',
      education: 'education',
      vocationalCourse: 'vocational_course',
      desiredJob: 'desired_job',
      birthday: 'birthday',
      age: 'age',
      sex: 'sex',

      companyName: 'company_name',
      industry: 'industry',
      companySize: 'company_size',
      website: 'website',
      hiringFor: 'hiring_for',
    };

    const sanitized = {};
    for (const [key, column] of Object.entries(fieldMap)) {
      if (Object.prototype.hasOwnProperty.call(updates, key)) {
        sanitized[column] = updates[key];
      }
    }

    const merged = { ...current, ...sanitized };
    const profileCompleted = computeProfileCompleted(current.user_type, merged, current.account_type);
    sanitized.profile_completed = profileCompleted;

    const columns = Object.keys(sanitized);
    if (columns.length === 0) {
      return res.json({ success: true, user: serializeUser(current) });
    }

    const sets = columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ');
    const values = columns.map((col) => sanitized[col]);

    if (sanitized.age != null && sanitized.age !== '') {
      const age = Number(sanitized.age);
      sanitized.age = Number.isFinite(age) ? Math.trunc(age) : null;
      values[columns.indexOf('age')] = sanitized.age;
    }

    const birthdayIndex = columns.indexOf('birthday');
    if (birthdayIndex >= 0) {
      const b = sanitized.birthday;
      values[birthdayIndex] = b ? b : null;
    }

    const result = await client.query(
      `UPDATE users SET ${sets} WHERE id = $${columns.length + 1} RETURNING *`,
      [...values, req.user.id]
    );

    return res.json({ success: true, user: serializeUser(result.rows[0]) });
  } catch (error) {
    if (String(error?.code) === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      ...(isDev
        ? {
            errorDetail: error?.message || String(error),
            errorCode: error?.code || '',
          }
        : {}),
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  searchUsers,
  getPublicProfile,
  updateMyProfile,
};
