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
  // 2. TÍNH TOÁN SỐ LIỆU THỐNG KÊ DỰA TRÊN 100% ĐƠN HÀNG THẬT
  const analyticsData = useMemo(() => {
    const totalOrdersCount = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const approvedPhotosCount = filteredOrders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRate = totalOrdersCount > 0 ? Math.round((approvedPhotosCount / totalOrdersCount) * 100) : 100;

    // 1. Top mẫu hoa bán chạy từ dữ liệu thật
    const productSalesMap = {};
    filteredOrders.forEach(order => {
      const pName = order.productName?.split('(')[0]?.trim() || 'Bó Hoa Nghệ Thuật';
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = {
          name: pName,
          count: 0,
          revenue: 0,
          image: order.proofPhotoUrl || order.catalogSamplePhoto || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=400&q=80'
        };
      }
      productSalesMap[pName].count += 1;
      productSalesMap[pName].revenue += Number(order.totalAmount || 0);
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
      .slice(0, 5);

    // 2. Biểu đồ doanh thu 7 ngày thực tế (Tính đúng theo ngày tạo & khung giờ đơn)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const now = new Date();
    const daysData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayOfWeek = dayNames[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${dayNum}/${monthNum}`;
      const isToday = i === 0;
      const dayLabel = isToday ? `Hôm nay (${dateStr})` : `${dayOfWeek} (${dateStr})`;

      // Lọc các đơn thật thuộc ngày này
      const matchedOrders = filteredOrders.filter(order => {
        const cTime = order.createdAt || '';
        const dSlot = order.deliverySlot || '';
        
        // Nếu đơn tạo hôm nay hoặc có định dạng giờ HH:mm
        if (isToday) {
          if (cTime.includes(dateStr) || /^\d{1,2}:\d{2}/.test(cTime) || cTime === 'Hôm nay') {
            return true;
          }
        } else {
          if (cTime.includes(dateStr) || dSlot.includes(dateStr)) {
            return true;
          }
        }
        return false;
      });

      const dayRevenue = matchedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
      const dayOrdersCount = matchedOrders.length;

      daysData.push({
        day: dayLabel,
        shortDay: isToday ? 'Hôm nay' : dayOfWeek,
        dateFormatted: dateStr,
        revenue: dayRevenue,
        orders: dayOrdersCount
      });
    }

    // Nếu các ngày trước chưa có đơn lẻ (do tạo test hôm nay), hiển thị chính xác ngày hôm nay với doanh thu thật
    const maxDayRevenue = Math.max(...daysData.map(d => d.revenue), 1);
    const peakDay = daysData.reduce((max, d) => (d.revenue > max.revenue ? d : max), daysData[daysData.length - 1]);
    const peakDayLabel = peakDay && peakDay.revenue > 0 
      ? `Cao điểm: ${peakDay.shortDay} (${peakDay.revenue.toLocaleString('vi-VN')}đ)`
      : `Ghi nhận ${totalOrdersCount} đơn thực tế`;

    // 3. Phân bổ Dịp Tặng Hoa 100% dựa trên nội dung thiệp & tên sản phẩm thật
    let loveCount = 0;
    let birthdayCount = 0;
    let openingCount = 0;
    let otherCount = 0;

    filteredOrders.forEach(o => {
      const text = `${o.cardMessage || ''} ${o.productName || ''} ${o.senderSign || ''}`.toLowerCase();
      if (/yêu|em|anh|bà xã|người yêu|kỷ niệm|valentine|juliet|forever|thương|hôn|vợ yêu/.test(text)) {
        loveCount++;
      } else if (/sinh nhật|tuổi mới|sn|hpbd|birthday|chúc mừng sinh nhật|tuổi/.test(text)) {
        birthdayCount++;
      } else if (/khai trương|hồng phát|thành công|phát tài|tấn tài|thịnh vượng|chúc mừng|doanh nghiệp/.test(text)) {
        openingCount++;
      } else {
        otherCount++;
      }
    });

    const divisor = totalOrdersCount > 0 ? totalOrdersCount : 1;
    const occasionsData = [
      { label: 'Tình Yêu & Kỷ Niệm', count: loveCount, percent: Math.round((loveCount / divisor) * 100), color: '#C4685A' },
      { label: 'Sinh Nhật Rạng Rỡ', count: birthdayCount, percent: Math.round((birthdayCount / divisor) * 100), color: '#E8998D' },
      { label: 'Khai Trương Hồng Phát', count: openingCount, percent: Math.round((openingCount / divisor) * 100), color: '#1B3B2B' },
      { label: 'Lời Cảm Ơn / Khác', count: otherCount, percent: Math.round((otherCount / divisor) * 100), color: '#5C8A70' },
    ];

    // Gợi ý chiến lược thật dựa trên số liệu thực tế
    const topOccasion = [...occasionsData].sort((a, b) => b.count - a.count)[0];
    const topProduct = topSellingProducts[0];
    let strategyAdvice = 'Chưa có dữ liệu đơn hàng thỏa mãn bộ lọc.';
    if (totalOrdersCount > 0 && topOccasion && topProduct) {
      strategyAdvice = `Dịp "${topOccasion.label}" đang chiếm ${topOccasion.percent}% với ${topOccasion.count} đơn hàng. Mẫu "${topProduct.name}" bán chạy nhất, mang về ${(topProduct.revenue || 0).toLocaleString('vi-VN')}đ doanh thu thực tế.`;
    }

    return {
      totalRevenue,
      totalOrdersCount,
      averageOrderValue,
      approvalRate,
      topSellingProducts,
      daysData,
      maxDayRevenue,
      peakDayLabel,
      occasionsData,
      strategyAdvice
    };
  }, [filteredOrders]);

  // 3. XUẤT BÁO CÁO EXCEL (.CSV UTF-8 BOM CHUẨN - KHÔNG BỊ CẢNH BÁO EXTENSION MISMATCH)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('Không có dữ liệu đơn hàng nào khớp với bộ lọc hiện tại để xuất!');
      return;
    }

    const now = new Date();
    const exportTimeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateFileStr = now.toISOString().slice(0, 10);

    const statusLabels = {
      'ARRANGING': 'Đang cắm hoa',
      'PHOTO_READY': 'Chờ duyệt ảnh',
      'DELIVERING': 'Đang giao hàng',
      'COMPLETED': 'Đã hoàn tất'
    };

    const totalRevenueExport = filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const avgOrderVal = Math.round(totalRevenueExport / filteredOrders.length);
    const approvedCount = filteredOrders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRatePercent = Math.round((approvedCount / filteredOrders.length) * 100);

    // Xây dựng mô tả bộ lọc đang áp dụng
    const filterDesc = [
      statusFilter !== 'all' ? `Trạng thái: ${statusLabels[statusFilter] || statusFilter}` : 'Trạng thái: Tất cả',
      searchKeyword ? `Từ khóa: "${searchKeyword}"` : null,
      (minPrice || maxPrice) ? `Khoảng giá: ${minPrice ? Number(minPrice).toLocaleString('vi-VN') + 'đ' : '0đ'} - ${maxPrice ? Number(maxPrice).toLocaleString('vi-VN') + 'đ' : 'Vô cực'}` : null
    ].filter(Boolean).join(' | ');

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    // 1. Tiêu đề và thông tin KPI quản trị
    const lines = [
      `"FLORA & BLOOM - BÁO CÁO DOANH THU & TIẾN TRÌNH ĐƠN HÀNG CHI TIẾT"`,
      `"Thời gian xuất: ${exportTimeStr}"`,
      `"Người lập: Ban Quản Trị Tiệm Hoa Flora & Bloom Studio"`,
      `"Bộ lọc đang áp dụng: ${filterDesc}"`,
      `""`,
      `"--- TỔNG QUAN CHỈ SỐ KINH DOANH (KPI) ---"`,
      `"Tổng doanh thu đã lọc (VNĐ):",${totalRevenueExport}`,
      `"Tổng số lượng đơn hàng:",${filteredOrders.length},"đơn hoa"`,
      `"Giá trị đơn trung bình (AOV):",${avgOrderVal},"VNĐ/đơn"`,
      `"Tỷ lệ duyệt ảnh thực tế:","${approvalRatePercent}% (${approvedCount}/${filteredOrders.length} đơn)"`,
      `""`,
      `"--- BẢNG KÊ CHI TIẾT ĐƠN HÀNG ---"`,
      [
        'STT',
        'Mã Đơn Hàng',
        'Thời Gian Đặt',
        'Tên Khách Đặt',
        'SĐT Khách Đặt',
        'Tên Người Nhận',
        'SĐT Người Nhận',
        'Địa Chỉ Giao Hoa',
        'Khung Giờ Hẹn',
        'Tên Mẫu Hoa',
        'Chi Tiết Sản Phẩm & Quà Kèm',
        'Lời Chúc Thiệp',
        'Ký Tên',
        'Giao Ẩn Danh',
        'Mã Voucher',
        'Tiền Giảm (VNĐ)',
        'Phí Ship (VNĐ)',
        'Tổng Tiền (VNĐ)',
        'Trạng Thái Đơn',
        'Duyệt Ảnh Xưởng'
      ].map(escapeCsv).join(',')
    ];

    // 2. Từng dòng dữ liệu đơn hàng (Giữ số 0 đầu SĐT bằng công thức ="0901234567")
    filteredOrders.forEach((o, idx) => {
      const itemsList = Array.isArray(o.items) && o.items.length > 0
        ? o.items.map(it => `${it.name} (${Number(it.price || 0).toLocaleString('vi-VN')}đ)`).join('; ')
        : (o.productName || '');

      const customerPhoneFormatted = o.customerPhone ? `="""${o.customerPhone}"""` : '""';
      const receiverPhoneFormatted = o.receiverPhone ? `="""${o.receiverPhone}"""` : '""';
      const orderCodeFormatted = `="""${o.orderCode || o.id}"""`;

      const row = [
        idx + 1,
        orderCodeFormatted,
        escapeCsv(o.createdAt || 'Hôm nay'),
        escapeCsv(o.customerName || 'Khách vãng lai'),
        customerPhoneFormatted,
        escapeCsv(o.receiverName || ''),
        receiverPhoneFormatted,
        escapeCsv(o.receiverAddress || ''),
        escapeCsv(o.deliverySlot || 'Hỏa tốc 90 phút'),
        escapeCsv(o.productName || 'Bó Hoa Nghệ Thuật'),
        escapeCsv(itemsList),
        escapeCsv(o.cardMessage || ''),
        escapeCsv(o.senderSign || ''),
        escapeCsv(o.isAnonymous ? 'Có' : 'Không'),
        escapeCsv(o.discountCode || '-'),
        Number(o.discountAmount || 0),
        Number(o.shippingFee || 0),
        Number(o.totalAmount || 0),
        escapeCsv(statusLabels[o.status] || o.status || 'Đang xử lý'),
        escapeCsv(o.isApproved ? 'Đã duyệt ảnh' : 'Chưa duyệt')
      ];
      lines.push(row.join(','));
    });

    // 3. Dòng tổng kết ở chân bảng
    const totalDiscount = filteredOrders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
    const totalShipping = filteredOrders.reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

    const summaryRow = [
      `"TỔNG CỘNG (${filteredOrders.length} ĐƠN HÀNG)"`,
      '""', '""', '""', '""', '""', '""', '""', '""', '""', '""', '""', '""', '""', '""',
      totalDiscount,
      totalShipping,
      totalRevenueExport,
      '""', '""'
    ];
    lines.push(summaryRow.join(','));

    // Tải xuống file CSV kèm UTF-8 BOM (\uFEFF) mở trong Excel hiển thị tiếng Việt hoàn hảo, không có cảnh báo
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Flora_Bloom_${dateFileStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`🎉 Đã xuất thành công báo cáo ${filteredOrders.length} đơn hàng ra file Excel (.csv UTF-8 chuẩn)!`);
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
            title="Xuất báo cáo bảng tính Excel (.csv UTF-8 chuẩn) mở trực tiếp không bị cảnh báo định dạng"
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
              <p className="text-xs text-gray-500">Biểu đồ thể hiện doanh thu và số lượng đơn hàng thực tế theo từng ngày</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {analyticsData.peakDayLabel}
            </span>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-gray-100">
            {analyticsData.daysData.map((d, idx) => {
              const heightPercent = Math.max(12, Math.round((d.revenue / analyticsData.maxDayRevenue) * 100));
              const isToday = idx === analyticsData.daysData.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#1B3B2B] text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap shadow-md mb-1 pointer-events-none z-10">
                    <p className="font-bold">{d.revenue.toLocaleString('vi-VN')}đ</p>
                    <p className="text-emerald-200">{d.orders} đơn thực tế</p>
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
                    {d.shortDay}
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
              Phân Bổ Theo Dịp Tặng Hoa Thực Tế
            </h4>
            <p className="text-xs text-gray-500">Thống kê từ nội dung thiệp &amp; mẫu hoa của các đơn hàng thật</p>
          </div>

          <div className="space-y-3.5 pt-2">
            {analyticsData.occasionsData.map((occ, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-800">{occ.label} <span className="text-gray-400 font-normal">({occ.count} đơn)</span></span>
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
            <p className="leading-relaxed">{analyticsData.strategyAdvice}</p>
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
            <span>Tải Báo Cáo Excel (.CSV)</span>
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
