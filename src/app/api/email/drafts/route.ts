import { NextRequest, NextResponse } from 'next/server';
import type { EmailDraft } from '../../../../types/api.types';

// Mock email drafts data
const mockDrafts: EmailDraft[] = [
  {
    id: 'draft1',
    to: ['team@example.com'],
    subject: 'Project Update - Q1 Progress',
    body: 'Hi team,\n\nI wanted to provide an update on our Q1 progress. We\'ve made significant strides in the following areas:\n\n1. Feature development is 80% complete\n2. Testing phase has begun\n3. Documentation is being updated\n\nLet me know if you have any questions.\n\nBest regards,\n[Your name]',
    cc: ['manager@example.com'],
    bcc: [],
    status: 'draft',
    createdAt: '2024-01-15T09:30:00Z',
    lastModified: '2024-01-15T14:20:00Z'
  },
  {
    id: 'draft2',
    to: ['client@example.com'],
    subject: 'Proposal for Website Redesign',
    body: 'Dear [Client Name],\n\nThank you for considering our services for your website redesign project. Based on our initial discussion, I\'ve prepared a comprehensive proposal that includes:\n\n- Modern, responsive design\n- SEO optimization\n- Content management system\n- 6-month maintenance package\n\nI\'ve attached the detailed proposal document. Please review it and let me know if you have any questions or would like to schedule a follow-up call.\n\nLooking forward to working with you.\n\nBest regards,\n[Your name]',
    cc: [],
    bcc: [],
    status: 'draft',
    createdAt: '2024-01-14T16:45:00Z',
    lastModified: '2024-01-15T10:15:00Z'
  },
  {
    id: 'draft3',
    to: ['john.doe@example.com'],
    subject: 'Meeting Follow-up',
    body: 'Hi John,\n\nThanks for the productive meeting today. As discussed, here are the action items:\n\n1. Review the technical specifications by Friday\n2. Prepare the budget estimate for next week\n3. Schedule follow-up meeting for next Tuesday\n\nI\'ll send you the detailed specs shortly.\n\nBest,\n[Your name]',
    cc: [],
    bcc: [],
    status: 'draft',
    createdAt: '2024-01-15T11:00:00Z',
    lastModified: '2024-01-15T11:00:00Z'
  },
  {
    id: 'draft4',
    to: ['vendor@example.com'],
    subject: 'Contract Renewal Discussion',
    body: 'Hello,\n\nI hope this email finds you well. I wanted to reach out regarding our current contract which is set to expire next month.\n\nWe\'ve been very satisfied with your services and would like to discuss renewal terms. Specifically, we\'re interested in:\n\n- Extending the contract for another year\n- Discussing volume discounts for increased usage\n- Adding new features that have become available\n\nPlease let me know when would be a good time to schedule a call to discuss these matters.\n\nBest regards,\n[Your name]',
    cc: ['legal@example.com'],
    bcc: [],
    status: 'draft',
    createdAt: '2024-01-16T08:30:00Z',
    lastModified: '2024-01-16T08:30:00Z'
  }
];

// GET /api/email/drafts - Get email drafts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'draft';
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'lastModified';

    // Filter drafts based on status
    let filteredDrafts = mockDrafts;
    
    if (status !== 'all') {
      filteredDrafts = mockDrafts.filter(draft => draft.status === status);
    }

    // Sort drafts
    filteredDrafts.sort((a, b) => {
      const aValue = sortBy === 'lastModified' ? a.lastModified : a.createdAt;
      const bValue = sortBy === 'lastModified' ? b.lastModified : b.createdAt;
      return new Date(bValue).getTime() - new Date(aValue).getTime();
    });

    // Apply limit
    filteredDrafts = filteredDrafts.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        drafts: filteredDrafts,
        totalCount: filteredDrafts.length,
        filters: {
          status,
          limit,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Error fetching email drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

// POST /api/email/drafts - Create a new draft
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, body: emailBody, cc = [], bcc = [] } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { success: false, error: 'to and subject are required' },
        { status: 400 }
      );
    }

    // Generate new draft
    const newDraft = {
      id: `draft${Date.now()}`,
      to: Array.isArray(to) ? to : [to],
      subject,
      body: emailBody || '',
      cc: Array.isArray(cc) ? cc : (cc ? [cc] : []),
      bcc: Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []),
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    // Add to mock data (in real implementation, this would be saved to database)
    mockDrafts.push(newDraft);

    return NextResponse.json({
      success: true,
      data: newDraft
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating email draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create draft' },
      { status: 500 }
    );
  }
}

// PUT /api/email/drafts/[id] - Update a draft
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { to, subject, body: emailBody, cc, bcc } = body;

    // Find and update draft
    const draftIndex = mockDrafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    const updatedDraft = {
      ...mockDrafts[draftIndex],
      ...(to && { to: Array.isArray(to) ? to : [to] }),
      ...(subject && { subject }),
      ...(emailBody !== undefined && { body: emailBody }),
      ...(cc !== undefined && { cc: Array.isArray(cc) ? cc : (cc ? [cc] : []) }),
      ...(bcc !== undefined && { bcc: Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []) }),
      lastModified: new Date().toISOString()
    };

    mockDrafts[draftIndex] = updatedDraft;

    return NextResponse.json({
      success: true,
      data: updatedDraft
    });

  } catch (error) {
    console.error('Error updating email draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// POST /api/email/drafts/[id]/send - Send a draft
export async function POST_SEND(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    // Find draft
    const draftIndex = mockDrafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    const draft = mockDrafts[draftIndex];

    // Simulate sending email
    const sentEmail = {
      ...draft,
      id: `sent_${Date.now()}`,
      status: 'sent' as const,
      sentAt: new Date().toISOString(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Update draft status to sent
    mockDrafts[draftIndex] = {
      ...draft,
      status: 'sent' as const,
      lastModified: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: sentEmail
    });

  } catch (error) {
    console.error('Error sending email draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send draft' },
      { status: 500 }
    );
  }
}

// DELETE /api/email/drafts/[id] - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (!draftId) {
      return NextResponse.json(
        { success: false, error: 'Draft ID is required' },
        { status: 400 }
      );
    }

    // Find and remove draft
    const draftIndex = mockDrafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Draft not found' },
        { status: 404 }
      );
    }

    const deletedDraft = mockDrafts.splice(draftIndex, 1)[0];

    return NextResponse.json({
      success: true,
      data: deletedDraft
    });

  } catch (error) {
    console.error('Error deleting email draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
