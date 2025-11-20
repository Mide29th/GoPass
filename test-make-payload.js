// Test what payload is being sent to Make.com
const WEBHOOK_URL = 'https://hook.us2.make.com/cl2nnrnpemh1uuhuxn6b3dw6jjwd1uny';

// Simulate what BankDetailsForm sends
const testPayloads = [
  {
    name: 'Test with bank code 001',
    payload: {
      organizer_id: 'test-user-id',
      bank_code: '001',
      account_number: '0102027322',
      account_name: 'TEST ACCOUNT - 0102027322',
      email: 'test@example.com',
      business_name: 'Test Business',
    }
  },
  {
    name: 'Test with real bank (044)',
    payload: {
      organizer_id: 'test-user-id',
      bank_code: '044',
      account_number: '0102027322',
      account_name: 'JOHN DOE',
      email: 'test@example.com',
      business_name: 'Test Business',
    }
  },
];

async function testPayload(test) {
  console.log(`\n📤 Testing: ${test.name}`);
  console.log('Payload:', JSON.stringify(test.payload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(test.payload),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
    
    if (!response.ok) {
      try {
        const json = JSON.parse(text);
        console.log('Error Details:', json);
      } catch (e) {
        console.log('Raw response:', text);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Make.com webhook payloads...');
  for (const test of testPayloads) {
    await testPayload(test);
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests();
