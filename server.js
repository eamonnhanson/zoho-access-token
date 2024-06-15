const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Function to send email notification
async function sendEmailNotification(errorMessage) {
    let transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other email services
        auth: {
            user: 'your-email@gmail.com', // Your email
            pass: 'your-email-password' // Your email password or app password
        }
    });

    let mailOptions = {
        from: 'your-email@gmail.com',
        to: 'eamonn@planteenboom.nu',
        subject: 'Zoho CRM Access Token Refresh Error',
        text: `An error occurred while refreshing the Zoho CRM access token: ${errorMessage}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Error notification email sent.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Function to refresh access token
async function refreshAccessToken() {
    const refreshToken = '1000.0fbbb7355b852585e33af15ca8df01a7.30dde41ebe34d216d1c8bdb2986dcb8e';
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
        // Update environment variable
        process.env.ZOHO_ACCESS_TOKEN = newAccessToken;

        // Optionally write the new access token to a file for persistence
        fs.writeFileSync('.env', `ZOHO_ACCESS_TOKEN=${newAccessToken}\nZOHO_REFRESH_TOKEN=${refreshToken}\nZOHO_CLIENT_ID=${clientId}\nZOHO_CLIENT_SECRET=${clientSecret}`);

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        await sendEmailNotification(error.message || error);
        throw new Error('Unable to refresh access token');
    }
}

// Middleware to check and refresh token if needed
async function ensureValidToken(req, res, next) {
    let accessToken = process.env.ZOHO_ACCESS_TOKEN;

    // Attempt to make a test call to check if the token is valid
    try {
        await axios.get('https://www.zohoapis.eu/crm/v2/Example/search?criteria=test', {
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        // Token is valid
        next();
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Token is invalid, refresh it
            accessToken = await refreshAccessToken();
            process.env.ZOHO_ACCESS_TOKEN = accessToken;
            next();
        } else {
            // Other error
            console.error('Error verifying access token:', error);
            res.status(500).json({ error: 'Error verifying access token' });
        }
    }
}

app.post('/fetch-achternaam', ensureValidToken, async (req, res) => {
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
