import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CogIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import CreateUserModal from '../../../components/CreateUserModal';
import apiService from '../../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [systemAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Fetch real data from backend
  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching admin dashboard data...');
      
      // First try to get users
      const usersResponse = await apiService.getUsers();
      console.log('👥 Users response:', usersResponse);
      
      if (usersResponse.success) {
        const usersList = usersResponse.data || [];
        console.log('✅ Users data:', usersList);
        setUsers(usersList);
        setSelectedUser(prev => {
          if (prev) {
            const updated = usersList.find(u => u.id === prev.id);
            return updated || usersList[0] || null;
          }
          return usersList[0] || null;
        });
        
        // Calculate basic stats from users if available
        const totalUsers = usersList.length;
        const activeStudents = usersList.filter(u => u.role === 'student' && u.isActive).length;
        const totalTeachers = usersList.filter(u => u.role === 'teacher').length;
        const totalParents = usersList.filter(u => u.role === 'parent').length;
        const totalAdmins = usersList.filter(u => u.role === 'admin').length;
        
        setStats({
          totalUsers,
          activeStudents,
          totalTeachers,
          totalParents,
          totalAdmins,
          systemUptime: '99.9%'
        });

        // Get recent users (last 10)
        const recent = usersList
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(user => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            email: user.email,
            joinedDate: formatDate(user.createdAt),
            status: user.accountStatus || 'active',
            isActive: user.isActive
          }));
        
        setRecentUsers(recent);
        console.log('✅ Dashboard data set successfully');
        
        // Try to get system stats separately
        try {
          console.log('🔄 Attempting to fetch system stats...');
          const statsResponse = await apiService.getSystemStats();
          console.log('📊 Stats response:', statsResponse);
          
          if (statsResponse.success) {
            console.log('✅ Using backend stats');
            setStats(statsResponse.data);
          }
        } catch (statsError) {
          console.log('⚠️ Stats endpoint failed, using calculated stats:', statsError);
          // Already set stats from users above
        }
        
      } else {
        console.error('❌ Failed to fetch users:', usersResponse);
        toast.error('Failed to load users data');
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const adminActions = [
    {
      title: 'Create New User',
      description: 'Add students, teachers, or parents to the platform',
      icon: UserPlusIcon,
      action: () => setIsCreateUserModalOpen(true),
      color: 'blue',
      count: '+'
    },
    {
      title: 'View All Users',
      description: 'Browse and manage existing user accounts',
      icon: UserGroupIcon,
      action: () => navigate('/admin/users'),
      color: 'green',
      count: stats.totalUsers
    },
    {
      title: 'Platform Analytics',
      description: 'View user activity and platform statistics',
      icon: ChartBarIcon,
      action: () => navigate('/admin/reports'),
      color: 'purple',
      count: 'View'
    }
  ];

  const quickStats = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      change: `+${stats.totalUsers > 100 ? '12%' : 'New'}`,
      changeType: 'positive',
      icon: UserGroupIcon,
      color: 'blue'
    },
    {
      title: 'Active Students',
      value: stats.activeStudents || 0,
      change: `+${stats.activeStudents > 50 ? '8%' : 'New'}`,
      changeType: 'positive',
      icon: AcademicCapIcon,
      color: 'green'
    },
    {
      title: 'Teachers',
      value: stats.totalTeachers || 0,
      change: stats.totalTeachers > 0 ? '+Active' : 'None',
      changeType: stats.totalTeachers > 0 ? 'positive' : 'neutral',
      icon: UserGroupIcon,
      color: 'purple'
    },
    {
      title: 'System Uptime',
      value: stats.systemUptime || '100%',
      change: 'Stable',
      changeType: 'neutral',
      icon: CheckCircleIcon,
      color: 'emerald'
    }
  ];

  const getRoleBadgeClasses = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700';
      case 'teacher':
        return 'bg-purple-100 text-purple-700';
      case 'student':
        return 'bg-green-100 text-green-700';
      case 'parent':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadgeClasses = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    const normalized = status.toLowerCase();
    if (['active', 'approved'].includes(normalized)) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (['pending', 'review'].includes(normalized)) {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-red-100 text-red-700';
  };

  const formatFullDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString();
  };

  const handleSelectUser = (userRecord) => {
    setSelectedUser(userRecord);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardNavbar role="admin" currentPage="Dashboard" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardNavbar role="admin" currentPage="Dashboard" />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full">
              <CogIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Welcome back, {user?.firstName}! Manage your TinyLearn platform
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className={`bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-600 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-${stat.color}-100 text-sm font-medium`}>{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      stat.changeType === 'positive' 
                        ? `bg-${stat.color}-400 text-${stat.color}-100`
                        : `bg-${stat.color}-300 text-${stat.color}-800`
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <stat.icon className={`h-12 w-12 text-${stat.color}-200`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* User Creation Section */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    User Management
                  </h2>
                  <p className="text-gray-600">
                    Create accounts for students, teachers, parents, and administrators
                  </p>
                </div>
                <Button
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create User
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalUsers || 0}</div>
                  <div className="text-sm text-blue-700">Total Users</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeStudents || 0}</div>
                  <div className="text-sm text-green-700">Students</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalTeachers || 0}</div>
                  <div className="text-sm text-purple-700">Teachers</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalParents || 0}</div>
                  <div className="text-sm text-orange-700">Parents</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Account Creation Policy</h3>
                <p className="text-sm text-gray-600">
                  As a superadmin, you can create accounts for all user types. All created accounts 
                  are automatically approved and active.
                </p>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
                <p className="text-gray-600">Common administrative tasks</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adminActions.map((action, index) => (
                  <div
                    key={index}
                    onClick={action.action}
                    className={`p-6 rounded-xl border-2 border-gray-200 hover:border-${action.color}-300 bg-gradient-to-br from-${action.color}-50 to-${action.color}-100 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 bg-${action.color}-500 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                          <action.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold text-${action.color}-900 mb-1`}>
                            {action.title}
                          </h3>
                          <p className={`text-sm text-${action.color}-700`}>
                            {action.description}
                          </p>
                        </div>
                      </div>
                      {action.count && (
                        <div className={`bg-${action.color}-500 text-white text-sm font-bold px-2 py-1 rounded-full`}>
                          {action.count}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* User Directory */}
            <Card>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">User Directory</h2>
                  <p className="text-gray-600">Browse and inspect user records</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  View All
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.slice(0, 8).map((record) => (
                        <tr key={`${record.role}-${record.id}`} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-gray-900">
                              {record.firstName} {record.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{record.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClasses(record.role)}`}>
                              {record.role?.charAt(0).toUpperCase() + record.role?.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(record.accountStatus || (record.isActive ? 'active' : 'inactive'))}`}>
                              {record.accountStatus || (record.isActive ? 'Active' : 'Inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleSelectUser(record)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500 text-sm">
                            No users available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border border-gray-100 rounded-xl p-6 bg-gray-50">
                  {selectedUser ? (
                    <>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-lg font-semibold text-indigo-700">
                          {selectedUser.firstName?.[0]}
                          {selectedUser.lastName?.[0]}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Role</p>
                          <p className="font-semibold">{selectedUser.role}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-semibold capitalize">{selectedUser.accountStatus || (selectedUser.isActive ? 'active' : 'inactive')}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-semibold">{formatFullDate(selectedUser.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Last Update</p>
                          <p className="font-semibold">{formatFullDate(selectedUser.updatedAt)}</p>
                        </div>
                        {selectedUser.grade && (
                          <div>
                            <p className="text-gray-500">Grade</p>
                            <p className="font-semibold">{selectedUser.grade}</p>
                          </div>
                        )}
                        {selectedUser.subjectSpecialty && (
                          <div>
                            <p className="text-gray-500">Specialty</p>
                            <p className="font-semibold">{selectedUser.subjectSpecialty}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-6">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate('/admin/users')}
                        >
                          Manage User
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 text-sm">
                      Select a user to view details.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* System Alerts */}
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">System Alerts</h2>
                <p className="text-gray-600">Recent system notifications</p>
              </div>
              
              <div className="space-y-4">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'warning' 
                        ? 'border-yellow-500 bg-yellow-50'
                        : alert.type === 'error'
                        ? 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === 'warning' ? (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      ) : alert.type === 'error' ? (
                        <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-medium mb-1 ${
                          alert.type === 'warning' 
                            ? 'text-yellow-900'
                            : alert.type === 'error'
                            ? 'text-red-900'
                            : 'text-blue-900'
                        }`}>
                          {alert.title}
                        </h3>
                        <p className={`text-sm ${
                          alert.type === 'warning' 
                            ? 'text-yellow-700'
                            : alert.type === 'error'
                            ? 'text-red-700'
                            : 'text-blue-700'
                        }`}>
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Users */}
            <Card>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Recent Users</h2>
                <p className="text-gray-600">Latest user registrations</p>
              </div>
              
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={`${user.role || 'user'}-${user.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.role} • {user.joinedDate}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'approved'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white">
                View All Users
              </Button>
            </Card>

            {/* Quick Add */}
            <Card>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Add</h2>
                <p className="text-gray-600">Create new user accounts</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white justify-start"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  Create User Account
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        onUserCreated={fetchDashboardData}
      />
    </div>
  );
}
