# 🚀 SmartRecruit AI - Nền Tảng Tuyển Dụng Thông Minh & Phân Tích CV Chuyên Sâu

Hệ thống tuyển dụng và phân tích hồ sơ ứng viên thông minh ứng dụng **Google Gemini 2.5 Flash**, hỗ trợ kết nối ứng viên và nhà tuyển dụng với dữ liệu thật 100%, bảo mật cao và giao diện Enterprise SaaS hiện đại.

---

## 📌 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
3. [Hiện Thực Chi Tiết Mục 2.3 (Chức Năng & Phi Chức Năng)](#-hiện-thực-chi-tiết-mục-23-chức-năng--phi-chức-năng)
4. [Tài Khoản Mặc Định & Cấu Hình Môi Trường](#-tài-khoản-mặc-định--cấu-hình-môi-trường)
5. [Hướng Dẫn Cài Đặt & Chạy Dự Án](#-hướng-dẫn-cài-đặt--chạy-dự-án)
6. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
7. [Danh Sách RESTful API Endpoints](#-danh-sách-restful-api-endpoints)
8. [Hướng Dẫn Triển Khai (Deployment Guide)](#-hướng-dẫn-triển-khai-deployment-guide)

---

## 🌟 Giới Thiệu Tổng Quan

**SmartRecruit AI** giải quyết bài toán tuyển dụng và tìm việc hiện đại:
- **Loại bỏ 100% dữ liệu ảo/bịa đặt**: Toàn bộ số lượng ứng viên, tin tuyển dụng, danh mục ngành nghề và kết quả phân tích đều được lưu trữ trực tiếp trên MongoDB và xử lý thông qua AI thực tế.
- **Ứng dụng AI phân tích sâu**: Tự động bóc tách kỹ năng từ CV, đánh giá độ chuẩn hóa của JD, đo lường tỷ lệ tương thích (Matching Score %) và tự động tạo bộ câu hỏi phỏng vấn sàng lọc.
- **Giao diện chuẩn Doanh Nghiệp (Modern Enterprise SaaS)**: Tinh gọn, sang trọng, loại bỏ các chi tiết sci-fi rườm rà, tập trung vào trải nghiệm công việc mượt mà.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Client)
- **Framework**: React 18 (Vite Bundler).
- **Styling**: Vanilla CSS thiết kế theo Design Tokens doanh nghiệp (`#0b0f19`, deep blue `#2563eb`, emerald `#10b981`), chuẩn responsive (Desktop, Tablet, Mobile).
- **Icons**: Lucide React.
- **State & HTTP**: Fetch API có cấu hình JWT Bearer Token, quản lý Session qua LocalStorage.

### Backend (Server)
- **Runtime**: Node.js & Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`).
- **File Parsing**: Multer (Upload file), `mammoth` (Trích xuất văn bản từ tệp Word `.docx`), `pdf-parse` (Đọc nội dung văn bản trực tiếp từ tệp PDF).
- **Xác thực & Bảo mật**: JSON Web Token (JWT), `bcryptjs` (Mã hóa mật khẩu 10 rounds).
- **Email Service**: Nodemailer (Gửi thư mời phỏng vấn, thông báo trạng thái hồ sơ qua Gmail SMTP).

---

## 📋 Hiện Thực Chi Tiết Mục 2.3 (Chức Năng & Phi Chức Năng)

Dự án hiện thực đầy đủ **12 chức năng chính** và **7 yêu cầu phi chức năng** theo đúng tài liệu đặc tả:

### 12 Chức Năng Chính:
1. **Đăng ký, đăng nhập và phân quyền người dùng**:
   - Đăng nhập thống nhất theo Email + Mật khẩu (hệ thống tự động nhận diện Role từ Database).
   - Đăng ký tài khoản rõ ràng theo vai trò: **Ứng viên (Candidate)** hoặc **Nhà tuyển dụng (Recruiter)**.
   - Quản trị viên tối cao (**Admin**) quản lý toàn bộ phân quyền.
2. **Tìm kiếm, lọc và xem chi tiết việc làm**:
   - Tìm kiếm theo từ khóa (Tiêu đề, kỹ năng, công ty).
   - Lọc đa chiều theo Địa điểm (Hà Nội, TP.HCM, Đà Nẵng, Remote...) và Danh mục ngành nghề.
   - Modal hiển thị chi tiết JD đầy đủ: Mức lương, mô tả chi tiết, yêu cầu, quyền lợi và số lượng ứng viên đang ứng tuyển realtime.
3. **Quản lý hồ sơ ứng viên và CV**:
   - Tải lên file CV định dạng PDF / DOCX hoặc dán nội dung văn bản.
   - Tự động trích xuất nội dung từ PDF để phân tích.
   - Quản lý lịch sử nộp đơn tại tab **"Đơn Đã Ứng Tuyển"** (theo dõi trạng thái, điểm match, thông tin phỏng vấn).
4. **Phân tích và đánh giá CV bằng AI**:
   - AI Gemini bóc tách điểm tổng thể (0-100), kỹ năng cứng, kỹ năng mềm, điểm mạnh vượt trội, điểm cần khắc phục và lộ trình đề xuất để nâng cao năng lực.
5. **Quản lý thông tin doanh nghiệp**:
   - Tab riêng dành cho Nhà tuyển dụng: Cập nhật tên công ty, quy mô nhân sự, địa chỉ trụ sở, ngành nghề kinh doanh và mô tả giới thiệu.
6. **Quản lý tin tuyển dụng / JD**:
   - Nhà tuyển dụng đăng tin mới với form tiêu chuẩn.
   - Bật/Tắt trạng thái tuyển dụng (`Đang tuyển` / `Đã đóng`).
   - Hiển thị số lượng hồ sơ đã nộp theo từng tin tuyển dụng.
7. **Phân tích mô tả công việc / JD bằng AI**:
   - Phân tích độ hoàn thiện của JD (Điểm chất lượng JD 0-100).
   - AI bóc tách danh sách kỹ năng bắt buộc, kỹ năng ưu tiên và phát hiện thông tin còn thiếu trong bản mô tả.
   - Tự động gợi ý 4-5 câu hỏi phỏng vấn sàng lọc ứng viên chuyên sâu.
8. **Ứng tuyển và quản lý hồ sơ ứng tuyển**:
   - Ứng viên ứng tuyển 1-click trực tiếp từ danh sách việc làm.
   - Nhà tuyển dụng theo dõi toàn bộ danh sách hồ sơ ứng tuyển, duyệt hồ sơ (`Phù hợp`, `Từ chối`), thiết lập lịch phỏng vấn và gửi email tự động tới ứng viên.
9. **Đánh giá mức độ phù hợp giữa CV và tin tuyển dụng**:
   - Tính toán chỉ số tương thích (Matching Score %) giữa hồ sơ và yêu cầu tuyển dụng dựa trên kỹ năng, kinh nghiệm và từ khóa ngành.
10. **Gợi ý việc làm phù hợp cho ứng viên**:
    - Tự động đề xuất danh sách việc làm có độ tương thích cao nhất dựa trên kết quả phân tích kỹ năng từ CV của ứng viên.
11. **Gợi ý ứng viên phù hợp cho nhà tuyển dụng**:
    - Tính năng gợi ý Top ứng viên tiềm năng có kỹ năng khớp nhất với tin tuyển dụng cụ thể.
12. **Quản trị người dùng, tin tuyển dụng, danh mục và thống kê hệ thống**:
    - Trang Admin Portal chuyên biệt: Thống kê số lượng Người dùng, Tin tuyển dụng, Hồ sơ ứng tuyển.
    - Duyệt / Khóa tài khoản Nhà tuyển dụng và Ứng viên.
    - Quản lý danh mục ngành nghề và bộ kỹ năng hệ thống (Thêm/Sửa/Xóa).

### Các Yêu Cầu Phi Chức Năng:
- **Bảo mật**: Mã hóa mật khẩu một chiều với Bcrypt, bảo vệ API với JWT Token, kiểm tra quyền hạn (Role-based Authorization Middleware).
- **Hiệu năng**: Tải trang nhanh, chỉ số ứng viên được tổng hợp realtime bằng Aggregation Pipeline của MongoDB.
- **Khả năng mở rộng**: Tích hợp sẵn Nodemailer kết nối SMTP Gmail, cấu trúc module dễ dàng bổ sung Chat Socket.io, Lịch phỏng vấn hay Cổng thanh toán.
- **Tính chính xác**: Kết quả phân tích từ Google Gemini 2.5 Flash định dạng JSON rõ ràng, giải thích cặn kẽ căn cứ đánh giá.
- **Giao diện thân thiện**: Thiết kế SaaS tối giản, hiện đại, màu sắc dịu mắt, hỗ trợ hiển thị tối ưu trên Desktop, Tablet và Mobile.
- **Tính ổn định**: Bắt lỗi tập trung (Error Handling Middleware), thông báo lỗi rõ ràng khi upload file quá dung lượng hoặc sai định dạng.

---

## 🔑 Tài Khoản Mặc Định & Cấu Hình Môi Trường

### 1. Tài Khoản Quản Trị Tối Cao (Super Admin)
- **Email**: `huynhvanhieu020104@gmail.com`
- **Mật khẩu**: `Admin@123456`
- **Quyền hạn**: Truy cập tab **Quản Trị**, kiểm duyệt tài khoản, xóa/sửa việc làm, quản lý danh mục kỹ năng, xem toàn bộ thống kê hệ thống.

### 2. Tài Khoản Nhà Tuyển Dụng (Recruiter - FPT Software)
- **Email**: `duonghoangyen1427@gmail.com`
- **Mật khẩu**: `123456`
- **Người đại diện**: Dương Hoàng Yến (Senior Talent Acquisition Manager)
- **Công ty**: **FPT Software** (Sở hữu 7 tin tuyển dụng kỹ sư công nghệ cao)
- **Cơ chế bảo mật Multi-Tenant Isolation**: Nhà tuyển dụng chỉ xem và quản lý danh sách hồ sơ ứng viên nộp vào chính các tin tuyển dụng của công ty mình; các nhà tuyển dụng công ty khác không thể xem trộm hồ sơ (HTTP 403 Forbidden).
- **Đăng ký Nhà tuyển dụng**: Yêu cầu bắt buộc điền **Tên công ty / Doanh nghiệp** ngay trong form đăng ký.

### 3. Tài Khoản Ứng Viên Mẫu (Candidate)
- **Email**: `huynhvanhieu2104@gmail.com`
- **Mật khẩu**: `123456`
- **Quyền hạn**: Phân tích CV chuẩn ATS (PDF / Word), so khớp năng lực với 7 việc làm FPT Software, nộp hồ sơ trực tiếp đến Nhà tuyển dụng.

### 4. Cấu Hình Email SMTP (Gửi Thông Báo Tự Động)
Hệ thống sử dụng dịch vụ Gmail SMTP để gửi thư mời phỏng vấn và kết quả xét duyệt:
- **Email gửi**: `huynhvanhieu020104@gmail.com`
- **Cơ chế xác thực**: Mật khẩu ứng dụng Google (App Password 16 ký tự).

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Tiên Quyết
- **Node.js**: Phiên bản 18.x hoặc 20.x trở lên ([Tải tại đây](https://nodejs.org/)).
- **MongoDB**: Đã cài MongoDB Local (cổng `27017`) hoặc có Connection String từ [MongoDB Atlas](https://www.mongodb.com/atlas).

### Bước 1: Khởi Chạy Backend (Server)
1. Mở Terminal và di chuyển vào thư mục `server`:
   ```bash
   cd server
   npm install
   ```
2. Tạo file `.env` từ file mẫu `.env.example` (hoặc chỉnh sửa trực tiếp file `.env`):
   ```env
   PORT=5000
   GEMINI_API_KEY=AIzaSy... (API Key của bạn từ Google AI Studio)
   JWT_SECRET=smartrecruit_super_secret_jwt_key_2026
   MONGODB_URI=mongodb://127.0.0.1:27017/tuvan_cv
   
   # Cấu hình Email SMTP
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=huynhvanhieu020104@gmail.com
   EMAIL_PASS=nmar ozfm hbpr ushc
   EMAIL_FROM="SmartRecruit AI" <huynhvanhieu020104@gmail.com>
   ```
3. Chạy Server:
   ```bash
   node server.js
   # Hoặc chế độ dev tự reload:
   npm run dev
   ```
   *Server sẽ chạy tại: `http://localhost:5000`*

### Bước 2: Khởi Chạy Frontend (Client)
1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `client`:
   ```bash
   cd client
   npm install
   ```
2. Chạy ứng dụng React với Vite:
   ```bash
   npm run dev
   ```
   *Truy cập ứng dụng tại: `http://localhost:5173`*

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
TuVanCV/
│
├── client/                          # Giao diện Frontend React + Vite
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminView.jsx        # Quản trị hệ thống, duyệt NTD, danh mục ngành nghề
│   │   │   ├── AuthModal.jsx        # Modal Đăng nhập / Đăng ký phân quyền
│   │   │   ├── CandidateView.jsx    # Phân tích CV AI, Tab "Đơn Đã Ứng Tuyển"
│   │   │   ├── HeroSection.jsx      # Banner tìm kiếm việc làm doanh nghiệp
│   │   │   ├── JobCard.jsx          # Thẻ hiển thị tin tuyển dụng & số lượng ứng viên
│   │   │   ├── MatchingView.jsx     # Tìm kiếm/lọc việc làm, Modal xem chi tiết JD
│   │   │   ├── Navbar.jsx           # Thanh điều hướng theo Role (Candidate/Recruiter/Admin)
│   │   │   ├── ProfileModal.jsx     # Cập nhật thông tin cá nhân & mật khẩu
│   │   │   └── RecruiterView.jsx    # Đăng tin, Quản lý ứng viên, Phân tích JD, Profile công ty
│   │   ├── services/
│   │   │   └── api.js               # Đóng gói toàn bộ các hàm gọi API Backend
│   │   ├── App.jsx                  # Điều phối State chính của ứng dụng
│   │   ├── index.css                # Bộ Design System CSS Modern SaaS
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Máy chủ Backend Node.js + Express
│   ├── config/
│   │   └── db.js                    # Kết nối cơ sở dữ liệu MongoDB
│   ├── middleware/
│   │   └── authMiddleware.js        # Xác thực Token JWT & phân quyền vai trò
│   ├── models/
│   │   ├── Application.js           # Schema đơn ứng tuyển (kết quả match, ghi chú phỏng vấn)
│   │   ├── Job.js                   # Schema tin tuyển dụng (kèm ngành nghề, trạng thái)
│   │   └── User.js                  # Schema người dùng (kèm thông tin công ty NTD)
│   ├── services/
│   │   ├── aiService.js             # Tích hợp Google Gemini 2.5 Flash (Phân tích CV, JD, Matching)
│   │   └── emailService.js          # Gửi email tự động qua Nodemailer SMTP
│   ├── .env                         # Biến môi trường hệ thống
│   ├── .env.example                 # File mẫu cấu hình môi trường
│   ├── package.json
│   └── server.js                    # Entry point khởi tạo Express server & API routes
│
└── README.md                        # Tài liệu hướng dẫn toàn diện của dự án
```

---

## 📡 Danh Sách RESTful API Endpoints

### 1. Xác thực & Tài khoản (`/api/auth`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản (Candidate / Recruiter) |
| `POST` | `/api/auth/login` | Public | Đăng nhập hệ thống (nhận JWT Token) |
| `GET` | `/api/auth/profile` | Logged In | Lấy thông tin tài khoản hiện tại |
| `PUT` | `/api/auth/profile` | Logged In | Cập nhật hồ sơ cá nhân |
| `PUT` | `/api/auth/company-profile`| Recruiter | Cập nhật thông tin doanh nghiệp |
| `GET` | `/api/auth/users` | Admin | Quản trị danh sách người dùng hệ thống |
| `PUT` | `/api/auth/users/:id/status`| Admin | Khóa hoặc kích hoạt tài khoản |

### 2. Trí Tuệ Nhân Tạo AI (`/api/ai`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/analyze-cv` | Public/Candidate | Phân tích file CV PDF hoặc văn bản bằng Gemini |
| `POST` | `/api/ai/analyze-jd` | Recruiter/Admin | Đánh giá chất lượng JD & gợi ý câu hỏi phỏng vấn |
| `POST` | `/api/ai/match` | Public/Candidate | Tính toán độ tương thích Matching Score giữa CV và JD |
| `POST` | `/api/ai/recommend-candidates`| Recruiter | Đề xuất Top ứng viên thích hợp cho một JD |

### 3. Việc Làm (`/api/jobs`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs` | Public | Lấy danh sách việc làm (kèm số lượng ứng viên realtime) |
| `GET` | `/api/jobs/:id` | Public | Xem chi tiết tin tuyển dụng |
| `POST` | `/api/jobs` | Recruiter/Admin | Đăng tin tuyển dụng mới |
| `PUT` | `/api/jobs/:id/status`| Recruiter/Admin | Chuyển đổi trạng thái tin tuyển dụng (`active`/`closed`) |
| `DELETE`| `/api/jobs/:id` | Admin | Xóa tin tuyển dụng |

### 4. Ứng Tuyển & Phỏng Vấn (`/api/applications`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/applications` | Candidate | Nộp hồ sơ ứng tuyển vào một vị trí công việc |
| `GET` | `/api/applications/my` | Candidate | Xem lịch sử các vị trí ứng viên đã nộp đơn |
| `GET` | `/api/applications/job/:jobId` | Recruiter/Admin | Xem danh sách hồ sơ ứng tuyển theo việc làm |
| `PUT` | `/api/applications/:id/status`| Recruiter/Admin | Duyệt hồ sơ, lên lịch phỏng vấn & gửi email tự động |

### 5. Danh Mục Hệ Thống (`/api/categories`)
| Phương thức | Đường dẫn | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/categories` | Public | Lấy danh mục ngành nghề và từ điển kỹ năng |

---

## 🚀 Hướng Dẫn Triển Khai (Deployment Guide)

### 1. Cơ sở dữ liệu: MongoDB Atlas
- Tạo tài khoản miễn phí tại [MongoDB Atlas](https://cloud.mongodb.com/).
- Tạo một Cluster M0 (Free), tạo Database User và thêm IP `0.0.0.0/0` vào Network Access.
- Sao chép Connection String dạng `mongodb+srv://...` gán vào biến `MONGODB_URI`.

### 2. Triển khai Backend: Render / Railway
- Đẩy code lên GitHub repository của bạn.
- Kết nối kho mã nguồn với Render (Web Service):
  - **Root Directory**: `server`
  - **Build Command**: `npm install`
  - **Start Command**: `node server.js`
  - Thêm các biến môi trường từ file `.env` vào phần **Environment Variables** trên Render.

### 3. Triển khai Frontend: Vercel / Netlify
- Kết nối GitHub repository với Vercel:
  - **Root Directory**: `client`
  - **Framework Preset**: `Vite`
  - **Build Command**: `npm run build`
  - **Output Directory**: `dist`
  - Thêm biến môi trường `VITE_API_URL` trỏ tới URL backend Render vừa tạo (Ví dụ: `https://tuvan-cv-api.onrender.com`).

---

## 📞 Hỗ Trợ Kỹ Thuật

Nếu bạn gặp bất kỳ vấn đề nào trong quá trình khởi chạy hoặc kiểm thử dự án, vui lòng liên hệ:
- **Email Quản Trị**: [huynhvanhieu020104@gmail.com](mailto:huynhvanhieu020104@gmail.com)
- **Hệ thống**: SmartRecruit AI Portal (Được vận hành bởi Node.js & Google Gemini 2.5 Flash).
