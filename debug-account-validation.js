// Debug real account validation issue
const TEST_SECRET = 'sk_test_c76380075b97a795cce7713aa85a827de45b558a';
const LIVE_SECRET = 'sk_live_530991a59b7b6529203649acc4111141c2c06119';

// Test accounts from earlier conversations
const testAccounts = [
  { bank: '044', code: 'Access Bank', account: '0102027322', name: 'Access Test' },
  { bank: '058', code: 'GTB', account: '0198760697', name: 'GTB Test' },
  { bank: '044', code: 'Access Bank', account: '0000000000', name: 'Synthetic Test' },
];

async function debugPaystackAPI(secret, secretType) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 DEBUGGING PAYSTACK API with ${secretType} SECRET`);
  console.log(`${'='.repeat(70)}\n`);

  for (const account of testAccounts) {
    console.log(`\n📝 Testing: ${account.name}`);
    console.log(`   Bank: ${account.code} (${account.bank})`);
    console.log(`   Account: ${account.account}`);

    try {
      // Test 1: Verify account exists
      console.log('   [1/3] Checking if account can be resolved...');
      const resolveUrl = `https://api.paystack.co/bank/resolve?account_number=${account.account}&bank_code=${account.bank}`;
      
      const response = await fetch(resolveUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log(`        Status: ${response.status}`);
      
      if (response.ok && result.data) {
        console.log(`   ✅ Account resolved: ${result.data.account_name}`);
      } else if (result.message) {
        console.log(`   ❌ Error: ${result.message}`);
      } else {
        console.log(`   ❓ Response:`, JSON.stringify(result).substring(0, 100));
      }

      // Test 2: Check daily limit info
      if (response.headers.get('x-ratelimit-remaining')) {
        const remaining = response.headers.get('x-ratelimit-remaining');
        console.log(`   [2/3] Daily limit remaining: ${remaining}`);
      }

      // Test 3: Check response body for details
      console.log(`   [3/3] Full response:`, JSON.stringify(result, null, 2).substring(0, 200));

    } catch (error) {
      console.error(`   ❌ Exception:`, error.message);
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function testFrontendValidation() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('🔍 TESTING FRONTEND VALIDATION');
  console.log(`${'='.repeat(70)}\n`);

  const testNumbers = [
    '0102027322',     // Valid 10 digits
    '0198760697',     // Valid 10 digits  
    '0000000000',     // Test account
    '123',            // Too short
    '12345678901',    // Valid 11 digits
    'abcd123456',     // Invalid characters
  ];

  testNumbers.forEach(num => {
    const isValid = /^\d{10,}$/.test(num);
    console.log(`Account: ${num.padEnd(15)} - ${isValid ? '✅ PASS' : '❌ FAIL'}`);
  });
}

async function testMakecomPayload() {
  console.log(`\n${'='.repeat(70)}`);
  console.log('🔍 TESTING MAKE.COM PAYLOAD VALIDATION');
  console.log(`${'='.repeat(70)}\n`);

  const WEBHOOK_URL = 'https://hook.us2.make.com/cl2nnrnpemh1uuhuxn6b3dw6jjwd1uny';

  const payloads = [
    {
      name: 'Real Account - Access Bank',
      data: {
        organizer_id: 'test-user-1',
        bank_code: '044',
        account_number: '0102027322',
        account_name: 'JOHN DOE',
        email: 'john@test.com',
        business_name: 'Test Events',
      }
    },
    {
      name: 'Test Account - Access Bank',
      data: {
        organizer_id: 'test-user-2',
        bank_code: '044',
        account_number: '0000000000',
        account_name: 'TEST ACCOUNT - 044',
        email: 'test@test.com',
        business_name: 'Test Events',
      }
    }
  ];

  for (const payload of payloads) {
    console.log(`\n📤 ${payload.name}`);
    console.log(`   Account: ${payload.data.account_number}`);
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload.data),
      });

      console.log(`   Status: ${response.status}`);
      const text = await response.text();
      
      if (response.status === 200) {
        console.log(`   ✅ Accepted`);
        try {
          const json = JSON.parse(text);
          console.log(`   Response: ${JSON.stringify(json)}`);
        } catch (e) {
          console.log(`   Response: ${text.substring(0, 100)}`);
        }
      } else {
        console.log(`   ❌ Rejected: ${text.substring(0, 150)}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function runDebug() {
  console.log('\n🚀 COMPREHENSIVE ACCOUNT VALIDATION DEBUG\n');
  
  // Test with test secret first
  await debugPaystackAPI(TEST_SECRET, 'TEST');
  
  // Test frontend validation logic
  await testFrontendValidation();
  
  // Test Make.com webhook
  await testMakecomPayload();
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ DEBUG COMPLETE');
  console.log(`${'='.repeat(70)}\n`);
}

runDebug();
