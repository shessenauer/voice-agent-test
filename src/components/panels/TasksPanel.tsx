'use client';

import React, { useState, useEffect } from 'react';

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  createdAt: string;
  url: string;
}

interface TasksPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function TasksPanel({ isVisible, onToggle }: TasksPanelProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'open' | 'closed' | 'assigned'>('open');

  // Mock data for demonstration
  const mockIssues: GitHubIssue[] = [
    {
      id: 1,
      number: 123,
      title: 'Fix login authentication bug',
      body: 'Users are experiencing issues with the login flow. The authentication token is not being properly validated.',
      state: 'open',
      labels: ['bug', 'high-priority', 'authentication'],
      assignees: ['john.doe'],
      createdAt: '2024-01-15T10:30:00Z',
      url: 'https://github.com/example/repo/issues/123'
    },
    {
      id: 2,
      number: 124,
      title: 'Add dark mode support',
      body: 'Implement dark mode toggle for better user experience during night time usage.',
      state: 'open',
      labels: ['enhancement', 'ui'],
      assignees: [],
      createdAt: '2024-01-14T14:20:00Z',
      url: 'https://github.com/example/repo/issues/124'
    },
    {
      id: 3,
      number: 125,
      title: 'Update documentation for API v2',
      body: 'Documentation needs to be updated to reflect the new API endpoints and parameters.',
      state: 'closed',
      labels: ['documentation', 'api'],
      assignees: ['jane.smith'],
      createdAt: '2024-01-10T09:15:00Z',
      url: 'https://github.com/example/repo/issues/125'
    }
  ];

  useEffect(() => {
    if (isVisible) {
      loadIssues();
    }
  }, [isVisible, viewFilter]);

  const loadIssues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call the MCP tool
      // For now, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      let filteredIssues = mockIssues;
      
      switch (viewFilter) {
        case 'open':
          filteredIssues = mockIssues.filter(issue => issue.state === 'open');
          break;
        case 'closed':
          filteredIssues = mockIssues.filter(issue => issue.state === 'closed');
          break;
        case 'assigned':
          filteredIssues = mockIssues.filter(issue => issue.assignees.length > 0);
          break;
        default:
          filteredIssues = mockIssues;
      }
      
      setIssues(filteredIssues);
    } catch (err) {
      setError('Failed to load issues');
      console.error('Error loading issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (labels: string[]) => {
    if (labels.includes('high-priority')) return 'text-red-600 bg-red-50';
    if (labels.includes('medium-priority')) return 'text-yellow-600 bg-yellow-50';
    if (labels.includes('low-priority')) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openIssueInGitHub = (url: string) => {
    window.open(url, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
          <span className="text-sm text-gray-500">({issues.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'open', label: 'Open' },
          { key: 'assigned', label: 'Assigned' },
          { key: 'closed', label: 'Closed' },
          { key: 'all', label: 'All' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewFilter(key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewFilter === key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
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
              <p className="font-medium">Failed to load issues</p>
              <button
                onClick={loadIssues}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="font-medium">No issues found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openIssueInGitHub(issue.url)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        #{issue.number} {issue.title}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(issue.labels)}`}>
                        {issue.labels.find(l => l.includes('priority')) || 'normal'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {issue.body}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created {formatDate(issue.createdAt)}</span>
                      {issue.assignees.length > 0 && (
                        <span>Assigned to {issue.assignees.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      issue.state === 'open' 
                        ? 'text-green-600 bg-green-50' 
                        : 'text-gray-600 bg-gray-50'
                    }`}>
                      {issue.state}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                
                {issue.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {issue.labels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
