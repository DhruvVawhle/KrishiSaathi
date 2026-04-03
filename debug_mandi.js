import axios from 'axios';

async function testLocalApi() {
  const url = 'http://localhost:3000/api/mandi/today?state=Maharashtra';
  console.log(`Testing Local API: ${url}`);
  try {
    const res = await axios.get(url);
    console.log('Status:', res.status);
    console.log('Success:', res.data.success);
    console.log('Price Count:', res.data.prices ? res.data.prices.length : 'N/A');
    console.log('Records Count:', res.data.records ? res.data.records.length : 'N/A');
    if (res.data.records && res.data.records.length > 0) {
      console.log('First Record:', res.data.records[0]);
    } else {
      console.log('Full Data Keys:', Object.keys(res.data));
    }
  } catch (err) {
    if (err.response) {
      console.error('Error Status:', err.response.status);
      console.error('Error Data:', err.response.data);
    } else {
      console.error('Error Message:', err.message);
    }
  }
}

testLocalApi();
