const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { refreshAccessToken } = require('./test-zohoaccess');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/verify-email', async (req, res) => {
    const { email } = req.body;
    try {
        await refreshAccessToken();
        const accessToken = process.env.ZOHO_ACCESS_TOKEN;
        const response = await axios.get(`https://www.zohoapis.eu/crm/v2/Example/search?criteria=(Email:equals:${email})`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
        });

        if (response.data.data.length > 0) {
            const user = response.data.data[0];
            if (user.Teller < 6) {
                res.json({
                    exists: true,
                    voornaam: user.Voornaam,
                    achternaam: user.Achternaam,
                    email: user.Email,
                    teller: user.Teller,
                    bedrijf: user.Bedrijf
                });
            } else {
                res.json({ exists: false });
            }
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        console.error('Error verifying email:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Error verifying email' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
