import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-0f8d8d4a/health", (c) => {
  return c.json({ status: "ok" });
});

// Helper function to verify admin token
async function verifyAdmin(token: string): Promise<boolean> {
  try {
    // Get admin from KV store
    const admin = await kv.get('admin:token:' + token);
    return admin !== null && admin !== undefined;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
}

// Admin login endpoint
app.post("/make-server-0f8d8d4a/admin/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    // Check credentials (you should have a secure way to store admin credentials)
    // For now, we'll use environment variables or hardcoded admin
    const adminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@gopass.com';
    const adminPassword = Deno.env.get('ADMIN_PASSWORD') || 'admin123';
    
    if (email !== adminEmail || password !== adminPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Generate admin token (simple approach - in production use JWT or similar)
    const adminToken = crypto.randomUUID();
    const adminId = 'admin-' + crypto.randomUUID();
    
    // Store admin session in KV
    await kv.set('admin:token:' + adminToken, {
      admin_id: adminId,
      email: email,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    });
    
    console.log('✅ Admin login successful:', email);
    
    return c.json({
      success: true,
      admin_id: adminId,
      token: adminToken,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Auth endpoints
app.post("/make-server-0f8d8d4a/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }
    
    console.log('User created successfully:', data.user.id);
    
    // Automatically sign in the user after creation
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      console.error('Auto-signin error after signup:', signInError);
      // User was created but signin failed - return user data without session
      return c.json({ 
        user: data.user,
        message: 'Account created successfully. Please sign in.',
        needsManualSignIn: true
      });
    }
    
    console.log('Auto-signin successful');
    
    return c.json({ 
      user: sessionData.user,
      session: sessionData.session,
      message: 'Account created and signed in successfully' 
    });
  } catch (error) {
    console.error('Signup exception:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

app.post("/make-server-0f8d8d4a/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Signin error:', error);
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    
    return c.json({ 
      session: data.session,
      user: data.user,
      message: 'Signed in successfully' 
    });
  } catch (error) {
    console.error('Signin exception:', error);
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Verify bank account number with Paystack
app.post("/make-server-0f8d8d4a/verify-account", async (c) => {
  try {
    const { account_number, bank_code } = await c.req.json();
    
    if (!account_number || !bank_code) {
      return c.json({ error: 'Account number and bank code are required' }, 400);
    }

    // Validate account number format (should be 10 digits for Nigerian banks)
    if (!/^\d{10}$/.test(account_number)) {
      return c.json({ error: 'Account number must be exactly 10 digits' }, 400);
    }
    
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment service not configured' }, 500);
    }

    console.log('Verifying account:', { account_number, bank_code });

    // Call Paystack API to resolve account number
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    console.log('Paystack verification response:', result);

    if (!response.ok || !result.status) {
      console.error('Account verification failed:', result);
      return c.json({ 
        error: result.message || 'Could not verify account number. Please check and try again.',
        verified: false 
      }, 400);
    }

    // Return the verified account name
    return c.json({ 
      verified: true,
      account_name: result.data.account_name,
      account_number: result.data.account_number,
      message: 'Account verified successfully' 
    });
  } catch (error) {
    console.error('Account verification exception:', error);
    return c.json({ 
      error: 'Failed to verify account. Please try again.',
      verified: false 
    }, 500);
  }
});

// Get list of banks from Paystack
app.get("/make-server-0f8d8d4a/banks", async (c) => {
  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment service not configured' }, 500);
    }

    console.log('Fetching banks from Paystack...');

    const response = await fetch(
      'https://api.paystack.co/bank?currency=NGN',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    console.log('Paystack banks response status:', result.status);
    console.log('Number of banks:', result.data?.length);

    if (!response.ok || !result.status) {
      console.error('Failed to fetch banks:', result);
      return c.json({ error: 'Failed to fetch banks' }, 500);
    }

    // Return the list of banks
    return c.json({ 
      banks: result.data.map((bank: any) => ({
        name: bank.name,
        code: bank.code,
        slug: bank.slug,
      }))
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return c.json({ error: 'Failed to fetch banks' }, 500);
  }
});

// Get organizer profile by userId
app.get("/make-server-0f8d8d4a/organizer/:userId", async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${userId}`);
    
    if (!organizer) {
      return c.json({ error: 'Organizer not found' }, 404);
    }

    return c.json({ organizer });
  } catch (error) {
    console.error('Error fetching organizer:', error);
    return c.json({ error: 'Failed to fetch organizer' }, 500);
  }
});

// Save/update organizer profile
app.post("/make-server-0f8d8d4a/organizer/save", async (c) => {
  try {
    const organizerData = await c.req.json();
    
    if (!organizerData.user_id) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Save organizer to KV store
    await kv.set(`organizer:${organizerData.user_id}`, organizerData);
    
    console.log('Organizer saved to KV store:', organizerData.user_id);
    console.log('Organizer data:', JSON.stringify(organizerData, null, 2));

    return c.json({ 
      message: 'Organizer data saved successfully',
      organizer: organizerData 
    });
  } catch (error) {
    console.error('Error saving organizer:', error);
    return c.json({ error: 'Failed to save organizer' }, 500);
  }
});

// Verify Paystack subaccount
app.post("/make-server-0f8d8d4a/organizer/verify-subaccount", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${userId}`);
    
    if (!organizer) {
      return c.json({ error: 'Organizer not found' }, 404);
    }

    if (!organizer.paystack_subaccount_id) {
      return c.json({ 
        verified: false,
        message: 'No Paystack subaccount ID found. Please complete bank setup.'
      });
    }

    // Verify with Paystack API
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }

    console.log('Verifying Paystack subaccount:', organizer.paystack_subaccount_id);

    const response = await fetch(
      `https://api.paystack.co/subaccount/${organizer.paystack_subaccount_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    console.log('Paystack verification response:', result);

    if (response.ok && result.status) {
      // Update organizer with verified status
      const updatedOrganizer = {
        ...organizer,
        subaccount_setup_complete: true,
        paystack_verified: true,
        last_verified: new Date().toISOString(),
      };
      
      await kv.set(`organizer:${userId}`, updatedOrganizer);
      
      return c.json({ 
        verified: true,
        message: 'Subaccount verified successfully',
        subaccount: result.data,
        organizer: updatedOrganizer
      });
    } else {
      return c.json({ 
        verified: false,
        message: 'Subaccount not found in Paystack',
        error: result.message || 'Verification failed'
      });
    }
  } catch (error) {
    console.error('Error verifying subaccount:', error);
    return c.json({ 
      verified: false,
      error: 'Failed to verify subaccount',
      details: error.message 
    }, 500);
  }
});

// Force activate subaccount (manual override)
app.post("/make-server-0f8d8d4a/organizer/force-activate-subaccount", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${userId}`);
    
    if (!organizer) {
      return c.json({ error: 'Organizer not found' }, 404);
    }

    if (!organizer.paystack_subaccount_id) {
      return c.json({ 
        error: 'No Paystack subaccount ID found. Cannot activate without subaccount ID.'
      }, 400);
    }

    console.log('Force activating subaccount for user:', userId);
    console.log('Subaccount ID:', organizer.paystack_subaccount_id);

    // Update organizer with activated status
    const updatedOrganizer = {
      ...organizer,
      subaccount_setup_complete: true,
      force_activated: true,
      activated_at: new Date().toISOString(),
    };
    
    await kv.set(`organizer:${userId}`, updatedOrganizer);
    console.log('✅ Subaccount force activated successfully');
    
    return c.json({ 
      success: true,
      message: 'Subaccount activated successfully',
      organizer: updatedOrganizer
    });
  } catch (error) {
    console.error('Error force activating subaccount:', error);
    return c.json({ 
      error: 'Failed to activate subaccount',
      details: error.message 
    }, 500);
  }
});

// Check ORGANIZER Paystack status
app.post("/make-server-0f8d8d4a/organizer/check-paystack-status", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    console.log('🔍 Checking ORGANIZER Paystack status for user:', userId);

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${userId}`);
    
    if (!organizer) {
      return c.json({ 
        status: 'not_found',
        message: 'ORGANIZER profile not found in database'
      }, 404);
    }

    console.log('📊 ORGANIZER data:', {
      user_id: organizer.user_id,
      name: organizer.name,
      has_bank_details: !!(organizer.bank_name && organizer.account_number),
      has_subaccount_id: !!organizer.paystack_subaccount_id,
      setup_complete: organizer.subaccount_setup_complete
    });

    // Check if subaccount exists
    if (!organizer.paystack_subaccount_id) {
      return c.json({ 
        status: 'no_subaccount',
        message: 'No Paystack subaccount ID found for ORGANIZER. Bank setup may not have completed.',
        organizer: organizer
      });
    }

    // Verify with Paystack API
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ 
        status: 'config_error',
        message: 'Payment gateway not configured'
      }, 500);
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/subaccount/${organizer.paystack_subaccount_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      console.log('💳 Paystack API response for ORGANIZER:', result);

      if (response.ok && result.status) {
        return c.json({ 
          status: organizer.subaccount_setup_complete ? 'active' : 'needs_activation',
          message: organizer.subaccount_setup_complete 
            ? 'ORGANIZER subaccount is active' 
            : 'Subaccount verified in Paystack but needs activation in database',
          paystack_data: result.data,
          organizer: organizer
        });
      } else {
        return c.json({ 
          status: 'not_in_paystack',
          message: 'Subaccount ID found in ORGANIZER profile but not in Paystack',
          error: result.message,
          organizer: organizer
        });
      }
    } catch (paystackError) {
      console.error('Error checking Paystack API:', paystackError);
      return c.json({ 
        status: 'api_error',
        message: 'Failed to check Paystack API',
        error: paystackError.message,
        organizer: organizer
      });
    }
  } catch (error) {
    console.error('Error checking ORGANIZER Paystack status:', error);
    return c.json({ 
      status: 'error',
      error: 'Failed to check status',
      details: error.message 
    }, 500);
  }
});

// Manual activate ORGANIZER subaccount
app.post("/make-server-0f8d8d4a/organizer/manual-activate", async (c) => {
  try {
    const { userId } = await c.req.json();
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    console.log('🔧 Manual activation for ORGANIZER:', userId);

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${userId}`);
    
    if (!organizer) {
      return c.json({ error: 'ORGANIZER profile not found' }, 404);
    }

    if (!organizer.paystack_subaccount_id) {
      return c.json({ 
        error: 'Cannot activate: No Paystack subaccount ID found for ORGANIZER',
        suggestion: 'Complete bank setup form first or check Make.com webhook'
      }, 400);
    }

    console.log('✅ Activating ORGANIZER subaccount:', organizer.paystack_subaccount_id);

    // Update organizer with activated status
    const updatedOrganizer = {
      ...organizer,
      subaccount_setup_complete: true,
      manually_activated: true,
      activated_at: new Date().toISOString(),
    };
    
    await kv.set(`organizer:${userId}`, updatedOrganizer);
    console.log('✅ ORGANIZER subaccount activated successfully');
    
    return c.json({ 
      success: true,
      message: 'ORGANIZER subaccount activated successfully! You can now receive payouts.',
      organizer: updatedOrganizer
    });
  } catch (error) {
    console.error('Error activating ORGANIZER subaccount:', error);
    return c.json({ 
      error: 'Failed to activate ORGANIZER subaccount',
      details: error.message 
    }, 500);
  }
});

// ===== ADMIN ENDPOINTS =====

// ADMIN: Verify organizer's Paystack subaccount
app.post("/make-server-0f8d8d4a/admin/verify-organizer-paystack", async (c) => {
  try {
    const { organizerId, subaccountId } = await c.req.json();
    
    if (!organizerId || !subaccountId) {
      return c.json({ error: 'Organizer ID and Subaccount ID are required' }, 400);
    }

    console.log('🔍 ADMIN: Verifying Paystack subaccount for organizer:', organizerId);
    console.log('🔍 ADMIN: Subaccount ID:', subaccountId);

    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return c.json({ error: 'Payment gateway not configured' }, 500);
    }

    // Verify with Paystack API
    const response = await fetch(
      `https://api.paystack.co/subaccount/${subaccountId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    console.log('💳 ADMIN: Paystack API response:', result);

    if (response.ok && result.status) {
      return c.json({ 
        verified: true,
        message: 'Subaccount verified successfully with Paystack',
        paystack_data: result.data
      });
    } else {
      return c.json({ 
        verified: false,
        message: 'Subaccount not found in Paystack or verification failed',
        error: result.message
      });
    }
  } catch (error) {
    console.error('ADMIN: Error verifying Paystack subaccount:', error);
    return c.json({ 
      verified: false,
      error: 'Failed to verify with Paystack',
      details: error.message 
    }, 500);
  }
});

// ADMIN: Activate organizer's subaccount
app.post("/make-server-0f8d8d4a/admin/activate-organizer-subaccount", async (c) => {
  try {
    const { organizerId } = await c.req.json();
    
    if (!organizerId) {
      return c.json({ error: 'Organizer ID is required' }, 400);
    }

    console.log('✅ ADMIN: Activating subaccount for organizer:', organizerId);

    // Get organizer from KV store
    const organizer = await kv.get(`organizer:${organizerId}`);
    
    if (!organizer) {
      return c.json({ error: 'Organizer not found' }, 404);
    }

    if (!organizer.paystack_subaccount_id) {
      return c.json({ 
        error: 'Cannot activate: No Paystack subaccount ID found for organizer'
      }, 400);
    }

    if (organizer.subaccount_setup_complete) {
      return c.json({ 
        error: 'Organizer subaccount is already activated'
      }, 400);
    }

    console.log('✅ ADMIN: Activating subaccount:', organizer.paystack_subaccount_id);

    // Update organizer with activated status
    const updatedOrganizer = {
      ...organizer,
      subaccount_setup_complete: true,
      admin_activated: true,
      activated_at: new Date().toISOString(),
    };
    
    await kv.set(`organizer:${organizerId}`, updatedOrganizer);
    console.log('✅ ADMIN: Organizer subaccount activated successfully');
    
    // Send email notification to organizer
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY') || 'dummy'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GoPass <onboarding@gopass.com>',
          to: organizer.email,
          subject: '🎉 Your GoPass Payout Account is Approved!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0;">🎉 Account Approved!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; color: #374151;">Hi ${organizer.name},</p>
                
                <p style="font-size: 16px; color: #374151;">
                  Great news! Your GoPass payout account has been verified and approved by our admin team.
                </p>
                
                <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #059669; font-weight: bold;">✅ You can now:</p>
                  <ul style="color: #374151; margin: 10px 0;">
                    <li>Create events on GoPass</li>
                    <li>Receive instant payouts to your bank account</li>
                    <li>Start selling tickets immediately</li>
                  </ul>
                </div>
                
                <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    <strong>💰 Payment Details:</strong><br>
                    Bank: ${organizer.bank_name}<br>
                    Account: ${organizer.account_number}<br>
                    Name: ${organizer.account_name}
                  </p>
                  <p style="margin: 10px 0 0 0; font-size: 13px; color: #1e40af;">
                    Platform Fee: 5% per ticket sale | You receive: 95%
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://gopass.com/organizer/dashboard" 
                     style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                    Go to Dashboard
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Questions? Reply to this email or contact our support team.
                </p>
                
                <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                  Best regards,<br>
                  <strong>The GoPass Team</strong>
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p>GoPass - Instant Event Ticketing</p>
              </div>
            </div>
          `,
        }),
      });
      console.log('📧 Email notification sent to organizer:', organizer.email);
    } catch (emailError) {
      console.error('📧 Failed to send email notification:', emailError);
      // Don't fail the activation if email fails
    }
    
    return c.json({ 
      success: true,
      message: `Organizer ${organizer.name}'s subaccount activated successfully`,
      organizer: updatedOrganizer
    });
  } catch (error) {
    console.error('ADMIN: Error activating organizer subaccount:', error);
    return c.json({ 
      error: 'Failed to activate organizer subaccount',
      details: error.message 
    }, 500);
  }
});

// ADMIN: Get all organizers with pending subaccounts
app.get("/make-server-0f8d8d4a/admin/pending-subaccounts", async (c) => {
  try {
    console.log('📋 ADMIN: Fetching organizers with pending subaccounts');

    // Get all organizers
    const allOrganizers = await kv.getByPrefix('organizer:');
    
    // Filter to only those with subaccount ID but not activated
    const pendingOrganizers = allOrganizers.filter((org: any) => 
      org.paystack_subaccount_id && !org.subaccount_setup_complete
    );

    console.log(`📋 ADMIN: Found ${pendingOrganizers.length} pending subaccounts`);

    return c.json({ 
      count: pendingOrganizers.length,
      organizers: pendingOrganizers 
    });
  } catch (error) {
    console.error('ADMIN: Error fetching pending subaccounts:', error);
    return c.json({ 
      error: 'Failed to fetch pending subaccounts',
      details: error.message 
    }, 500);
  }
});

// ADMIN: Bulk activate organizer subaccounts
app.post("/make-server-0f8d8d4a/admin/bulk-activate-subaccounts", async (c) => {
  try {
    const { user_ids } = await c.req.json();
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return c.json({ error: 'User IDs array is required' }, 400);
    }

    console.log(`✅ ADMIN: Bulk activating ${user_ids.length} subaccounts`);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const userId of user_ids) {
      try {
        // Get organizer from KV store
        const organizer = await kv.get(`organizer:${userId}`);
        
        if (!organizer) {
          errors.push(`Organizer not found: ${userId}`);
          failCount++;
          continue;
        }

        if (!organizer.paystack_subaccount_id) {
          errors.push(`No subaccount ID for: ${organizer.name}`);
          failCount++;
          continue;
        }

        if (organizer.subaccount_setup_complete) {
          errors.push(`Already activated: ${organizer.name}`);
          failCount++;
          continue;
        }

        // Update organizer with activated status
        const updatedOrganizer = {
          ...organizer,
          subaccount_setup_complete: true,
          admin_activated: true,
          bulk_activated: true,
          activated_at: new Date().toISOString(),
        };
        
        await kv.set(`organizer:${userId}`, updatedOrganizer);
        console.log(`✅ ADMIN: Activated subaccount for ${organizer.name}`);
        
        // Send email notification
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY') || 'dummy'}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'GoPass <onboarding@gopass.com>',
              to: organizer.email,
              subject: '🎉 Your GoPass Payout Account is Approved!',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0;">🎉 Account Approved!</h1>
                  </div>
                  
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #374151;">Hi ${organizer.name},</p>
                    
                    <p style="font-size: 16px; color: #374151;">
                      Great news! Your GoPass payout account has been verified and approved by our admin team.
                    </p>
                    
                    <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #059669; font-weight: bold;">✅ You can now:</p>
                      <ul style="color: #374151; margin: 10px 0;">
                        <li>Create events on GoPass</li>
                        <li>Receive instant payouts to your bank account</li>
                        <li>Start selling tickets immediately</li>
                      </ul>
                    </div>
                    
                    <div style="background: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #1e40af;">
                        <strong>💰 Payment Details:</strong><br>
                        Bank: ${organizer.bank_name}<br>
                        Account: ${organizer.account_number}<br>
                        Name: ${organizer.account_name}
                      </p>
                      <p style="margin: 10px 0 0 0; font-size: 13px; color: #1e40af;">
                        Platform Fee: 5% per ticket sale | You receive: 95%
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://gopass.com/organizer/dashboard" 
                         style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Go to Dashboard
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                      Questions? Reply to this email or contact our support team.
                    </p>
                    
                    <p style="font-size: 14px; color: #374151; margin-top: 20px;">
                      Best regards,<br>
                      <strong>The GoPass Team</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p>GoPass - Instant Event Ticketing</p>
                  </div>
                </div>
              `,
            }),
          });
          console.log(`📧 Email sent to ${organizer.email}`);
        } catch (emailError) {
          console.error(`📧 Email failed for ${organizer.email}:`, emailError);
          // Don't fail activation if email fails
        }
        
        successCount++;
      } catch (orgError) {
        console.error(`Error activating organizer ${userId}:`, orgError);
        errors.push(`Error activating ${userId}: ${orgError.message}`);
        failCount++;
      }
    }

    console.log(`✅ ADMIN: Bulk activation complete - Success: ${successCount}, Failed: ${failCount}`);
    
    return c.json({ 
      success: true,
      message: `Bulk activation complete`,
      count: successCount,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('ADMIN: Error bulk activating subaccounts:', error);
    return c.json({ 
      error: 'Failed to bulk activate subaccounts',
      details: error.message 
    }, 500);
  }
});

// Admin Dashboard Stats
app.get("/make-server-0f8d8d4a/admin/stats", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all data from KV store
    const organizerRecords = await kv.getByPrefix('organizer:');
    const eventRecords = await kv.getByPrefix('event:');
    const ticketRecords = await kv.getByPrefix('ticket:');
    
    const totalOrganizers = organizerRecords?.length || 0;
    const totalEvents = eventRecords?.length || 0;
    
    // Count active events (future or today)
    const today = new Date().toISOString().split('T')[0];
    const activeEvents = eventRecords?.filter((e: any) => {
      const eventDate = e.value.date;
      return eventDate >= today;
    }).length || 0;

    // Calculate ticket stats
    const tickets = ticketRecords || [];
    const totalTickets = tickets.length;
    const totalRevenue = tickets.reduce((sum: number, t: any) => 
      sum + (t.value.price || 0), 0
    );
    const platformCommission = totalRevenue * 0.05;
    const ticketsCheckedIn = tickets.filter((t: any) => t.value.checked_in).length;
    const ticketsPending = totalTickets - ticketsCheckedIn;

    return c.json({
      stats: {
        total_organizers: totalOrganizers,
        total_events: totalEvents,
        active_events: activeEvents,
        total_tickets_sold: totalTickets,
        total_revenue: totalRevenue,
        platform_commission: platformCommission,
        tickets_checked_in: ticketsCheckedIn,
        tickets_pending: ticketsPending,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// Admin get all organizers
app.get("/make-server-0f8d8d4a/admin/organizers", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all organizers from KV store
    const organizerRecords = await kv.getByPrefix('organizer:');
    
    if (!organizerRecords) {
      return c.json({ organizers: [] });
    }

    // Get event and ticket data for each organizer
    const eventsRecords = await kv.getByPrefix('event:');
    const ticketRecords = await kv.getByPrefix('ticket:');
    
    const events = eventsRecords || [];
    const tickets = ticketRecords || [];

    const organizersWithStats = organizerRecords.map((record: any) => {
      const org = record.value || record; // Handle both {value: ...} and direct object
      
      // Skip if org is null/undefined
      if (!org || !org.user_id) {
        return null;
      }
      
      // Count events for this organizer
      const organizerEvents = events.filter((e: any) => {
        const event = e.value || e;
        return event && event.organizer_id === org.user_id;
      });
      const eventCount = organizerEvents.length;
      
      // Calculate revenue from tickets for this organizer's events
      const organizerEventIds = organizerEvents.map((e: any) => {
        const event = e.value || e;
        return event ? event.id : null;
      }).filter(id => id !== null);
      
      const organizerTickets = tickets.filter((t: any) => {
        const ticket = t.value || t;
        return ticket && organizerEventIds.includes(ticket.event_id);
      });
      
      const totalRevenue = organizerTickets.reduce((sum: number, t: any) => {
        const ticket = t.value || t;
        return sum + (ticket?.price || 0);
      }, 0);

      return {
        user_id: org.user_id || '',
        email: org.email || '',
        name: org.name || 'Unknown',
        bank_name: org.bank_name || null,
        bank_code: org.bank_code || null,
        account_number: org.account_number || null,
        account_name: org.account_name || null,
        paystack_subaccount_id: org.paystack_subaccount_id || null,
        subaccount_setup_complete: org.subaccount_setup_complete || false,
        event_count: eventCount,
        total_revenue: totalRevenue * 0.95, // 95% goes to organizer
        created_at: org.created_at || new Date().toISOString(),
      };
    }).filter(org => org !== null); // Remove any null entries

    return c.json({ organizers: organizersWithStats });
  } catch (error) {
    console.error('Admin organizers error:', error);
    return c.json({ error: 'Failed to fetch organizers' }, 500);
  }
});

// Admin get all events
app.get("/make-server-0f8d8d4a/admin/events", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all events from KV store
    const eventRecords = await kv.getByPrefix('event:');
    
    if (!eventRecords) {
      return c.json({ events: [] });
    }

    // Get organizers and tickets
    const organizerRecords = await kv.getByPrefix('organizer:');
    const ticketRecords = await kv.getByPrefix('ticket:');
    
    const organizers = organizerRecords || [];
    const tickets = ticketRecords || [];

    // Process events with stats
    const eventsWithStats = eventRecords.map((record: any) => {
      const event = record.value;
      
      // Find organizer for this event
      const organizer = organizers.find((o: any) => o.value.user_id === event.organizer_id);
      
      // Count tickets sold for this event
      const eventTickets = tickets.filter((t: any) => t.value.event_id === event.id);
      const ticketsSold = eventTickets.length;
      const revenue = eventTickets.reduce((sum: number, t: any) => sum + (t.value.price || 0), 0);
      
      // Calculate total tickets available from ticket types
      const ticketTypes = event.ticket_types || [];
      const ticketsAvailable = ticketTypes.reduce((sum: number, type: any) => 
        sum + (type.quantity || 0), 0
      );

      return {
        ...event,
        organizer_name: organizer?.value?.name || 'Unknown',
        organizer_email: organizer?.value?.email || '',
        tickets_sold: ticketsSold,
        tickets_available: ticketsAvailable,
        revenue: revenue,
        created_at: event.created_at || new Date().toISOString(),
      };
    });

    // Sort by created_at descending
    eventsWithStats.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ events: eventsWithStats });
  } catch (error) {
    console.error('Admin events error:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Admin get all tickets
app.get("/make-server-0f8d8d4a/admin/tickets", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get all tickets from KV store
    const ticketRecords = await kv.getByPrefix('ticket:');
    
    if (!ticketRecords) {
      return c.json({ tickets: [] });
    }

    // Get events and organizers
    const eventRecords = await kv.getByPrefix('event:');
    const organizerRecords = await kv.getByPrefix('organizer:');
    
    const events = eventRecords || [];
    const organizers = organizerRecords || [];

    // Format tickets with event and organizer info
    const formattedTickets = ticketRecords.map((record: any) => {
      const ticket = record.value;
      
      // Find event for this ticket
      const event = events.find((e: any) => e.value.id === ticket.event_id);
      
      // Find organizer for this event
      const organizer = organizers.find((o: any) => 
        o.value.user_id === event?.value?.organizer_id
      );

      return {
        ...ticket,
        event_title: event?.value?.title || 'Unknown Event',
        organizer_name: organizer?.value?.name || 'Unknown Organizer',
        purchase_date: ticket.created_at || ticket.purchase_date || new Date().toISOString(),
        created_at: ticket.created_at || ticket.purchase_date || new Date().toISOString(),
      };
    });

    // Sort by created_at descending
    formattedTickets.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json({ tickets: formattedTickets });
  } catch (error) {
    console.error('Admin tickets error:', error);
    return c.json({ error: 'Failed to fetch tickets' }, 500);
  }
});

// Admin get settings
app.get("/make-server-0f8d8d4a/admin/settings", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const settings = await kv.get('platform:settings');
    
    return c.json({
      commission_percentage: settings?.commission_percentage || 5,
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Admin update settings
app.post("/make-server-0f8d8d4a/admin/settings", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { commission_percentage } = await c.req.json();

    if (commission_percentage === undefined || commission_percentage < 0 || commission_percentage > 100) {
      return c.json({ error: 'Invalid commission percentage' }, 400);
    }

    await kv.set('platform:settings', {
      commission_percentage,
      updated_at: new Date().toISOString(),
    });

    return c.json({
      message: 'Settings updated successfully',
      commission_percentage,
    });
  } catch (error) {
    console.error('Admin settings update error:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Admin restore backup
app.post("/make-server-0f8d8d4a/admin/restore-backup", async (c) => {
  try {
    const adminToken = c.req.header('X-Admin-Token');
    
    if (!adminToken || !(await verifyAdmin(adminToken))) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const backupData = await c.req.json();
    
    console.log('🔄 ADMIN: Starting backup restore...');
    console.log('📊 Data to restore:', {
      organizers: backupData.organizers?.length || 0,
      events: backupData.events?.length || 0,
      tickets: backupData.tickets?.length || 0,
    });

    let restoredCount = 0;

    // Restore organizers
    if (backupData.organizers && Array.isArray(backupData.organizers)) {
      for (const org of backupData.organizers) {
        if (org.user_id) {
          await kv.set(`organizer:${org.user_id}`, org);
          restoredCount++;
        }
      }
      console.log(`✅ Restored ${backupData.organizers.length} organizers`);
    }

    // Restore events
    if (backupData.events && Array.isArray(backupData.events)) {
      for (const event of backupData.events) {
        if (event.id) {
          await kv.set(`event:${event.id}`, event);
          restoredCount++;
        }
      }
      console.log(`✅ Restored ${backupData.events.length} events`);
    }

    // Restore tickets
    if (backupData.tickets && Array.isArray(backupData.tickets)) {
      for (const ticket of backupData.tickets) {
        if (ticket.id) {
          await kv.set(`ticket:${ticket.id}`, ticket);
          restoredCount++;
        }
      }
      console.log(`✅ Restored ${backupData.tickets.length} tickets`);
    }

    // Restore settings
    if (backupData.settings) {
      await kv.set('platform:settings', backupData.settings);
      restoredCount++;
      console.log(`✅ Restored platform settings`);
    }

    console.log(`🎉 ADMIN: Backup restore complete! ${restoredCount} records restored.`);

    return c.json({
      success: true,
      restored_count: restoredCount,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    console.error('ADMIN: Backup restore error:', error);
    return c.json({ 
      error: 'Failed to restore backup',
      details: error.message 
    }, 500);
  }
});

Deno.serve(app.fetch);