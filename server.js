const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

app.post('/fetch-achternaam', async (req, res) => {
    const email = req.body.email;
    const accessToken = process.env.ZOHO_ACCESS_TOKEN; // Access token from environment variable

    if (!accessToken) {
        return res.status(500).json({ error: 'Access token not configured' });
    }

    const criteria = `(Email:equals:${email})`;
    const url = `https://www.zohoapis.eu/crm/v2/Example/search?criteria=${encodeURIComponent(criteria)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;
        res.json(data);
    } catch (error) {
        console.error('Error fetching Bedrijf:', error);
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
