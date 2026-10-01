const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'smartrecruit_super_secret_jwt_key_2026';

// In-memory fallback trong trường hợp chưa bật MongoDB
let fallbackUsers = [
  {
    id: 'usr-admin-hieu',
    _id: 'usr-admin-hieu',
    fullName: 'Huỳnh Văn Hiếu',
    email: 'huynhvanhieu020104@gmail.com',
    passwordHash: bcrypt.hashSync('123456', 8),
    role: 'admin',
    title: 'Super Administrator',
    experienceYears: '5+ năm kinh nghiệm',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '6ab697bbd9132bc58165d515',
    _id: '6ab697bbd9132bc58165d515',
    fullName: 'Dương Hoàng Yến',
    email: 'duonghoangyen1427@gmail.com',
    passwordHash: bcrypt.hashSync('123456', 8),
    role: 'recruiter',
    companyName: 'FPT Software',
    companyWebsite: 'https://fptsoftware.com/',
    title: 'Senior Talent Acquisition Manager @ FPT Software',
    experienceYears: '5+ năm kinh nghiệm (Senior / Leader)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DuongHoangYenRecruiter',
    isEmailVerified: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Sinh mã OTP ngẫu nhiên 6 chữ số
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Đăng ký tài khoản mới kèm gửi mã OTP qua Email
 */
async function register(req, res) {
  try {
    const { fullName, email, password, role = 'candidate', title = '', experienceYears = '', companyName = '' } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu' });
    }

    if (role === 'recruiter' && (!companyName || !companyName.trim())) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Tên công ty / Doanh nghiệp khi đăng ký tài khoản Nhà tuyển dụng' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

    try {
      // 1. Kiểm tra tồn tại trên MongoDB
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new User({
        fullName,
        email: normalizedEmail,
        passwordHash,
        role: normalizedEmail === 'huynhvanhieu020104@gmail.com' ? 'admin' : (['candidate', 'recruiter', 'admin'].includes(role) ? role : 'candidate'),
        title: title || (normalizedEmail === 'huynhvanhieu020104@gmail.com' ? 'Super Administrator' : (role === 'recruiter' ? 'Nhà Tuyển Dụng' : 'Ứng Viên')),
        experienceYears: experienceYears || 'Chưa cập nhật',
        companyName: role === 'recruiter' ? companyName.trim() : '',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
        isEmailVerified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires
      });

      await newUser.save();

      // Gửi email OTP
      await sendOtpEmail(normalizedEmail, otp, fullName);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công! Vui lòng nhập mã OTP đã gửi đến email của bạn.',
        requireOtp: true,
        email: normalizedEmail
      });
    } catch (dbErr) {
      // Fallback nếu DB chưa kết nối
      const exist = fallbackUsers.find(u => u.email === normalizedEmail);
      if (exist) {
        return res.status(400).json({ success: false, message: 'Email này đã tồn tại trong hệ thống' });
      }

      const fbUser = {
        id: `usr-${Date.now()}`,
        _id: `usr-${Date.now()}`,
        fullName,
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(password, 8),
        role: normalizedEmail === 'huynhvanhieu020104@gmail.com' ? 'admin' : role,
        title: title || (normalizedEmail === 'huynhvanhieu020104@gmail.com' ? 'Super Administrator' : 'Thành viên mới'),
        experienceYears: experienceYears || 'Chưa cập nhật',
        companyName: role === 'recruiter' ? companyName.trim() : '',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fullName)}`,
        isEmailVerified: false,
        emailOtp: otp,
        emailOtpExpires: otpExpires,
        createdAt: new Date().toISOString()
      };
      fallbackUsers.push(fbUser);
      await sendOtpEmail(normalizedEmail, otp, fullName);

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công! Vui lòng nhập mã OTP xác thực email.',
        requireOtp: true,
        email: normalizedEmail
      });
    }
  } catch (error) {
    console.error('Lỗi register:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
  }
}

/**
 * Xác thực tài khoản bằng mã OTP
 */
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mã OTP' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
      }

      if (user.isEmailVerified) {
        return res.status(200).json({ success: true, message: 'Tài khoản đã được xác thực trước đó. Bạn có thể đăng nhập ngay!' });
      }

      if (user.emailOtp !== otp.trim()) {
        return res.status(400).json({ success: false, message: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' });
      }

      if (user.emailOtpExpires && new Date() > user.emailOtpExpires) {
        return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã.' });
      }

      user.isEmailVerified = true;
      user.emailOtp = null;
      user.emailOtpExpires = null;
      await user.save();

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Xác thực email thành công! Chào mừng bạn đến với SmartRecruit AI.',
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          title: user.title,
          avatar: user.avatar,
          isEmailVerified: true
        }
      });
    } catch (dbErr) {
      // Fallback
      const fbUser = fallbackUsers.find(u => u.email === normalizedEmail);
      if (!fbUser) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      if (fbUser.emailOtp !== otp.trim()) return res.status(400).json({ success: false, message: 'Mã OTP không chính xác' });

      fbUser.isEmailVerified = true;
      fbUser.emailOtp = null;

      const token = jwt.sign(
        { id: fbUser.id, email: fbUser.email, role: fbUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Xác thực email thành công!',
        token,
        user: {
          id: fbUser.id,
          fullName: fbUser.fullName,
          email: fbUser.email,
          role: fbUser.role,
          title: fbUser.title,
          avatar: fbUser.avatar,
          isEmailVerified: true
        }
      });
    }
  } catch (error) {
    console.error('Lỗi verifyOtp:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi xác thực OTP' });
  }
}

/**
 * Gửi lại mã OTP
 */
async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email' });

    const normalizedEmail = email.toLowerCase().trim();
    const newOtp = generateOTP();
    const newExpires = new Date(Date.now() + 10 * 60 * 1000);

    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

      user.emailOtp = newOtp;
      user.emailOtpExpires = newExpires;
      await user.save();

      await sendOtpEmail(normalizedEmail, newOtp, user.fullName);
      return res.json({ success: true, message: 'Mã OTP mới đã được gửi tới hộp thư của bạn.' });
    } catch (dbErr) {
      const fbUser = fallbackUsers.find(u => u.email === normalizedEmail);
      if (!fbUser) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      fbUser.emailOtp = newOtp;
      fbUser.emailOtpExpires = newExpires;
      await sendOtpEmail(normalizedEmail, newOtp, fbUser.fullName);
      return res.json({ success: true, message: 'Mã OTP mới đã được gửi lại.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi gửi lại OTP' });
  }
}

/**
 * Yêu cầu đặt lại mật khẩu qua email
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email của bạn' });

    const normalizedEmail = email.toLowerCase().trim();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

    try {
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        // Bảo mật: Không thông báo user không tồn tại để tránh rà quét email
        return res.json({ success: true, message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong ít phút.' });
      }

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      await sendPasswordResetEmail(normalizedEmail, resetToken, user.fullName);
      return res.json({ success: true, message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.' });
    } catch (dbErr) {
      const fbUser = fallbackUsers.find(u => u.email === normalizedEmail);
      if (fbUser) {
        fbUser.resetPasswordToken = resetToken;
        fbUser.resetPasswordExpires = resetExpires;
        await sendPasswordResetEmail(normalizedEmail, resetToken, fbUser.fullName);
      }
      return res.json({ success: true, message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi yêu cầu quên mật khẩu' });
  }
}

/**
 * Đặt lại mật khẩu với token
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Thiếu mã xác nhận hoặc mật khẩu mới' });
    }

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.json({ success: true, message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' });
    } catch (dbErr) {
      const fbUser = fallbackUsers.find(u => u.resetPasswordToken === token);
      if (!fbUser) return res.status(400).json({ success: false, message: 'Liên kết không hợp lệ' });

      fbUser.passwordHash = bcrypt.hashSync(newPassword, 8);
      fbUser.resetPasswordToken = null;
      return res.json({ success: true, message: 'Đặt lại mật khẩu thành công!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đặt lại mật khẩu' });
  }
}

/**
 * Đăng nhập tài khoản
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập Email và Mật khẩu' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Tìm user trong MongoDB
      const user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
        }

        // BẮT BUỘC: Kiểm tra trạng thái xác thực Email / OTP
        if (!user.isEmailVerified) {
          return res.status(403).json({
            success: false,
            requireOtp: true,
            email: user.email,
            message: 'Tài khoản chưa được xác thực email. Vui lòng nhập mã OTP để kích hoạt tài khoản!'
          });
        }

        const token = jwt.sign(
          { id: user._id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          message: 'Đăng nhập thành công!',
          token,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            title: user.title,
            experienceYears: user.experienceYears || user.title || 'Chưa cập nhật',
            companyName: user.companyName || '',
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          }
        });
      }
    } catch (dbErr) {
      console.warn('[DB Query Warning in Login]:', dbErr.message);
    }

    // 2. Kiểm tra fallback users
    const fallbackUser = fallbackUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (fallbackUser) {
      const isMatch = bcrypt.compareSync(password, fallbackUser.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      if (!fallbackUser.isEmailVerified) {
        return res.status(403).json({
          success: false,
          requireOtp: true,
          email: fallbackUser.email,
          message: 'Tài khoản chưa được xác thực email. Vui lòng nhập mã OTP để kích hoạt tài khoản!'
        });
      }

      const token = jwt.sign(
        { id: fallbackUser._id || fallbackUser.id, email: fallbackUser.email, role: fallbackUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: fallbackUser._id || fallbackUser.id,
          fullName: fallbackUser.fullName,
          email: fallbackUser.email,
          role: fallbackUser.role,
          title: fallbackUser.title,
          experienceYears: fallbackUser.experienceYears || fallbackUser.title || 'Chưa cập nhật',
          companyName: fallbackUser.companyName || '',
          avatar: fallbackUser.avatar,
          isEmailVerified: fallbackUser.isEmailVerified || false
        }
      });
    }

    return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
  } catch (error) {
    console.error('Lỗi login:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
}

/**
 * Lấy thông tin user hiện tại
 */
async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc token thiếu' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    try {
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        return res.json({
          success: true,
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            title: user.title,
            experienceYears: user.experienceYears || user.title || 'Chưa cập nhật',
            companyName: user.companyName || '',
            companyWebsite: user.companyWebsite || '',
            phone: user.phone || '',
            bio: user.bio || '',
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          }
        });
      }
    } catch (dbErr) {}

    const fbUser = fallbackUsers.find(u => (u.id === decoded.id || u._id === decoded.id));
    if (!fbUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.json({
      success: true,
      user: {
        id: fbUser._id || fbUser.id,
        fullName: fbUser.fullName,
        email: fbUser.email,
        role: fbUser.role,
        title: fbUser.title,
        experienceYears: fbUser.experienceYears || fbUser.title || 'Chưa cập nhật',
        phone: fbUser.phone || '',
        avatar: fbUser.avatar,
        bio: fbUser.bio || '',
        companyName: fbUser.companyName || '',
        companyWebsite: fbUser.companyWebsite || '',
        skills: fbUser.skills || [],
        isEmailVerified: fbUser.isEmailVerified || false
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/**
 * Cập nhật thông tin cá nhân theo từng Role (Ứng viên / Tuyển dụng / Admin)
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { 
      fullName, phone, title, experienceYears, bio, 
      companyName, companyWebsite, skills, 
      portfolioUrl, avatar 
    } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

      if (fullName) user.fullName = fullName;
      if (phone !== undefined) user.phone = phone;
      if (title !== undefined) user.title = title;
      if (experienceYears !== undefined) user.experienceYears = experienceYears;
      if (bio !== undefined) user.bio = bio;
      if (companyName !== undefined) user.companyName = companyName;
      if (companyWebsite !== undefined) user.companyWebsite = companyWebsite;
      if (avatar !== undefined) user.avatar = avatar;
      if (portfolioUrl !== undefined) user.portfolioUrl = portfolioUrl;
      if (skills !== undefined) {
        user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      await user.save();

      return res.json({
        success: true,
        message: 'Cập nhật thông tin cá nhân thành công!',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          title: user.title,
          experienceYears: user.experienceYears || user.title || 'Chưa cập nhật',
          phone: user.phone,
          avatar: user.avatar,
          bio: user.bio,
          companyName: user.companyName,
          companyWebsite: user.companyWebsite,
          skills: user.skills,
          portfolioUrl: user.portfolioUrl,
          isEmailVerified: user.isEmailVerified
        }
      });
    } catch (dbErr) {
      const fbUser = fallbackUsers.find(u => (u.id === userId || u._id === userId));
      if (fbUser) {
        if (fullName) fbUser.fullName = fullName;
        if (phone !== undefined) fbUser.phone = phone;
        if (title !== undefined) fbUser.title = title;
        if (experienceYears !== undefined) fbUser.experienceYears = experienceYears;
        if (bio !== undefined) fbUser.bio = bio;
        if (companyName !== undefined) fbUser.companyName = companyName;
        if (companyWebsite !== undefined) fbUser.companyWebsite = companyWebsite;
        if (avatar !== undefined) fbUser.avatar = avatar;
        return res.json({
          success: true,
          message: 'Cập nhật thông tin thành công!',
          user: fbUser
        });
      }
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }
  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật hồ sơ' });
  }
}

/**
 * Đổi mật khẩu tài khoản
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' });
    }

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      await user.save();

      return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (dbErr) {
      const fbUser = fallbackUsers.find(u => (u.id === userId || u._id === userId));
      if (!fbUser) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });

      const isMatch = bcrypt.compareSync(currentPassword, fbUser.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
      }
      fbUser.passwordHash = bcrypt.hashSync(newPassword, 8);
      return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu' });
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  updateProfile,
  changePassword,
  fallbackUsers
};
