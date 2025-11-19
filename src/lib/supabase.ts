import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Construct Supabase URL from project ID
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(projectId && publicAnonKey);
};

// Singleton Supabase client instance to avoid multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return supabaseInstance;
};

// Export the singleton instance
export const supabase = getSupabaseClient();

// Database types
export type Event = {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image_url?: string;
  organizer_email: string;
  created_at: string;
};

export type TicketType = {
  id: string;
  event_id: string;
  name: string;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  created_at: string;
};

export type Order = {
  id: string;
  event_id: string;
  ticket_type_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string;
  ticket_id: string;
  qr_code: string;
  amount: number;
  payment_status: 'pending' | 'completed' | 'refunded';
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
};

// Initialize database tables
export async function initializeTables() {
  // Check if tables exist by trying to query them
  const { error: eventsError } = await supabase.from('events').select('id').limit(1);
  
  if (eventsError && eventsError.message.includes('relation')) {
    // Tables don't exist, create them
    console.log('Creating tables...');
    
    // Note: In a real app, you'd run these SQL commands in Supabase SQL Editor
    // For this demo, we'll handle missing tables gracefully
  }
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createTicketType(ticketType: Omit<TicketType, 'id' | 'created_at' | 'sold_quantity'>) {
  const { data, error } = await supabase
    .from('ticket_types')
    .insert([{ ...ticketType, sold_quantity: 0 }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();
  
  if (error) throw error;
  
  // Update ticket sold quantity
  await supabase.rpc('increment_sold_quantity', { ticket_type_id: order.ticket_type_id });
  
  return data;
}

export async function getEventWithTickets(eventId: string) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (eventError) throw eventError;
  
  const { data: ticketTypes, error: ticketsError } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId);
  
  if (ticketsError) throw ticketsError;
  
  return { event, ticketTypes };
}

export async function getOrdersByEvent(eventId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      ticket_types (name, price)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function checkInTicket(ticketId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('ticket_id', ticketId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getOrderByTicketId(ticketId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('ticket_id', ticketId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function searchEvents(searchQuery: string = '', dateFilter?: string) {
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  
  // Search by name or organizer email
  if (searchQuery.trim()) {
    query = query.or(`name.ilike.%${searchQuery}%,organizer_email.ilike.%${searchQuery}%`);
  }
  
  // Filter by date
  if (dateFilter) {
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('date', startOfDay.toISOString())
      .lte('date', endOfDay.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
}