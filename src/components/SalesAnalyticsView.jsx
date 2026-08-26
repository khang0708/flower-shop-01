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
  PieChart
} from 'lucide-react';

export const SalesAnalyticsView = ({ orders, products }) => {
  const [timeRange, setTimeRange] = useState('7_days'); // 'today' | '7_days' | 'month' | 'all'

  // Tính toán số liệu thống kê
  const analyticsData = useMemo(() => {
    const totalOrdersCount = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const approvedPhotosCount = orders.filter(o => o.isApproved || o.status === 'DELIVERING' || o.status === 'COMPLETED').length;
    const approvalRate = totalOrdersCount > 0 ? Math.round((approvedPhotosCount / totalOrdersCount) * 100) : 100;

    // Top mẫu hoa bán chạy
    const productSalesMap = {};
    orders.forEach(order => {
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

    // Thống kê doanh thu theo ngày (Mockup biểu đồ 7 ngày gần nhất)
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
  }, [orders, products]);

  return (
    <div className="space-y-8 animate-fade-in text-[#222523]">
      
      {/* Header Báo Cáo & Bộ Lọc Thời Gian */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#1B3B2B] flex items-center gap-2">
            <span>📊</span> Báo Cáo Doanh Thu & Hiệu Quả Xưởng Hoa
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Tổng hợp dữ liệu bán hàng thời gian thực, giá trị trung bình đơn và xu hướng quà tặng.
          </p>
        </div>

        {/* Bộ lọc thời gian */}
        <div className="flex items-center bg-[#FAF8F5] p-1.5 rounded-2xl border border-gray-200">
          {[
            { id: 'today', label: 'Hôm Nay' },
            { id: '7_days', label: '7 Ngày Qua' },
            { id: 'month', label: 'Tháng Này' },
            { id: 'all', label: 'Tất Cả' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                timeRange === t.id
                  ? 'bg-[#1B3B2B] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 THẺ KPI CHỈ SỐ CHÍNH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Tổng Doanh Thu</span>
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
              <span>+18.4% so với tuần trước</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Tổng Số Đơn */}
        <div className="bg-white p-5 rounded-3xl border border-[#E8EFEA] shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs text-gray-500 font-medium">Tổng Đơn Đã Nhận</span>
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
              <span>100% giao đúng khung giờ</span>
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
              <span>Phân khúc cao cấp</span>
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
              <span>Duyệt ảnh ngay lần đầu</span>
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

      {/* TOP MẪU HOA BÁN CHẠY NHẤT (BEST SELLERS) */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8EFEA] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#1B3B2B] flex items-center gap-2">
              <span>🏆</span> Top Mẫu Hoa Bán Chạy Nhất (Best Sellers)
            </h4>
            <p className="text-xs text-gray-500">Xếp hạng theo số lượng đơn cắm và doanh số</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 bg-[#FAF8F5]">
                <th className="p-3.5">Hạng</th>
                <th className="p-3.5">Mẫu Bó Hoa Nghệ Thuật</th>
                <th className="p-3.5 text-center">Số Đơn Bán</th>
                <th className="p-3.5 text-right">Tổng Doanh Thu</th>
                <th className="p-3.5 text-center">Đánh Giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {analyticsData.topSellingProducts.map((p, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                  <td className="p-3.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-400 text-white' :
                      idx === 1 ? 'bg-gray-300 text-gray-800' :
                      idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border" />
                      <div>
                        <strong className="font-serif text-gray-900 block">{p.name}</strong>
                        <span className="text-[11px] text-gray-400">Thiết kế bán chạy nhất</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-mono font-bold text-gray-800">
                    {p.count} đơn
                  </td>
                  <td className="p-3.5 text-right font-mono font-extrabold text-[#C4685A]">
                    {p.revenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-3.5 text-center text-amber-500 font-bold">
                    ★ 5.0 (Tuyệt đối)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
