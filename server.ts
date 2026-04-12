
import express from "express";
import cors from "cors";
import path from "path";
import cron from "node-cron";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const app = express();
const PORT = 3000;

console.log('[BOOT] Starting IT-KOM Bautagebuch Server...');

// 1. Basic Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 2. API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 3. Daily Report Cron Job (Every day at 20:00)
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] Starting daily material report at 20:00');
  
  try {
    // 1. Get config for email list
    const configDoc = await db.collection('config').doc('app').get();
    const config = configDoc.data();
    const emailList = config?.reportEmailList || [];
    
    if (emailList.length === 0) {
      console.log('[CRON] No emails configured for report. Skipping.');
      return;
    }

    // 2. Get today's entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entriesSnapshot = await db.collection('diaryEntries')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(today))
      .get();

    if (entriesSnapshot.empty) {
      console.log('[CRON] No entries found for today. Skipping report.');
      return;
    }

    // 3. Aggregate missing materials
    const missingMaterials: { [key: string]: string[] } = {};
    entriesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.missingWork) {
        const tech = data.technician || 'Unbekannt';
        if (!missingMaterials[tech]) missingMaterials[tech] = [];
        missingMaterials[tech].push(data.missingWork);
      }
    });

    // 4. Aggregate material list
    const materialSummary: { [key: string]: number } = {};
    entriesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.materials && Array.isArray(data.materials)) {
        data.materials.forEach((m: any) => {
          const amount = parseFloat(m.amount) || 0;
          materialSummary[m.name] = (materialSummary[m.name] || 0) + amount;
        });
      }
    });

    // 5. Build Email Content
    let emailHtml = `
      <h2 style="color: #1e293b;">Täglicher Material- & Statusbericht</h2>
      <p style="color: #64748b;">Datum: ${new Date().toLocaleDateString('de-DE')}</p>
      
      <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Fehlendes Material / Offene Arbeiten</h3>
    `;

    if (Object.keys(missingMaterials).length === 0) {
      emailHtml += '<p>Keine offenen Arbeiten gemeldet.</p>';
    } else {
      for (const [tech, works] of Object.entries(missingMaterials)) {
        emailHtml += `
          <div style="margin-bottom: 15px;">
            <strong style="color: #2563eb;">${tech}:</strong>
            <ul style="margin-top: 5px;">
              ${works.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>
        `;
      }
    }

    emailHtml += `
      <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Materialverbrauch Heute</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 12px; border: 1px solid #e2e8f0;">Material</th>
            <th style="text-align: right; padding: 12px; border: 1px solid #e2e8f0;">Gesamtmenge</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(materialSummary).map(([name, amount]) => `
            <tr>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${name}</td>
              <td style="text-align: right; padding: 12px; border: 1px solid #e2e8f0; font-weight: bold;">${amount} ST</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="font-size: 10px; color: #94a3b8; margin-top: 40px;">Dies ist ein automatisch generierter Bericht vom IT-KOM Bautagebuch System.</p>
    `;

    // 6. Send Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Bautagebuch System" <noreply@it-kom.de>',
      to: emailList.join(', '),
      subject: `Täglicher Materialbericht - ${new Date().toLocaleDateString('de-DE')}`,
      html: emailHtml,
    });

    console.log('[CRON] Daily report sent successfully to:', emailList.join(', '));
  } catch (err) {
    console.error('[CRON] Error sending daily report:', err);
  }
}, {
  timezone: "Europe/Berlin"
});

// 4. Frontend / Static Files
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[READY] IT-KOM Bautagebuch Server on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('[FATAL] Server failed:', err);
});
