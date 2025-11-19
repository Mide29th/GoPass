import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { searchEvents, Event } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { Calendar, MapPin, Search, Ticket, X } from 'lucide-react';
import { Badge } from './ui/badge';

type EventBrowserProps = {
  onSelectEvent: (eventId: string) => void;
};

export function EventBrowser({ onSelectEvent }: EventBrowserProps) {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Load all events on mount
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const results = await searchEvents(searchQuery, dateFilter || undefined);
      setEvents(results);
      
      if (results.length === 0) {
        toast.info('No events found. Try adjusting your search.');
      }
    } catch (error) {
      console.error('Error searching events:', error);
      toast.error('Failed to search events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setHasSearched(false);
    handleSearch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Events</CardTitle>
          <CardDescription>Search for events by name, organizer, or date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="search">Search by Name or Organizer</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Event name or organizer email..."
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Filter by Date</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="flex-1">
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Searching...' : 'Search Events'}
            </Button>
            {(searchQuery || dateFilter) && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">
              {events.length} {events.length === 1 ? 'Event' : 'Events'} Found
            </h3>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No events found</p>
                <p className="text-sm">Try adjusting your search filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Event Image */}
                      {event.image_url && (
                        <div className="flex-shrink-0">
                          <div className="w-full md:w-48 h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={event.image_url}
                              alt={event.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xl">{event.name}</h3>
                            {isUpcoming(event.date) ? (
                              <Badge className="bg-green-600">Upcoming</Badge>
                            ) : (
                              <Badge variant="secondary">Past</Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <Button 
                            onClick={() => onSelectEvent(event.id)}
                            disabled={!isUpcoming(event.date)}
                          >
                            <Ticket className="w-4 h-4 mr-2" />
                            {isUpcoming(event.date) ? 'Buy Tickets' : 'Event Ended'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
