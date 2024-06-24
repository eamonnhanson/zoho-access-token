const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

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

        // Update the environment variable
        process.env.ZOHO_ACCESS_TOKEN = newAccessToken;

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error.response ? error.response.data : error.message);
        throw new Error('Unable to refresh access token');
    }
}

// Endpoint om de toegangstoken op te halen en te verversen
app.post('/fetch-achternaam', async (req, res) => {
    const email = req.body.email;
    const accessToken = await refreshAccessToken();

    try {
        const response = await axios.get(`https://www.zohoapis.eu/crm/v2/Example/search?criteria=(Email:equals:${email})`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Zoho CRM:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error fetching data from Zoho CRM' });
    }
});

app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
});
