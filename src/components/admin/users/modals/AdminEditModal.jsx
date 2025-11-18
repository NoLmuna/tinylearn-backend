import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../../../ui/Button';
import apiService from '../../../../services/api';

const STATUS_OPTIONS = ['active', 'pending', 'suspended', 'deleted'];

const defaultFormState = {
  firstName: '',
  lastName: '',
  email: '',
  accountStatus: 'active',
  isSuperAdmin: false
};

const AdminEditModal = ({ isOpen, onClose, onUserUpdated, userId, selectedUser }) => {
  const [form, setForm] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hydratedForm = useMemo(() => ({
    firstName: selectedUser?.firstName || '',
    lastName: selectedUser?.lastName || '',
    email: selectedUser?.email || '',
    accountStatus: selectedUser?.accountStatus || 'active',
    isSuperAdmin: Boolean(selectedUser?.isSuperAdmin)
  }), [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setForm(hydratedForm);
    }
  }, [hydratedForm, selectedUser]);

  useEffect(() => {
    if (!isOpen || selectedUser || !userId) return;

    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserById(userId, 'admin');
        if (response.success) {
          const user = response.data;
          setForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            accountStatus: user.accountStatus || 'active',
            isSuperAdmin: Boolean(user.isSuperAdmin)
          });
        } else {
          toast.error(response.message || 'Failed to load admin details');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load admin details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [isOpen, selectedUser, userId]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';

    if (!form.email.trim()) nextErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) nextErrors.email = 'Invalid email format';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await apiService.updateUser(
        userId,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          accountStatus: form.accountStatus,
          isSuperAdmin: form.isSuperAdmin,
          role: 'admin'
        },
        'admin'
      );

      toast.success('Admin updated successfully');
      onUserUpdated?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update admin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm(defaultFormState);
    setErrors({});
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 py-8">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Administrator</h3>
          <button onClick={handleClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.firstName ? 'border-red-500' : ''}`}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.lastName ? 'border-red-500' : ''}`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Status
                    </label>
                    <select
                      name="accountStatus"
                      value={form.accountStatus}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-6">
                    <input
                      id="isSuperAdmin"
                      name="isSuperAdmin"
                      type="checkbox"
                      checked={form.isSuperAdmin}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isSuperAdmin" className="text-sm font-medium text-gray-700">
                      Super Admin Privileges
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminEditModal;

