import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import apiService from '../../../services/api';
import toast from 'react-hot-toast';
import EditUserModal from '../../../components/EditUserModal';

const roleLabels = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent'
};

const badgeClasses = {
  admin: 'bg-red-100 text-red-700',
  teacher: 'bg-purple-100 text-purple-700',
  student: 'bg-green-100 text-green-700',
  parent: 'bg-orange-100 text-orange-700'
};

export default function AdminUserDetails() {
  const { role, userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserById(userId, role);
      if (response.success) {
        setUser(response.data);
      } else {
        toast.error(response.message || 'Failed to load user');
      }
    } catch (error) {
      console.error('Failed to load user', error);
      toast.error(error.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role && userId) {
      fetchUser();
    }
  }, [role, userId]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await apiService.deleteUser(userId, role);
      toast.success('User deleted');
      navigate('/admin/users');
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardNavbar role="admin" currentPage="User Details" />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardNavbar role="admin" currentPage="User Details" />
        <div className="max-w-6xl mx-auto p-6 text-center">
          <Card className="p-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User not found</h2>
            <Button onClick={() => navigate('/admin/users')}>Back to Users</Button>
          </Card>
        </div>
      </div>
    );
  }

  const infoRows = [
    { label: 'First Name', value: user.firstName },
    { label: 'Last Name', value: user.lastName },
    { label: 'Email', value: user.email },
    { label: 'Role', value: roleLabels[user.role] || user.role },
    { label: 'Status', value: user.accountStatus || (user.isActive ? 'Active' : 'Inactive') },
    { label: 'Created At', value: new Date(user.createdAt).toLocaleString() },
    { label: 'Updated At', value: new Date(user.updatedAt).toLocaleString() }
  ];

  if (user.grade) infoRows.push({ label: 'Grade', value: user.grade });
  if (user.subjectSpecialty) infoRows.push({ label: 'Specialty', value: user.subjectSpecialty });
  if (user.phoneNumber) infoRows.push({ label: 'Phone Number', value: user.phoneNumber });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardNavbar role="admin" currentPage="User Details" />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="text-red-600" onClick={handleDelete}>
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-semibold text-indigo-600">
              {user.firstName?.[0]}
              {user.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
              <div className="flex gap-2 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badgeClasses[user.role] || 'bg-gray-100 text-gray-700'}`}>
                  {roleLabels[user.role] || user.role}
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infoRows.map((row) => (
              <div key={row.label}>
                <p className="text-xs uppercase text-gray-500 tracking-wide">{row.label}</p>
                <p className="text-base font-semibold text-gray-900">{row.value || '—'}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={fetchUser}
        userId={userId}
        selectedUser={user}
        role={role}
      />
    </div>
  );
}

