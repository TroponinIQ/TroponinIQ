// Email notification utilities for feedback system
import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface FeedbackNotificationData {
  id: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  userEmail?: string;
  userId: string;
  userAgent?: string;
  url?: string;
}

export async function sendFeedbackNotification(data: FeedbackNotificationData) {
  console.log('📧 New feedback notification:', {
    id: data.id,
    type: data.type,
    title: data.title,
    priority: data.priority,
    userEmail: data.userEmail,
    userId: data.userId,
  });

  // Send email notification using Resend
  const feedbackNotificationEmail = process.env.FEEDBACK_NOTIFICATION_EMAIL;
  if (feedbackNotificationEmail && resend) {
    console.log('[Feedback Email] Attempting to send email with config:', {
      to: feedbackNotificationEmail,
      from: process.env.RESEND_FROM_EMAIL || 'noreply@troponiniq.com',
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3),
      subject: `[${data.type.toUpperCase()}] ${data.title}`
    });

    try {
      const response = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@troponiniq.com',
        to: feedbackNotificationEmail,
        subject: `[${data.type.toUpperCase()}] ${data.title}`,
        html: createFeedbackEmailTemplate(data),
      });

      console.log('[Feedback Email] Feedback notification email sent successfully:', response.data?.id);
      console.log('[Feedback Email] Full response object:', JSON.stringify(response, null, 2));
    } catch (error: any) {
      console.error('[Feedback Email] Failed to send feedback notification email:', error);
      console.error('[Feedback Email] Full error object:', JSON.stringify(error, null, 2));
      
      // Try to extract more details from different error formats
      const errorDetails = {
        message: error.message,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response?.data,
        data: error.data,
        error: error.error,
        name: error.name
      };
      
      console.error('[Feedback Email] Error details:', errorDetails);
    }
  } else {
    if (!feedbackNotificationEmail) {
      console.log('⚠️ FEEDBACK_NOTIFICATION_EMAIL not configured - skipping email notification');
    }
    if (!resend) {
      console.log('⚠️ RESEND_API_KEY not configured - skipping email notification');
    }
  }

  // Send to Slack webhook (keep existing functionality)
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      const slackMessage = {
        text: `🐛 New ${data.type} feedback: ${data.title}`,
        attachments: [
          {
            color: data.priority === 'high' ? 'danger' : data.priority === 'medium' ? 'warning' : 'good',
            fields: [
              {
                title: 'Type',
                value: data.type,
                short: true,
              },
              {
                title: 'Priority',
                value: data.priority,
                short: true,
              },
              {
                title: 'Description',
                value: data.description.substring(0, 200) + (data.description.length > 200 ? '...' : ''),
                short: false,
              },
              {
                title: 'User',
                value: data.userEmail || `User ID: ${data.userId}`,
                short: true,
              },
            ],
          },
        ],
      };

      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
      
      console.log('✅ Slack notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error);
    }
  }
}

function createFeedbackEmailTemplate(data: FeedbackNotificationData) {
  const priorityColor = data.priority === 'high' ? '#dc2626' : data.priority === 'medium' ? '#d97706' : '#16a34a';
  const typeIcon = data.type === 'bug' ? '🐛' : data.type === 'feature' ? '💡' : data.type === 'improvement' ? '⚡' : '💬';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Feedback Submission</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: #ffffff;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
          }
          .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .feedback-badge {
            display: inline-block;
            background: ${priorityColor};
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 16px;
          }
          .feedback-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin: 16px 0 12px 0;
          }
          .feedback-meta {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .meta-row:last-child {
            margin-bottom: 0;
          }
          .meta-label {
            font-weight: 600;
            color: #64748b;
          }
          .meta-value {
            color: #1e293b;
          }
          .description-section {
            margin: 20px 0;
          }
          .description-label {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .description-content {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            color: #1e293b;
            white-space: pre-wrap;
            line-height: 1.5;
          }
          .technical-info {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #64748b;
          }
          .footer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 12px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${typeIcon} New Feedback Received</h1>
          </div>
          
          <div class="feedback-badge">${data.priority} priority ${data.type}</div>
          
          <div class="feedback-title">${data.title}</div>
          
          <div class="feedback-meta">
            <div class="meta-row">
              <span class="meta-label">Feedback ID:</span>
              <span class="meta-value">${data.id}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Type:</span>
              <span class="meta-value">${data.type}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">Priority:</span>
              <span class="meta-value">${data.priority}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">User ID:</span>
              <span class="meta-value">${data.userId}</span>
            </div>
            ${data.userEmail ? `
            <div class="meta-row">
              <span class="meta-label">User Email:</span>
              <span class="meta-value">${data.userEmail}</span>
            </div>
            ` : ''}
            ${data.url ? `
            <div class="meta-row">
              <span class="meta-label">Page URL:</span>
              <span class="meta-value">${data.url}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="description-section">
            <div class="description-label">Description:</div>
            <div class="description-content">${data.description}</div>
          </div>
          
          ${data.userAgent ? `
          <div class="technical-info">
            <strong>User Agent:</strong><br>
            ${data.userAgent}
          </div>
          ` : ''}
          
          <div class="footer">
            <div>This feedback was submitted via your application feedback system</div>
            <div>Feedback received on ${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// Example integration with SendGrid (commented out)
/*
import sgMail from '@sendgrid/mail';

export async function sendEmailWithSendGrid(data: FeedbackNotificationData) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not found, skipping email notification');
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const msg = {
    to: process.env.ADMIN_EMAIL,
    from: process.env.FROM_EMAIL,
    subject: `[${data.type.toUpperCase()}] ${data.title}`,
    html: `
      <h2>New Feedback Submitted</h2>
      <p><strong>Type:</strong> ${data.type}</p>
      <p><strong>Priority:</strong> ${data.priority}</p>
      <p><strong>Title:</strong> ${data.title}</p>
      <p><strong>Description:</strong></p>
      <p>${data.description}</p>
      <p><strong>User:</strong> ${data.userEmail || data.userId}</p>
      ${data.url ? `<p><strong>URL:</strong> ${data.url}</p>` : ''}
      ${data.userAgent ? `<p><strong>User Agent:</strong> ${data.userAgent}</p>` : ''}
    `,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email notification sent successfully');
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
  }
}
*/ 