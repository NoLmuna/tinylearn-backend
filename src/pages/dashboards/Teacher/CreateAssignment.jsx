import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import teacherService from '../../../services/teacher';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CreateAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    lessonId: '',
    assignedTo: [], // Array of student IDs, empty means all students
    assignToAll: false, // Toggle for assigning to all students
    dueDate: '',
    maxPoints: 100,
    assignmentType: 'homework',
    attachments: []
  });

  const assignmentTypes = [
    { value: 'homework', label: 'Homework' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'project', label: 'Project' },
    { value: 'essay', label: 'Essay' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'lab', label: 'Lab Work' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchLessonsAndStudents();
  }, []);

  const fetchLessonsAndStudents = async () => {
    try {
      const [lessonsRes, studentsRes] = await Promise.all([
        teacherService.getLessons({ limit: 100 }),
        teacherService.getAssignedStudents()
      ]);

      if (lessonsRes.success) {
        const lessonsData = lessonsRes.data;
        const lessonsList = Array.isArray(lessonsData.lessons) 
          ? lessonsData.lessons 
          : (Array.isArray(lessonsData) ? lessonsData : []);
        setLessons(lessonsList);
      }

      if (studentsRes.success) {
        const assignedStudents = studentsRes.data || [];
        setStudents(assignedStudents);
      }
    } catch (error) {
      console.error('Failed to fetch lessons and students:', error);
      toast.error('Failed to load lessons and students');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssignToAllToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      assignToAll: checked,
      assignedTo: checked ? [] : prev.assignedTo // Clear specific students if assigning to all
    }));
  };

  const handleStudentToggle = (studentId) => {
    if (formData.assignToAll) {
      // If "assign to all" is checked, uncheck it first
      setFormData(prev => ({
        ...prev,
        assignToAll: false,
        assignedTo: [studentId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.includes(studentId)
          ? prev.assignedTo.filter(id => id !== studentId)
          : [...prev.assignedTo, studentId]
      }));
    }
  };

  const selectAllStudents = () => {
    setFormData(prev => ({
      ...prev,
      assignToAll: false,
      assignedTo: students.map(student => student.id)
    }));
  };

  const clearAllStudents = () => {
    setFormData(prev => ({
      ...prev,
      assignToAll: false,
      assignedTo: []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.assignToAll && formData.assignedTo.length === 0) {
      toast.error('Please assign the assignment to at least one student or select "Assign to All Students"');
      return;
    }

    if (new Date(formData.dueDate) <= new Date()) {
      toast.error('Due date must be in the future');
      return;
    }

    try {
      setLoading(true);
      
      const assignmentData = {
        ...formData,
        maxPoints: parseInt(formData.maxPoints),
        // If assignToAll is true, send empty array (backend will interpret as "all students")
        assignedTo: formData.assignToAll ? [] : formData.assignedTo,
        // Remove assignToAll from the payload as backend doesn't need it
        assignToAll: undefined
      };

      const response = await api.createAssignment(assignmentData);
      
      if (response.success) {
        toast.success('Assignment created successfully!');
        navigate('/teacher/assignments');
      } else {
        toast.error(response.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Create assignment error:', error);
      toast.error('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Create Assignment" />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Create New Assignment</h1>
          </div>
          <p className="text-gray-600">Set homework and tasks for your students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter assignment title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type
                </label>
                <select
                  value={formData.assignmentType}
                  onChange={(e) => handleInputChange('assignmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {assignmentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Lesson (Optional)
                </label>
                <select
                  value={formData.lessonId}
                  onChange={(e) => handleInputChange('lessonId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a lesson</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min={getMinDate()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Points
                </label>
                <input
                  type="number"
                  value={formData.maxPoints}
                  onChange={(e) => handleInputChange('maxPoints', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description of the assignment"
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="6"
                placeholder="Detailed instructions for completing the assignment..."
                required
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
                Assign to Students *
              </h2>
              <div className="flex gap-2">
                {!formData.assignToAll && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllStudents}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllStudents}
                    >
                      Clear All
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Assign to All Students Option */}
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.assignToAll}
                  onChange={(e) => handleAssignToAllToggle(e.target.checked)}
                  className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <div>
                  <div className="font-medium text-gray-800">
                    Assign to All Students
                  </div>
                  <div className="text-sm text-gray-600">
                    This assignment will be available to all {students.length} of your assigned students
                  </div>
                </div>
              </label>
            </div>
            
            {!formData.assignToAll && (
              <>
                <div className="text-sm text-gray-600 mb-4">
                  Selected: {formData.assignedTo.length} of {students.length} students
                </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {students.map(student => (
                <label
                  key={student.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.assignedTo.includes(student.id)
                      ? 'bg-purple-50 border-purple-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Grade {student.grade || 'N/A'}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {students.length === 0 && (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students available</p>
              </div>
            )}
              </>
            )}
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[140px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Assignment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignment;
