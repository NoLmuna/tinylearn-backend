import { useEffect, useMemo, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../../../ui/Button';
import apiService from '../../../../services/api';

const STATUS_OPTIONS = ['pending', 'active', 'suspended'];

const defaultFormState = {
  firstName: '',
  lastName: '',
  email: '',
  subjectSpecialty: '',
  bio: '',
  accountStatus: 'pending',
  isActive: true
};

const TeacherEditModal = ({ isOpen, onClose, onUserUpdated, userId, selectedUser }) => {
  const [form, setForm] = useState(defaultFormState);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  const hydratedForm = useMemo(() => ({
    firstName: selectedUser?.firstName || '',
    lastName: selectedUser?.lastName || '',
    email: selectedUser?.email || '',
    subjectSpecialty: selectedUser?.subjectSpecialty || '',
    bio: selectedUser?.bio || '',
    accountStatus: selectedUser?.accountStatus || 'pending',
    isActive: selectedUser?.isActive ?? true
  }), [selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      setForm(hydratedForm);
    }
  }, [hydratedForm, selectedUser]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchTeacher = async () => {
      setIsLoading(true);
      try {
        if (!selectedUser) {
          const response = await apiService.getUserById(userId, 'teacher');
          if (response.success) {
            const user = response.data;
            setForm({
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              subjectSpecialty: user.subjectSpecialty || '',
              bio: user.bio || '',
              accountStatus: user.accountStatus || 'pending',
              isActive: user.isActive ?? true
            });
          } else {
            toast.error(response.message || 'Failed to load teacher details');
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load teacher details');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStudents = async () => {
      setIsStudentsLoading(true);
      try {
        const [studentsResponse, teacherStudentsResponse] = await Promise.all([
          apiService.getUsers('student'),
          apiService.getTeacherStudents(userId)
        ]);

        if (studentsResponse.success) {
          setStudentOptions(studentsResponse.data || []);
        } else {
          toast.error(studentsResponse.message || 'Failed to load students');
        }

        if (teacherStudentsResponse.success) {
          const assignedIds = (teacherStudentsResponse.data || []).map((student) => student.id);
          setSelectedStudentIds(assignedIds);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load students');
      } finally {
        setIsStudentsLoading(false);
      }
    };

    fetchTeacher();
    fetchStudents();
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
          bio: form.bio,
          subjectSpecialty: form.subjectSpecialty,
          role: 'teacher'
        },
        'teacher'
      );

      const updates = [
        apiService.updateTeacherAccountState(userId, {
          accountStatus: form.accountStatus,
          isActive: form.isActive
        })
      ];

      if (selectedStudentIds && selectedStudentIds.length >= 0) {
        updates.push(apiService.assignStudentsToTeacher(userId, selectedStudentIds));
      }

      await Promise.all(updates);

      toast.success('Teacher updated successfully');
      onUserUpdated?.();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update teacher');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setForm(defaultFormState);
    setErrors({});
    setStudentSearch('');
    setStudentOptions([]);
    setSelectedStudentIds([]);
    onClose?.();
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return studentOptions;
    return studentOptions.filter((student) => {
      const name = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      return (
        name.includes(studentSearch.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentSearch.toLowerCase())
      );
    });
  }, [studentOptions, studentSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm px-4 py-8">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Teacher</h3>
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${errors.firstName ? 'border-red-500' : ''}`}
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
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 ${errors.lastName ? 'border-red-500' : ''}`}
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
                      Subject Specialty
                    </label>
                    <input
                      type="text"
                      name="subjectSpecialty"
                      value={form.subjectSpecialty}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Status
                    </label>
                    <select
                      name="accountStatus"
                      value={form.accountStatus}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="teacherIsActive"
                    name="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="teacherIsActive" className="ml-2 text-sm text-gray-700">
                    Active Teacher
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assigned Students
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select which students belong to this teacher. {selectedStudentIds.length} selected.
                  </p>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-gray-50">
                    {isStudentsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-purple-500" />
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <label
                          key={student.id}
                          className="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-3 py-2 text-sm last:border-b-0 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                            className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-xs text-gray-500">{student.email}</span>
                          </div>
                          {student.grade && (
                            <span className="ml-auto text-xs text-gray-500">
                              Grade {student.grade}
                            </span>
                          )}
                        </label>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-gray-500">
                        No students found
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving} className="bg-purple-600 text-white hover:bg-purple-700">
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

export default TeacherEditModal;

