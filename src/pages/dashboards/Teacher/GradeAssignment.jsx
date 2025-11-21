/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import DashboardNavbar from '../../../components/ui/DashboardNavbar';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarDaysIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const GradeAssignment = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: ''
  });

  // Safety timeout - clear loading after 8 seconds if still loading
  // This is a last resort fallback if API calls hang
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Loading timeout - forcing loading state to false');
        setLoading(false);
        if (!assignment) {
          setError('Request timed out. The server may be slow or unavailable. Please try refreshing the page.');
        } else {
          // We have assignment data, just show it even without submissions
          console.log('✅ Timeout but we have assignment data, showing it');
        }
      }
    }, 8000); // 8 second timeout (matches API timeout)

    return () => clearTimeout(timeout);
  }, [loading, assignment]);

  const fetchAssignmentAndSubmissions = React.useCallback(async () => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching assignment and submissions for:', assignmentId);
      
      // Fetch assignment first (more critical), then submissions
      // This way if submissions fail, we still have the assignment
      let assignmentRes = null;
      let submissionsRes = null;
      
      try {
        console.log('📋 Fetching assignment...');
        assignmentRes = await Promise.race([
          api.getAssignment(assignmentId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Assignment request timeout')), 5000)
          )
        ]);
        console.log('✅ Assignment fetched');
      } catch (assignmentError) {
        console.error('❌ Failed to fetch assignment:', assignmentError);
        assignmentRes = { success: false, message: assignmentError.message };
      }
      
      // Try to fetch submissions, but don't fail completely if it times out
      try {
        console.log('📝 Fetching submissions...');
        submissionsRes = await Promise.race([
          api.getTeacherSubmissions({ assignmentId, sortBy: 'submittedAt', sortOrder: 'DESC' }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Submissions request timeout')), 5000)
          )
        ]);
        console.log('✅ Submissions fetched');
      } catch (submissionsError) {
        console.warn('⚠️ Failed to fetch submissions (will use fallback):', submissionsError);
        submissionsRes = null; // Will use fallback from assignment data
      }

      console.log('📋 Assignment response:', assignmentRes);
      console.log('📝 Submissions response:', submissionsRes);

      // Handle submissions response - backend returns { success: true, data: { submissions: [...], pagination: {...} } }
      let submissionList = [];

      // Handle assignment response
      if (assignmentRes && assignmentRes.success) {
        setAssignment(assignmentRes.data);
        setError(null); // Clear any previous errors
        console.log('✅ Assignment loaded:', assignmentRes.data?.title);
        
        // If assignment has submissions embedded, use them as fallback
        if (assignmentRes.data?.submissions && Array.isArray(assignmentRes.data.submissions) && assignmentRes.data.submissions.length > 0) {
          console.log('📋 Found submissions in assignment data:', assignmentRes.data.submissions.length);
          if (submissionList.length === 0) {
            submissionList = assignmentRes.data.submissions;
            console.log('✅ Using submissions from assignment data as primary source');
          }
        }
      } else {
        console.error('❌ Assignment response error:', assignmentRes);
        const errorMsg = assignmentRes?.message || 'Failed to load assignment';
        // Only set error if we don't have assignment data at all
        if (!assignmentRes?.data) {
          setError(errorMsg);
          toast.error(errorMsg);
        } else {
          // We have some data, use it even if success is false
          setAssignment(assignmentRes.data);
          console.log('⚠️ Using assignment data despite error flag');
          
          // Try to use submissions from assignment data
          if (assignmentRes.data?.submissions && Array.isArray(assignmentRes.data.submissions)) {
            submissionList = assignmentRes.data.submissions;
            console.log('✅ Using submissions from assignment data');
          }
        }
      }
      
      try {
        if (submissionsRes) {
          // Check if response indicates success
          if (submissionsRes.success === true || (submissionsRes.success !== false && submissionsRes.data)) {
            // Success case - extract submissions from response
            if (submissionsRes.data) {
              if (Array.isArray(submissionsRes.data)) {
                submissionList = submissionsRes.data;
              } else if (submissionsRes.data.submissions && Array.isArray(submissionsRes.data.submissions)) {
                submissionList = submissionsRes.data.submissions;
              } else if (submissionsRes.data.data?.submissions && Array.isArray(submissionsRes.data.data.submissions)) {
                submissionList = submissionsRes.data.data.submissions;
              }
            } else if (Array.isArray(submissionsRes)) {
              submissionList = submissionsRes;
            }
            
            console.log('✅ Loaded submissions:', submissionList.length);
          } else {
            // Error case
            console.error('❌ Submissions response indicates failure:', submissionsRes);
            const errorMsg = submissionsRes?.message || 'Failed to load submissions';
            // Only show error if it's not just "no submissions"
            if (!errorMsg.toLowerCase().includes('no submissions') && !errorMsg.toLowerCase().includes('not found')) {
              toast.error(errorMsg);
            }
          }
        } else {
          console.warn('⚠️ No submissions response received - trying fallback from assignment data');
          // Fallback: try to get submissions from assignment data if available
          if (assignmentRes?.data?.submissions && Array.isArray(assignmentRes.data.submissions)) {
            submissionList = assignmentRes.data.submissions;
            console.log('✅ Using submissions from assignment data:', submissionList.length);
          }
        }
      } catch (parseError) {
        console.error('❌ Error parsing submissions response:', parseError);
        console.error('Raw response:', submissionsRes);
        // Fallback: try to get submissions from assignment data
        if (assignmentRes?.data?.submissions && Array.isArray(assignmentRes.data.submissions)) {
          submissionList = assignmentRes.data.submissions;
          console.log('✅ Fallback: Using submissions from assignment data:', submissionList.length);
        }
      }

      setSubmissions(submissionList);
      
      // Check for submission ID in URL query params
      const submissionIdParam = searchParams.get('submission');
      if (submissionIdParam) {
        const submissionFromParam = submissionList.find(sub => 
          sub.id === parseInt(submissionIdParam) || sub.id === submissionIdParam
        );
        if (submissionFromParam) {
          console.log('✅ Found submission from URL param:', submissionFromParam.id);
          setSelectedSubmission(submissionFromParam);
          if (submissionFromParam.status === 'graded') {
            setGradeData({
              score: submissionFromParam.score || '',
              feedback: submissionFromParam.feedback || ''
            });
          } else {
            setGradeData({ score: '', feedback: '' });
          }
          return; // Exit early if we found the submission from URL
        }
      }
      
      // Auto-select first ungraded submission if no URL param
      if (submissionList.length > 0) {
        const firstUngraded = submissionList.find(sub => sub.status !== 'graded');
        if (firstUngraded) {
          console.log('✅ Auto-selecting first ungraded submission:', firstUngraded.id);
          setSelectedSubmission(firstUngraded);
          setGradeData({ score: '', feedback: '' });
        } else {
          console.log('✅ Auto-selecting first submission (all graded):', submissionList[0].id);
          setSelectedSubmission(submissionList[0]);
          if (submissionList[0].status === 'graded') {
            setGradeData({
              score: submissionList[0].score || '',
              feedback: submissionList[0].feedback || ''
            });
          }
        }
      } else {
        console.log('ℹ️ No submissions found for this assignment');
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('💥 Failed to fetch assignment data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        data: error.data,
        stack: error.stack
      });
      
      // Show user-friendly error message
      const errorMessage = error.message || error.data?.message || 'Failed to load assignment data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If we have assignment but no submissions, that's okay - show the assignment
      // Only set assignment to null if we completely failed to load it
      if (!assignment && (!assignmentRes || (!assignmentRes.success && !assignmentRes.data))) {
        setAssignment(null);
      } else if (assignmentRes?.data && !assignment) {
        // If we got data but assignment state wasn't set, set it now
        setAssignment(assignmentRes.data);
        console.log('✅ Assignment set from response data');
      }
      
      // If we have assignment data, clear any errors
      if (assignment || assignmentRes?.data) {
        setError(null);
      }
    } finally {
      // Always clear loading state - this is critical!
      setLoading(false);
      console.log('✅ Loading state cleared - component should render now');
    }
  }, [assignmentId, assignment, searchParams]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentAndSubmissions();
    } else {
      setLoading(false);
      toast.error('Invalid assignment ID');
      navigate('/teacher/assignments');
    }
  }, [assignmentId, fetchAssignmentAndSubmissions, navigate]);

  // Handle submission selection from URL params after submissions are loaded
  useEffect(() => {
    if (submissions.length > 0 && searchParams.get('submission')) {
      const submissionIdParam = searchParams.get('submission');
      const submissionFromParam = submissions.find(sub => 
        sub.id === parseInt(submissionIdParam) || sub.id === submissionIdParam
      );
      if (submissionFromParam && (!selectedSubmission || selectedSubmission.id !== submissionFromParam.id)) {
        setSelectedSubmission(submissionFromParam);
        if (submissionFromParam.status === 'graded') {
          setGradeData({
            score: submissionFromParam.score || '',
            feedback: submissionFromParam.feedback || '',
          });
        } else {
          setGradeData({ score: '', feedback: '' });
        }
      }
    }
  }, [searchParams, submissions, selectedSubmission]); // Only when searchParams or submissions change

  const handleSubmissionSelect = (submission) => {
    setSelectedSubmission(submission);
    if (submission.status === 'graded') {
      setGradeData({
        score: submission.score || '',
        feedback: submission.feedback || ''
      });
    } else {
      setGradeData({
        score: '',
        feedback: ''
      });
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSubmission) {
      toast.error('Please select a submission to grade');
      return;
    }

    if (!gradeData.score || parseFloat(gradeData.score) < 0 || parseFloat(gradeData.score) > (assignment?.maxPoints || 100)) {
      toast.error(`Score must be between 0 and ${assignment?.maxPoints || 100}`);
      return;
    }

    // Calculate values upfront
    const scoreValue = parseFloat(gradeData.score);
    const percentage = ((scoreValue / (assignment?.maxPoints || 100)) * 100).toFixed(2);
    const gradeLetter = getGradeLetter(parseFloat(percentage));

    // Store original submission for rollback
    const originalSubmission = { ...selectedSubmission };
    const originalSubmissions = [...submissions];

    // Optimistic update - update UI immediately
    const optimisticSubmission = {
      ...selectedSubmission,
      status: 'graded',
      score: scoreValue,
      feedback: gradeData.feedback || null,
      percentage: percentage,
      gradeLetter: gradeLetter,
      gradedAt: new Date().toISOString()
    };

    // Update UI immediately
    const updatedSubmissions = submissions.map(sub => 
      sub.id === selectedSubmission.id ? optimisticSubmission : sub
    );
    setSubmissions(updatedSubmissions);
    setSelectedSubmission(optimisticSubmission);
    setSaving(true);

    try {
      console.log('📝 Grading submission:', selectedSubmission.id, 'with score:', scoreValue);
      
      const gradePayload = {
        score: scoreValue,
        feedback: gradeData.feedback?.trim() || null
      };

      console.log('📤 Sending grade payload:', gradePayload);

      // Use api service with built-in 15 second timeout
      const response = await api.gradeSubmission(selectedSubmission.id, gradePayload);
      
      console.log('📥 Grade response received:', response);
      
      if (response.success || response.data) {
        toast.success('Submission graded successfully!', { duration: 3000 });
        
        // Update with server response data (if different from optimistic)
        const finalSubmission = {
          ...optimisticSubmission,
          ...(response.data || {}),
          gradedBy: response.data?.gradedBy || optimisticSubmission.gradedBy
        };
        
        const finalSubmissions = submissions.map(sub => 
          sub.id === selectedSubmission.id ? finalSubmission : sub
        );
        setSubmissions(finalSubmissions);
        setSelectedSubmission(finalSubmission);
        
        // Move to next ungraded submission
        const currentIndex = finalSubmissions.findIndex(sub => sub.id === selectedSubmission.id);
        const nextUngraded = finalSubmissions.slice(currentIndex + 1).find(sub => sub.status !== 'graded');
        if (nextUngraded) {
          console.log('✅ Moving to next ungraded submission:', nextUngraded.id);
          setSelectedSubmission(nextUngraded);
          setGradeData({ score: '', feedback: '' });
        } else {
          // Keep current submission selected but update grade data
          console.log('✅ No more ungraded submissions, staying on current');
          setGradeData({
            score: finalSubmission.score || '',
            feedback: finalSubmission.feedback || ''
          });
        }
      } else {
        // Revert optimistic update on error
        console.error('❌ Grade response indicates failure');
        setSubmissions(originalSubmissions);
        setSelectedSubmission(originalSubmission);
        toast.error(response.message || 'Failed to grade submission');
      }
    } catch (error) {
      console.error('💥 Failed to grade submission:', error);
      
      // Revert optimistic update on error
      setSubmissions(originalSubmissions);
      setSelectedSubmission(originalSubmission);
      
      // Show appropriate error message based on error type
      if (error.name === 'AbortError' || error.message?.includes('abort')) {
        toast.error('Request was cancelled. Please try again.', { duration: 5000 });
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Request timed out. The server may be slow. Refreshing to verify...', { duration: 6000 });
        // Auto-refresh after 2 seconds to check if grade was actually saved
        setTimeout(() => {
          fetchAssignmentAndSubmissions();
        }, 2000);
      } else if (error.status === 504 || error.status === 503) {
        toast.error('Server is experiencing issues. Please try again in a moment.', { duration: 5000 });
      } else if (error.status === 400) {
        toast.error(error.message || error.data?.message || 'Invalid input. Please check your data.', { duration: 5000 });
      } else if (error.status === 403) {
        toast.error('You do not have permission to grade this submission.', { duration: 5000 });
      } else if (error.status === 404) {
        toast.error('Submission or assignment not found. Please refresh the page.', { duration: 5000 });
      } else {
        toast.error(error.message || error.data?.message || 'Failed to grade submission. Please try again.', { duration: 5000 });
      }
    } finally {
      setSaving(false);
    }
  };

  const getSubmissionStatusColor = (submission) => {
    if (submission.status === 'graded') {
      const percentage = submission.percentage || ((submission.score || 0) / (assignment?.maxPoints || 100)) * 100;
      
      if (percentage >= 90) return 'bg-green-100 text-green-800 border-green-300';
      if (percentage >= 80) return 'bg-blue-100 text-blue-800 border-blue-300';
      if (percentage >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      return 'bg-red-100 text-red-800 border-red-300';
    }
    if (submission.status === 'submitted') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 97) return 'A+';
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };

  const getSubmissionStatusText = (submission) => {
    if (submission.status === 'graded') {
      const score = submission.score || 0;
      const maxPoints = assignment?.maxPoints || 100;
      const percentage = submission.percentage || ((score / maxPoints) * 100).toFixed(1);
      return `${score}/${maxPoints} (${percentage}%)`;
    }
    if (submission.status === 'submitted') {
      return 'Pending Review';
    }
    return 'Draft';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Grade Assignment" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="text-gray-600">Loading assignment and submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Grade Assignment" />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center">
            <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Assignment</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/teacher/assignments')}>
                Back to Assignments
              </Button>
              <Button variant="outline" onClick={() => fetchAssignmentAndSubmissions()}>
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <DashboardNavbar role="teacher" currentPage="Grade Assignment" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardNavbar role="teacher" currentPage="Grade Assignment" />
      
      <div className="max-w-7xl mx-auto p-6">
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
          
          <div className="flex items-center gap-3 mb-2">
            <DocumentTextIcon className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-800">Grade Assignment</h1>
          </div>
          <p className="text-gray-600">Review and grade student submissions</p>
        </div>

        {/* Assignment Info */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{assignment.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-gray-500" />
              <span>Max Points: {assignment.maxPoints || 100}</span>
            </div>
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
              <span>Type: {assignment.assignmentType?.charAt(0).toUpperCase() + assignment.assignmentType?.slice(1)}</span>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Submissions ({submissions.length})
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {submissions.length > 0 ? (
                  submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSubmission?.id === submission.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => handleSubmissionSelect(submission)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-800">
                          {submission.student 
                            ? `${submission.student.firstName || ''} ${submission.student.lastName || ''}`.trim()
                            : submission.studentName || `Student ${submission.studentId || 'Unknown'}`}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSubmissionStatusColor(submission)}`}>
                          {getSubmissionStatusText(submission)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Not submitted'}
                      </div>
                      {submission.status === 'graded' && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircleIcon className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Graded</span>
                          {submission.gradeLetter && (
                            <span className="text-xs font-semibold text-gray-700 ml-1">
                              ({submission.gradeLetter})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No submissions yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Grading Panel */}
          <div className="lg:col-span-2">
            {selectedSubmission ? (
              <div className="space-y-6">
                {/* Submission Details */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Submission by {selectedSubmission.student 
                      ? `${selectedSubmission.student.firstName || ''} ${selectedSubmission.student.lastName || ''}`.trim()
                      : selectedSubmission.studentName || `Student ${selectedSubmission.studentId || 'Unknown'}`}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student Response
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="text-gray-800">
                          {selectedSubmission.content || 'No content provided'}
                        </p>
                      </div>
                    </div>

                    {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Attachments
                        </label>
                        <div className="space-y-2">
                          {selectedSubmission.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <DocumentTextIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{attachment.name || `Attachment ${index + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Grading Form */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {selectedSubmission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                  </h3>
                  
                  <form onSubmit={handleGradeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Score (out of {assignment.maxPoints || 100})
                        </label>
                        <input
                          type="number"
                          value={gradeData.score}
                          onChange={(e) => setGradeData(prev => ({ ...prev, score: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                          min="0"
                          max={assignment.maxPoints || 100}
                          step="0.5"
                          required
                        />
                        {gradeData.score && (
                          <p className="mt-1 text-sm text-gray-600">
                            Percentage: {((parseFloat(gradeData.score) || 0) / (assignment.maxPoints || 100) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student Information
                        </label>
                        <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-base font-medium text-gray-800">
                            {selectedSubmission.student?.firstName} {selectedSubmission.student?.lastName}
                          </p>
                          {selectedSubmission.student?.grade && (
                            <p className="text-sm text-gray-600">Grade {selectedSubmission.student.grade}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Feedback
                      </label>
                      <textarea
                        value={gradeData.feedback}
                        onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                        rows="4"
                        placeholder="Provide constructive feedback to help the student improve..."
                      />
                    </div>


                    <div className="flex justify-end gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/teacher/assignments')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="min-w-[120px]"
                      >
                        {saving ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </div>
                        ) : (
                          selectedSubmission.status === 'graded' ? 'Update Grade' : 'Grade Submission'
                        )}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <XCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a submission</h3>
                <p className="text-gray-600">Choose a submission from the left panel to start grading</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeAssignment;
