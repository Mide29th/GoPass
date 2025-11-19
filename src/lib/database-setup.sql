-- Run this SQL in your Supabase SQL Editor to set up the database

-- Organizers table (for Paystack subaccount management)
CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  paystack_subaccount_id TEXT,
  subaccount_setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT,
  organizer_email TEXT NOT NULL,
  organizer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_page_url TEXT,
  ticket_price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticket Types table
CREATE TABLE IF NOT EXISTS ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  available_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (Sales/Tickets)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  attendee_phone TEXT NOT NULL,
  ticket_id TEXT UNIQUE NOT NULL,
  qr_code TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'completed',
  paystack_reference TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to increment sold quantity
CREATE OR REPLACE FUNCTION increment_sold_quantity(ticket_type_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET sold_quantity = sold_quantity + 1
  WHERE id = ticket_type_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Organizers policies
CREATE POLICY "Allow users to read their own organizer profile" ON organizers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own organizer profile" ON organizers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own organizer profile" ON organizers
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access to events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to events" ON events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to events" ON events
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to ticket_types" ON ticket_types
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to ticket_types" ON ticket_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to ticket_types" ON ticket_types
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to orders" ON orders
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email);
CREATE INDEX IF NOT EXISTS idx_events_organizer_email ON events(organizer_email);
CREATE INDEX IF NOT EXISTS idx_events_organizer_user_id ON events(organizer_user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_event_id ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_ticket_id ON orders(ticket_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);