const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://bbkriket.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { pdfData, roundId } = req.body;
    if (!pdfData || !roundId) {
      return res.status(400).json({ success: false, error: 'Missing pdfData or roundId' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    const tempFilePath = path.join(__dirname, `Baccarat_Game_History_${roundId}.pdf`);
    await fs.writeFile(tempFilePath, pdfBuffer);

    const fileMetadata = {
      name: `Baccarat_Game_History_${roundId}.pdf`,
      parents: ['1dqOfJTTV19Q-wo3eN9Grv2ghlK58UdvX'],
    };

    const media = {
      mimeType: 'application/pdf',
      body: require('fs').createReadStream(tempFilePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    await fs.unlink(tempFilePath);
    res.json({ success: true, fileId: response.data.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};