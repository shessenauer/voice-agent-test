import { NextRequest, NextResponse } from 'next/server';
import type { GitHubIssue } from '../../../../types/api.types';

// Mock GitHub issues data
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
    updatedAt: '2024-01-15T14:20:00Z',
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
    updatedAt: '2024-01-14T16:45:00Z',
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
    updatedAt: '2024-01-12T11:30:00Z',
    url: 'https://github.com/example/repo/issues/125'
  },
  {
    id: 4,
    number: 126,
    title: 'Implement user profile management',
    body: 'Add functionality for users to update their profiles, including avatar upload and personal information.',
    state: 'open',
    labels: ['feature', 'user-management'],
    assignees: ['john.doe', 'jane.smith'],
    createdAt: '2024-01-16T08:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
    url: 'https://github.com/example/repo/issues/126'
  }
];

// GET /api/github/issues - Get issues with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'open';
    const labels = searchParams.get('labels')?.split(',') || [];
    const assignee = searchParams.get('assignee');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Filter issues based on query parameters
    let filteredIssues = mockIssues;

    if (state !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.state === state);
    }

    if (labels.length > 0) {
      filteredIssues = filteredIssues.filter(issue => 
        labels.some(label => issue.labels.includes(label))
      );
    }

    if (assignee) {
      filteredIssues = filteredIssues.filter(issue => 
        issue.assignees.includes(assignee)
      );
    }

    // Apply limit
    filteredIssues = filteredIssues.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        issues: filteredIssues,
        totalCount: filteredIssues.length,
        filters: {
          state,
          labels,
          assignee,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching GitHub issues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST /api/github/issues - Create a new issue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: issueBody, labels = [], assignees = [] } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Generate new issue
    const newIssue = {
      id: mockIssues.length + 1,
      number: Math.max(...mockIssues.map(i => i.number)) + 1,
      title,
      body: issueBody || '',
      state: 'open' as const,
      labels,
      assignees,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: `https://github.com/example/repo/issues/${Math.max(...mockIssues.map(i => i.number)) + 1}`
    };

    // Add to mock data (in real implementation, this would be saved to database)
    mockIssues.push(newIssue);

    return NextResponse.json({
      success: true,
      data: newIssue
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

// PUT /api/github/issues/[id] - Update an issue
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueNumber = searchParams.get('number');
    
    if (!issueNumber) {
      return NextResponse.json(
        { success: false, error: 'Issue number is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, body: issueBody, state, labels, assignees } = body;

    // Find and update issue
    const issueIndex = mockIssues.findIndex(issue => issue.number === parseInt(issueNumber));
    
    if (issueIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    const updatedIssue = {
      ...mockIssues[issueIndex],
      ...(title && { title }),
      ...(issueBody !== undefined && { body: issueBody }),
      ...(state && { state }),
      ...(labels && { labels }),
      ...(assignees && { assignees }),
      updatedAt: new Date().toISOString()
    };

    mockIssues[issueIndex] = updatedIssue;

    return NextResponse.json({
      success: true,
      data: updatedIssue
    });

  } catch (error) {
    console.error('Error updating GitHub issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}
