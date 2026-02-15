// pages/AdminAnalytics.js
// Admin Dashboard for Website Analytics

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { BarChart, Globe, Users, Eye, MousePointer, TrendingUp, Monitor, Smartphone } from 'lucide-react';

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    todayVisitors: 0,
    uniqueVisitors: 0,
    totalPageViews: 0,
    mobileVisitors: 0,
    desktopVisitors: 0,
    topPages: [],
    topCountries: [],
    topBrowsers: [],
    recentActions: []
  });
  
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch page views (analytics collection)
      const analyticsQuery = query(
        collection(db, 'analytics'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      
      const analyticsSnapshot = await getDocs(analyticsQuery);
      const analyticsData = analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch user actions
      const actionsQuery = query(
        collection(db, 'user_actions'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const actionsSnapshot = await getDocs(actionsQuery);
      const actionsData = actionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAnalytics(analyticsData);
      
      // Calculate stats inline
      const now = new Date();
      const today = now.toDateString();

      // Filter by time
      let filteredData = analyticsData;
      if (timeFilter === 'today') {
        filteredData = analyticsData.filter(v => 
          v.date && new Date(v.date).toDateString() === today
        );
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = analyticsData.filter(v => 
          v.date && new Date(v.date) >= weekAgo
        );
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = analyticsData.filter(v => 
          v.date && new Date(v.date) >= monthAgo
        );
      }

      // Today's visitors
      const todayVisitors = analyticsData.filter(v => 
        v.date && new Date(v.date).toDateString() === today
      ).length;

      // Unique visitors (by visitorId)
      const uniqueVisitorIds = new Set(filteredData.map(v => v.visitorId));

      // Device breakdown
      const mobileCount = filteredData.filter(v => v.device?.isMobile).length;
      const desktopCount = filteredData.filter(v => !v.device?.isMobile).length;

      // Top Pages
      const pageCount = {};
      filteredData.forEach(v => {
        const page = v.page || '/';
        pageCount[page] = (pageCount[page] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, count]) => ({ page, count }));

      // Top Countries
      const countryCount = {};
      filteredData.forEach(v => {
        const country = v.country || 'Unknown';
        countryCount[country] = (countryCount[country] || 0) + 1;
      });
      const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      // Top Browsers
      const browserCount = {};
      filteredData.forEach(v => {
        const browser = v.device?.browser || 'Unknown';
        browserCount[browser] = (browserCount[browser] || 0) + 1;
      });
      const topBrowsers = Object.entries(browserCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([browser, count]) => ({ browser, count }));

      // Recent actions
      const recentActions = actionsData.slice(0, 10);

      setStats({
        totalVisitors: filteredData.length,
        todayVisitors: todayVisitors,
        uniqueVisitors: uniqueVisitorIds.size,
        totalPageViews: filteredData.length,
        mobileVisitors: mobileCount,
        desktopVisitors: desktopCount,
        topPages: topPages,
        topCountries: topCountries,
        topBrowsers: topBrowsers,
        recentActions: recentActions
      });
      
      setLoading(false);

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setLoading(false);
      window.showToast?.('❌ Failed to load analytics', 'error');
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getActionIcon = (actionType) => {
    if (actionType?.includes('product')) return '🛍️';
    if (actionType?.includes('cart')) return '🛒';
    if (actionType?.includes('purchase') || actionType?.includes('payment')) return '💳';
    if (actionType?.includes('download')) return '📥';
    if (actionType?.includes('search')) return '🔍';
    if (actionType?.includes('login') || actionType?.includes('register')) return '👤';
    return '📊';
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode === 'XX') return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  if (loading) {
    return (
      <div style={{
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#6366f1',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #6366f1',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          Loading Analytics...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '100px',
      minHeight: '100vh',
      padding: '100px 1.5rem 5rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: '3rem',
        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        📊 Website Analytics
      </h1>

      {/* Time Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all', label: 'All Time' },
          { id: 'today', label: 'Today' },
          { id: 'week', label: 'Last 7 Days' },
          { id: 'month', label: 'Last 30 Days' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id)}
            style={{
              background: timeFilter === filter.id
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : '#ffffff',
              border: timeFilter === filter.id ? 'none' : '2px solid #e2e8f0',
              color: timeFilter === filter.id ? '#ffffff' : '#64748b',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: timeFilter === filter.id ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {[
          { icon: Users, label: 'Total Visitors', value: stats.totalVisitors, color: '#6366f1' },
          { icon: TrendingUp, label: 'Today', value: stats.todayVisitors, color: '#10b981' },
          { icon: Eye, label: 'Unique Visitors', value: stats.uniqueVisitors, color: '#ec4899' },
          { icon: BarChart, label: 'Page Views', value: stats.totalPageViews, color: '#f59e0b' },
          { icon: Smartphone, label: 'Mobile', value: stats.mobileVisitors, color: '#8b5cf6' },
          { icon: Monitor, label: 'Desktop', value: stats.desktopVisitors, color: '#06b6d4' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              background: `${stat.color}15`,
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={32} color={stat.color} />
            </div>
            <div>
              <div style={{
                fontSize: '0.95rem',
                color: '#64748b',
                marginBottom: '0.25rem',
                fontWeight: '600'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '900',
                color: '#1e293b'
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        {/* Top Pages */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <MousePointer size={24} color="#6366f1" />
            Top Pages
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topPages.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {item.page}
                  </span>
                </div>
                <span style={{
                  background: 'rgba(99,102,241,0.1)',
                  color: '#6366f1',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  {item.count} views
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Globe size={24} color="#10b981" />
            Top Countries
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.topCountries.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getCountryFlag(
                      analytics.find(a => a.country === item.country)?.countryCode
                    )}
                  </span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>
                    {item.country}
                  </span>
                </div>
                <span style={{
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  {item.count} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Actions */}
      {stats.recentActions.length > 0 && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '3rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1e293b',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <MousePointer size={24} color="#ec4899" />
            Recent User Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentActions.map((action, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {getActionIcon(action.actionType)}
                  </span>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>
                      {action.actionType?.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {action.city}, {action.country} • {action.deviceType}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#94a3b8' }}>
                  {action.localTime}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visitors Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '800',
          color: '#1e293b',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Users size={24} color="#f59e0b" />
          Recent Visitors ({analytics.slice(0, 50).length})
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.95rem'
          }}>
            <thead>
              <tr style={{
                borderBottom: '2px solid #e2e8f0',
                background: '#f8fafc'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>IP Address</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Location</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Device</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Browser</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Page</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {analytics.slice(0, 50).map((visitor, index) => (
                <tr key={index} style={{
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '1rem', color: '#1e293b', fontWeight: '600', fontFamily: 'monospace' }}>
                    {visitor.ip}
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{getCountryFlag(visitor.countryCode)}</span>
                      <span>{visitor.city}, {visitor.country}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>
                    {visitor.device?.isMobile ? '📱 Mobile' : '💻 Desktop'}
                  </td>
                  <td style={{ padding: '1rem', color: '#64748b' }}>
                    {visitor.device?.browser}
                  </td>
                  <td style={{ padding: '1rem', color: '#6366f1', fontWeight: '600' }}>
                    {visitor.page}
                  </td>
                  <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    {visitor.localTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminAnalytics;