const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// In-memory cache for the access token
let cachedAccessToken = process.env.ZOHO_ACCESS_TOKEN;

// Function to refresh access token
const refreshAccessToken = async () => {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: process.env.ZOHO_REFRESH_TOKEN,
                client_id: process.env.ZOHO_CLIENT_ID,
                client_secret: process.env.ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        const newAccessToken = response.data.access_token;
        console.log('New Access Token:', newAccessToken);

        // Update the cached access token
        cachedAccessToken = newAccessToken;
        process.env.ZOHO_ACCESS_TOKEN = newAccessToken;

        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing access token:', error.message, error.response ? error.response.data : '');
        throw error;
    }
};

// Middleware to check login and variable teller
const checkLogin = async (req, res, next) => {
    const { email, password } = req.body;

    const authenticateUser = async (token) => {
        try {
            console.log('Attempting to authenticate user:', email);
            console.log('Using access token:', token);

            const response = await axios.get('https://www.zohoapis.com/crm/v2/Example/search', {
                params: {
                    criteria: `(Email:equals:${email}) and (Password:equals:${password})`
                },
                headers: {
                    'Authorization': `Zoho-oauthtoken ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Zoho CRM API Response:', response.data);

            if (response.data.data.length === 0) {
                console.log('No matching user found.');
                return res.status(401).send('Unauthorized');
            }

            const user = response.data.data[0];

            if (!user) {
                console.log('User object is empty.');
                return res.status(401).send('Unauthorized');
            }

            if (user.teller && user.teller >= 6) {
                console.log('Submission limit reached for user.');
                return res.status(403).send('Form submission limit reached');
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Error during login:', error.message, error.response ? error.response.data : '');

            // Check if the error is due to an expired token and refresh it
            if (error.response && error.response.status === 401 && token === cachedAccessToken) {
                try {
                    console.log('Access token expired. Refreshing token...');
                    const newToken = await refreshAccessToken();
                    return authenticateUser(newToken); // Retry the login check with the new token
                } catch (refreshError) {
                    console.error('Error refreshing access token:', refreshError.message, refreshError.response ? refreshError.response.data : '');
                    return res.status(500).send('Internal Server Error');
                }
            }

            console.error('Unhandled error:', error.message, error.response ? error.response.data : '');
            return res.status(500).send('Internal Server Error');
        }
    };

    authenticateUser(cachedAccessToken);
};

// Root route to serve a login form
app.get('/', (req, res) => {
    res.render('login');
});

// Login endpoint
app.post('/login', checkLogin, (req, res) => {
    const { Email, First_Name, Last_Name, Company_Name } = req.user;

    res.render('form', {
        email: Email,
        voornaam: First_Name,
        achternaam: Last_Name,
        bedrijfsnaam: Company_Name
    });
});

// Serve form (EJS Template)
app.get('/form', (req, res) => {
    res.render('form', {
        email: '',
        voornaam: '',
        achternaam: '',
        bedrijfsnaam: ''
    });
});

app.post('/submit', (req, res) => {
    // Handle form submission
    const formData = req.body;
    console.log('Form Data:', formData);

    // Update Zoho CRM record if necessary
    // ...

    res.send('Form submitted successfully!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
