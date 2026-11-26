/**
 * Email Service
 * Handles sending emails via SendGrid, AWS SES, or similar provider
 */

export interface EmailMessage {
  to: string;
  subject: string;
  template: 'registration' | 'inspection-report' | 'payment-confirmation' | 'shop-verified' | 'complaint-received';
  data: Record<string, any>;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    // In production, integrate with SendGrid, AWS SES, etc.
    // For now, log the email
    console.log('📧 Email to send:', {
      to: message.to,
      subject: message.subject,
      template: message.template,
    });

    // Simulate API call
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: message.to }] }],
    //     from: { email: process.env.EMAIL_FROM },
    //     subject: message.subject,
    //     content: [{ type: 'text/html', value: renderTemplate(message) }],
    //   }),
    // });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export function renderTemplate(message: EmailMessage): string {
  const templates: Record<string, (data: any) => string> = {
    registration: (data) => `
      <h1>Welcome to MobCheck!</h1>
      <p>Hi ${data.firstName},</p>
      <p>Your account has been successfully created.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/verify/${data.token}">Verify your email</a></p>
    `,
    'inspection-report': (data) => `
      <h1>Your Inspection Report is Ready!</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your device inspection for ${data.deviceModel} is complete.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reports/${data.reportNumber}">View Report</a></p>
      <p>You have 3 hours to review and confirm.</p>
    `,
    'payment-confirmation': (data) => `
      <h1>Payment Confirmed</h1>
      <p>Hi ${data.customerName},</p>
      <p>Your inspection booking payment of Rs. ${data.amount} has been received.</p>
      <p>Booking reference: ${data.bookingId}</p>
    `,
    'shop-verified': (data) => `
      <h1>Shop Verified!</h1>
      <p>Hi ${data.shopName},</p>
      <p>Your shop has been verified and is now active on MobCheck.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/vendor/dashboard">Go to Dashboard</a></p>
    `,
    'complaint-received': (data) => `
      <h1>Complaint Received</h1>
      <p>Hi ${data.customerName},</p>
      <p>We have received your complaint about ${data.shopName}.</p>
      <p>Reference: ${data.complaintId}</p>
      <p>We will review and get back to you within 48 hours.</p>
    `,
  };

  const template = templates[message.template];
  return template ? template(message.data) : 'Email template not found';
}

// Example usage:
// sendEmail({
//   to: 'customer@example.com',
//   subject: 'Your Inspection Report is Ready',
//   template: 'inspection-report',
//   data: {
//     customerName: 'John Doe',
//     deviceModel: 'iPhone 15 Pro',
//     reportNumber: 'MBC-2026-00001',
//     bookingId: 'booking-uuid',
//   },
// });
