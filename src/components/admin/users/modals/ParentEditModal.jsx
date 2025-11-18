import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../../../ui/Button';
import apiService from '../../../../services/api';

const STATUS_OPTIONS = ['active', 'pending', 'suspended', 'deleted'];
const RELATIONSHIP_OPTIONS = ['mother', 'father', 'guardian', 'relative', 'other'];

const defaultFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  relationship: '',
  accountStatus: 'active',
  isActive: true
};

const ParentEditModal = ({ isOpen, onClose, onUserUpdated, userId, selectedUser }) => {
  const [form, setForm] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hydratedForm = useMemo(() => ({
    firstName: selectedUser?.firstName || '',
    lastName: selectedUser?.lastName || '',
    email: selectedUser?.email || '',
    phoneNumber: selectedUser?.phoneNumber || '',
    relationship: selectedUser?.relationship || '',
    accountStatus: selectedUser?.accountStatus || 'active',
    isActive: selectedUser?.isActive ?? true
  }), [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setForm(hydratedForm);
    }
  }, [hydratedForm, selectedUser]);

  useEffect(() => {
    if (!isOpen || selectedUser || !userId) return;

    const fetchParent = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserById(userId, 'parent');
        if (response.success) {
          const user = response.data;
          setForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            relationship: user.relationship || '',
            accountStatus: user.accountStatus || 'active',
            isActive: user.isActive ?? true
          });
        } else {
          toast.error(response.message || 'Failed to load parent details');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load parent details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchParent();
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
          phoneNumber: form.phoneNumber,
          relationship: form.relationship,
          accountStatus: form.accountStatus,
          isActive: form.isActive,
          role: 'parent'
        },
        'parent'
      );

      toast.success('Parent updated successfully');
      onUserUpdated?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update parent');
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
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Parent</h3>
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${errors.firstName ? 'border-red-500' : ''}`}
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 ${errors.lastName ? 'border-red-500' : ''}`}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email (read only)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-200 bg-gray-100 shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={form.phoneNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <select
                      name="relationship"
                      value={form.relationship}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    >
                      <option value="">Select relationship</option>
                      {RELATIONSHIP_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Status
                    </label>
                    <select
                      name="accountStatus"
                      value={form.accountStatus}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center pt-6">
                    <input
                      id="parentIsActive"
                      name="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="parentIsActive" className="ml-2 text-sm text-gray-700">
                      Active Parent
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="bg-orange-600 text-white hover:bg-orange-700">
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

export default ParentEditModal;

