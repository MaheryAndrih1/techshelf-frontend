import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CustomButton from '../../components/CustomButton';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingRead, setMarkingRead] = useState({});
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }

    fetchNotifications();
  }, [isAuthenticated, navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data?.results || response.data || []);
      setError('');
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    if (markingRead[notificationId]) return;
    setMarkingRead(prev => ({ ...prev, [notificationId]: true }));
    
    try {
      await api.post(`/notifications/${notificationId}/read/`, {});

      // Update local state to reflect the change
      setNotifications(prev => 
        prev.map(notification => 
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error(`Failed to mark notification ${notificationId} as read:`, err);
      setError('Failed to mark notification as read. Please try again.');
    } finally {
      setMarkingRead(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={fetchNotifications}
              className="text-sm underline"
            >
              Refresh
            </button>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="text-xl font-semibold mb-4 text-[#33353a]">No Notifications</h2>
            <p className="text-gray-600 mb-4">You don't have any notifications yet.</p>
            <Link to="/">
              <CustomButton type="primary">
                Back to Home
              </CustomButton>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border ${
                  notification.is_read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between">
                  <p className={`${notification.is_read ? 'text-gray-700' : 'font-medium text-gray-900'}`}>
                    {notification.message}
                    
                    {notification.link_url && (
                      <a
                        href={notification.link_url}
                        className="ml-2 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View details
                      </a>
                    )}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.notification_id)}
                        disabled={markingRead[notification.notification_id]}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {markingRead[notification.notification_id] ? (
                          <div className="w-3 h-3 border-t-transparent border-2 border-blue-600 rounded-full animate-spin mr-1"></div>
                        ) : null}
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
