const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware to check login and variable teller
const checkLogin = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const response = await axios.post('https://www.zohoapis.com/crm/v2/Example/search', {
            criteria: `((Email:equals:${email}) and (Password:equals:${password}))`
        }, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${process.env.ZOHO_ACCESS_TOKEN}`
            }
        });

        const user = response.data.data[0];

        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        if (user.teller && user.teller >= 6) {
            return res.status(403).send('Form submission limit reached');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
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
