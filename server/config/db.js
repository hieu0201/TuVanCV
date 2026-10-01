const mongoose = require('mongoose');

// VÔ CÙNG QUAN TRỌNG: Tắt buffer commands để Mongoose không bao giờ bị treo khi chưa kết nối DB
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  // Nếu trên môi trường cloud (Render) chưa có MONGODB_URI, không cố kết nối vào localhost tránh timeout
  if (!uri && process.env.NODE_ENV === 'production') {
    isConnected = false;
    console.log('⚡ [Database] MONGODB_URI chưa được cấu hình. Hệ thống chuyển sang In-Memory Store tức thì.');
    return;
  }

  const connectUri = uri || 'mongodb://127.0.0.1:27017/tuvan_cv';
  
  try {
    const conn = await mongoose.connect(connectUri, {
      serverSelectionTimeoutMS: 2500, // Timeout nhanh sau 2.5s nếu không thấy MongoDB
    });
    
    isConnected = true;
    console.log(`[Database] MongoDB kết nối thành công: ${conn.connection.host}`);
    
    // Tự động khởi tạo dữ liệu mẫu nếu database mới tinh
    await seedInitialData();
  } catch (error) {
    isConnected = false;
    console.warn(`\n⚠️  [MongoDB Warning]: Chưa thể kết nối trực tiếp đến MongoDB (${error.message}).`);
    console.warn(`👉  Hệ thống chuyển sang In-Memory Data Store tức thì (không timeout).\n`);
  }
};

/**
 * Tự động tạo tài khoản Admin mặc định và tin tuyển dụng nếu database trống
 */
async function seedInitialData() {
  try {
    const User = require('../models/User');
    const Job = require('../models/Job');
    const bcrypt = require('bcryptjs');

    // Đảm bảo tài khoản admin của bạn luôn tồn tại với quyền cao nhất
    let hieuAdmin = await User.findOne({ email: 'huynhvanhieu020104@gmail.com' });
    if (!hieuAdmin) {
      hieuAdmin = new User({
        fullName: 'Huỳnh Văn Hiếu',
        email: 'huynhvanhieu020104@gmail.com',
        passwordHash: bcrypt.hashSync('Admin@123456', 10),
        role: 'admin',
        title: 'Super Administrator',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isEmailVerified: true
      });
      await hieuAdmin.save();
      console.log('✅ [Seed] Đã tạo tài khoản Admin chính: huynhvanhieu020104@gmail.com / Admin@123456');
    } else if (hieuAdmin.role !== 'admin') {
      hieuAdmin.role = 'admin';
      await hieuAdmin.save();
    }

    // Kiểm tra tin tuyển dụng mẫu
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      await Job.insertMany([
        {
          title: "Senior Fullstack Engineer (React & Node.js)",
          company: "VNG Tech Innovation",
          location: "TP. Hồ Chí Minh (Hybrid)",
          salary: "35 - 50 Triệu VNĐ",
          type: "Toàn thời gian",
          experience: "3+ năm kinh nghiệm",
          description: `Chúng tôi đang tìm kiếm Senior Fullstack Developer đồng hành xây dựng hệ thống nền tảng phục vụ hàng triệu người dùng.\n\nYÊU CẦU:\n- Thành thạo React.js, Tailwind CSS, TypeScript và tối ưu hiệu năng frontend.\n- Vững chuyên môn Node.js, Express, MongoDB/PostgreSQL, thiết kế kiến trúc Microservices & RESTful API.\n- Có kinh nghiệm triển khai Docker, CI/CD và kiến thức cơ bản về Cloud (AWS/GCP).\n- Kỹ năng tư duy logic tốt, giải quyết vấn đề độc lập và làm việc nhóm hiệu quả theo Agile/Scrum.`,
          requiredSkills: ["React.js", "Node.js", "MongoDB", "TypeScript", "Docker", "REST API"],
          applicantsCount: 18,
          isActive: true
        },
        {
          title: "AI Solutions Engineer / Machine Learning",
          company: "Nexus AI Labs",
          location: "Hà Nội (Remote / Linh hoạt)",
          salary: "40 - 65 Triệu VNĐ",
          type: "Toàn thời gian",
          experience: "2+ năm kinh nghiệm",
          description: `Tham gia phát triển các giải pháp GenAI, Document Intelligence và Retrieval-Augmented Generation (RAG).\n\nYÊU CẦU:\n- Thành thạo Python, PyTorch, Hugging Face Transformers và LangChain/LlamaIndex.\n- Có kinh nghiệm fine-tuning mô hình ngôn ngữ lớn (LLMs), tích hợp Vector Database (Pinecone/Milvus).\n- Nắm vững quy trình MLOps, CI/CD và triển khai API FastAPI/Docker trên hạ tầng GPU Kubernetes.`,
          requiredSkills: ["Python", "PyTorch", "LangChain", "Vector DB", "Docker", "FastAPI"],
          applicantsCount: 12,
          isActive: true
        },
        {
          title: "Senior Frontend Architect (React / Next.js)",
          company: "Fintech Global Solutions",
          location: "Đà Nẵng (Hybrid)",
          salary: "30 - 45 Triệu VNĐ",
          type: "Toàn thời gian",
          experience: "3+ năm kinh nghiệm",
          description: `Chịu trách nhiệm kiến trúc Frontend cho cổng thanh toán tài chính tốc độ cao.\n\nYÊU CẦU:\n- Xuất sắc với React.js, Next.js App Router, Tailwind CSS, Redux Toolkit hoặc Zustand.\n- Kỹ năng tối ưu hóa Core Web Vitals, SSR, caching, kiến trúc Micro-Frontend.\n- Viết Unit Test và E2E Test vững vàng (Jest, Cypress, Playwright).`,
          requiredSkills: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Jest", "Micro-Frontend"],
          applicantsCount: 9,
          isActive: true
        }
      ]);
      console.log('✅ [Seed] Đã khởi tạo các tin tuyển dụng ban đầu vào MongoDB');
    }
  } catch (err) {
    console.error('[Seed Error]:', err.message);
  }
}

module.exports = { connectDB, getIsConnected: () => isConnected };
