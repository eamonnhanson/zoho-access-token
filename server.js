const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Function to refresh access token
async function refreshAccessToken() {
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshUrl = `https://accounts.zoho.eu/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;

    try {
        const response = await axios.post(refreshUrl, null, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const newAccessToken = response.data.access_token;
        console.log('New access token:', newAccessToken);
        process.env.ZOHO_ACCESS_TOKEN = newAccessToken;

        // Optionally write the new access token to a file for persistence
        fs.writeFileSync('.env', `ZOHO_ACCESS_TOKEN=${newAccessToken}\nZOHO_REFRESH_TOKEN=${refreshToken}\nZOHO_CLIENT_ID=${clientId}\nZOHO_CLIENT_SECRET=${clientSecret}`);

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
        throw new Error('Unable to refresh access token');
    }
}

// Middleware to check and refresh token if needed
async function ensureValidToken(req, res, next) {
    let accessToken = process.env.ZOHO_ACCESS_TOKEN;

    try {
        console.log('Verifying access token...');
        const response = await axios.get('https://www.zohoapis.eu/crm/v2/Example/search?criteria=(Email:equals:test@example.com)', {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Access token is valid. Response:', response.data);
        next();
    } catch (error) {
        console.error('Error verifying access token:', error.response ? error.response.data : error.message);
        if (error.response && error.response.status === 401) {
            try {
                console.log('Refreshing access token...');
                accessToken = await refreshAccessToken();
                process.env.ZOHO_ACCESS_TOKEN = accessToken;
                next();
            } catch (refreshError) {
                console.error('Error refreshing access token:', refreshError.message);
                res.status(500).json({ error: 'Error refreshing access token' });
            }
        } else {
            res.status(500).json({ error: 'Error verifying access token' });
        }
    }
}

// Route to handle POST request to /fetch-achternaam
app.post('/fetch-achternaam', ensureValidToken, async (req, res) => {
    const email = req.body.email;
    const accessToken = process.env.ZOHO_ACCESS_TOKEN;

    if (!accessToken) {
        return res.status(500).json({ error: 'Access token not configured' });
    }

    const criteria = `(Email:equals:${email})`;
    const url = `https://www.zohoapis.eu/crm/v2/Example/search?criteria=${encodeURIComponent(criteria)}`;

    try {
        console.log('Fetching data for email:', email);
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        console.log('Data fetched successfully:', data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching Bedrijf:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching Bedrijf' });
    }
});

// Default route for health check
app.get('/', (req, res) => {
    res.send('Zoho CRM API integration is running');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
