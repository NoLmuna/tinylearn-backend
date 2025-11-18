import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  UserGroupIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ViewAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);

  const fetchAssignment = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getAssignment(assignmentId);
      
      if (response.success) {
        setAssignment(response.data);
      } else {
        toast.error('Failed to load assignment');
        navigate('/teacher/assignments');
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      toast.error('Failed to load assignment');
      navigate('/teacher/assignments');
    } finally {
      setLoading(false);
    }
  }, [assignmentId, navigate]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [assignmentId, fetchAssignment]);

  const handleEdit = () => {
    navigate(`/teacher/assignments/${assignmentId}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        const response = await api.deleteAssignment(assignmentId);
        
        if (response.success) {
          toast.success('Assignment deleted successfully');
          navigate('/teacher/assignments');
        } else {
          toast.error('Failed to delete assignment');
        }
      } catch (error) {
        console.error('Failed to delete assignment:', error);
        toast.error('Failed to delete assignment');
      }
    }
  };

  const handleGrade = () => {
    navigate(`/teacher/assignments/${assignmentId}/grade`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="View Assignment" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="View Assignment" />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Assignment not found</h2>
            <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/teacher/assignments')}>
              Back to Assignments
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const isOverdue = new Date(assignment.dueDate) < new Date();
  const assignedCount = assignment.assignedTo && assignment.assignedTo.length > 0
    ? assignment.assignedTo.length
    : 'All Students';
  const submissions = assignment.submissions || [];
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="View Assignment" />
      
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/assignments')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{assignment.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    assignment.assignmentType === 'homework' ? 'bg-blue-100 text-blue-800' :
                    assignment.assignmentType === 'quiz' ? 'bg-purple-100 text-purple-800' :
                    assignment.assignmentType === 'project' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {assignment.assignmentType?.charAt(0).toUpperCase() + assignment.assignmentType?.slice(1) || 'Assignment'}
                  </div>
                  {isOverdue && (
                    <div className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      Overdue
                    </div>
                  )}
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
                onClick={handleGrade}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Grade
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

        {/* Assignment Details */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <CalendarDaysIcon className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm text-gray-500">Due Date</div>
                  <div className="font-medium">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm text-gray-500">Max Points</div>
                  <div className="font-medium">{assignment.maxPoints || 100} points</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-500">Assigned To</div>
                  <div className="font-medium">{assignedCount}</div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">Description</div>
              <p className="text-gray-800">{assignment.description}</p>
            </div>

            {assignment.instructions && (
              <div>
                <div className="text-sm text-gray-500 mb-2">Instructions</div>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <pre className="whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
                    {assignment.instructions}
                  </pre>
                </div>
              </div>
            )}
          </Card>

          {/* Linked Lesson */}
          {assignment.lesson && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
                Linked Lesson
              </h2>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <h3 className="font-semibold text-gray-800">{assignment.lesson.title}</h3>
                  <p className="text-sm text-gray-600">Lesson ID: {assignment.lesson.id}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/teacher/lessons/${assignment.lesson.id}`)}
                >
                  View Lesson
                </Button>
              </div>
            </Card>
          )}

          {/* Submission Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Submission Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Total Assigned</div>
                <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">Submitted</div>
                <div className="text-2xl font-bold text-yellow-600">{submittedCount}</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Graded</div>
                <div className="text-2xl font-bold text-green-600">{gradedCount}</div>
              </div>
            </div>
          </Card>

          {/* Submissions List */}
          {submissions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Submissions</h2>
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {submission.student ? `${submission.student.firstName} ${submission.student.lastName}` : 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                        submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {submission.status?.charAt(0).toUpperCase() + submission.status?.slice(1) || 'Pending'}
                      </div>
                      {submission.score !== null && submission.score !== undefined && (
                        <div className="text-sm font-medium text-gray-700">
                          {submission.score} / {assignment.maxPoints} points
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${assignmentId}/grade?submission=${submission.id}`)}
                      >
                        {submission.status === 'graded' ? 'View' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Assignment Metadata */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {assignment.updatedAt ? new Date(assignment.updatedAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">
                  {assignment.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Teacher:</span>
                <span className="ml-2 font-medium">
                  {assignment.teacher ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}` : 'Unknown'}
                </span>
              </div>
              {assignment.lesson && (
                <div>
                  <span className="text-gray-500">Linked Lesson:</span>
                  <span className="ml-2 font-medium">
                    {assignment.lesson.title}
                  </span>
                </div>
              )}
              {submissions.length > 0 && (
                <div>
                  <span className="text-gray-500">Total Submissions:</span>
                  <span className="ml-2 font-medium">
                    {submissions.length}
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

export default ViewAssignment;

