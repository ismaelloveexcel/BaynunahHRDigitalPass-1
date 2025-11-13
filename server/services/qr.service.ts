import QRCode from 'qrcode';

/**
 * Generate QR code for digital pass
 * Returns data URL that can be embedded directly in HTML
 */
export async function generatePassQRCode(passId: string): Promise<string> {
  try {
    const passUrl = `${process.env.APP_URL || 'http://localhost:5173'}/pass/${passId}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(passUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#002b5c', // Baynunah primary color
        light: '#FFFFFF',
      },
      width: 300,
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as buffer (for saving to file)
 */
export async function generatePassQRCodeBuffer(passId: string): Promise<Buffer> {
  try {
    const passUrl = `${process.env.APP_URL || 'http://localhost:5173'}/pass/${passId}`;
    
    const buffer = await QRCode.toBuffer(passUrl, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.95,
      margin: 1,
      color: {
        dark: '#002b5c',
        light: '#FFFFFF',
      },
      width: 600,
    });

    return buffer;
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Generate QR code for interview check-in
 */
export async function generateInterviewQRCode(interviewId: number, passId: string): Promise<string> {
  try {
    const data = JSON.stringify({
      type: 'interview',
      interviewId,
      passId,
      timestamp: new Date().toISOString(),
    });

    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      color: {
        dark: '#33b3ed', // Accent color for interviews
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating interview QR code:', error);
    throw new Error('Failed to generate interview QR code');
  }
}
