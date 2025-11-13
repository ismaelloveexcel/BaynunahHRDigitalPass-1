import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let client: ReturnType<typeof twilio> | null = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<void> {
  if (!client) {
    console.warn('⚠️  WhatsApp not configured - message not sent');
    return;
  }

  try {
    // Ensure phone number has correct format
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    await client.messages.create({
      from: whatsappNumber,
      to: formattedTo,
      body: message,
    });

    console.log(`✅ WhatsApp message sent to ${to}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    // Don't throw - WhatsApp failure shouldn't break the main flow
  }
}

/**
 * Send pass created notification
 */
export async function sendPassCreatedWhatsApp(
  phone: string,
  name: string,
  passId: string
): Promise<void> {
  const message = `
🎉 *Welcome to Baynunah HRIS!*

Hi ${name},

Your digital pass has been created successfully!

📱 *Pass ID:* ${passId}

✅ Track your application journey
✅ Complete assessments
✅ Schedule interviews
✅ View offers

🔗 Access your pass: ${process.env.APP_URL}/candidate-pass/${passId}

_Powered by HR |IS| Baynunah 2025_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Send interview scheduled notification
 */
export async function sendInterviewScheduledWhatsApp(
  phone: string,
  name: string,
  details: {
    date: string;
    time: string;
    location: string;
    passId: string;
  }
): Promise<void> {
  const message = `
📅 *Interview Scheduled!*

Hi ${name},

Your interview has been confirmed:

📆 *Date:* ${details.date}
⏰ *Time:* ${details.time}
📍 *Location:* ${details.location}

💡 *Tips:*
• Arrive 10 minutes early
• Bring your Pass ID: ${details.passId}
• Review your CV

🔗 View details: ${process.env.APP_URL}/candidate-pass/${details.passId}

Good luck! 🍀

_Baynunah HR Team_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Send offer notification
 */
export async function sendOfferWhatsApp(
  phone: string,
  name: string,
  jobTitle: string,
  passId: string
): Promise<void> {
  const message = `
🎊 *Congratulations ${name}!*

We're excited to extend an offer for the position of *${jobTitle}*!

Your offer letter is now available in your digital pass.

✨ *Next Steps:*
1️⃣ Review the offer letter
2️⃣ Accept or decline
3️⃣ Complete onboarding documents

🔗 View offer: ${process.env.APP_URL}/candidate-pass/${passId}

Welcome to the Baynunah family! 🎉

_HR |IS| Baynunah_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Send status update notification
 */
export async function sendStatusUpdateWhatsApp(
  phone: string,
  name: string,
  status: string,
  passId: string
): Promise<void> {
  const message = `
🔔 *Application Update*

Hi ${name},

Your application status has been updated to: *${status}*

Check your digital pass for full details.

🔗 ${process.env.APP_URL}/candidate-pass/${passId}

_Baynunah HR Team_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Send assessment reminder
 */
export async function sendAssessmentReminderWhatsApp(
  phone: string,
  name: string,
  passId: string
): Promise<void> {
  const message = `
⏰ *Assessment Reminder*

Hi ${name},

You have a pending assessment waiting for you!

Please complete it within the next 48 hours.

🔗 Start assessment: ${process.env.APP_URL}/candidate-pass/${passId}

_Baynunah HR Team_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Send document upload reminder
 */
export async function sendDocumentReminderWhatsApp(
  phone: string,
  name: string,
  documents: string[],
  passId: string
): Promise<void> {
  const docList = documents.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n');

  const message = `
📄 *Document Upload Reminder*

Hi ${name},

Please upload the following documents to complete your onboarding:

${docList}

🔗 Upload now: ${process.env.APP_URL}/candidate-pass/${passId}

_Baynunah HR Team_
  `.trim();

  await sendWhatsAppMessage(phone, message);
}

/**
 * Test WhatsApp configuration
 */
export async function testWhatsAppConfig(): Promise<boolean> {
  if (!client) {
    console.log('❌ WhatsApp not configured');
    return false;
  }

  console.log('✅ WhatsApp is configured');
  return true;
}
