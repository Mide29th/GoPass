import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  Calendar, 
  Ticket, 
  DollarSign, 
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Skeleton } from '../ui/skeleton';

type AdminOverviewProps = {
  adminToken: string;
};

type Stats = {
  total_organizers: number;
  total_events: number;
  total_tickets_sold: number;
  total_revenue: number;
  platform_commission: number;
  tickets_checked_in: number;
  tickets_pending: number;
  active_events: number;
};

export function AdminOverview({ adminToken }: AdminOverviewProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0f8d8d4a/admin/stats`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-Admin-Token': adminToken,
          },
        }
      );

      if (!response.ok) {
        // Read response as text first (can only read once!)
        const errorText = await response.text();
        console.error('Stats fetch failed:', response.status, errorText);
        
        // Try to parse as JSON
        let errorMessage = 'Failed to fetch stats';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Not JSON, use text directly
          errorMessage = errorText.substring(0, 100) || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Read response as text first, then parse
      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from server');
      }
      
      // Check if response looks like JSON
      const trimmed = responseText.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        console.error('Non-JSON response:', trimmed.substring(0, 200));
        throw new Error('Server returned invalid response');
      }
      
      const result = JSON.parse(trimmed);
      setStats(result.stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    {
      title: 'Total Organizers',
      value: stats.total_organizers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Events',
      value: stats.active_events.toLocaleString(),
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Events',
      value: stats.total_events.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Tickets Sold',
      value: stats.total_tickets_sold.toLocaleString(),
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.total_revenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'Platform Commission (5%)',
      value: formatCurrency(stats.platform_commission),
      icon: TrendingUp,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Checked In',
      value: stats.tickets_checked_in.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Check-In',
      value: stats.tickets_pending.toLocaleString(),
      icon: XCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Dashboard Overview</h2>
        <p className="text-muted-foreground">Platform statistics and metrics</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>How the money is distributed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold">{formatCurrency(stats.total_revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Organizers (95%)</span>
              <span className="font-semibold">{formatCurrency(stats.total_revenue - stats.platform_commission)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">GoPass Platform (5%)</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.platform_commission)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Rate</CardTitle>
            <CardDescription>Check-in statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Checked In</span>
              <span className="font-semibold text-green-600">
                {stats.tickets_checked_in} ({stats.total_tickets_sold > 0 ? Math.round((stats.tickets_checked_in / stats.total_tickets_sold) * 100) : 0}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="font-semibold text-yellow-600">
                {stats.tickets_pending} ({stats.total_tickets_sold > 0 ? Math.round((stats.tickets_pending / stats.total_tickets_sold) * 100) : 0}%)
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${stats.total_tickets_sold > 0 ? (stats.tickets_checked_in / stats.total_tickets_sold) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}