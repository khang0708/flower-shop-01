import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { adminLoginApi } from '../api';

export const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await adminLoginApi(username.trim(), password);
      if (res.success && res.user) {
        setIsLoading(false);
        onLoginSuccess(res.user);
      } else {
        throw new Error(res.message || 'Đăng nhập không thành công.');
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-gray-200 animate-fade-in text-[#222523]">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1B3B2B] to-[#264A37] text-white p-6 text-center relative">
          <BrandLogo variant="stacked" size="md" theme="light" showTagline={false} className="mb-1" />
          <p className="text-[11px] text-emerald-200 mt-1">Cổng điều hành & quản trị tiệm hoa (Bảo mật JWT)</p>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-base transition-all"
            aria-label="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 sm:p-8 space-y-5">

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-center gap-2 border border-red-200 animate-fade-in">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tên đăng nhập */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Tài khoản quản trị:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc email quản trị"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-gray-200 focus:border-[#1B3B2B] focus:bg-white rounded-xl text-xs text-gray-900 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Mật khẩu:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị..."
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-gray-200 focus:border-[#1B3B2B] focus:bg-white rounded-xl text-xs text-gray-900 focus:outline-hidden transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút Đăng nhập */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1B3B2B] hover:bg-[#234d38] text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực bảo mật...</span>
                </>
              ) : (
                <>
                  <span>Đăng Nhập Quản Trị</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Gợi ý đăng nhập ban đầu */}
          <div className="bg-[#FAF8F5] border border-emerald-100 rounded-2xl p-4 text-[11px] text-gray-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1B3B2B]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thông tin khởi tạo ban đầu:</span>
            </div>
            <p>
              Tài khoản: <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">admin</code>
              {' • '}
              Mật khẩu: <code className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">Flora@2026</code>
            </p>
            <p className="text-[10px] text-gray-400 italic">
              🔒 Bạn có thể đổi mật khẩu mới bất kỳ lúc nào trong tab <b>Cấu Hình & Vận Hành</b> của Admin.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center text-[10px] text-gray-400">
          Hệ thống bảo vệ đa lớp • Mã hóa chuẩn PBKDF2 & JWT Token
        </div>

      </div>
    </div>
  );
};
