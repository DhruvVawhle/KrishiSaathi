import axios from 'axios';

const API_KEY = '579b464db66ec23bdd0000018b0c1dfe712d4a6946c232e17f9666dc';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

async function test() {
  const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=10`;
  console.log(`Fetching: ${url}`);
  try {
    const res = await axios.get(url);
    console.log('Status:', res.status);
    console.log('Total:', res.data.total);
    console.log('Records length:', res.data.records ? res.data.records.length : 0);
    if (res.data.records && res.data.records.length > 0) {
      console.log('Sample record:', res.data.records[0]);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
