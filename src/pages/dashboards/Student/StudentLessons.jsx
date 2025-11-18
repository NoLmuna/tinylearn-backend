import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import AnimatedProgressBar from '../../../components/AnimatedProgressBar';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  FunnelIcon,
  StarIcon,
  AcademicCapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const StudentLessons = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const categories = ['Mathematics', 'Science', 'English', 'History', 'Art', 'Technology'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  const statuses = ['All', 'Not Started', 'In Progress', 'Completed'];

  // Utility functions
  const getLessonProgress = useCallback((lessonId) => {
    const lessonProgress = progress.find(p => p.lessonId === lessonId);
    return lessonProgress ? lessonProgress.progress : 0;
  }, [progress]);

  const isLessonCompleted = useCallback((lessonId) => {
    const lessonProgress = progress.find(p => p.lessonId === lessonId);
    return lessonProgress ? lessonProgress.completed : false;
  }, [progress]);

  const filterLessons = useCallback(() => {
    let filtered = lessons.filter(lesson => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || lesson.category === categoryFilter;
      const matchesDifficulty = !difficultyFilter || lesson.difficulty === difficultyFilter;
      
      let matchesStatus = true;
      if (statusFilter && statusFilter !== 'All') {
        const lessonProgress = getLessonProgress(lesson.id);
        const isCompleted = isLessonCompleted(lesson.id);
        
        if (statusFilter === 'Not Started') {
          matchesStatus = lessonProgress === 0;
        } else if (statusFilter === 'In Progress') {
          matchesStatus = lessonProgress > 0 && !isCompleted;
        } else if (statusFilter === 'Completed') {
          matchesStatus = isCompleted;
        }
      }

      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    });

    setFilteredLessons(filtered);
  }, [lessons, searchTerm, categoryFilter, difficultyFilter, statusFilter, getLessonProgress, isLessonCompleted]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching lessons and progress...');
      
      const [lessonsRes, progressRes] = await Promise.all([
        api.getLessons(),
        api.getProgress()
      ]);

      console.log('📚 Lessons response:', lessonsRes);
      console.log('📊 Progress response:', progressRes);

      if (lessonsRes.success) {
        const lessonsData = lessonsRes.data;
        // Handle both direct array and nested object format
        const lessonsList = Array.isArray(lessonsData) ? lessonsData : (lessonsData.lessons || []);
        console.log('✅ Processed lessons:', lessonsList);
        setLessons(lessonsList);
      } else {
        console.error('❌ Failed to fetch lessons:', lessonsRes);
      }

      if (progressRes.success) {
        const progressData = progressRes.data;
        // Handle both direct array and nested object format  
        const progressList = Array.isArray(progressData) ? progressData : (progressData.progress || []);
        console.log('✅ Processed progress:', progressList);
        setProgress(progressList);
      } else {
        console.error('❌ Failed to fetch progress:', progressRes);
      }
    } catch (error) {
      console.error('💥 Failed to fetch lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  useEffect(() => {
    if (lessons.length > 0) {
      filterLessons();
    }
  }, [lessons, filterLessons]);

  const startLesson = async (lessonId) => {
    try {
      toast.success('Starting lesson...', { icon: '🚀' });
      // Navigate to lesson view page
      navigate(`/student/lessons/${lessonId}`);
    } catch (error) {
      console.error('Failed to start lesson:', error);
      toast.error('Failed to start lesson');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'mathematics': return <LightBulbIcon className="h-5 w-5" />;
      case 'science': return <AcademicCapIcon className="h-5 w-5" />;
      default: return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="student" currentPage="Lessons" />
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
      <DashboardNavbar role="student" currentPage="Lessons" />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Lessons</h1>
          <p className="text-gray-600">Explore and continue your learning journey</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <Button variant="outline" className="flex items-center gap-2">
              <FunnelIcon className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </Card>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => {
              const lessonProgress = getLessonProgress(lesson.id);
              const completed = isLessonCompleted(lesson.id);

              return (
                <Card key={lesson.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2 text-blue-600">
                        {getCategoryIcon(lesson.category)}
                        <span className="text-sm font-medium">{lesson.category}</span>
                      </div>
                      {completed && (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{lesson.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{lesson.description}</p>

                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{lesson.duration || 30} min</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty || 'Beginner'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-blue-600 font-medium">{lessonProgress}%</span>
                      </div>
                      <AnimatedProgressBar progress={lessonProgress} />
                    </div>

                    <Button
                      onClick={() => startLesson(lesson.id)}
                      className="w-full"
                      disabled={completed}
                    >
                      <PlayIcon className="h-4 w-4 mr-2" />
                      {completed ? 'Completed' : lessonProgress > 0 ? 'Continue' : 'Start Lesson'}
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No lessons found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>

        {/* Statistics Summary */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{lessons.length}</div>
              <div className="text-sm text-gray-600">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.filter(p => p.completed).length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {progress.filter(p => p.progress > 0 && !p.completed).length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {lessons.length - progress.length}
              </div>
              <div className="text-sm text-gray-600">Not Started</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentLessons;
