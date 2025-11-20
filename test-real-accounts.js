/**
 * Test Real Accounts with Test Secret Key
 */

const projectId = "rmconyhxvmwfudrwwfiv";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtY29ueWh4dm13ZnVkcnd3Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTk1ODIsImV4cCI6MjA3NzA5NTU4Mn0.UmeHT_5x-1_hPPbvVF85MkIAPhr-SWcBBeCNKf2FA8g";

// Real accounts with test secret key
const realAccounts = [
  { bank_code: "044", account_number: "0102027322", bank_name: "Access Bank", description: "Access Bank Account" },
  { bank_code: "058", account_number: "0198760697", bank_name: "Guaranty Trust Bank", description: "Guaranty Trust Bank Account" },
];

async function testAccount(bank_code, account_number, bank_name, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   Bank: ${bank_name} (${bank_code})`);
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
      console.log(`✅ SUCCESS! Account verified`);
      console.log(`   Account Name: ${data.account_name}`);
      console.log(`   Account Number: ${data.account_number}`);
      return { success: true, data };
    } else {
      console.log(`❌ VERIFICATION FAILED`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.log(`❌ API ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("🚀 TESTING REAL ACCOUNTS WITH TEST SECRET KEY");
  console.log("=====================================\n");
  
  let successCount = 0;
  const results = [];
  
  for (const account of realAccounts) {
    const result = await testAccount(
      account.bank_code, 
      account.account_number, 
      account.bank_name,
      account.description
    );
    results.push({ ...account, result });
    if (result.success) successCount++;
  }
  
  console.log("\n=====================================");
  console.log("📋 FINAL RESULTS:");
  console.log(`✅ Successful: ${successCount}/${realAccounts.length}`);
  
  if (successCount > 0) {
    console.log("\n🎉 SUCCESS! Your Paystack verification is working!");
    console.log("\n📝 Verified Accounts:");
    results.forEach(r => {
      if (r.result.success) {
        console.log(`  ✅ ${r.bank_name}: ${r.result.data.account_name}`);
      }
    });
    console.log("\n✅ You can now test the full flow in the UI!");
  } else {
    console.log("\n⚠️  None of the accounts verified");
  }
  
  console.log("\n📊 Detailed Results:");
  results.forEach((r, i) => {
    console.log(`\n${i+1}. ${r.description}`);
    console.log(`   Bank: ${r.bank_name} (${r.bank_code})`);
    console.log(`   Account: ${r.account_number}`);
    if (r.result.success) {
      console.log(`   ✅ VERIFIED: ${r.result.data.account_name}`);
    } else {
      console.log(`   ❌ FAILED: ${r.result.error}`);
    }
  });
}

runTests();
