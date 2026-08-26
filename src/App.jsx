import React, { useState, useEffect } from 'react';
import { ShopProvider } from './context/ShopContext';
import { ZaloMiniAppBanner } from './components/ZaloMiniAppBanner';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { OccasionFilter } from './components/OccasionFilter';
import { FlowerGrid } from './components/FlowerGrid';
import { ReviewsSection } from './components/ReviewsSection';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AIFloristModal } from './components/AIFloristModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ZaloChatFloatingButton } from './components/ZaloChatFloatingButton';
import { Footer } from './components/Footer';

function AppContent() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  
  // Tự động khôi phục tài khoản Admin đã đăng nhập
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const cached = localStorage.getItem('flora_admin_user');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });

  const isAdminAuthenticated = Boolean(adminUser);

  // Lắng nghe URL Hash (#admin) hoặc phím tắt bảo mật
  useEffect(() => {
    const handleHashCheck = () => {
      if (window.location.hash === '#admin') {
        if (isAdminAuthenticated) {
          setIsAdminView(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    const handleKeyDown = (e) => {
      // Phím tắt: Alt + Shift + A hoặc Ctrl + Shift + A
      if ((e.altKey || e.ctrlKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdminAuthenticated) {
          setIsAdminView(true);
        } else {
          setIsAdminLoginOpen(true);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdminAuthenticated]);

  const handleLoginSuccess = (userData) => {
    setAdminUser(userData);
    setIsAdminLoginOpen(false);
    setIsAdminView(true);
    window.location.hash = 'admin';
  };

  const handleExitAdmin = () => {
    setIsAdminView(false);
    window.location.hash = '';
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('flora_admin_user');
    setAdminUser(null);
    setIsAdminView(false);
    window.location.hash = '';
  };

  if (isAdminView && isAdminAuthenticated) {
    return (
      <AdminDashboard 
        adminUser={adminUser}
        onBackToStore={handleExitAdmin} 
        onLogout={handleLogoutAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#222523] selection:bg-[#F5D6CE] selection:text-[#1B3B2B]">
      {/* Banner Mô phỏng Zalo Mini App */}
      <ZaloMiniAppBanner />

      {/* Header Khách Hàng */}
      <Header />

      {/* Nội dung chính Storefront */}
      <main className="flex-grow">
        <HeroSection />
        <OccasionFilter />
        <FlowerGrid />
        <ReviewsSection />
      </main>

      {/* Floating Real Zalo Chat Button */}
      <ZaloChatFloatingButton />

      {/* Modals & Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <CheckoutModal />
      <AIFloristModal />
      <OrderTrackingModal />

      {/* Modal Đăng Nhập Bảo Mật Cho Nhân Viên Bằng Google, FB, Telegram */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          if (window.location.hash === '#admin') window.location.hash = '';
        }}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer với link Cổng Nội Bộ kín đáo */}
      <Footer onOpenAdminLogin={() => setIsAdminLoginOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
}
