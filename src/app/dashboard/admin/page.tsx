'use client';

import React, { useState } from 'react';
import { Users, Store, DollarSign, Zap } from 'lucide-react';
import KPICard from '../components/KPICard';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import type { UserProfile } from '@/lib/schemas/dashboard';

const mockAdminKPIs = {
  totalUsers: 1250,
  totalStores: 85,
  totalRevenue: 125000,
  systemUptime: 99.9,
};

const mockUsers: UserProfile[] = [
  {
    id: '1',
    name: 'Juan Carlos',
    email: 'juan@emprendyup.com',
    role: 'ADMIN',
    avatar: '/api/placeholder/40/40',
    company: 'EmprendyUp',
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    email: 'maria@example.com',
    role: 'USER',
    avatar: '/api/placeholder/40/40',
    company: 'Fashion Store',
  },
  {
    id: '3',
    name: 'Carlos Mendez',
    email: 'carlos@example.com',
    role: 'USER',
    avatar: '/api/placeholder/40/40',
    company: 'Tech Gadgets',
  },
];

const mockSystemLogs = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    level: 'info',
    message: 'User login successful',
    user: 'juan@emprendyup.com',
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    level: 'warning',
    message: 'High memory usage detected',
    system: 'App Server',
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    level: 'error',
    message: 'Payment gateway timeout',
    system: 'Payment Service',
  },
];

const mockChartData = [
  { date: '2024-01-08', users: 120, stores: 8, revenue: 15000 },
  { date: '2024-01-09', users: 130, stores: 9, revenue: 18000 },
  { date: '2024-01-10', users: 125, stores: 8, revenue: 16000 },
  { date: '2024-01-11', users: 140, stores: 10, revenue: 22000 },
  { date: '2024-01-12', users: 150, stores: 12, revenue: 25000 },
  { date: '2024-01-13', users: 135, stores: 11, revenue: 20000 },
  { date: '2024-01-14', users: 160, stores: 13, revenue: 28000 },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'stores', name: 'Stores', icon: '🏪' },
    { id: 'system', name: 'System', icon: '⚙️' },
  ];

  const toggleUserStatus = (userId: string) => {
    // In a real app, this would make an API call
  };

  const deleteUser = (userId: string) => {
    // In a real app, this would make an API call
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            System administration and user management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            System Healthy
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Users"
                  value={mockAdminKPIs.totalUsers.toLocaleString()}
                  trend={{ value: 12, isPositive: true }}
                  icon={Users}
                />
                <KPICard
                  title="Active Stores"
                  value={mockAdminKPIs.totalStores.toLocaleString()}
                  trend={{ value: 8, isPositive: true }}
                  icon={Store}
                />
                <KPICard
                  title="Platform Revenue"
                  value={`$${(mockAdminKPIs.totalRevenue / 1000).toFixed(0)}K`}
                  trend={{ value: 15, isPositive: true }}
                  icon={DollarSign}
                />
                <KPICard
                  title="System Uptime"
                  value={`${mockAdminKPIs.systemUptime}%`}
                  trend={{ value: 0, isPositive: true }}
                  icon={Zap}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChart
                  data={mockChartData}
                  xKey="date"
                  yKey="users"
                  title="User Growth"
                  color="#3b82f6"
                />
                <BarChart
                  data={mockChartData}
                  xKey="date"
                  yKey="stores"
                  title="Store Growth"
                  color="#10b981"
                />
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent System Logs
                </h3>
                <div className="space-y-3">
                  {mockSystemLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.level === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : log.level === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {log.level}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{log.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.timestamp).toLocaleString()} • {log.user || log.system}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Management
                </h3>
                <div className="flex items-center space-x-2">
                  <input
                    type="search"
                    placeholder="Search users..."
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                    Add User
                  </button>
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={user.avatar || '/api/placeholder/40/40'}
                              alt={user.name}
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {user.company || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                            </button>
                            {user.role !== 'ADMIN' && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={user.avatar || '/api/placeholder/48/48'}
                        alt={user.name}
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {user.role}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {user.company || 'No company'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  Store Management
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Store management features coming soon.
                </p>
              </div>
            </div>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Health
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        API Response Time
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        45ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Database Status
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Healthy
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        78%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Active Connections
                      </span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        1,247
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Actions
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-left">
                      Clear Cache
                    </button>
                    <button className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-left">
                      Restart Services
                    </button>
                    <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-left">
                      Generate Report
                    </button>
                    <button className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-left">
                      Maintenance Mode
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedUser.name}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  defaultValue={selectedUser.role}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
