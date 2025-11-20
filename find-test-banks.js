// Find valid Paystack test bank codes
const PAYSTACK_SECRET = 'sk_live_530991a59b7b6529203649acc4111141c2c06119';

async function findTestBankCodes() {
  console.log('🔍 Fetching all available Paystack banks...\n');

  try {
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch banks: ${response.statusText}`);
    }

    const data = await response.json();
    const banks = data.data;

    console.log(`✅ Found ${banks.length} banks\n`);
    console.log('🧪 COMMON TEST BANK CODES:\n');

    // Common test bank codes in Paystack
    const testCodes = ['999', '998', '997', '001', '090', '044', '058'];
    
    testCodes.forEach(code => {
      const bank = banks.find(b => b.code === code);
      if (bank) {
        console.log(`✓ Code: ${code.padEnd(4)} | Name: ${bank.name}`);
      } else {
        console.log(`✗ Code: ${code.padEnd(4)} | NOT FOUND`);
      }
    });

    console.log('\n📋 ALL BANKS (showing first 20):\n');
    banks.slice(0, 20).forEach(bank => {
      console.log(`${bank.code.padEnd(4)} | ${bank.name}`);
    });

    console.log('\n💡 RECOMMENDATION:');
    const testBank = banks.find(b => b.name.toLowerCase().includes('test'));
    if (testBank) {
      console.log(`Use bank code: ${testBank.code} (${testBank.name})`);
    } else {
      console.log('No dedicated test bank found. Options:');
      console.log('1. Use code 999 if it exists');
      console.log('2. Use any real bank code with valid test account data');
      console.log('3. Create synthetic test data with any bank code');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findTestBankCodes();
