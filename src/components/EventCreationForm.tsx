import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { createEvent, createTicketType, supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { Plus, Trash2, Upload, X, AlertCircle, Landmark, ArrowRight } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { WEBHOOK_EVENT_CREATION } from '../lib/webhooks-config';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { CheckCircle2 } from 'lucide-react';

type TicketTypeInput = {
  name: string;
  price: string;
  available_quantity: string;
};

type EventCreationFormProps = {
  onEventCreated: (eventId: string) => void;
  userId?: string;
  userEmail?: string;
  onAuthSuccess?: (userId: string, accessToken: string, userName: string, userEmail: string) => void;
};

export function EventCreationForm({ onEventCreated, userId, userEmail, onAuthSuccess }: EventCreationFormProps) {
  const [loading, setLoading] = useState(false);
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showBankSetupDialog, setShowBankSetupDialog] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [flyerUrl, setFlyerUrl] = useState('');
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string>('');
  const [bankSetupComplete, setBankSetupComplete] = useState(false);
  const [checkingBankStatus, setCheckingBankStatus] = useState(true);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeInput[]>([
    { name: 'General Admission', price: '5000', available_quantity: '100' }
  ]);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('eventDraft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setEventName(draft.eventName || '');
        setDescription(draft.description || '');
        setDate(draft.date || '');
        setLocation(draft.location || '');
        setFlyerPreview(draft.flyerPreview || '');
        setTicketTypes(draft.ticketTypes || [{ name: 'General Admission', price: '5000', available_quantity: '100' }]);
        toast.info('Draft event loaded! Continue where you left off.', { duration: 3000 });
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Check bank setup status when userId changes
  useEffect(() => {
    if (userId) {
      checkBankSetupStatus();
    }
  }, [userId]);

  // Auto-save draft to localStorage whenever form changes
  useEffect(() => {
    if (eventName || description || date || location || flyerPreview) {
      const draft = {
        eventName,
        description,
        date,
        location,
        flyerPreview,
        ticketTypes,
      };
      localStorage.setItem('eventDraft', JSON.stringify(draft));
    }
  }, [eventName, description, date, location, flyerPreview, ticketTypes]);

  const checkBankSetupStatus = async () => {
    if (!userId) {
      setBankSetupComplete(false);
      setCheckingBankStatus(false);
      return;
    }

    setCheckingBankStatus(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const { organizer } = await response.json();
        setBankSetupComplete(organizer?.subaccount_setup_complete || false);
      } else {
        setBankSetupComplete(false);
      }
    } catch (error) {
      console.error('Error checking bank setup:', error);
      setBankSetupComplete(false);
    } finally {
      setCheckingBankStatus(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', available_quantity: '' }]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const updateTicketType = (index: number, field: keyof TicketTypeInput, value: string) => {
    const updated = [...ticketTypes];
    updated[index][field] = value;
    setTicketTypes(updated);
  };

  const handleFlyerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFlyerFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFlyerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFlyerPreview = () => {
    setFlyerFile(null);
    setFlyerPreview('');
    setFlyerUrl('');
  };

  const handleAuthSuccessFromDialog = (uid: string, token: string, name: string, email: string) => {
    setShowAuthDialog(false);
    if (onAuthSuccess) {
      onAuthSuccess(uid, token, name, email);
    }
    // The parent component will update userId and userEmail, which will trigger the save
    setPendingSubmit(true);
  };

  // Auto-submit form after authentication completes
  useEffect(() => {
    if (pendingSubmit && userId && userEmail) {
      setPendingSubmit(false);
      submitEventForm();
    }
  }, [pendingSubmit, userId, userEmail]);

  const submitEventForm = async () => {
    if (!userId || !userEmail) return;
    
    setLoading(true);

    try {
      // Check if organizer has completed bank account setup via KV store
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/organizer/${userId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        toast.error('Please complete your profile and bank account setup first', {
          description: 'Go to Profile Settings to set up your payout account',
        });
        setLoading(false);
        return;
      }

      const { organizer: organizerData } = await response.json();

      if (!organizerData || !organizerData.subaccount_setup_complete) {
        toast.error('Bank Account Setup Required', {
          description: 'Complete your bank account setup in Profile Settings before creating events',
          duration: 6000,
        });
        setLoading(false);
        return;
      }

      // Get webhook configuration
      const webhookConfig = WEBHOOK_EVENT_CREATION;
      if (!webhookConfig) {
        toast.error('Make.com webhook not configured. Please configure webhooks in settings.');
        setLoading(false);
        return;
      }

      // For now, use the preview as the image URL
      // In a production app, you'd upload to Supabase Storage here
      const imageUrl = flyerPreview || undefined;

      // Calculate the primary ticket price (we'll use the first ticket type)
      const primaryTicketPrice = ticketTypes.length > 0 ? parseFloat(ticketTypes[0].price) : 0;

      // Create event in database first
      const event = await createEvent({
        name: eventName,
        description,
        date,
        location,
        organizer_email: userEmail,
        organizer_user_id: userId,
        image_url: imageUrl,
        ticket_price: primaryTicketPrice,
      });

      // Create ticket types in database
      for (const ticket of ticketTypes) {
        if (ticket.name && ticket.price && ticket.available_quantity) {
          await createTicketType({
            event_id: event.id,
            name: ticket.name,
            price: parseFloat(ticket.price),
            available_quantity: parseInt(ticket.available_quantity),
          });
        }
      }

      // Send event data to Make.com webhook to create Paystack payment page
      const webhookPayload = {
        event_id: event.id,
        event_name: eventName,
        organizer_id: userId,
        organizer_email: userEmail,
        paystack_subaccount_id: organizerData.paystack_subaccount_id,
        price: primaryTicketPrice,
        ticket_types: ticketTypes.map(t => ({
          name: t.name,
          price: parseFloat(t.price),
          quantity: parseInt(t.available_quantity),
        })),
      };

      console.log('Sending event data to Make.com:', webhookPayload);

      try {
        const response = await fetch(webhookConfig, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Make.com webhook error:', errorText);
          toast.warning('Event created, but payment page creation failed. Check Make.com webhook.');
        } else {
          const result = await response.json();
          console.log('Make.com webhook response:', result);
          
          // Update event with Paystack payment page URL
          if (result.paystack_page_url) {
            await supabase
              .from('events')
              .update({ paystack_page_url: result.paystack_page_url })
              .eq('id', event.id);
          }
        }
      } catch (webhookError) {
        console.error('Error calling Make.com webhook:', webhookError);
        toast.warning('Event created, but payment page setup pending. Check webhook configuration.');
      }

      toast.success('Event created successfully!');
      onEventCreated(event.id);
      
      // Clear draft from localStorage
      localStorage.removeItem('eventDraft');
      
      // Reset form
      setEventName('');
      setDescription('');
      setDate('');
      setLocation('');
      setFlyerPreview('');
      setFlyerFile(null);
      setFlyerUrl('');
      setTicketTypes([{ name: 'General Admission', price: '5000', available_quantity: '100' }]);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!userId || !userEmail) {
      setShowAuthDialog(true);
      return;
    }
    
    // User is authenticated, submit the form
    await submitEventForm();
  };

  return (
    <>
      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to save your event.
            </DialogDescription>
          </DialogHeader>
          <AuthForm onAuthSuccess={handleAuthSuccessFromDialog} embedded />
        </DialogContent>
      </Dialog>

      {/* Bank Setup Required Dialog */}
      <Dialog open={showBankSetupDialog} onOpenChange={setShowBankSetupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">Bank Account Setup Required</DialogTitle>
            <DialogDescription className="text-center">
              Your event details are saved! Complete your bank setup to publish this event and start selling tickets.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                <strong>Don't worry!</strong> Your event information is auto-saved. After you complete bank setup, come back and click "Create Event" to publish it.
              </AlertDescription>
            </Alert>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-2">Why do I need to set up my bank account?</p>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>✅ Receive 95% of ticket sales instantly</li>
                <li>✅ Automatic payouts to your bank</li>
                <li>✅ Secure payments via Paystack</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  setShowBankSetupDialog(false);
                  // Navigate to profile settings - we'll need to add this callback
                  toast.info('Navigate to Profile Settings → Bank Details', { duration: 5000 });
                }}
                className="w-full"
              >
                <Landmark className="w-4 h-4 mr-2" />
                Go to Bank Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                onClick={() => setShowBankSetupDialog(false)}
                variant="outline"
                className="w-full"
              >
                I'll Do This Later
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
          <CardDescription>
            {userId ? 'Set up your event and ticket types' : 'Start creating your event - you\'ll need to login before saving'}
          </CardDescription>
        </CardHeader>
      <CardContent>
        {/* Warning Banner - Bank Setup Not Complete */}
        {userId && !checkingBankStatus && !bankSetupComplete && (
          <Alert className="mb-6 bg-amber-50 border-amber-200">
            <Landmark className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium mb-1">Bank Account Setup Required</p>
                  <p className="text-sm text-amber-800">
                    Fill out your event details below - they'll be auto-saved! You'll need to complete bank setup in Profile Settings before publishing.
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Banner - Bank Setup Complete */}
        {userId && !checkingBankStatus && bankSetupComplete && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <p className="font-medium">✅ Bank account verified! You can create events and receive payouts.</p>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Summer Music Festival"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event..."
              rows={3}
            />
          </div>

          {/* Event Flyer Upload */}
          <div className="space-y-2">
            <Label htmlFor="flyer">Event Flyer (Optional)</Label>
            {!flyerPreview ? (
              <div className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors">
                <label htmlFor="flyer" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <Input
                    id="flyer"
                    type="file"
                    accept="image/*"
                    onChange={handleFlyerUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="relative border rounded-lg overflow-hidden bg-muted">
                <div className="flex items-center justify-center p-4">
                  <img
                    src={flyerPreview}
                    alt="Event Flyer Preview"
                    className="max-w-full h-auto max-h-96 object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeFlyerPreview}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City Park, Main Stage"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Ticket Types</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTicketType}>
                <Plus className="w-4 h-4 mr-1" />
                Add Ticket Type
              </Button>
            </div>

            {ticketTypes.map((ticket, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Ticket Type {index + 1}</Label>
                      {ticketTypes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={ticket.name}
                          onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                          placeholder="VIP"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Price (₦)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={ticket.price}
                          onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                          placeholder="5000"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={ticket.available_quantity}
                          onChange={(e) => updateTicketType(index, 'available_quantity', e.target.value)}
                          placeholder="100"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Event...' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  );
}