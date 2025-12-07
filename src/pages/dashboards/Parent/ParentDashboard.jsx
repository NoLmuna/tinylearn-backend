import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { 
  HeartIcon, 
  ChartBarIcon,
  ChatBubbleLeftRightIcon, 
  TrophyIcon,
  BookOpenIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  EyeIcon,
  PlusIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';

const ParentDashboard = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    averageProgress: 0,
    totalMessages: 0,
    upcomingAssignments: 0
  });
  const [selectedChild, setSelectedChild] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ 
    subject: '', 
    content: '', 
    receiverId: '' 
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching parent dashboard data...');
      
      // Fetch all data in parallel
      const [childrenRes, teachersRes] = await Promise.all([
        api.getParentChildren().catch(err => ({ success: false, data: [] })),
        api.getTeachers().catch(err => ({ success: false, data: [] }))
      ]);

      console.log('👨‍👩‍👧‍👦 Children response:', childrenRes);
      console.log('👩‍🏫 Teachers response:', teachersRes);

      // Process children data
      const childrenData = childrenRes.success ? (childrenRes.data || []) : [];
      setChildren(childrenData);
      
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }

      // Process teachers data
      const teachersData = teachersRes.success ? (teachersRes.data || []) : [];
      setTeachers(teachersData);

      // TODO: Fetch messages from messaging API when available
      setMessages([]);

      // Calculate real stats
      let totalUpcoming = 0;
      let totalCompleted = 0;
      let totalLessons = 0;

      childrenData.forEach(child => {
        if (child.recentProgress) {
          totalCompleted += child.recentProgress.completedLessons || 0;
          totalLessons += child.recentProgress.totalLessons || 0;
        }
        if (child.upcomingAssignments) {
          totalUpcoming += child.upcomingAssignments.length;
        }
      });

      const avgProgress = totalLessons > 0 
        ? Math.round((totalCompleted / totalLessons) * 100) 
        : 0;

      setStats({
        totalChildren: childrenData.length,
        averageProgress: avgProgress,
        totalMessages: 0, // Will be updated when messaging API is integrated
        upcomingAssignments: totalUpcoming
      });

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('💥 Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const sendMessage = () => {
    if (!newMessage.receiverId || !newMessage.subject || !newMessage.content) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Message sent successfully! (Static mode)');
    setShowMessageModal(false);
    setNewMessage({ subject: '', content: '', receiverId: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <DashboardNavbar role="parent" currentPage="Dashboard" />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your children's education</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Children</p>
                <p className="text-3xl font-bold">{stats.totalChildren}</p>
              </div>
              <HeartIcon className="h-8 w-8 text-purple-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Average Progress</p>
                <p className="text-3xl font-bold">{stats.averageProgress}%</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-indigo-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-pink-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm">Messages</p>
                <p className="text-3xl font-bold">{stats.totalMessages}</p>
              </div>
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-pink-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Upcoming</p>
                <p className="text-3xl font-bold">{stats.upcomingAssignments}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-200" />
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Children Overview */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Children Overview</h3>
                <Button
                  onClick={() => setShowMessageModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Message Teacher</span>
                </Button>
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading children data...</p>
                </div>
              ) : children.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Children Found</h3>
                  <p className="text-gray-600">Your children's information will appear here once added to the system.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div 
                      key={child.id} 
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedChild?.id === child.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => setSelectedChild(child)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-purple-600">
                              {child.firstName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {child.firstName} {child.lastName}
                            </h4>
                            <p className="text-sm text-gray-600">Grade {child.grade}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Progress</p>
                              <p className="text-lg font-semibold text-green-600">
                                {child.recentProgress?.completedLessons || 0}/{child.recentProgress?.totalLessons || 0}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Avg Score</p>
                              <p className="text-lg font-semibold text-blue-600">
                                {child.recentProgress?.averageScore || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {child.upcomingAssignments && child.upcomingAssignments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Upcoming Assignments:</p>
                          <div className="flex flex-wrap gap-2">
                            {child.upcomingAssignments.slice(0, 3).map((assignment) => (
                              <span 
                                key={assignment.id}
                                className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
                              >
                                {assignment.title}
                              </span>
                            ))}
                            {child.upcomingAssignments.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{child.upcomingAssignments.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Messages */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Recent Messages</h3>
                <Button variant="outline" size="sm">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
              
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm text-gray-800">{message.sender}</p>
                        <span className={`w-2 h-2 rounded-full ${message.isRead ? 'bg-gray-300' : 'bg-blue-500'}`}></span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{message.subject}</p>
                      <p className="text-xs text-gray-500">{message.preview}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Send Message to Teacher</h3>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send to Teacher
                  </label>
                  <select
                    value={newMessage.receiverId}
                    onChange={(e) => setNewMessage({ ...newMessage, receiverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter message subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Type your message here..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={() => setShowMessageModal(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={sendMessage}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
