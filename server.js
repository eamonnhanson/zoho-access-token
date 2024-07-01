const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for specific origin
const corsOptions = {
    origin: 'https://www.planteenboom.nu',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Welcome to the Zoho CRM Data Fetcher');
});

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

// Endpoint to fetch data based on email 28 june 2024
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

// Endpoint to handle webhook requests
app.post('/zoho-webhook', async (req, res) => {
    const payload = req.body;

    try {
        const response = await axios.post('https://flow.zoho.eu/20071889412/flow/webhook/incoming?zapikey=1001.135d0547db270fb2604b6772f9c30ac1.e1c3971a221b2993f3d850b4b348471a&isdebug=false', payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error sending data to Zoho Creator:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error sending data to Zoho Creator' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
