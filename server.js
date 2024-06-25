const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/fetch-achternaam', async (req, res) => {
    const email = req.body['contact[email]'];
    console.log(`Fetching data for email: ${email}`);

    try {
        const response = await axios.get(`https://www.zohoapis.eu/crm/v2/Leads/search?email=${email}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`
            }
        });

        console.log('Data fetched from Zoho CRM:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Zoho CRM:', error.message, error.response ? error.response.data : '');
        if (error.response && error.response.data) {
            res.status(500).json({ message: error.response.data.message });
        } else {
            res.status(500).json({ message: 'Error fetching data from Zoho CRM' });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
