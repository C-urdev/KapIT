const jwt = require('jsonwebtoken');

const normalizeDecodedUser = (decoded) => {
  const normalizedUserType = String(decoded?.userType || decoded?.type || '').trim().toLowerCase();
  const normalizedAccountType = String(
    decoded?.accountType || (normalizedUserType === 'company' ? 'company' : normalizedUserType === 'employee' ? 'developer' : '')
  )
    .trim()
    .toLowerCase();

  return {
    ...decoded,
    userType: normalizedUserType,
    accountType: normalizedAccountType,
  };
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Access denied.' 
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = normalizeDecodedUser(jwt.verify(token, process.env.JWT_SECRET));
    
    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token. Access denied.' 
    });
  }
};

module.exports = { verifyToken };
