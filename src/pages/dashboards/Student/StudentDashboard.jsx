import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import AnimatedProgressBar from '../../../components/AnimatedProgressBar';
import WeatherWidget from '../../../components/WeatherWidget';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  TrophyIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CalendarIcon,
  PlayIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const AGE_GROUP_RANGES = [
  { label: 'Preschool (3-5)', min: 3, max: 5 },
  { label: 'Kindergarten (5-6)', min: 5, max: 6 },
  { label: 'Grade 1-2 (6-8)', min: 6, max: 8 },
  { label: 'Grade 3-5 (8-11)', min: 8, max: 11 },
  { label: 'Grade 6-8 (11-14)', min: 11, max: 14 },
  { label: 'Grade 9-12 (14-18)', min: 14, max: 18 }
];

const deriveAgeGroupForStudent = (student) => {
  if (!student) return null;

  const numericAge = Number(student.age);
  if (!Number.isNaN(numericAge) && numericAge > 0) {
    const rangeMatch = AGE_GROUP_RANGES.find(range => numericAge >= range.min && numericAge <= range.max);
    if (rangeMatch) {
      return rangeMatch.label;
    }
  }

  const gradeValue = student.grade?.toString().toLowerCase();
  if (!gradeValue) return null;

  if (gradeValue.includes('preschool')) return 'Preschool (3-5)';
  if (gradeValue.includes('k') || gradeValue.includes('kindergarten')) return 'Kindergarten (5-6)';

  const gradeNumberMatch = gradeValue.match(/\d+/);
  if (gradeNumberMatch) {
    const gradeNumber = parseInt(gradeNumberMatch[0], 10);
    if (gradeNumber <= 2) return 'Grade 1-2 (6-8)';
    if (gradeNumber <= 5) return 'Grade 3-5 (8-11)';
    if (gradeNumber <= 8) return 'Grade 6-8 (11-14)';
    return 'Grade 9-12 (14-18)';
  }

  return null;
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const defaultDashboardState = {
    stats: {
      completedLessons: 0,
      totalLessons: 0,
      pendingAssignments: 0,
      overallProgress: 0,
      streak: 0
    },
    lessons: [],
    assignments: [],
    progress: []
  };
  const [dashboardData, setDashboardData] = useState(defaultDashboardState);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const preferredAgeGroup = useMemo(() => deriveAgeGroupForStudent(user), [user]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const baseFilters = { limit: 12, status: 'published' };
      const lessonFilters = preferredAgeGroup ? { ...baseFilters, ageGroup: preferredAgeGroup } : baseFilters;

      let lessonsResponse = await api.getLessons(lessonFilters);
      let rawLessons = lessonsResponse.success ? lessonsResponse.data : [];
      let lessonsList = Array.isArray(rawLessons) ? rawLessons : (rawLessons.lessons || []);

      if (lessonsList.length === 0 && preferredAgeGroup) {
        lessonsResponse = await api.getLessons(baseFilters);
        rawLessons = lessonsResponse.success ? lessonsResponse.data : [];
        lessonsList = Array.isArray(rawLessons) ? rawLessons : (rawLessons.lessons || []);
      }

      // Placeholder progress computation until student progress API is hooked up
      const mockProgress = lessonsList.map((lesson, index) => ({
        lessonId: lesson.id,
        progress: Math.min(100, Math.round(((index + 1) / lessonsList.length) * 40)),
        completed: false,
        isCompleted: false
      }));

      const completedLessons = mockProgress.filter(p => p.completed || p.isCompleted).length;
      const totalLessons = lessonsList.length;
      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      setDashboardData({
        stats: {
          completedLessons,
          totalLessons,
          pendingAssignments: 0,
          overallProgress,
          streak: 0
        },
        lessons: lessonsList.slice(0, 6),
        assignments: [],
        progress: mockProgress
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setDashboardData(defaultDashboardState);
    } finally {
      setLoading(false);
    }
  }, [preferredAgeGroup, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const startLesson = async (lessonId) => {
    try {
      toast.success('Starting lesson...', { icon: '🚀' });
      navigate(`/student/lessons/${lessonId}`);
    } catch (error) {
      console.error('Failed to start lesson:', error);
      toast.error('Failed to start lesson');
    }
  };

  const viewAssignment = (assignmentId) => {
    toast.success('Opening assignment...', { icon: '📝' });
    // In a real app, you would navigate to the assignment page
    // For now, we'll just show a success message
    console.log('Viewing assignment:', assignmentId);
    
    // You could add navigation here:
    // navigate(`/assignments/${assignmentId}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getLessonProgress = (lessonId) => {
    const lessonProgress = dashboardData.progress.find(p => p.lessonId === lessonId);
    return lessonProgress ? lessonProgress.progress : 0;
  };

  const isLessonCompleted = (lessonId) => {
    const lessonProgress = dashboardData.progress.find(p => p.lessonId === lessonId);
    return lessonProgress ? lessonProgress.completed : false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="student" currentPage="Dashboard" />
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
      <DashboardNavbar role="student" currentPage="Dashboard" />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {getGreeting()}, {user?.firstName || 'Student'}! 🌟
                  </h1>
                  <p className="text-blue-100 text-lg">Ready to learn something amazing today?</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {soundEnabled ? (
                      <SpeakerWaveIcon className="h-6 w-6" />
                    ) : (
                      <SpeakerXMarkIcon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">{dashboardData.stats.completedLessons}</div>
                  <div className="text-blue-100">Lessons Completed</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">{dashboardData.stats.pendingAssignments}</div>
                  <div className="text-blue-100">Pending Tasks</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">{dashboardData.stats.overallProgress}%</div>
                  <div className="text-blue-100">Overall Progress</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="text-2xl font-bold">{dashboardData.stats.streak}</div>
                  <div className="text-blue-100">Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lessons and Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <BookOpenIcon className="h-6 w-6 text-blue-600" />
                  Continue Learning
                </h2>
                <Button variant="outline" size="sm">
                  View All Lessons
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardData.lessons.length > 0 ? (
                  dashboardData.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{lesson.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>{lesson.duration} minutes</span>
                          </div>
                        </div>
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-blue-600 font-medium">{getLessonProgress(lesson.id)}%</span>
                        </div>
                        <AnimatedProgressBar progress={getLessonProgress(lesson.id)} />
                      </div>
                      
                      <Button
                        onClick={() => startLesson(lesson.id)}
                        className="w-full"
                        size="sm"
                        disabled={isLessonCompleted(lesson.id)}
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        {isLessonCompleted(lesson.id) ? 'Completed' : getLessonProgress(lesson.id) > 0 ? 'Continue' : 'Start Lesson'}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No lessons available yet</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Assignments Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                  Recent Assignments
                </h2>
                <Button variant="outline" size="sm">
                  View All Assignments
                </Button>
              </div>
              
              <div className="space-y-4">
                {dashboardData.assignments.length > 0 ? (
                  dashboardData.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                              <CalendarIcon className="h-4 w-4" />
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              assignment.isCompleted
                                ? 'bg-green-100 text-green-800'
                                : new Date(assignment.dueDate) < new Date()
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {assignment.isCompleted 
                                ? 'Completed' 
                                : new Date(assignment.dueDate) < new Date()
                                ? 'Overdue'
                                : 'Pending'
                              }
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => viewAssignment(assignment.id)}
                          variant={assignment.isCompleted ? "outline" : "primary"}
                          size="sm"
                        >
                          {assignment.isCompleted ? 'Review' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assignments available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                Learning Progress
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="text-blue-600 font-semibold">{dashboardData.stats.overallProgress}%</span>
                  </div>
                  <AnimatedProgressBar progress={dashboardData.stats.overallProgress} height="h-3" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{dashboardData.stats.completedLessons}</div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.totalLessons - dashboardData.stats.completedLessons}</div>
                    <div className="text-xs text-gray-500">Remaining</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Achievements */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-600" />
                Achievements
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <StarIcon className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">First Lesson</div>
                    <div className="text-sm text-gray-600">Completed your first lesson!</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Quick Learner</div>
                    <div className="text-sm text-gray-600">5-day learning streak!</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Weather Widget */}
            <WeatherWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
