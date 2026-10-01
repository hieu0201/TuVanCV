const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'smartrecruit_super_secret_jwt_key_2026';

/**
 * Middleware bảo vệ route yêu cầu đăng nhập
 */
async function protect(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để truy cập tính năng này' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Nếu có MongoDB, nạp user mới nhất
    try {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (dbErr) {
      // Tiếp tục dùng decoded payload nếu DB chưa sẵn sàng
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/**
 * Middleware phân quyền Admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Truy cập bị từ chối. Chỉ dành cho Quản Trị Viên (Admin).' });
  }
  next();
}

/**
 * Middleware phân quyền Recruiter hoặc Admin
 */
function requireRecruiter(req, res, next) {
  if (!req.user || (req.user.role !== 'recruiter' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Chức năng này dành cho Nhà Tuyển Dụng hoặc Quản Trị Viên.' });
  }
  next();
}

module.exports = {
  protect,
  requireAdmin,
  requireRecruiter
};
