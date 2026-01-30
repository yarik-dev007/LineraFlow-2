import React, { useState, useEffect } from 'react';
import { useLinera } from '../components/LineraProvider';
import {
    Wallet,
    ShoppingBag,
    Users,
    TrendingUp,
    CreditCard,
    AlertCircle,
    BarChart2
} from 'lucide-react';
import StatsChart from './StatsChart';

const Statistics: React.FC = () => {
    const { accountOwner, application } = useLinera();
    const [activeTab, setActiveTab] = useState<'DONATIONS' | 'ORDERS' | 'SUBSCRIPTIONS'>('DONATIONS');

    if (!accountOwner || !application) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <Wallet className="w-16 h-16 mb-4 text-gray-300" />
                <h2 className="text-xl font-bold mb-2">Connect Wallet</h2>
                <p>Please connect your wallet to view statistics.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 lg:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-slide-in">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-display font-black text-deep-black tracking-tight mb-2 uppercase">
                            Statistics
                        </h1>
                        <p className="font-mono text-gray-500 uppercase tracking-widest text-sm font-bold">
                            Track your earnings and growth
                        </p>
                    </div>
                    <div className="flex gap-2 bg-white p-1 border-2 border-deep-black shadow-hard">
                        <TabButton
                            active={activeTab === 'DONATIONS'}
                            onClick={() => setActiveTab('DONATIONS')}
                            icon={<Wallet className="w-4 h-4" />}
                            label="Donations"
                        />
                        <TabButton
                            active={activeTab === 'ORDERS'}
                            onClick={() => setActiveTab('ORDERS')}
                            icon={<ShoppingBag className="w-4 h-4" />}
                            label="Orders"
                        />
                        <TabButton
                            active={activeTab === 'SUBSCRIPTIONS'}
                            onClick={() => setActiveTab('SUBSCRIPTIONS')}
                            icon={<Users className="w-4 h-4" />}
                            label="Subscribers"
                        />
                    </div>
                </div>

                {activeTab === 'DONATIONS' && <DonationsStats owner={accountOwner} application={application} />}
                {activeTab === 'ORDERS' && <OrdersStats owner={accountOwner} application={application} />}
                {activeTab === 'SUBSCRIPTIONS' && <SubscriptionsStats owner={accountOwner} application={application} />}

            </div>
        </div>
    );
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 font-mono text-sm font-bold transition-all
            ${active
                ? 'bg-deep-black text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-100 hover:text-deep-black'
            }
        `}
    >
        {icon}
        <span>{label}</span>
    </button>
);

// --- Stats Components ---

interface StatsProps {
    owner: string;
    application: any;
}

const DonationsStats: React.FC<StatsProps> = ({ owner, application }) => {
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDonations = async () => {
            setLoading(true);
            try {
                const query = `
                  query {
                    donationsViewByRecipient(owner: "${owner}") {
                      id
                      timestamp
                      amount
                      fromOwner
                      message
                    }
                  }
                `;
                const result: any = await application.query(JSON.stringify({ query }));
                const data = typeof result === 'string' ? JSON.parse(result) : result;

                if (data.errors) throw new Error(data.errors[0].message);
                setDonations(data.data?.donationsViewByRecipient || []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch donations');
            } finally {
                setLoading(false);
            }
        };
        fetchDonations();
    }, [owner, application]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;

    // Aggregation Logic
    const totalEarned = donations.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() * 1000; // micros
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime() * 1000;
    const startOfYear = new Date(today.getFullYear(), 0, 1).getTime() * 1000;

    const earnedToday = donations
        .filter((d: any) => d.timestamp >= startOfToday)
        .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

    const earnedMonth = donations
        .filter((d: any) => d.timestamp >= startOfMonth)
        .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

    const earnedYear = donations
        .filter((d: any) => d.timestamp >= startOfYear)
        .reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Earned" value={`${totalEarned.toFixed(2)} LIN`} icon={<Wallet className="text-deep-black" />} />
                <StatCard title="Today" value={`${earnedToday.toFixed(2)} LIN`} subtext="Since midnight" />
                <StatCard title="This Month" value={`${earnedMonth.toFixed(2)} LIN`} subtext="Current month" />
                <StatCard title="This Year" value={`${earnedYear.toFixed(2)} LIN`} subtext="Year to date" />
            </div>

            {/* Chart */}
            <StatsChart
                data={donations.map(d => ({ timestamp: d.timestamp, value: parseFloat(d.amount) }))}
                dataLabel="Donations"
                color="#10B981"
            />
        </div>
    );
};

const OrdersStats: React.FC<StatsProps> = ({ owner, application }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const query = `
                  query {
                    myOrders(owner: "${owner}") {
                      id
                      amount
                      timestamp
                      product {
                        id
                        price
                      }
                    }
                  }
                `;
                const result: any = await application.query(JSON.stringify({ query }));
                const data = typeof result === 'string' ? JSON.parse(result) : result;

                if (data.errors) throw new Error(data.errors[0].message);
                setOrders(data.data?.myOrders || []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch orders');
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [owner, application]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + parseFloat(o.amount), 0);
    const totalOrders = orders.length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Revenue" value={`${totalRevenue.toFixed(2)} LIN`} icon={<CreditCard className="text-deep-black" />} />
                <StatCard title="Total Orders" value={totalOrders.toString()} icon={<ShoppingBag className="text-deep-black" />} />
                <StatCard title="Avg. Order Value" value={totalOrders > 0 ? `${(totalRevenue / totalOrders).toFixed(2)} LIN` : '0 LIN'} />
            </div>

            {/* Chart */}
            <StatsChart
                data={orders.map(o => ({ timestamp: o.timestamp, value: parseFloat(o.amount) }))}
                dataLabel="Sales Revenue"
                color="#8B5CF6"
            />
        </div>
    );
};

const SubscriptionsStats: React.FC<StatsProps> = ({ owner, application }) => {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubs = async () => {
            setLoading(true);
            try {
                const query = `
                  query {
                    subscribersOf(author: "${owner}") {
                      subscriber
                      endTimestamp
                      price
                    }
                  }
                `;
                const result: any = await application.query(JSON.stringify({ query }));
                const data = typeof result === 'string' ? JSON.parse(result) : result;

                if (data.errors) throw new Error(data.errors[0].message);
                setSubscribers(data.data?.subscribersOf || []);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch subscribers');
            } finally {
                setLoading(false);
            }
        };
        fetchSubs();
    }, [owner, application]);

    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} />;

    const activeSubscribers = subscribers.length;
    // Assuming monthly subscription, projected revenue = sum of active prices
    const monthlyRunRate = subscribers.reduce((sum: number, s: any) => sum + parseFloat(s.price), 0);

    return (
        <div className="space-y-6">


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard title="Active Subscribers" value={activeSubscribers.toString()} icon={<Users className="text-pink-500" />} />
                <StatCard title="Monthly Run Rate" value={`${monthlyRunRate.toFixed(2)} LIN`} subtext="Projected monthly revenue from active subs" />
            </div>

            <div className="bg-white border-2 border-deep-black shadow-hard p-6">
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 uppercase">
                    <Users className="w-5 h-5" /> Subscriber List
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-sm">
                        <thead className="bg-gray-50 border-b-2 border-gray-100">
                            <tr>
                                <th className="p-3 uppercase text-xs text-gray-500 font-bold">Subscriber</th>
                                <th className="p-3 uppercase text-xs text-gray-500 font-bold">Ends At</th>
                                <th className="p-3 uppercase text-xs text-right text-gray-500 font-bold">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 italic">No active subscribers.</td>
                                </tr>
                            ) : (
                                subscribers.map((s: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="p-3 font-bold text-deep-black underline" title={s.subscriber}>{s.subscriber.substring(0, 12)}...</td>
                                        <td className="p-3 text-gray-500">{new Date(s.endTimestamp / 1000).toLocaleDateString()}</td>
                                        <td className="p-3 text-right font-bold text-pink-600">{parseFloat(s.price).toFixed(2)} LIN</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Shared UI Components ---

const StatCard: React.FC<{ title: string, value: string, icon?: React.ReactNode, subtext?: string }> = ({ title, value, icon, subtext }) => (
    <div className="bg-white border-2 border-deep-black p-6 shadow-hard hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <h4 className="font-mono text-xs uppercase text-gray-500 font-bold tracking-wider">{title}</h4>
            {icon && <div className="p-2 bg-gray-100 border-2 border-transparent group-hover:border-deep-black transition-all rounded-lg">{icon}</div>}
        </div>
        <div className="font-display text-4xl font-bold text-deep-black mb-1">{value}</div>
        {subtext && <div className="text-xs text-gray-400 font-mono">{subtext}</div>}
    </div>
);

const LoadingState: React.FC = () => (
    <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-4 gap-4">
            <div className="h-32 bg-gray-200 border-2 border-gray-300"></div>
            <div className="h-32 bg-gray-200 border-2 border-gray-300"></div>
            <div className="h-32 bg-gray-200 border-2 border-gray-300"></div>
            <div className="h-32 bg-gray-200 border-2 border-gray-300"></div>
        </div>
        <div className="h-64 bg-gray-200 border-2 border-gray-300"></div>
    </div>
);

const ErrorState: React.FC<{ error: string | null }> = ({ error }) => (
    <div className="bg-white border-2 border-deep-black shadow-hard p-4 flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-linera-red" />
        <div>
            <h3 className="font-bold text-deep-black uppercase">Error loading data</h3>
            <p className="font-mono text-sm text-gray-600">{error || 'Unknown error'}</p>
        </div>
    </div>
);

export default Statistics;
