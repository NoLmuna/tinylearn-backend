import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  DocumentTextIcon,
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';

const TeacherAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleCreateAssignment = () => {
    navigate('/teacher/assignments/create');
  };

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getAssignments();
      if (response.success) {
        const assignmentsData = response.data;
        const assignmentsList = Array.isArray(assignmentsData)
          ? assignmentsData
          : (assignmentsData.assignments || []);
        setAssignments(assignmentsList);
      } else {
        toast.error(response.message || 'Failed to load assignments');
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error(error.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleViewAssignment = (assignmentId) => {
    navigate(`/teacher/assignments/${assignmentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Assignments" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-800">My Assignments</h1>
            </div>
            <Button onClick={handleCreateAssignment}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Assignment
            </Button>
          </div>
          <p className="text-gray-600">Manage homework, quizzes, and projects for your students</p>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
              <p className="text-gray-600">Loading assignments...</p>
            </div>
          </Card>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No assignments created yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first assignment to give students tasks and homework
            </p>
            <Button onClick={handleCreateAssignment}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Your First Assignment
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card
                key={assignment.id}
                className="p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {assignment.title}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {assignment.assignmentType?.charAt(0).toUpperCase() + assignment.assignmentType?.slice(1) || 'Assignment'}
                      </span>
                      {!assignment.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {assignment.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Max Points: {assignment.maxPoints || 100}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>
                          Assigned: {assignment.assignedTo && assignment.assignedTo.length > 0
                            ? assignment.assignedTo.length
                            : 'All Students'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewAssignment(assignment.id)}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignments;
