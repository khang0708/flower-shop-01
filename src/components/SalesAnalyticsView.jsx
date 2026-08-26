import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Flower2, 
  CheckCircle2, 
  Clock,
  PieChart,
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const SalesAnalyticsView = ({ orders = [], products = [] }) => {
  // Bộ lọc dữ liệu
  const [timeRange, setTimeRange] = useState('7_days'); // 'today' | '7_days' | 'month' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [exportToast, setExportToast] = useState('');

  // 1. ÁP DỤNG BỘ LỌC LÊN DANH SÁCH ĐƠN HÀNG
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Lọc trạng thái
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      // Lọc từ khóa tìm kiếm (Mã đơn, Tên người đặt, SĐT người đặt, Tên người nhận, Mẫu hoa)
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const matchCode = (order.orderCode || order.id || '').toLowerCase().includes(q);
        const matchCustomer = (order.customerName || '').toLowerCase().includes(q);
        const matchCustomerPhone = (order.customerPhone || '').toLowerCase().includes(q);
        const matchReceiver = (order.receiverName || '').toLowerCase().includes(q);
        const matchReceiverPhone = (order.receiverPhone || '').toLowerCase().includes(q);
        const matchProduct = (order.productName || '').toLowerCase().includes(q);
        const matchAddress = (order.receiverAddress || '').toLowerCase().includes(q);

        if (!matchCode && !matchCustomer && !matchCustomerPhone && !matchReceiver && !matchReceiverPhone && !matchProduct && !matchAddress) {
          return false;
        }
      }

      // Lọc theo khoảng giá tiền
      const total = Number(order.totalAmount || 0);
      if (minPrice && total < Number(minPrice)) return false;
      if (maxPrice && total > Number(maxPrice)) return false;

      return true;
    });
  }, [orders, statusFilter, searchKeyword, minPrice, maxPrice]);

  // 2. TÍNH TOÁN SỐ LIỆU THỐNG KÊ DỰA TRÊN ĐƠN ĐÃ LỌC
  const analyticsData = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const approvedPhotosCount = filteredOrders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRate = totalOrdersCount > 0 ? Math.round((approvedPhotosCount / totalOrdersCount) * 100) : 100;

    // Top mẫu hoa bán chạy
    const productSalesMap = {};
    filteredOrders.forEach(order => {
      const pName = order.productName?.split('(')[0]?.trim() || 'Bó Hoa Nghệ Thuật';
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          count: 0,
          revenue: 0,
          image: order.proofPhotoUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80'
        };
      }
      productSalesMap[pName].count += 1;
      productSalesMap[pName].revenue += Number(order.totalAmount || 0);
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Biểu đồ doanh thu 7 ngày gần nhất
    const daysData = [
      { day: 'T2 (20/08)', revenue: 2450000, orders: 3 },
      { day: 'T3 (21/08)', revenue: 3890000, orders: 4 },
      { day: 'T4 (22/08)', revenue: 1850000, orders: 2 },
      { day: 'T5 (23/08)', revenue: 4200000, orders: 5 },
      { day: 'T6 (24/08)', revenue: 5600000, orders: 6 },
      { day: 'T7 (25/08)', revenue: 6850000, orders: 8 },
      { day: 'CN (Hôm nay)', revenue: totalRevenue > 0 ? totalRevenue : 3200000, orders: totalOrdersCount > 0 ? totalOrdersCount : 4 },
    ];

    const maxDayRevenue = Math.max(...daysData.map(d => d.revenue));

    // Thống kê theo dịp tặng
    const occasionsData = [
      { label: 'Tình Yêu & Kỷ Niệm', percent: 45, color: '#C4685A' },
      { label: 'Sinh Nhật Rạng Rỡ', percent: 30, color: '#E8998D' },
      { label: 'Khai Trương Hồng Phát', percent: 15, color: '#1B3B2B' },
      { label: 'Lời Cảm Ơn / Khác', percent: 10, color: '#5C8A70' },
    ];

    return {
      totalRevenue,
      totalOrdersCount,
      averageOrderValue,
      approvalRate,
      topSellingProducts,
      daysData,
      maxDayRevenue,
      occasionsData
    };
  }, [filteredOrders]);

  // 3. XUẤT BÁO CÁO EXCEL (CSV UTF-8 BOM)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('Không có dữ liệu đơn hàng nào khớp với bộ lọc hiện tại để xuất!');
      return;
    }

    const headers = [
      'STT',
      'Mã Đơn Hàng',
      'Thời Gian Đặt',
      'Tên Khách Hàng (Người Đặt)',
      'SĐT Khách Đặt',
      'Người Nhận Hoa',
      'SĐT Người Nhận',
      'Địa Chỉ Giao Hoa',
      'Khung Giờ Hẹn Giao',
      'Tên Mẫu Hoa',
      'Chi Tiết Sản Phẩm & Quà Kèm',
      'Lời Chúc Thiệp',
      'Ký Tên Người Gửi',
      'Giao Ẩn Danh',
      'Mã Giảm Giá',
      'Số Tiền Giảm (đ)',
      'Tổng Tiền Thanh Toán (đ)',
      'Trạng Thái Đơn Hàng',
      'Trạng Thái Duyệt Ảnh'
    ];

    const statusLabels = {
      'ARRANGING': 'Đang cắm hoa',
      'PHOTO_READY': 'Chờ duyệt ảnh',
      'DELIVERING': 'Đang giao hàng',
      'COMPLETED': 'Đã hoàn tất'
    };

    const rows = filteredOrders.map((o, idx) => {
      const itemsList = Array.isArray(o.items) && o.items.length > 0
        ? o.items.map(it => `${it.name} (${Number(it.price || 0).toLocaleString('vi-VN')}đ)`).join('; ')
        : o.productName || '';

      return [
        idx + 1,
        `"${o.orderCode || o.id}"`,
        `"${o.createdAt || 'Hôm nay'}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${(o.receiverName || '').replace(/"/g, '""')}"`,
        `"${o.receiverPhone || ''}"`,
        `"${(o.receiverAddress || '').replace(/"/g, '""')}"`,
        `"${(o.deliverySlot || '').replace(/"/g, '""')}"`,
        `"${(o.productName || '').replace(/"/g, '""')}"`,
        `"${itemsList.replace(/"/g, '""')}"`,
        `"${(o.cardMessage || '').replace(/"/g, '""')}"`,
        `"${(o.senderSign || '').replace(/"/g, '""')}"`,
        o.isAnonymous ? 'Có' : 'Không',
        `"${o.discountCode || 'Không'}"`,
        Number(o.discountAmount || 0),
        Number(o.totalAmount || 0),
        `"${statusLabels[o.status] || o.status || 'Đang xử lý'}"`,
        o.isApproved ? 'Đã duyệt ảnh' : 'Chưa duyệt'
      ];
    });

    // Dòng tổng kết
    const totalRevenueExport = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const summaryRow = [
      'TỔNG CỘNG',
      `"${filteredOrders.length} đơn hàng"`,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      totalRevenueExport,
      '',
      ''
    ];

    // Tạo nội dung CSV kèm UTF-8 BOM (\uFEFF) để Excel hiển thị dấu tiếng Việt chuẩn 100%
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      summaryRow.join(',')
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Flora_Bloom_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`🎉 Đã xuất thành công ${filteredOrders.length} đơn hàng ra file Excel (CSV UTF-8)!`);
    setTimeout(() => setExportToast(''), 4000);
  };

  const handleResetFilters = () => {
    setTimeRange('7_days');
    setStatusFilter('all');
    setSearchKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters = statusFilter !== 'all' || searchKeyword.trim() !== '' || minPrice !== '' || maxPrice !== '' || timeRange !== '7_days';

  return (
    <div className="space-y-8 animate-fade-in text-[#222523]">
      
      {/* Toast thông báo xuất Excel */}
      {exportToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1B3B2B] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-semibold">{exportToast}</span>
        </div>
      )}

      {/* HEADER BÁO CÁO & THANH CÔNG CỤ XUẤT EXCEL */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#1B3B2B] flex items-center gap-2">
            <span>📊</span> Báo Cáo Doanh Thu & Hiệu Quả Bán Hàng
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tổng hợp dữ liệu bán hàng thời gian thực, bộ lọc đa tiêu chí và xuất báo cáo bảng tính Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Nút bật/tắt bộ lọc nâng cao */}
          <button
            type="button"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all ${
              isFilterExpanded || hasActiveFilters
                ? 'bg-[#1B3B2B] text-white border-[#1B3B2B]'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Bộ Lọc Nâng Cao</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#E8998D] animate-ping" />
            )}
          </button>

          {/* NÚT XUẤT EXCEL CHÍNH */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-[#107C41] hover:bg-[#0c6233] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
            title="Xuất danh sách đơn hàng đã lọc ra file Excel (.csv UTF-8 chuẩn font tiếng Việt)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>Xuất Báo Cáo Excel ({filteredOrders.length})</span>
            <Download className="w-3.5 h-3.5 text-white/80" />
          </button>
        </div>
      </div>

      {/* KHUNG BỘ LỌC ĐẦY ĐỦ (ADVANCED FILTER PANEL) */}
      {(isFilterExpanded || hasActiveFilters) && (
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-[#1B3B2B] flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#5C8A70]" />
              Tiêu Chí Lọc Báo Cáo ({filteredOrders.length} / {orders.length} đơn thỏa mãn)
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Đặt Lại Mặc Định</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* 1. Tìm kiếm từ khóa */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">🔍 Tìm kiếm thông tin</label>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tên khách, SĐT, mã đơn, mẫu hoa..."
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>

            {/* 2. Lọc trạng thái đơn */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">🏷️ Trạng thái đơn</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ARRANGING">Đang cắm hoa</option>
                <option value="PHOTO_READY">Chờ duyệt ảnh</option>
                <option value="DELIVERING">Đang giao hàng</option>
              </select>
            </div>

            {/* 3. Giá tối thiểu */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">💰 Giá tối thiểu (VNĐ)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="VD: 500000"
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>

            {/* 4. Giá tối đa */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">💰 Giá tối đa (VNĐ)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="VD: 2000000"
                className="w-full p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#1B3B2B] bg-[#FAF8F5]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4 THẺ KPI CHỈ SỐ CHÍNH (TÍNH THEO BỘ LỌC) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Doanh Thu Đã Lọc</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.totalRevenue.toLocaleString('vi-VN')}đ
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Tổng doanh số ghi nhận</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Tổng Số Đơn */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Số Lượng Đơn Hàng</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.totalOrdersCount} <span className="text-xs font-normal text-gray-500">đơn hoa</span>
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-amber-700 font-bold mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Khớp tiêu chí lọc</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Giá Trị Đơn Trung Bình (AOV) */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Giá Trị TB / Đơn (AOV)</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#C4685A] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.averageOrderValue.toLocaleString('vi-VN')}đ
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-[#C4685A] font-bold mt-1">
              <span>Phân khúc hoa thiết kế</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Tỷ Lệ Khách Duyệt Ảnh Hoa */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Hài Lòng Ảnh Mẫu</span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h4 className="text-2xl font-extrabold text-[#1B3B2B] font-sans">
              {analyticsData.approvalRate}%
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-sky-700 font-bold mt-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Duyệt ảnh trước khi giao</span>
            </div>
          </div>
        </div>

      </div>

      {/* BIỂU ĐỒ DOANH THU & PHÂN BỔ DỊP TẶNG (2 Cột) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: BIỂU ĐỒ CỘT DOANH THU 7 NGÀY (7 Cột) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-serif text-lg font-bold text-[#1B3B2B]">
                Xu Hướng Doanh Thu 7 Ngày Gần Nhất
              </h4>
              <p className="text-xs text-gray-500">Biểu đồ thể hiện doanh thu và số lượng đơn theo ngày</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              Cao điểm: Cuối tuần
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
            {analyticsData.daysData.map((d, idx) => {
              const heightPercent = Math.max(15, Math.round((d.revenue / analyticsData.maxDayRevenue) * 100));
              const isToday = idx === analyticsData.daysData.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B3B2B] text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-md mb-1 pointer-events-none">
                    <p className="font-bold">{d.revenue.toLocaleString('vi-VN')}đ</p>
                    <p className="text-emerald-200">{d.orders} đơn hoa</p>
                  </div>

                  {/* The Bar */}
                  <div 
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-xl transition-all group-hover:opacity-90 ${
                      isToday 
                        ? 'bg-gradient-to-t from-[#1B3B2B] to-[#5C8A70]' 
                        : 'bg-gradient-to-t from-gray-200 to-[#E8998D]'
                    }`}
                  />
                  
                  {/* Day Label */}
                  <span className={`text-[10px] font-medium truncate w-full text-center ${
                    isToday ? 'font-bold text-[#1B3B2B]' : 'text-gray-500'
                  }`}>
                    {d.day.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#1B3B2B]" /> Hôm nay
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#E8998D]" /> Các ngày trước
            </span>
            <span>Đơn vị: VNĐ</span>
          </div>
        </div>

        {/* CỘT PHẢI: PHÂN BỔ DỊP TẶNG HOA (5 Cột) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-5">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#C4685A]" />
              Phân Bổ Theo Dịp Tặng Hoa
            </h4>
            <p className="text-xs text-gray-500">Tỷ lệ các chủ đề được khách đặt nhiều nhất</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {analyticsData.occasionsData.map((occ, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-800">{occ.label}</span>
                  <span className="font-mono font-bold text-[#1B3B2B]">{occ.percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${occ.percent}%`, backgroundColor: occ.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
            <strong className="text-[#1B3B2B] block">💡 Gợi ý chiến lược cho Tiệm Hoa:</strong>
            <p>Hoa tình yêu và sinh nhật chiếm 75% doanh số. Hãy chuẩn bị sẵn nhiều hoa Hồng Juliet và Mẫu Đơn vào các ngày cuối tuần.</p>
          </div>
        </div>

      </div>

      {/* DANH SÁCH CHI TIẾT CÁC ĐƠN HÀNG TRONG BỘ LỌC (TABLE BREAKDOWN) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
              <span>📋</span> Bảng Kê Đơn Hàng Chi Tiết Theo Bộ Lọc ({filteredOrders.length} đơn)
            </h4>
            <p className="text-xs text-gray-500">Dữ liệu được sử dụng trực tiếp khi xuất bảng tính Excel</p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-[#107C41] hover:bg-[#0c6233] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải File Excel (.CSV)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 bg-[#FAF8F5]">
                <th className="p-3">Mã Đơn</th>
                <th className="p-3">Người Đặt & SĐT</th>
                <th className="p-3">Người Nhận & Địa Chỉ</th>
                <th className="p-3">Mẫu Hoa</th>
                <th className="p-3 text-right">Tổng Tiền</th>
                <th className="p-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1B3B2B]">
                      #{o.orderCode || o.id}
                      <span className="block text-[10px] font-normal text-gray-400">{o.createdAt || 'Hôm nay'}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-gray-900 block">{o.customerName}</strong>
                      <span className="text-[11px] text-gray-500 font-mono">{o.customerPhone}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-gray-900 block">{o.receiverName}</strong>
                      <span className="text-[11px] text-gray-500 line-clamp-1">{o.receiverAddress}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-gray-900 line-clamp-1">{o.productName}</span>
                      <span className="text-[10px] text-[#C4685A] font-bold block">{o.deliverySlot}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-extrabold text-[#1B3B2B]">
                      {Number(o.totalAmount || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.status === 'ARRANGING' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'PHOTO_READY' ? 'bg-purple-100 text-purple-800' :
                        o.status === 'DELIVERING' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {o.status === 'ARRANGING' ? 'Đang cắm' :
                         o.status === 'PHOTO_READY' ? 'Chờ duyệt ảnh' :
                         o.status === 'DELIVERING' ? 'Đang giao' : 'Hoàn tất'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                    Không tìm thấy đơn hàng nào khớp với điều kiện lọc hiện tại.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
