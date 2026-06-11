const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:3000/api/charges/class', {
      classId: 1,
      name: "TEST_CHARGE",
      amount: 100,
      term: "ONE",
      yearAss: 2025,
      dateAss: "2025-01-01"
    }, {
      headers: {
        'Content-Type': 'application/json'
        // we'll see if it fails auth, which is fine, at least it hits the server!
      }
    });
    console.log(res.status, res.data);
  } catch (e) {
    console.error(e.response ? e.response.status + ' ' + JSON.stringify(e.response.data) : e.message);
  }
}
test();
