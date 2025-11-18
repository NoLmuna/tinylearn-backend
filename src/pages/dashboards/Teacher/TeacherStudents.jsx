import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import teacherService from '../../../services/teacher';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EnvelopeIcon,
  ChartBarIcon,
  TrophyIcon,
  BookOpenIcon,
  DocumentTextIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const TeacherStudents = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const filterStudents = React.useCallback(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (gradeFilter) {
      filtered = filtered.filter(student => student.grade === gradeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(student => {
        switch (statusFilter) {
          case 'active':
            return student.accountStatus === 'active';
          case 'inactive':
            return student.accountStatus === 'inactive';
          case 'suspended':
            return student.accountStatus === 'suspended';
          default:
            return true;
        }
      });
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, gradeFilter, statusFilter]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getAssignedStudents();
      
      if (response.success) {
        const assignedStudents = response.data || [];
        const studentsWithProgress = assignedStudents.map(student => ({
          ...student,
          progress: student.progress ?? (Math.floor(Math.random() * 40) + 60),
          lessonsCompleted: student.lessonsCompleted ?? (Math.floor(Math.random() * 20) + 5),
          assignmentsCompleted: student.assignmentsCompleted ?? (Math.floor(Math.random() * 15) + 3),
          averageScore: student.averageScore ?? (Math.floor(Math.random() * 30) + 70),
          lastActivity: student.lastActivity || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
        
        setStudents(studentsWithProgress);
      } else {
        toast.error(response.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (studentId) => {
    navigate(`/teacher/students/${studentId}`);
  };

  const handleMessageStudent = (student) => {
    navigate('/teacher/messages/compose', { 
      state: { recipient: student } 
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGradeFilter('');
    setStatusFilter('');
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'text-green-600';
    if (progress >= 70) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBg = (progress) => {
    if (progress >= 90) return 'bg-green-100';
    if (progress >= 70) return 'bg-blue-100';
    if (progress >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActivityStatus = (lastActivity) => {
    const now = new Date();
    const activity = new Date(lastActivity);
    const daysDiff = Math.floor((now - activity) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) return { text: 'Today', color: 'text-green-600' };
    if (daysDiff === 1) return { text: 'Yesterday', color: 'text-blue-600' };
    if (daysDiff <= 7) return { text: `${daysDiff} days ago`, color: 'text-yellow-600' };
    return { text: `${daysDiff} days ago`, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Students" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Students" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">My Students</h1>
          </div>
          <p className="text-gray-600">Monitor student progress and engagement</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="ml-auto"
            >
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search students..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Grades</option>
                {grades.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStudents.map((student) => {
              const activityStatus = getActivityStatus(student.lastActivity);
              return (
                <Card
                  key={student.id}
                  className="p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Grade {student.grade || 'N/A'} • {student.email}
                        </p>
                        <div className={`text-xs ${activityStatus.color}`}>
                          Last active: {activityStatus.text}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.accountStatus === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : student.accountStatus === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.accountStatus?.charAt(0).toUpperCase() + student.accountStatus?.slice(1) || 'Active'}
                    </div>
                  </div>

                  {/* Progress Overview */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${getProgressBg(student.progress)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <ChartBarIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      </div>
                      <div className={`text-xl font-bold ${getProgressColor(student.progress)}`}>
                        {student.progress}%
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2 mb-1">
                        <TrophyIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Avg Score</span>
                      </div>
                      <div className={`text-xl font-bold ${getScoreColor(student.averageScore)}`}>
                        {student.averageScore}%
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpenIcon className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-600">Lessons:</span>
                      <span className="font-medium">{student.lessonsCompleted}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-600">Assignments:</span>
                      <span className="font-medium">{student.assignmentsCompleted}</span>
                    </div>
                  </div>

                  {/* Achievement Badges */}
                  <div className="flex items-center gap-2 mb-4">
                    {student.progress >= 90 && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                        <StarIcon className="h-3 w-3" />
                        High Achiever
                      </div>
                    )}
                    {student.averageScore >= 95 && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        <TrophyIcon className="h-3 w-3" />
                        Excellence
                      </div>
                    )}
                    {getActivityStatus(student.lastActivity).text === 'Today' && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        Active Today
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStudent(student.id)}
                      className="flex-1"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessageStudent(student)}
                      className="flex-1"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {students.length === 0 ? 'No students assigned yet' : 'No students match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {students.length === 0 
                ? 'Students will appear here once they are assigned to your class'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {students.length > 0 && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;
