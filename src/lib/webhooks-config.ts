// Platform-level webhook configuration
// As the platform owner, you configure these URLs once in your Make.com scenarios

// Workflow A: Organizer Onboarding - Creates Paystack subaccount when organizer submits bank details
export const WEBHOOK_ORGANIZER_ONBOARDING = 'https://hook.us2.make.com/cl2nnrnpemh1uuhuxn6b3dw6jjwd1uny';

// Workflow B: Event Creation - Creates Paystack payment page when organizer creates an event
export const WEBHOOK_EVENT_CREATION = 'https://hook.us2.make.com/t4h4kg28d99nzyq9vgebcsdxd31pst9q';

// Workflow C: This is configured in Paystack Dashboard, not here
// Go to Paystack Dashboard → Settings → Webhooks
// Add your Make.com webhook URL there to listen for charge.success events