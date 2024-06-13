const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.post('/fetch-achternaam', async (req, res) => {
    const email = req.body.email;
    const accessToken = process.env.ZOHO_ACCESS_TOKEN; // Access token from environment variable

    if (!accessToken) {
        return res.status(500).json({ error: 'Access token not configured' });
    }

    const criteria = `(Email:equals:${email})`;
    const url = `https://www.zohoapis.eu/crm/v2/Example/search?criteria=${encodeURIComponent(criteria)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching Bedrijf:', error);
        res.status(500).json({ error: 'Error fetching Bedrijf' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
