import { Resend } from 'resend';

// Initialize Resend client
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface MagicLinkEmailProps {
  to: string;
  magicLinkUrl: string;
  displayName?: string;
}

export async function sendMagicLinkEmail({ to, magicLinkUrl, displayName }: MagicLinkEmailProps) {
  if (!resend) {
    console.warn('[Email] Resend not configured. Skipping email send.');
    return { success: false, error: 'Email service not configured' };
  }

  console.log('[Email] Attempting to send email with config:', {
    to,
    from: process.env.RESEND_FROM_EMAIL || 'noreply@troponiniq.com',
    hasApiKey: !!process.env.RESEND_API_KEY,
    apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3)
  });

  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@troponiniq.com',
      to,
      subject: 'Your secure login link',
      html: createMagicLinkEmailTemplate({ magicLinkUrl, displayName }),
    });

    console.log('[Email] Magic link email sent successfully:', response.data?.id);
    return { success: true, id: response.data?.id };
  } catch (error: any) {
    console.error('[Email] Failed to send magic link email:', error);
    console.error('[Email] Full error object:', JSON.stringify(error, null, 2));
    
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
    
    console.error('[Email] Error details:', errorDetails);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

function createMagicLinkEmailTemplate({ 
  magicLinkUrl, 
  displayName 
}: { 
  magicLinkUrl: string; 
  displayName?: string; 
}) {
  const greeting = displayName ? `Hi ${displayName}` : 'Hi there';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Login Link</title>
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
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e2e8f0;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .button:hover {
            background: #1d4ed8 !important;
          }
          .button:visited {
            color: #ffffff !important;
          }
          .security-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            color: #92400e;
          }
          .security-notice strong {
            color: #78350f;
          }
          .security-notice ul {
            margin: 12px 0 0 0;
            padding-left: 20px;
          }
          .security-notice li {
            margin-bottom: 4px;
          }
          .fallback-section {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          .fallback-text {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 12px;
            font-weight: 500;
          }
          .fallback-link {
            word-break: break-all;
            color: #475569;
            font-size: 13px;
            background: #f1f5f9;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 14px;
            text-align: center;
          }
          .site-attribution {
            color: #475569;
            font-weight: 500;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Secure Login Link</h1>
          </div>
          
          <p>${greeting},</p>
          
          <p>You requested a secure login link for your account. Click the button below to sign in:</p>
          
          <div class="button-container">
            <a href="${magicLinkUrl}" class="button">Sign In Securely</a>
          </div>
          
          <div class="security-notice">
            <strong>Security Notice:</strong>
            <ul>
              <li>This link will expire in 15 minutes</li>
              <li>It can only be used once</li>
              <li>Don't share this link with anyone</li>
            </ul>
          </div>
          
          <p>If you didn't request this login link, you can safely ignore this email.</p>
          
          <div class="fallback-section">
            <div class="fallback-text">Trouble clicking the button? Use this link:</div>
            <div class="fallback-link">
              ${magicLinkUrl}
            </div>
          </div>
          
          <div class="footer">
            <div class="site-attribution">This secure login link was sent from your account dashboard</div>
            <div>© ${new Date().getFullYear()} All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>
  `;
} 