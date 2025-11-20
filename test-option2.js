// Test Option 2: Real bank codes with synthetic test account (0000000000)
const WEBHOOK_URL = 'https://hook.us2.make.com/cl2nnrnpemh1uuhuxn6b3dw6jjwd1uny';

const testPayloads = [
  {
    name: 'Test Account (0000000000) with Access Bank (044)',
    payload: {
      organizer_id: 'test-user-id',
      bank_code: '044',
      account_number: '0000000000',
      account_name: 'TEST ACCOUNT - 044',
      email: 'test@example.com',
      business_name: 'Test Organizer',
    }
  },
  {
    name: 'Test Account (0000000000) with GTB (058)',
    payload: {
      organizer_id: 'test-user-id',
      bank_code: '058',
      account_number: '0000000000',
      account_name: 'TEST ACCOUNT - 058',
      email: 'test@example.com',
      business_name: 'Test Organizer',
    }
  },
  {
    name: 'Real Account with Access Bank (044) - For Production',
    payload: {
      organizer_id: 'test-user-id',
      bank_code: '044',
      account_number: '0102027322',
      account_name: 'JOHN DOE',
      email: 'john@example.com',
      business_name: 'John Events',
    }
  },
];

async function testPayload(test) {
  console.log(`\n📤 Testing: ${test.name}`);
  console.log('Account Number:', test.payload.account_number);
  console.log('Bank Code:', test.payload.bank_code);

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
    
    if (response.ok || response.status === 200) {
      console.log('✅ Webhook accepted');
      try {
        const json = JSON.parse(text);
        console.log('Response:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Response:', text.substring(0, 200));
      }
    } else {
      console.log('❌ Webhook error');
      try {
        const json = JSON.parse(text);
        console.log('Error Details:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Raw response:', text.substring(0, 200));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Option 2: Real bank codes with synthetic test account\n');
  console.log('============================================================');
  console.log('TEST ACCOUNT: 0000000000 (triggers mock verification)');
  console.log('REAL ACCOUNT: Uses Paystack verification');
  console.log('============================================================\n');
  
  for (const test of testPayloads) {
    await testPayload(test);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📋 TESTING COMPLETE');
  console.log('\n✅ For UI Testing: Use account number 0000000000');
  console.log('✅ For Real Testing: Use actual account numbers with real bank codes');
}

runTests();
