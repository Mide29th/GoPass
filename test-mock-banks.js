/**
 * Test with Test Bank Codes (001, 044, 058)
 * These will use the mock verification bypass
 */

const projectId = "rmconyhxvmwfudrwwfiv";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY29ueWh4dm13ZnVkcnd3Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTk1ODIsImV4cCI6MjA3NzA5NTU4Mn0.UmeHT_5x-1_hPPbvVF85MkIAPhr-SWcBBeCNKf2FA8g";

// Test accounts with TEST bank codes
const testAccounts = [
  { bank_code: "001", account_number: "0102027322", bank_name: "Test Bank 001", description: "Test Account 1" },
  { bank_code: "044", account_number: "0198760697", bank_name: "Test Bank 044", description: "Test Account 2" },
  { bank_code: "058", account_number: "1234567890", bank_name: "Test Bank 058", description: "Test Account 3" },
];

async function testAccount(bank_code, account_number, bank_name, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   Bank Code: ${bank_code}`);
  console.log(`   Account: ${account_number}`);
  
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/verify-account`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          account_number: account_number,
          bank_code: bank_code,
        }),
      }
    );

    const data = await response.json();
    
    if (data.status === 'success' && data.account_name) {
      console.log(`✅ SUCCESS! Account verified (TEST MODE)`);
      console.log(`   Account Name: ${data.account_name}`);
      return { success: true, data };
    } else {
      console.log(`❌ FAILED: ${data.error || JSON.stringify(data)}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 TESTING WITH TEST BANK CODES (001, 044, 058)");
  console.log("================================================\n");
  console.log("These test bank codes use mock verification (no Paystack calls)");
  console.log("Status: Should all PASS with TEST MODE responses\n");
  
  let successCount = 0;
  const results = [];
  
  for (const account of testAccounts) {
    const result = await testAccount(
      account.bank_code, 
      account.account_number, 
      account.bank_name,
      account.description
    );
    results.push({ ...account, result });
    if (result.success) successCount++;
  }
  
  console.log("\n================================================");
  console.log("📋 RESULTS:");
  console.log(`✅ Passed: ${successCount}/${testAccounts.length}`);
  
  if (successCount === testAccounts.length) {
    console.log("\n🎉 PERFECT! All test bank codes work!");
    console.log("\n✅ Mock verification is active for testing");
    console.log("✅ Ready to test the full workflow");
  }
  
  console.log("\n📊 Details:");
  results.forEach((r, i) => {
    console.log(`\n${i+1}. ${r.description}`);
    console.log(`   Bank Code: ${r.bank_code}`);
    console.log(`   Account: ${r.account_number}`);
    if (r.result.success) {
      console.log(`   ✅ ${r.result.data.account_name}`);
    } else {
      console.log(`   ❌ ${r.result.error}`);
    }
  });
}

runTests();
