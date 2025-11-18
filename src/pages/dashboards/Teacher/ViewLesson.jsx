import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ViewLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);

  const fetchLesson = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getLesson(lessonId);
      
      if (response.success) {
        setLesson(response.data);
      } else {
        toast.error('Failed to load lesson');
        navigate('/teacher/lessons');
      }
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      toast.error('Failed to load lesson');
      navigate('/teacher/lessons');
    } finally {
      setLoading(false);
    }
  }, [lessonId, navigate]);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, fetchLesson]);

  const handleEdit = () => {
    navigate(`/teacher/lessons/${lessonId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      try {
        const response = await api.deleteLesson(lessonId);
        
        if (response.success) {
          toast.success('Lesson deleted successfully');
          navigate('/teacher/lessons');
        } else {
          toast.error('Failed to delete lesson');
        }
      } catch (error) {
        console.error('Failed to delete lesson:', error);
        toast.error('Failed to delete lesson');
      }
    }
  };

  const handleTogglePublish = async () => {
    try {
      const response = await api.updateLesson(lessonId, {
        ...lesson,
        isPublished: !lesson.isPublished
      });
      
      if (response.success) {
        toast.success(`Lesson ${lesson.isPublished ? 'unpublished' : 'published'} successfully`);
        setLesson(prev => ({ ...prev, isPublished: !prev.isPublished }));
      } else {
        toast.error('Failed to update lesson status');
      }
    } catch (error) {
      console.error('Failed to update lesson:', error);
      toast.error('Failed to update lesson status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="View Lesson" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="View Lesson" />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lesson not found</h2>
            <p className="text-gray-600 mb-4">The lesson you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/teacher/lessons')}>
              Back to Lessons
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="View Lesson" />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/lessons')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{lesson.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lesson.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lesson.isPublished ? 'Published' : 'Draft'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                    lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {lesson.difficulty?.charAt(0).toUpperCase() + lesson.difficulty?.slice(1) || 'Beginner'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                size="sm"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant={lesson.isPublished ? "outline" : "primary"}
                onClick={handleTogglePublish}
                size="sm"
              >
                {lesson.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Lesson Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Category</div>
                  <div className="font-medium">{lesson.category || 'General'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">{lesson.duration || 30} minutes</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Age Group</div>
                  <div className="font-medium">{lesson.ageGroup || 'All ages'}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-500 mb-2">Description</div>
              <p className="text-gray-800">{lesson.description}</p>
            </div>
          </Card>

          {/* Learning Objectives */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Objectives</h2>
              <ul className="space-y-2">
                {lesson.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Required Materials */}
          {lesson.materials && lesson.materials.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Required Materials</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {lesson.materials.map((material, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-700">{material}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Lesson Content */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Content</h2>
            <div className="prose max-w-none">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                  {lesson.content}
                </pre>
              </div>
            </div>
          </Card>

          {/* Linked Assignments */}
          {lesson.assignments && lesson.assignments.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                Linked Assignments
              </h2>
              <div className="space-y-4">
                {lesson.assignments.map((assignment) => {
                  const isOverdue = new Date(assignment.dueDate) < new Date();
                  const assignedCount = assignment.assignedTo && assignment.assignedTo.length > 0
                    ? assignment.assignedTo.length
                    : 'All Students';
                  
                  return (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {assignment.title}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.assignmentType === 'homework' ? 'bg-blue-100 text-blue-800' :
                              assignment.assignmentType === 'quiz' ? 'bg-purple-100 text-purple-800' :
                              assignment.assignmentType === 'project' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {assignment.assignmentType?.charAt(0).toUpperCase() + assignment.assignmentType?.slice(1) || 'Assignment'}
                            </div>
                            {isOverdue && (
                              <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Overdue
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{assignment.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              <span>Max Points: {assignment.maxPoints || 100}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UserGroupIcon className="h-4 w-4" />
                              <span>Assigned to: {assignedCount}</span>
                            </div>
                          </div>
                          {assignment.instructions && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="text-xs font-medium text-gray-500 mb-1">Instructions:</div>
                              <p className="text-sm text-gray-700">{assignment.instructions}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Lesson Metadata */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">
                  {lesson.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Teacher:</span>
                <span className="ml-2 font-medium">
                  {lesson.teacher ? `${lesson.teacher.firstName} ${lesson.teacher.lastName}` : 'Unknown'}
                </span>
              </div>
              {lesson.assignments && (
                <div>
                  <span className="text-gray-500">Linked Assignments:</span>
                  <span className="ml-2 font-medium">
                    {lesson.assignments.length}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewLesson;

