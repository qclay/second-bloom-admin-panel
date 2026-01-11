'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/category.service';
import { productService } from '@/services/product.service';
import { orderService } from '@/services/order.service';
import { userService } from '@/services/user.service';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardPage() {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll({}),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({}),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getAll({}),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAll({}),
  });

  const totalProducts = productsData?.data.length || 0;
  const totalOrders = ordersData?.data.length || 0;
  const totalUsers = usersData?.data.length || 0;
  const totalCategories = categoriesData?.data.length || 0;
  const totalRevenue = ordersData?.data.reduce((sum, order) => sum + order.totalPrice, 0) || 0;
  const pendingOrders = ordersData?.data.filter(o => o.status === 'PENDING').length || 0;

  // Mock data for charts (replace with real data when available)
  const orderStatusData = [
    { name: 'Pending', value: ordersData?.data.filter(o => o.status === 'PENDING').length || 0 },
    { name: 'Confirmed', value: ordersData?.data.filter(o => o.status === 'CONFIRMED').length || 0 },
    { name: 'Processing', value: ordersData?.data.filter(o => o.status === 'PROCESSING').length || 0 },
    { name: 'Shipped', value: ordersData?.data.filter(o => o.status === 'SHIPPED').length || 0 },
    { name: 'Delivered', value: ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0 },
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 },
  ];

  const productCategoryData = categoriesData?.data.map(cat => ({
    name: cat.name,
    products: productsData?.data.filter(p => p.categoryId === cat.id).length || 0,
  })) || [];

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts.toString(),
      icon: '📦',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: '🛒',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Total Users',
      value: totalUsers.toString(),
      icon: '👥',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: '💰',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      iconBg: 'bg-yellow-500',
    },
    {
      title: 'Categories',
      value: totalCategories.toString(),
      icon: '📁',
      bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100',
      iconBg: 'bg-pink-500',
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      icon: '⏳',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      iconBg: 'bg-orange-500',
    },
  ];

  return (
    <div className="p-8 page-transition">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-in">Dashboard</h1>
        <p className="text-gray-600 animate-slide-in" style={{ animationDelay: '0.1s' }}>Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={`stats-card rounded-2xl p-6 ${stat.bgColor} animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Products by Category Chart */}
      {productCategoryData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Products by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Bar dataKey="products" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 animate-fade-in card-animate" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/categories"
            className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <span className="text-xl">📁</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Categories</h3>
                <p className="text-sm text-gray-600">Organize products</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/dashboard/products"
            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Manage Products</h3>
                <p className="text-sm text-gray-600">Add or edit items</p>
              </div>
            </div>
          </Link>
          
          <Link
            href="/dashboard/orders"
            className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group card-animate"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Track all orders</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                0
              </div>
              <div>
                <p className="font-medium text-gray-900">No activity yet</p>
                <p className="text-sm text-gray-600">Start managing your store</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-animate animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
              <span className="font-medium text-gray-700">Active Products</span>
              <span className="text-2xl font-bold text-blue-600">{totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
              <span className="font-medium text-gray-700">Completed Orders</span>
              <span className="text-2xl font-bold text-green-600">
                {ordersData?.data.filter(o => o.status === 'DELIVERED').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
              <span className="font-medium text-gray-700">Total Categories</span>
              <span className="text-2xl font-bold text-purple-600">{totalCategories}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
