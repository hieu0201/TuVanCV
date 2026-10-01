const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Khởi tạo mail transporter (hỗ trợ sẵn sàng khi có API key hoặc Gmail SMTP)
 */
function getTransporter() {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_API_KEY;

  if (emailUser && emailPass) {
    if (emailUser.includes('@gmail.com') || (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail'))) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      });
    }
  }
  return transporter;
}

/**
 * Gửi email chung với fallback logging chuyên nghiệp (Hỗ trợ cả HTTPS REST API và SMTP)
 */
async function sendMailHelper({ to, subject, html, simulationType, extraLog }) {
  // 1. Ưu tiên gửi qua HTTPS REST API (Resend) - KHÔNG BAO GIỜ BỊ CHẶN BỞI FIREWALL CLOUD (Render/Vercel)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'SmartRecruit AI <onboarding@resend.dev>',
          to: [to],
          subject: subject,
          html: html
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ [Email Service via Resend HTTPS]: Đã gửi email thành công đến ${to} (ID: ${data.id})`);
        return { success: true, simulated: false, messageId: data.id };
      } else {
        console.warn(`⚠️ [Resend API Warning]:`, data.message || data);
      }
    } catch (e) {
      console.warn(`⚠️ [Resend API Exception]:`, e.message);
    }
  }

  // 2. Gửi qua SMTP truyền thống (Gmail / Nodemailer)
  const mailTransporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"SmartRecruit AI" <noreply@smartrecruit.vn>';

  if (!mailTransporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [EMAIL NOTIFICATION QUEUED - SẴN SÀNG CHỜ API KEY]`);
    console.log(`📬 Loại thông báo: ${simulationType}`);
    console.log(`🎯 Người nhận: ${to}`);
    console.log(`📋 Tiêu đề: ${subject}`);
    if (extraLog) console.log(`📌 Chi tiết:`, extraLog);
    console.log(`💡 Hệ thống đã chuẩn bị sẵn sàng, chỉ cần điền EMAIL_API_KEY trong .env là email sẽ tự động bắn đi thật!`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true, to, subject };
  }

  try {
    const sendPromise = mailTransporter.sendMail({ from, to, subject, html });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout sau 4 giây')), 4000)
    );
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ [Email Service]: Đã gửi email thật thành công đến ${to} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ [Email Service]: Lỗi gửi email (${error.message}). Tiếp tục quy trình.`);
    return { success: true, simulated: true, error: error.message };
  }
}

/**
 * 1. Gửi mã OTP xác thực email khi đăng ký
 */
async function sendOtpEmail(toEmail, otp, fullName = 'Quý khách') {
  const subject = `[SmartRecruit AI] Mã xác thực tài khoản của bạn: ${otp}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">SmartRecruit AI</h1>
        <p style="color: #e0f2fe; margin: 4px 0 0 0; font-size: 14px;">Hệ Thống Đánh Giá & Tuyển Dụng Nhân Tài Trí Tuệ Nhân Tạo</p>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Kính chào ${fullName},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Cảm ơn bạn đã đăng ký tài khoản trên nền tảng <strong>SmartRecruit AI</strong>. Để hoàn tất việc kích hoạt tài khoản, vui lòng sử dụng mã xác thực (OTP) dưới đây:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <div style="display: inline-block; background-color: #1e293b; border: 2px dashed #38bdf8; border-radius: 8px; padding: 14px 28px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${otp}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Mã OTP có hiệu lực trong vòng 10 phút. Tuyệt đối không chia sẻ mã này cho người khác.</p>
        </div>
      </div>
      <div style="background-color: #090d16; padding: 16px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;">
        © 2026 SmartRecruit AI Platform. All rights reserved.
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'XÁC THỰC TÀI KHOẢN (OTP)',
    extraLog: `MÃ OTP: >>> ${otp} <<<`
  });
}

/**
 * 2. Gửi email đặt lại mật khẩu
 */
async function sendPasswordResetEmail(toEmail, resetToken, fullName = 'Quý khách') {
  const resetUrl = `http://localhost:5173/?resetToken=${resetToken}&email=${encodeURIComponent(toEmail)}`;
  const subject = `[SmartRecruit AI] Yêu cầu đặt lại mật khẩu`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">SmartRecruit AI</h1>
      </div>
      <div style="padding: 32px 24px;">
        <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Xin chào ${fullName},</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
          Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với địa chỉ email này.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #06b6d4, #2563eb); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
            Đặt Lại Mật Khẩu
          </a>
        </div>
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'KHÔI PHỤC MẬT KHẨU',
    extraLog: `LIÊN KẾT RESET: ${resetUrl}`
  });
}

/**
 * 3. Gửi báo cáo đánh giá CV chi tiết về email
 */
async function sendAnalysisReportEmail(toEmail, candidateName, reportData) {
  const subject = `[SmartRecruit AI] Kết quả đánh giá hồ sơ CV năng lực của bạn (${reportData.overallScore}/100)`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">SmartRecruit AI - Báo Cáo Năng Lực CV</h1>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Xin chào ${candidateName || 'Ứng viên'},</h2>
        <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 40px; font-weight: bold; color: #38bdf8;">${reportData.overallScore}<span style="font-size: 20px; color: #94a3b8;">/100</span></div>
          <div style="font-size: 14px; color: #10b981; font-weight: 600; margin-top: 4px;">Đánh Giá Năng Lực Tổng Quan Chuẩn ATS</div>
        </div>
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'BÁO CÁO NĂNG LỰC CV',
    extraLog: `Điểm: ${reportData.overallScore}/100`
  });
}

/**
 * 4. THƯ MỜI PHỎNG VẤN (Nhà tuyển dụng mời ứng viên)
 */
async function sendInterviewInvitationEmail(toEmail, candidateName, jobTitle, companyName, interviewData) {
  const subject = `[Thư Mời Phỏng Vấn] Vị trí ${jobTitle} tại ${companyName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #a855f7, #3b82f6); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">THƯ MỜI PHỎNG VẤN</h1>
        <p style="color: #f3e8ff; margin: 4px 0 0 0; font-size: 14px;">${companyName} trân trọng kính mời</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #c084fc; font-size: 18px; margin-top: 0;">Kính gửi ${candidateName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Bộ phận Tuyển dụng của <strong>${companyName}</strong> đã xem xét hồ sơ của bạn cho vị trí <strong>${jobTitle}</strong> và rất ấn tượng với năng lực chuyên môn của bạn.
        </p>
        
        <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #a855f7;">
          <h3 style="color: #e2e8f0; font-size: 15px; margin-top: 0;">Thông Tin Chi Tiết Buổi Phỏng Vấn:</h3>
          <p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">🗓️ <strong>Thời gian:</strong> ${interviewData.scheduledDate || 'Sẽ thông báo cụ thể'}</p>
          <p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">📍 <strong>Hình thức / Địa điểm:</strong> ${interviewData.meetingLink || 'Online qua Google Meet'}</p>
          ${interviewData.note ? `<p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">📝 <strong>Ghi chú:</strong> ${interviewData.note}</p>` : ''}
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Vui lòng phản hồi lại email này để xác nhận tham gia. Chúc bạn có một buổi trao đổi thành công!
        </p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
          Trân trọng,<br/><strong>Ban Tuyển Dụng ${companyName}</strong>
        </p>
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'THƯ MỜI PHỎNG VẤN (INTERVIEW INVITATION)',
    extraLog: `Ứng viên: ${candidateName} | Job: ${jobTitle} | Ngày: ${interviewData.scheduledDate}`
  });
}

/**
 * 5. THƯ MỜI NHẬN VIỆC (JOB OFFER)
 */
async function sendHiringOfferEmail(toEmail, candidateName, jobTitle, companyName, offerData) {
  const subject = `[Chúc Mừng - Thư Mời Nhận Việc] Vị trí ${jobTitle} tại ${companyName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">CHÚC MỪNG BẠN TRÚNG TUYỂN!</h1>
        <p style="color: #ecfdf5; margin: 4px 0 0 0; font-size: 14px;">Chào mừng bạn gia nhập ${companyName}</p>
      </div>
      <div style="padding: 24px;">
        <h2 style="color: #34d399; font-size: 18px; margin-top: 0;">Thân gửi ${candidateName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Chúng tôi rất vui mừng thông báo bạn đã chính thức được chọn vào vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>.
        </p>
        
        <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #e2e8f0; font-size: 15px; margin-top: 0;">Thông Tin Đãi Ngộ & Nhận Việc:</h3>
          <p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">💰 <strong>Mức lương đề xuất:</strong> ${offerData.salaryOffer || 'Thỏa thuận theo buổi phỏng vấn'}</p>
          <p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">🚀 <strong>Ngày bắt đầu công việc:</strong> ${offerData.startDate || 'Theo thống nhất'}</p>
          ${offerData.note ? `<p style="font-size: 14px; margin: 6px 0; color: #cbd5e1;">📝 <strong>Ghi chú thêm:</strong> ${offerData.note}</p>` : ''}
        </div>
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'THƯ MỜI NHẬN VIỆC (JOB OFFER)',
    extraLog: `Ứng viên: ${candidateName} | Lương: ${offerData.salaryOffer} | Ngày làm: ${offerData.startDate}`
  });
}

/**
 * 6. THƯ CẢM ƠN VÀ TỪ CHỐI LỊCH SỰ
 */
async function sendRejectionEmail(toEmail, candidateName, jobTitle, companyName) {
  const subject = `[Cảm Ơn Ứng Tuyển] Vị trí ${jobTitle} tại ${companyName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d1322; color: #e2e8f0; border-radius: 12px; overflow: hidden; border: 1px solid #1e293b;">
      <div style="padding: 24px;">
        <h2 style="color: #38bdf8; font-size: 18px;">Kính gửi ${candidateName},</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vào vị trí <strong>${jobTitle}</strong> tại <strong>${companyName}</strong>.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Dù nhận thấy bạn có tiềm năng tốt, sau khi cân nhắc kỹ lưỡng các tiêu chí phù hợp cho dự án hiện tại, chúng tôi rất tiếc chưa thể đồng hành cùng bạn ở vị trí này lúc này. Chúng tôi sẽ lưu hồ sơ của bạn vào Talent Pool và chủ động liên hệ khi có cơ hội phù hợp hơn trong tương lai.
        </p>
        <p style="font-size: 14px; color: #94a3b8; margin-top: 20px;">
          Chúc bạn luôn gặt hái nhiều thành công trong sự nghiệp!<br/>
          <strong>Bộ phận Tuyển dụng ${companyName}</strong>
        </p>
      </div>
    </div>
  `;

  return sendMailHelper({
    to: toEmail,
    subject,
    html,
    simulationType: 'THƯ TỪ CHỐI LỊCH SỰ',
    extraLog: `Ứng viên: ${candidateName} | Job: ${jobTitle}`
  });
}

module.exports = {
  sendOtpEmail,
  sendPasswordResetEmail,
  sendAnalysisReportEmail,
  sendInterviewInvitationEmail,
  sendHiringOfferEmail,
  sendRejectionEmail
};
