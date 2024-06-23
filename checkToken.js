const axios = require('axios');

const accessToken = '1000.83b2b84ea44aced42f095512f5ab4cd4.ae813a74167cb474067ddf67e72a2670';
const url = 'https://www.zohoapis.eu/crm/v2/Example/search?criteria=(Email:equals:test@example.com)';

axios.get(url, {
  headers: {
    'Authorization': `Zoho-oauthtoken ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response data:', response.data);
})
.catch(error => {
  if (error.response) {
    console.log('Error response data:', error.response.data);
  } else {
    console.log('Error message:', error.message);
  }
});
git add .