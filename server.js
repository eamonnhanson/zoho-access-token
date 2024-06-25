const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the Zoho CRM integration server!');
});

app.post('/fetch-achternaam', async (req, res) => {
    try {
        const email = req.body['contact[email]'];
        const response = await axios.get(`${process.env.ZOHO_API_DOMAIN}/crm/v2/Leads/search?email=${email}`, {
            headers: {
                Authorization: `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`
            }
        });

        if (response.data.data.length > 0) {
            res.json(response.data);
        } else {
            res.status(404).json({ message: 'No matching records found' });
        }
    } catch (error) {
        console.error('Error fetching data from Zoho CRM:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'An error occurred while fetching data' });
    }
});

app.post('/submit-form', async (req, res) => {
    try {
        console.log('Form data received:', req.body);
        res.json({ message: 'Form submission successful' });
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({ message: 'An error occurred while processing the form' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
