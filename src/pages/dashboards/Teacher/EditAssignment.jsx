import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import teacherService from '../../../services/teacher';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const EditAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    lessonId: '',
    assignedTo: [],
    assignToAll: false,
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
    fetchData();
  }, [assignmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentRes, lessonsRes, studentsRes] = await Promise.all([
        api.getAssignment(assignmentId),
        teacherService.getLessons({ limit: 100 }),
        teacherService.getAssignedStudents()
      ]);

      if (assignmentRes.success) {
        const assignment = assignmentRes.data;
        
        // Format due date for input (YYYY-MM-DD)
        const dueDate = assignment.dueDate 
          ? new Date(assignment.dueDate).toISOString().split('T')[0]
          : '';

        // Determine if assigned to all students
        const assignToAll = !assignment.assignedTo || assignment.assignedTo.length === 0;
        const assignedTo = assignToAll ? [] : (assignment.assignedTo || []);

        setFormData({
          title: assignment.title || '',
          description: assignment.description || '',
          instructions: assignment.instructions || '',
          lessonId: assignment.lessonId ? assignment.lessonId.toString() : '',
          assignedTo: assignedTo,
          assignToAll: assignToAll,
          dueDate: dueDate,
          maxPoints: assignment.maxPoints || 100,
          assignmentType: assignment.assignmentType || 'homework',
          attachments: assignment.attachments || []
        });
      } else {
        toast.error('Failed to load assignment');
        navigate('/teacher/assignments');
      }

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
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load assignment data');
      navigate('/teacher/assignments');
    } finally {
      setLoading(false);
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
      assignedTo: checked ? [] : prev.assignedTo
    }));
  };

  const handleStudentToggle = (studentId) => {
    if (formData.assignToAll) {
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

    try {
      setSaving(true);
      
      const assignmentData = {
        ...formData,
        maxPoints: parseInt(formData.maxPoints),
        assignedTo: formData.assignToAll ? [] : formData.assignedTo,
        lessonId: formData.lessonId || null
      };

      // Remove assignToAll from payload
      delete assignmentData.assignToAll;

      const response = await api.updateAssignment(assignmentId, assignmentData);
      
      if (response.success) {
        toast.success('Assignment updated successfully!');
        navigate(`/teacher/assignments/${assignmentId}`);
      } else {
        toast.error(response.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Update assignment error:', error);
      toast.error('Failed to update assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/teacher/assignments/${assignmentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Edit Assignment" />
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Edit Assignment" />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignment
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Edit Assignment</h1>
          </div>
          <p className="text-gray-600">Update assignment details and settings</p>
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
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
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[140px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Update Assignment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssignment;

