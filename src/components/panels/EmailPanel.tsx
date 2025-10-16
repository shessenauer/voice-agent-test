'use client';

import React, { useState, useEffect } from 'react';

interface EmailDraft {
  id: string;
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  createdAt: string;
  lastModified: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
}

interface EmailPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function EmailPanel({ isVisible, onToggle }: EmailPanelProps) {
  const [drafts, setDrafts] = useState<EmailDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<EmailDraft | null>(null);

  // Mock data for demonstration
  const mockDrafts: EmailDraft[] = [
    {
      id: 'draft1',
      to: ['team@example.com'],
      subject: 'Project Update - Q1 Progress',
      body: 'Hi team,\n\nI wanted to provide an update on our Q1 progress. We\'ve made significant strides in the following areas:\n\n1. Feature development is 80% complete\n2. Testing phase has begun\n3. Documentation is being updated\n\nLet me know if you have any questions.\n\nBest regards,\n[Your name]',
      cc: ['manager@example.com'],
      createdAt: '2024-01-15T09:30:00Z',
      lastModified: '2024-01-15T14:20:00Z',
      status: 'draft'
    },
    {
      id: 'draft2',
      to: ['client@example.com'],
      subject: 'Proposal for Website Redesign',
      body: 'Dear [Client Name],\n\nThank you for considering our services for your website redesign project. Based on our initial discussion, I\'ve prepared a comprehensive proposal that includes:\n\n- Modern, responsive design\n- SEO optimization\n- Content management system\n- 6-month maintenance package\n\nI\'ve attached the detailed proposal document. Please review it and let me know if you have any questions or would like to schedule a follow-up call.\n\nLooking forward to working with you.\n\nBest regards,\n[Your name]',
      createdAt: '2024-01-14T16:45:00Z',
      lastModified: '2024-01-15T10:15:00Z',
      status: 'draft'
    },
    {
      id: 'draft3',
      to: ['john.doe@example.com'],
      subject: 'Meeting Follow-up',
      body: 'Hi John,\n\nThanks for the productive meeting today. As discussed, here are the action items:\n\n1. Review the technical specifications by Friday\n2. Prepare the budget estimate for next week\n3. Schedule follow-up meeting for next Tuesday\n\nI\'ll send you the detailed specs shortly.\n\nBest,\n[Your name]',
      createdAt: '2024-01-15T11:00:00Z',
      lastModified: '2024-01-15T11:00:00Z',
      status: 'draft'
    }
  ];

  useEffect(() => {
    if (isVisible) {
      loadDrafts();
    }
  }, [isVisible]);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the MCP tool
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API call
      
      // Sort drafts by last modified date (newest first)
      const sortedDrafts = [...mockDrafts].sort((a, b) => 
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      );
      
      setDrafts(sortedDrafts);
    } catch (_err) {
      setError('Failed to load email drafts');
      console.error('Error loading drafts:', _err);
    } finally {
      setLoading(false);
    }
  };

  const sendDraft = async (draftId: string) => {
    try {
      // In a real implementation, this would call the MCP tool
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setDrafts(prev => prev.map(draft => 
        draft.id === draftId 
          ? { ...draft, status: 'sent' as const }
          : draft
      ));
      
      // Remove sent draft from the list
      setTimeout(() => {
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
        setSelectedDraft(null);
      }, 2000);
      
    } catch {
      setDrafts(prev => prev.map(draft => 
        draft.id === draftId 
          ? { ...draft, status: 'failed' as const }
          : draft
      ));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'sending':
        return 'text-blue-600 bg-blue-100';
      case 'sent':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Email Drafts</h3>
          <span className="text-sm text-gray-500">({drafts.length})</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {/* TODO: Implement compose functionality */}}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Compose
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-600">
            <div className="text-center">
              <p className="font-medium">Failed to load drafts</p>
              <button
                onClick={loadDrafts}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : drafts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="font-medium">No drafts found</p>
              <p className="text-sm">Start composing a new email</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedDraft?.id === draft.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => setSelectedDraft(draft)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {draft.subject}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                        {draft.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      To: {draft.to.join(', ')}
                      {draft.cc && draft.cc.length > 0 && (
                        <span className="text-gray-500">, CC: {draft.cc.join(', ')}</span>
                      )}
                    </p>
                    
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {draft.body}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                      <span>Modified {formatDate(draft.lastModified)}</span>
                      {draft.status === 'draft' && (
                        <span>Created {formatDate(draft.createdAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {draft.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendDraft(draft.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Send
                      </button>
                    )}
                    {draft.status === 'sending' && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                    {draft.status === 'sent' && (
                      <span className="text-xs text-green-600 font-medium">Sent</span>
                    )}
                    {draft.status === 'failed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendDraft(draft.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draft Preview Modal */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              <button
                onClick={() => setSelectedDraft(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <p className="text-sm text-gray-900">{selectedDraft.to.join(', ')}</p>
                </div>
                
                {selectedDraft.cc && selectedDraft.cc.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">CC:</label>
                    <p className="text-sm text-gray-900">{selectedDraft.cc.join(', ')}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject:</label>
                  <p className="text-sm text-gray-900">{selectedDraft.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Message:</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                      {selectedDraft.body}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedDraft(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {selectedDraft.status === 'draft' && (
                <button
                  onClick={() => {
                    sendDraft(selectedDraft.id);
                    setSelectedDraft(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Email
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
