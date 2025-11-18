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
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const CreateLesson = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [includeAssignment, setIncludeAssignment] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    difficulty: 'beginner',
    ageGroup: '',
    duration: 30,
    objectives: [''],
    materials: [''],
    isPublished: false
  });
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    assignmentType: 'homework',
    assignToAll: false,
    assignedTo: []
  });

  const categories = [
    'Mathematics',
    'Science',
    'Language Arts',
    'Social Studies',
    'Art',
    'Music',
    'Physical Education',
    'Technology',
    'Other'
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const ageGroups = [
    'Preschool (3-5)',
    'Kindergarten (5-6)',
    'Grade 1-2 (6-8)',
    'Grade 3-5 (8-11)',
    'Grade 6-8 (11-14)',
    'Grade 9-12 (14-18)'
  ];

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
    if (includeAssignment) {
      fetchStudents();
    }
  }, [includeAssignment]);

  const fetchStudents = async () => {
    try {
      const response = await teacherService.getAssignedStudents({ silent: true });
      if (response.success) {
        setStudents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleAssignmentInputChange = (field, value) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAssignToAllToggle = (checked) => {
    setAssignmentData(prev => ({
      ...prev,
      assignToAll: checked,
      assignedTo: checked ? [] : prev.assignedTo
    }));
  };

  const handleStudentToggle = (studentId) => {
    if (assignmentData.assignToAll) {
      setAssignmentData(prev => ({
        ...prev,
        assignToAll: false,
        assignedTo: [studentId]
      }));
    } else {
      setAssignmentData(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.includes(studentId)
          ? prev.assignedTo.filter(id => id !== studentId)
          : [...prev.assignedTo, studentId]
      }));
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.category || !formData.ageGroup) {
      toast.error('Please fill in all required fields (Title, Category, and Age Group)');
      return;
    }
    
    if (!formData.description.trim() || !formData.content.trim()) {
      toast.error('Please fill in description and content');
      return;
    }

    // Validate assignment if included
    if (includeAssignment) {
      if (!assignmentData.title.trim() || !assignmentData.description.trim() || !assignmentData.dueDate) {
        toast.error('Please fill in all required assignment fields');
        return;
      }

      if (!assignmentData.assignToAll && assignmentData.assignedTo.length === 0) {
        toast.error('Please assign the assignment to at least one student or select "Assign to All Students"');
        return;
      }

      if (new Date(assignmentData.dueDate) <= new Date()) {
        toast.error('Assignment due date must be in the future');
        return;
      }
    }

    try {
      setLoading(true);
      
      const lessonData = {
        ...formData,
        objectives: formData.objectives.filter(obj => obj.trim()),
        materials: formData.materials.filter(mat => mat.trim())
      };

      const lessonResponse = await api.createLesson(lessonData);
      
      if (lessonResponse.success) {
        const createdLesson = lessonResponse.data;
        
        // Create assignment if included
        if (includeAssignment) {
          const assignmentPayload = {
            ...assignmentData,
            lessonId: createdLesson.id,
            maxPoints: parseInt(assignmentData.maxPoints),
            assignedTo: assignmentData.assignToAll ? [] : assignmentData.assignedTo,
            assignToAll: undefined
          };

          console.log('[CreateLesson] Creating assignment with payload:', assignmentPayload);
          
          try {
            const assignmentResponse = await api.createAssignment(assignmentPayload);
            console.log('[CreateLesson] Assignment creation response:', assignmentResponse);
            
            if (assignmentResponse && assignmentResponse.success) {
              toast.success('Lesson and assignment created successfully!');
            } else {
              const errorMsg = assignmentResponse?.message || 'Unknown error';
              console.error('[CreateLesson] Assignment creation failed:', errorMsg, assignmentResponse);
              toast.success('Lesson created successfully, but assignment creation failed: ' + errorMsg);
            }
          } catch (assignmentError) {
            console.error('[CreateLesson] Assignment creation error:', assignmentError);
            toast.success(`Lesson created successfully, but assignment creation failed: ${assignmentError.message || 'Unknown error'}`);
          }
        } else {
          toast.success('Lesson created successfully!');
        }
        
        navigate('/teacher/lessons');
      } else {
        toast.error(lessonResponse.message || 'Failed to create lesson');
      }
    } catch (error) {
      console.error('Create lesson error:', error);
      toast.error('Failed to create lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Create Lesson" />
      
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
            <BookOpenIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Create New Lesson</h1>
          </div>
          <p className="text-gray-600">Design engaging learning content for your students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter lesson title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>{diff.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group *
                </label>
                <select
                  value={formData.ageGroup}
                  onChange={(e) => handleInputChange('ageGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select age group</option>
                  {ageGroups.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="180"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description of the lesson"
                required
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Content</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lesson Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="8"
                placeholder="Enter the detailed lesson content, activities, and instructions..."
                required
              />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Objectives</h2>
            
            {formData.objectives.map((objective, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Learning objective ${index + 1}`}
                />
                {formData.objectives.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('objectives', index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('objectives')}
              className="mt-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Materials</h2>
            
            {formData.materials.map((material, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={material}
                  onChange={(e) => handleArrayChange('materials', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Material ${index + 1}`}
                />
                {formData.materials.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('materials', index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('materials')}
              className="mt-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                Publish lesson immediately (students will be able to access it)
              </label>
            </div>
          </Card>

          {/* Optional Assignment Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="includeAssignment"
                checked={includeAssignment}
                onChange={(e) => setIncludeAssignment(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="includeAssignment" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-purple-600" />
                Include Assignment (Optional)
              </label>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Create an assignment linked to this lesson. Students can complete it after finishing the lesson.
            </p>

            {includeAssignment && (
              <div className="space-y-6 border-t pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Title *
                    </label>
                    <input
                      type="text"
                      value={assignmentData.title}
                      onChange={(e) => handleAssignmentInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter assignment title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Type
                    </label>
                    <select
                      value={assignmentData.assignmentType}
                      onChange={(e) => handleAssignmentInputChange('assignmentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {assignmentTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={assignmentData.dueDate}
                      onChange={(e) => handleAssignmentInputChange('dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min={getMinDate()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Points
                    </label>
                    <input
                      type="number"
                      value={assignmentData.maxPoints}
                      onChange={(e) => handleAssignmentInputChange('maxPoints', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={assignmentData.description}
                    onChange={(e) => handleAssignmentInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    placeholder="Brief description of the assignment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={assignmentData.instructions}
                    onChange={(e) => handleAssignmentInputChange('instructions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="4"
                    placeholder="Detailed instructions for completing the assignment..."
                  />
                </div>

                {/* Student Assignment Section */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <UserGroupIcon className="h-5 w-5 text-purple-600" />
                      Assign to Students *
                    </h3>
                  </div>

                  {/* Assign to All Students Option */}
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignmentData.assignToAll}
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

                  {!assignmentData.assignToAll && (
                    <>
                      <div className="text-sm text-gray-600 mb-4">
                        Selected: {assignmentData.assignedTo.length} of {students.length} students
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {students.map(student => (
                          <label
                            key={student.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              assignmentData.assignedTo.includes(student.id)
                                ? 'bg-purple-50 border-purple-300'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={assignmentData.assignedTo.includes(student.id)}
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
                </div>
              </div>
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
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Lesson'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLesson;
