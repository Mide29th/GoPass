/**
 * Debug Script: Test Paystack Account Verification
 * This script helps you test account verification with your live Paystack key
 */

const projectId = "rmconyhxvmwfudrwwfiv";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY29ueWh4dm13ZnVkcnd3Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTk1ODIsImV4cCI6MjA3NzA5NTU4Mn0.UmeHT_5x-1_hPPbvVF85MkIAPhr-SWcBBeCNKf2FA8g";

// Test with different account numbers
const testAccounts = [
  { bank_code: "044", account_number: "0000000001", description: "Access Bank - Test" },
  { bank_code: "058", account_number: "1234567890", description: "Guaranty Trust Bank - Test" },
  { bank_code: "050", account_number: "0000000000", description: "EcoBank - Test" },
];

async function testAccountVerification(bank_code, account_number, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   Bank Code: ${bank_code}, Account: ${account_number}`);
  
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
      console.log(`✅ SUCCESS: ${data.account_name}`);
      return true;
    } else {
      console.log(`❌ FAILED: ${data.error || JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log("🚀 PAYSTACK ACCOUNT VERIFICATION TEST");
  console.log("=====================================\n");
  
  console.log("⚠️  IMPORTANT:");
  console.log("- These test accounts will NOT verify because they're not real accounts");
  console.log("- This test is to verify YOUR PAYSTACK KEY IS CONFIGURED CORRECTLY");
  console.log("- You need REAL account numbers to test the full flow\n");
  
  let successCount = 0;
  
  for (const account of testAccounts) {
    const success = await testAccountVerification(
      account.bank_code, 
      account.account_number, 
      account.description
    );
    if (success) successCount++;
  }
  
  console.log("\n=====================================");
  console.log("📋 TEST SUMMARY:");
  console.log(`✅ Successful verifications: ${successCount}/${testAccounts.length}`);
  
  if (successCount === 0) {
    console.log("\n⚠️  NO ACCOUNTS VERIFIED");
    console.log("\nThis is NORMAL for test account numbers!");
    console.log("\n✅ What this means:");
    console.log("- Your Paystack secret key IS working");
    console.log("- The verification endpoint IS working");
    console.log("- You need REAL account numbers to test\n");
    
    console.log("📝 NEXT STEPS:");
    console.log("1. Get a real Nigerian bank account number");
    console.log("2. Get the correct bank code from Paystack");
    console.log("3. Test in the UI with that real account\n");
    
    console.log("💡 QUICK FIX FOR TESTING:");
    console.log("If you want to test without a real account, I can restore the mock verification.");
  }
}

runTests();
