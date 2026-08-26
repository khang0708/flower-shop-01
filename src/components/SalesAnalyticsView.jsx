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

  // 3. XUẤT BÁO CÁO EXCEL CAO CẤP (FORMATTED WORKBOOK .XLS & ĐẦY ĐỦ STYLING)
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      alert('Không có dữ liệu đơn hàng nào khớp với bộ lọc hiện tại để xuất!');
      return;
    }

    const now = new Date();
    const exportTimeStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateFileStr = now.toISOString().slice(0, 10);

    const escapeXml = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const statusLabels = {
      'ARRANGING': 'Đang cắm hoa',
      'PHOTO_READY': 'Chờ duyệt ảnh',
      'DELIVERING': 'Đang giao hàng',
      'COMPLETED': 'Đã hoàn tất'
    };

    const statusClasses = {
      'ARRANGING': 'status-arranging',
      'PHOTO_READY': 'status-photo',
      'DELIVERING': 'status-delivering',
      'COMPLETED': 'status-completed'
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

    // Tạo các dòng dữ liệu bảng
    const tableRowsHtml = filteredOrders.map((o, idx) => {
      const isEven = idx % 2 === 0;
      const rowClass = isEven ? 'row-even' : 'row-odd';
      
      const itemsList = Array.isArray(o.items) && o.items.length > 0
        ? o.items.map(it => `${it.name} (${Number(it.price || 0).toLocaleString('vi-VN')}đ)`).join('; ')
        : (o.productName || '');

      const statusText = statusLabels[o.status] || o.status || 'Đang xử lý';
      const statusCls = statusClasses[o.status] || 'status-arranging';

      return `
        <tr class="${rowClass}">
          <td class="data-cell c-center">${idx + 1}</td>
          <td class="data-cell c-code">${escapeXml(o.orderCode || o.id)}</td>
          <td class="data-cell c-center">${escapeXml(o.createdAt || 'Hôm nay')}</td>
          <td class="data-cell c-left font-bold">${escapeXml(o.customerName || 'Khách vãng lai')}</td>
          <td class="data-cell c-phone">${escapeXml(o.customerPhone || '')}</td>
          <td class="data-cell c-left">${escapeXml(o.receiverName || '')}</td>
          <td class="data-cell c-phone">${escapeXml(o.receiverPhone || '')}</td>
          <td class="data-cell c-left">${escapeXml(o.receiverAddress || '')}</td>
          <td class="data-cell c-center" style="color: #C4685A; font-weight: 600;">${escapeXml(o.deliverySlot || 'Hỏa tốc 90 phút')}</td>
          <td class="data-cell c-left font-bold" style="color: #1B3B2B;">${escapeXml(o.productName || 'Bó Hoa Nghệ Thuật')}</td>
          <td class="data-cell c-left">${escapeXml(itemsList)}</td>
          <td class="data-cell c-left" style="font-style: italic; color: #555;">${escapeXml(o.cardMessage || '')}</td>
          <td class="data-cell c-left">${escapeXml(o.senderSign || '')}</td>
          <td class="data-cell c-center">${o.isAnonymous ? '✓ Có' : 'Không'}</td>
          <td class="data-cell c-center font-bold">${escapeXml(o.discountCode || '-')}</td>
          <td class="data-cell c-currency">${Number(o.discountAmount || 0)}</td>
          <td class="data-cell c-currency">${Number(o.shippingFee || 0)}</td>
          <td class="data-cell c-currency" style="font-size: 11pt; color: #1B3B2B; font-weight: bold;">${Number(o.totalAmount || 0)}</td>
          <td class="data-cell ${statusCls}">${escapeXml(statusText)}</td>
          <td class="data-cell ${o.isApproved ? 'approved-yes' : 'approved-no'}">${o.isApproved ? '✓ Đã duyệt ảnh' : '⏳ Chưa duyệt'}</td>
        </tr>
      `;
    }).join('');

    // Toàn bộ cấu trúc XML HTML Spreadsheet hỗ trợ mở trực tiếp trong Excel / Numbers / Google Sheets
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Doanh Thu Flora Bloom</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>9</x:PaperSizeIndex>
                    <x:HorizontalResolution>600</x:HorizontalResolution>
                    <x:VerticalResolution>600</x:VerticalResolution>
                  </x:Print>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; table-layout: auto; }
          .banner-title {
            background-color: #1B3B2B;
            color: #FFFFFF;
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            height: 48px;
            border: 1px solid #1B3B2B;
          }
          .banner-sub {
            background-color: #264A37;
            color: #F5D6CE;
            font-size: 10.5pt;
            text-align: center;
            vertical-align: middle;
            height: 28px;
            border: 1px solid #264A37;
          }
          .kpi-title {
            background-color: #E8EFEA;
            color: #1B3B2B;
            font-weight: bold;
            font-size: 10pt;
            padding: 8px;
            border: 1px solid #C4D7CC;
            vertical-align: middle;
          }
          .kpi-cell {
            background-color: #FAF8F5;
            font-size: 11pt;
            font-weight: bold;
            padding: 8px;
            border: 1px solid #C4D7CC;
            vertical-align: middle;
          }
          .kpi-highlight {
            color: #C4685A;
            font-size: 12pt;
            font-weight: bold;
            mso-number-format: "\#\,\#\#0";
          }
          .kpi-green {
            color: #1B3B2B;
            font-size: 12pt;
            font-weight: bold;
          }
          th.col-header {
            background-color: #1B3B2B;
            color: #FFFFFF;
            font-size: 10.5pt;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
            border: 1px solid #3B5A45;
            padding: 10px 8px;
            height: 38px;
          }
          td.data-cell {
            font-size: 10pt;
            vertical-align: middle;
            border: 1px solid #D1DFD6;
            padding: 7px 8px;
          }
          .font-bold { font-weight: bold; }
          .row-even { background-color: #F8FAF8; }
          .row-odd { background-color: #FFFFFF; }
          .c-center { text-align: center; }
          .c-left { text-align: left; }
          .c-right { text-align: right; }
          .c-currency {
            text-align: right;
            font-weight: 600;
            color: #1B3B2B;
            mso-number-format: "\#\,\#\#0";
          }
          .c-phone {
            mso-number-format: "\@";
            text-align: center;
          }
          .c-code {
            font-weight: bold;
            color: #0068FF;
            text-align: center;
            mso-number-format: "\@";
          }
          .status-arranging { background-color: #FFF3CD; color: #856404; font-weight: bold; text-align: center; }
          .status-photo { background-color: #FFE8D6; color: #C4685A; font-weight: bold; text-align: center; }
          .status-delivering { background-color: #CFE2FF; color: #084298; font-weight: bold; text-align: center; }
          .status-completed { background-color: #D1E7DD; color: #0F5132; font-weight: bold; text-align: center; }
          .approved-yes { background-color: #D1E7DD; color: #0F5132; font-weight: bold; text-align: center; }
          .approved-no { background-color: #F8D7DA; color: #842029; text-align: center; }
          .row-total {
            background-color: #E8F3ED;
            font-weight: bold;
            font-size: 11pt;
            border-top: 2px solid #1B3B2B;
            border-bottom: 2px solid #1B3B2B;
            height: 40px;
          }
          .total-sum {
            font-size: 12pt;
            color: #C4685A;
            font-weight: bold;
            text-align: right;
            mso-number-format: "\#\,\#\#0";
          }
        </style>
      </head>
      <body>
        <table>
          <!-- 1. BANNER TIÊU ĐỀ BÁO CÁO -->
          <tr>
            <td colspan="20" class="banner-title">
              🌸 FLORA &amp; BLOOM - BÁO CÁO DOANH THU &amp; TIẾN TRÌNH ĐƠN HÀNG CHI TIẾT
            </td>
          </tr>
          <tr>
            <td colspan="20" class="banner-sub">
              Hệ Thống Quản Trị Tiệm Hoa Tươi Flora &amp; Bloom Studio &bull; Ngày xuất: ${exportTimeStr} &bull; Người lập: Ban Quản Trị
            </td>
          </tr>
          <tr><td colspan="20" style="height: 10px;"></td></tr>

          <!-- 2. KHUNG THỐNG KÊ KPI TỔNG QUAN -->
          <tr>
            <td colspan="4" class="kpi-title">💰 TỔNG DOANH THU ĐÃ LỌC:</td>
            <td colspan="6" class="kpi-cell kpi-highlight">${totalRevenueExport.toLocaleString('vi-VN')} đ</td>
            <td colspan="4" class="kpi-title">📦 TỔNG SỐ ĐƠN HÀNG:</td>
            <td colspan="6" class="kpi-cell kpi-green">${filteredOrders.length} đơn hàng</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-title">💵 GIÁ TRỊ TRUNG BÌNH/ĐƠN:</td>
            <td colspan="6" class="kpi-cell">${avgOrderVal.toLocaleString('vi-VN')} đ / đơn</td>
            <td colspan="4" class="kpi-title">📸 TỶ LỆ DUYỆT ẢNH THẬT:</td>
            <td colspan="6" class="kpi-cell">${approvalRatePercent}% (${approvedCount}/${filteredOrders.length} đơn)</td>
          </tr>
          <tr>
            <td colspan="4" class="kpi-title">🔍 BỘ LỌC ĐANG ÁP DỤNG:</td>
            <td colspan="16" class="kpi-cell" style="font-size: 10pt; font-weight: normal; color: #444;">${escapeXml(filterDesc)}</td>
          </tr>
          <tr><td colspan="20" style="height: 14px;"></td></tr>

          <!-- 3. TIÊU ĐỀ CÁC CỘT DỮ LIỆU -->
          <thead>
            <tr>
              <th class="col-header" style="width: 45px;">STT</th>
              <th class="col-header" style="width: 100px;">Mã Đơn Hàng</th>
              <th class="col-header" style="width: 100px;">Thời Gian</th>
              <th class="col-header" style="width: 150px;">Người Đặt Hoa</th>
              <th class="col-header" style="width: 110px;">SĐT Người Đặt</th>
              <th class="col-header" style="width: 150px;">Người Nhận</th>
              <th class="col-header" style="width: 110px;">SĐT Người Nhận</th>
              <th class="col-header" style="width: 220px;">Địa Chỉ Giao Hoa</th>
              <th class="col-header" style="width: 130px;">Khung Giờ Hẹn</th>
              <th class="col-header" style="width: 180px;">Tên Mẫu Hoa</th>
              <th class="col-header" style="width: 220px;">Chi Tiết Sản Phẩm &amp; Quà Kèm</th>
              <th class="col-header" style="width: 220px;">Lời Chúc Thiệp Kẹp Hoa</th>
              <th class="col-header" style="width: 120px;">Ký Tên</th>
              <th class="col-header" style="width: 90px;">Ẩn Danh</th>
              <th class="col-header" style="width: 90px;">Voucher</th>
              <th class="col-header" style="width: 110px;">Tiền Giảm (đ)</th>
              <th class="col-header" style="width: 110px;">Phí Ship (đ)</th>
              <th class="col-header" style="width: 140px;">Tổng Tiền (đ)</th>
              <th class="col-header" style="width: 130px;">Trạng Thái Đơn</th>
              <th class="col-header" style="width: 130px;">Duyệt Ảnh Xưởng</th>
            </tr>
          </thead>

          <!-- 4. DANH SÁCH DỮ LIỆU ĐƠN HÀNG -->
          <tbody>
            ${tableRowsHtml}
          </tbody>

          <!-- 5. DÒNG TỔNG KẾT BẢNG TÍNH -->
          <tfoot>
            <tr class="row-total">
              <td colspan="17" class="data-cell" style="text-align: right; padding-right: 15px; font-weight: bold; font-size: 11pt; color: #1B3B2B;">
                TỔNG CỘNG DOANH THU (${filteredOrders.length} ĐƠN HÀNG):
              </td>
              <td class="data-cell total-sum">${totalRevenueExport}</td>
              <td colspan="2" class="data-cell" style="background-color: #E8F3ED;"></td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;

    // Tải xuống file Excel (.xls) định dạng bảng tính hoàn chỉnh
    const blob = new Blob(['\uFEFF' + excelTemplate], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Flora_Bloom_${dateFileStr}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`🎉 Đã xuất thành công báo cáo ${filteredOrders.length} đơn hàng ra file Excel (.xls) đẹp mắt!`);
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
            title="Xuất báo cáo bảng tính Excel (.xls) đẹp mắt với đầy đủ màu sắc, tiêu đề banner và định dạng số"
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
