import fetch from 'node-fetch';

async function test() {
  const url = 'http://localhost:3000/api/mandi/today?state=Maharashtra';
  console.log(`Testing: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Success: ${data.success}`);
    console.log(`Price count: ${data.prices ? data.prices.length : 0}`);
    console.log(`Record count: ${data.records ? data.records.length : 0}`);
  } catch (err) {
    console.error(`Test failed: ${err.message}`);
  }
}

test();
