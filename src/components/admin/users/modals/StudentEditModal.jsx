import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../../../ui/Button';
import apiService from '../../../../services/api';

const STATUS_OPTIONS = ['active', 'pending', 'suspended', 'deleted'];
const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const defaultFormState = {
  firstName: '',
  lastName: '',
  email: '',
  age: '',
  grade: '',
  accountStatus: 'active',
  isActive: true
};

const StudentEditModal = ({ isOpen, onClose, onUserUpdated, userId, selectedUser }) => {
  const [form, setForm] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hydratedForm = useMemo(() => ({
    firstName: selectedUser?.firstName || '',
    lastName: selectedUser?.lastName || '',
    email: selectedUser?.email || '',
    age: selectedUser?.age ?? '',
    grade: selectedUser?.grade || '',
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

    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const response = await apiService.getUserById(userId, 'student');
        if (response.success) {
          const user = response.data;
          setForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            age: user.age ?? '',
            grade: user.grade || '',
            accountStatus: user.accountStatus || 'active',
            isActive: user.isActive ?? true
          });
        } else {
          toast.error(response.message || 'Failed to load student details');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load student details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
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

    if (!form.grade) nextErrors.grade = 'Grade is required';
    if (!form.age) nextErrors.age = 'Age is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const ageValue = form.age === '' ? undefined : Number(form.age);
      await apiService.updateUser(
        userId,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          grade: form.grade,
          age: ageValue,
          accountStatus: form.accountStatus,
          isActive: form.isActive,
          role: 'student'
        },
        'student'
      );

      toast.success('Student updated successfully');
      onUserUpdated?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update student');
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
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${errors.firstName ? 'border-red-500' : ''}`}
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${errors.lastName ? 'border-red-500' : ''}`}
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
                      Grade
                    </label>
                    <select
                      name="grade"
                      value={form.grade}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${errors.grade ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select grade</option>
                      {GRADES.map(grade => (
                        <option key={grade} value={grade}>
                          {grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
                        </option>
                      ))}
                    </select>
                    {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      min={3}
                      max={18}
                      value={form.age}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${errors.age ? 'border-red-500' : ''}`}
                    />
                    {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                      id="studentIsActive"
                      name="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="studentIsActive" className="ml-2 text-sm text-gray-700">
                      Active Student
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="bg-green-600 text-white hover:bg-green-700">
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

export default StudentEditModal;

