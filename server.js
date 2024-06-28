document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('email-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('input--sections--21194190717258__footer--contactemail').value;

        console.log(`Fetching data for email: ${email}`);

        fetch('https://zoho-calls-e0dc91dd8cf4.herokuapp.com/fetch-achternaam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => {
            console.log('Response received', response);
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            if (data.data && data.data.length > 0) {
                const userRecord = data.data[0];
                if (userRecord.Teller < 6) {
                    const bedrijf = userRecord.Bedrijf || 'Bedrijf not found';
                    document.getElementById('achternaam-display').innerText = bedrijf;

                    // Show the introduction section
                    document.getElementById('introduction-section').style.display = 'block';

                    // Collect necessary fields to send to Zoho Creator via webhook
                    const payload = {
                        Voornaam: userRecord.Voornaam,
                        Achternaam: userRecord.Achternaam,
                        Email: userRecord.Email,
                        Teller: userRecord.Teller,
                        Bedrijf: userRecord.Bedrijf,
                        // Add other form data here
                    };

                    // Send data to Zoho Creator via webhook through the proxy
                    fetch('https://zoho-calls-e0dc91dd8cf4.herokuapp.com/zoho-webhook', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Data sent to Zoho Creator:', data);
                    })
                    .catch(error => {
                        console.error('Error sending data to Zoho Creator:', error);
                    });
                } else {
                    document.getElementById('achternaam-display').innerText = 'Teller value is 6 or greater';
                }
            } else {
                document.getElementById('achternaam-display').innerText = 'No matching records found';
            }
        })
        .catch(error => {
            console.error('Error fetching Bedrijf:', error);
            document.getElementById('achternaam-display').innerText = 'De informatie kan niet opgehaald worden. Stuur een email naar info@planteenboom.nu om de fout te melden.';
        });
    });

    // Show form if checkbox is checked
    document.getElementById('more-info-checkbox').addEventListener('change', function() {
        const loginForm = document.getElementById('login-form');
        if (this.checked) {
            loginForm.style.display = 'block';
        } else {
            loginForm.style.display = 'none';
        }
    });
});
