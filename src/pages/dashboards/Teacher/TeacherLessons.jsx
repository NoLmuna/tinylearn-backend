import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import teacherService from '../../../services/teacher';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  BookOpenIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const TeacherLessons = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchLessons();
  }, []);

  const filterLessons = React.useCallback(() => {
    let filtered = lessons;

    if (searchTerm) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(lesson => lesson.category === categoryFilter);
    }

    if (difficultyFilter) {
      filtered = filtered.filter(lesson => lesson.difficulty === difficultyFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(lesson => 
        statusFilter === 'published' ? lesson.isPublished : !lesson.isPublished
      );
    }

    setFilteredLessons(filtered);
  }, [lessons, searchTerm, categoryFilter, difficultyFilter, statusFilter]);

  useEffect(() => {
    filterLessons();
  }, [filterLessons]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await teacherService.getLessons({ limit: 100 });
      
      if (response.success) {
        // Handle both direct array and nested object format
        const lessonsData = response.data;
        const lessonsList = Array.isArray(lessonsData.lessons) 
          ? lessonsData.lessons 
          : (Array.isArray(lessonsData) ? lessonsData : []);
        setLessons(lessonsList);
      } else {
        toast.error('Failed to load lessons');
      }
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    navigate('/teacher/lessons/create');
  };

  const handleViewLesson = (lessonId) => {
    navigate(`/teacher/lessons/${lessonId}`);
  };

  const handleEditLesson = (lessonId) => {
    navigate(`/teacher/lessons/${lessonId}/edit`);
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      try {
        const response = await api.deleteLesson(lessonId);
        
        if (response.success) {
          toast.success('Lesson deleted successfully');
          fetchLessons();
        } else {
          toast.error('Failed to delete lesson');
        }
      } catch (error) {
        console.error('Failed to delete lesson:', error);
        toast.error('Failed to delete lesson');
      }
    }
  };

  const handleTogglePublish = async (lesson) => {
    try {
      const response = await api.updateLesson(lesson.id, {
        ...lesson,
        isPublished: !lesson.isPublished
      });
      
      if (response.success) {
        toast.success(`Lesson ${lesson.isPublished ? 'unpublished' : 'published'} successfully`);
        fetchLessons();
      } else {
        toast.error('Failed to update lesson status');
      }
    } catch (error) {
      console.error('Failed to update lesson:', error);
      toast.error('Failed to update lesson status');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setDifficultyFilter('');
    setStatusFilter('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Lessons" />
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
      <DashboardNavbar role="teacher" currentPage="Lessons" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">My Lessons</h1>
            </div>
            <Button onClick={handleCreateLesson}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create New Lesson
            </Button>
          </div>
          <p className="text-gray-600">Manage your educational content and track student progress</p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-500" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  placeholder="Search lessons..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredLessons.length} of {lessons.length} lessons
          </p>
        </div>

        {/* Lessons Grid */}
        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="p-6 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {lesson.description}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    lesson.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lesson.isPublished ? 'Published' : 'Draft'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <AcademicCapIcon className="h-4 w-4" />
                    <span>{lesson.category || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span>{lesson.duration || 30} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lesson.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      lesson.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {lesson.difficulty?.charAt(0).toUpperCase() + lesson.difficulty?.slice(1) || 'Beginner'}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewLesson(lesson.id)}
                        title="View lesson"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditLesson(lesson.id)}
                        title="Edit lesson"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLesson(lesson.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete lesson"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant={lesson.isPublished ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleTogglePublish(lesson)}
                    >
                      {lesson.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {lessons.length === 0 ? 'No lessons created yet' : 'No lessons match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {lessons.length === 0 
                ? 'Create your first lesson to start teaching your students'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            {lessons.length === 0 ? (
              <Button onClick={handleCreateLesson}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Your First Lesson
              </Button>
            ) : (
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

export default TeacherLessons;
