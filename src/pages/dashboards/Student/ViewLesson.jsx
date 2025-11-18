import React, { useState, useEffect, useCallback } from 'react';
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
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const StudentViewLesson = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLesson = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getLesson(lessonId);

      if (response.success && response.data) {
        setLesson(response.data);
      } else {
        toast.error('Lesson not found');
        navigate('/student/lessons');
      }
    } catch (error) {
      console.error('Failed to fetch lesson:', error);
      toast.error('Failed to load lesson');
      navigate('/student/lessons');
    } finally {
      setLoading(false);
    }
  }, [lessonId, navigate]);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId, fetchLesson]);

  const startLesson = () => {
    toast.success('Enjoy your lesson!', { icon: '🎧' });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="student" currentPage="View Lesson" />
        <div className="max-w-6xl mx-auto p-6">
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
        <DashboardNavbar role="student" currentPage="View Lesson" />
        <div className="max-w-4xl mx-auto p-6">
          <Card className="p-8 text-center">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Lesson not available</h2>
            <p className="text-gray-600 mb-4">Please choose another lesson to continue learning.</p>
            <Button onClick={() => navigate('/student/lessons')}>Back to Lessons</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="student" currentPage="View Lesson" />

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/student/lessons')}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
          <Button onClick={startLesson} variant="primary">
            <PlayIcon className="h-4 w-4 mr-2" />
            Start Activity
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-blue-100">
                <BookOpenIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{lesson.title}</h1>
                <p className="text-gray-600 mt-2">{lesson.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4" />
                    {lesson.category || 'General'}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    {lesson.duration || 30} min
                  </span>
                  <span className={`px-3 py-1 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty || 'Beginner'}
                  </span>
                  {lesson.isPublished && (
                    <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4" />
                      Ready to learn
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {lesson.objectives && lesson.objectives.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Learning Goals</h2>
            <ul className="space-y-3">
              {lesson.objectives.map((objective, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700">{objective}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {lesson.materials && lesson.materials.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">What You Need</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lesson.materials.map((material, index) => (
                <li key={index} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <p className="text-gray-700">{material}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Lesson Activity</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <pre className="whitespace-pre-wrap text-gray-800 font-sans text-base leading-relaxed">
              {lesson.content || 'No content available for this lesson yet.'}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentViewLesson;

