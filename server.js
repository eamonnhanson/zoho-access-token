const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to fetch Achternaam from Zoho CRM
app.post('/fetch-achternaam', async (req, res) => {
    const { email } = req.body;
    const accessToken = '1000.ccea1aac8d55c749b178a67a425b5411.e327f06b86e6675f136796dd27f8dfef';

    try {
        const response = await axios.get('https://www.zohoapis.com/crm/v2/Example/search', {
            params: {
                criteria: `(Email:equals:${email})`
            },
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.data.length === 0) {
            return res.json({ achternaam: null });
        }

        const achternaam = response.data.data[0].Achternaam;
        res.json({ achternaam });
    } catch (error) {
        console.error('Error fetching Achternaam:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Root route to serve a simple welcome message
app.get('/', (req, res) => {
    res.send('Welcome to the Zoho CRM interface app!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
