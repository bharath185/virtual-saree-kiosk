// Automated Render Deployment Script for Virtual Saree Try-On Kiosk
const https = require('https');

const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_11SPRZFyNfwhWUu4HjuRnytvpnhe';
const OWNER_ID = 'tea-d0kkget6ubrc73bcd9tg'; // Verified from your Render account

const repoName = process.argv[2] || 'virtual-saree-kiosk';
const repoUrl = repoName.startsWith('http') ? repoName : `https://github.com/bharath185/${repoName}`;

console.log(`🚀 Initiating Render deployment for: ${repoUrl}`);

const payload = JSON.stringify({
  type: 'static_site',
  name: 'virtual-saree-kiosk',
  ownerId: OWNER_ID,
  repo: repoUrl,
  branch: 'master',
  autoDeploy: 'yes',
  serviceDetails: {
    buildCommand: 'npm run build',
    publishPath: 'dist'
  }
});

const req = https.request(
  {
    hostname: 'api.render.com',
    path: '/v1/services',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  },
  (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('\n✅ Successfully created Render Static Site!');
          console.log(`Service Name : ${json.name}`);
          console.log(`Live URL     : ${json.serviceDetails ? json.serviceDetails.url : 'Deploying...'}`);
          console.log(`Dashboard    : ${json.dashboardUrl}`);
        } else {
          console.error('\n❌ Render API Response:', json.message || data);
          if (data.includes('not found') || data.includes('access')) {
            console.log('\n👉 Make sure the GitHub repository is created and pushed before calling Render API.');
          }
        }
      } catch (e) {
        console.error('Error parsing response:', data);
      }
    });
  }
);

req.on('error', (err) => {
  console.error('Network error:', err);
});

req.write(payload);
req.end();
