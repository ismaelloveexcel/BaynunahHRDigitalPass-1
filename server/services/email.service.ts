import nodemailer from 'nodemailer';
import { generatePassQRCode } from './qr.service.js';

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Email templates
const emailTemplates = {
  passCreated: (name: string, passId: string, qrCode: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 25px rgba(51, 179, 237, 0.35); }
        .header { background: linear-gradient(135deg, #002b5c 0%, #33b3ed 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .pass-id { background: rgba(51, 179, 237, 0.1); border-left: 4px solid #33b3ed; padding: 20px; margin: 20px 0; font-size: 24px; font-weight: bold; color: #002b5c; }
        .qr-code { text-align: center; margin: 30px 0; }
        .btn { display: inline-block; background: #33b3ed; color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; margin: 20px 0; }
        .footer { background: #f5f7fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Baynunah HRIS!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Your digital pass has been created successfully. Use this pass to track your entire journey with Baynunah.</p>
          
          <div class="pass-id">
            Pass ID: ${passId}
          </div>
          
          <p><strong>Your Digital Pass Features:</strong></p>
          <ul>
            <li>✅ Track application status in real-time</li>
            <li>✅ Complete assessments online</li>
            <li>✅ Schedule interviews</li>
            <li>✅ View offer letters</li>
            <li>✅ Upload onboarding documents</li>
          </ul>
          
          <div class="qr-code">
            <p><strong>Scan to access your pass:</strong></p>
            <img src="${qrCode}" alt="QR Code" style="max-width: 200px;" />
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}/candidate-pass/${passId}" class="btn">
              View My Pass →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Powered by HR |IS| Baynunah 2025</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  interviewScheduled: (name: string, passId: string, date: string, time: string, location: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 25px rgba(51, 179, 237, 0.35); }
        .header { background: linear-gradient(135deg, #33b3ed 0%, #002b5c 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .interview-details { background: #f5f7fa; border-radius: 12px; padding: 25px; margin: 20px 0; }
        .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .detail-label { font-weight: bold; width: 120px; color: #002b5c; }
        .btn { display: inline-block; background: #33b3ed; color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; margin: 20px 0; }
        .footer { background: #f5f7fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Interview Scheduled!</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Great news! Your interview has been scheduled. Please find the details below:</p>
          
          <div class="interview-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span>
              <span>${date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏰ Time:</span>
              <span>${time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📍 Location:</span>
              <span>${location}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🎫 Pass ID:</span>
              <span>${passId}</span>
            </div>
          </div>
          
          <p><strong>Preparation Tips:</strong></p>
          <ul>
            <li>Arrive 10 minutes early</li>
            <li>Bring your pass ID or QR code</li>
            <li>Review your CV and application</li>
            <li>Prepare questions about the role</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}/candidate-pass/${passId}" class="btn">
              View Pass & Details →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Powered by HR |IS| Baynunah 2025</p>
          <p>Need to reschedule? Contact us through your digital pass.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  offerSent: (name: string, passId: string, jobTitle: string, startDate: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 25px rgba(51, 179, 237, 0.35); }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .congratulations { text-align: center; font-size: 48px; margin: 20px 0; }
        .offer-box { background: linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%); border-left: 4px solid #28a745; padding: 25px; margin: 20px 0; border-radius: 12px; }
        .btn { display: inline-block; background: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; margin: 20px 0; font-weight: bold; }
        .footer { background: #f5f7fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations!</h1>
        </div>
        <div class="content">
          <div class="congratulations">🎊</div>
          <p>Dear ${name},</p>
          <p>We are delighted to extend an offer of employment to you!</p>
          
          <div class="offer-box">
            <h3 style="margin-top: 0; color: #28a745;">Position: ${jobTitle}</h3>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p>Your offer letter is now available in your digital pass.</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Review the offer letter in your pass</li>
            <li>Accept or decline the offer</li>
            <li>Complete onboarding documents</li>
            <li>Prepare for your first day!</li>
          </ol>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}/candidate-pass/${passId}" class="btn">
              View Offer Letter →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Powered by HR |IS| Baynunah 2025</p>
          <p>Welcome to the Baynunah family!</p>
        </div>
      </div>
    </body>
    </html>
  `,

  statusUpdate: (name: string, passId: string, status: string, message: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 25px rgba(51, 179, 237, 0.35); }
        .header { background: linear-gradient(135deg, #002b5c 0%, #33b3ed 100%); padding: 40px 20px; text-align: center; color: white; }
        .content { padding: 40px 30px; }
        .status-badge { display: inline-block; background: #33b3ed; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
        .btn { display: inline-block; background: #33b3ed; color: white; padding: 15px 40px; text-decoration: none; border-radius: 10px; margin: 20px 0; }
        .footer { background: #f5f7fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Update</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          <p>Your application status has been updated:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <span class="status-badge">${status}</span>
          </div>
          
          <p>${message}</p>
          
          <div style="text-align: center;">
            <a href="${process.env.APP_URL}/candidate-pass/${passId}" class="btn">
              View Full Details →
            </a>
          </div>
        </div>
        <div class="footer">
          <p>Powered by HR |IS| Baynunah 2025</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

// Email sending functions
export async function sendPassCreatedEmail(
  email: string,
  name: string,
  passId: string
): Promise<void> {
  try {
    // Generate QR code
    const qrCode = await generatePassQRCode(passId);

    await transporter.sendMail({
      from: `"Baynunah HRIS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your Baynunah Digital Pass: ${passId}`,
      html: emailTemplates.passCreated(name, passId, qrCode),
    });

    console.log(`✅ Pass created email sent to ${email}`);
  } catch (error) {
    console.error('Error sending pass created email:', error);
    // Don't throw - email failure shouldn't break the main flow
  }
}

export async function sendInterviewScheduledEmail(
  email: string,
  name: string,
  passId: string,
  interviewDetails: {
    date: string;
    time: string;
    location: string;
  }
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Baynunah HRIS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Interview Scheduled - ${interviewDetails.date}`,
      html: emailTemplates.interviewScheduled(
        name,
        passId,
        interviewDetails.date,
        interviewDetails.time,
        interviewDetails.location
      ),
    });

    console.log(`✅ Interview email sent to ${email}`);
  } catch (error) {
    console.error('Error sending interview email:', error);
  }
}

export async function sendOfferEmail(
  email: string,
  name: string,
  passId: string,
  offerDetails: {
    jobTitle: string;
    startDate: string;
  }
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Baynunah HRIS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 Offer Letter - ${offerDetails.jobTitle}`,
      html: emailTemplates.offerSent(
        name,
        passId,
        offerDetails.jobTitle,
        offerDetails.startDate
      ),
    });

    console.log(`✅ Offer email sent to ${email}`);
  } catch (error) {
    console.error('Error sending offer email:', error);
  }
}

export async function sendStatusUpdateEmail(
  email: string,
  name: string,
  passId: string,
  status: string,
  message: string
): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"Baynunah HRIS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Application Status Update - ${status}`,
      html: emailTemplates.statusUpdate(name, passId, status, message),
    });

    console.log(`✅ Status update email sent to ${email}`);
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    return false;
  }
}
