import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../services/api';

function EmailTestPage() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [schedulerInfo, setSchedulerInfo] = useState(null);

  useEffect(() => {
    fetchHistory();
    checkSchedulers();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/test/email/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const checkSchedulers = async () => {
    try {
      const response = await api.get('/test/email/check-schedulers');
      setSchedulerInfo(response.data);
    } catch (error) {
      console.error('Failed to check schedulers', error);
    }
  };

  const sendEmail = async (type) => {
    setLoading(true);
    try {
      const response = await api.post(`/test/email/send-${type}`);
      toast.success(response.data.message);
      fetchHistory(); // Refresh history
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
    setLoading(false);
  };

  const sendAllEmails = async () => {
    setLoading(true);
    try {
      const response = await api.post('/test/email/send-all-test-emails');

      Object.entries(response.data.results).forEach(([type, result]) => {
        if (result.includes('✅')) {
          toast.success(`${type}: ${result}`);
        } else if (result.includes('❌')) {
          toast.error(`${type}: ${result}`);
        } else {
          toast.info(`${type}: ${result}`);
        }
      });

      fetchHistory();
    } catch (error) {
      console.error('Failed to send emails:', error);
      toast.error('Failed to send emails');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Email Notification Testing</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>📝 Daily Reminder</h3>
          <p>Reminds you to log your expenses</p>
          <button
            onClick={() => sendEmail('daily-reminder')}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          >
            Send Daily Reminder
          </button>
        </div>

        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Weekly Report</h3>
          <p>Summary of last 7 days</p>
          <button
            onClick={() => sendEmail('weekly-report')}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          >
            Send Weekly Report
          </button>
        </div>

        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Monthly Report</h3>
          <p>Comprehensive monthly analysis</p>
          <button
            onClick={() => sendEmail('monthly-report')}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          >
            Send Monthly Report
          </button>
        </div>

        <div style={{
          border: '1px solid #ddd',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Payment Reminder</h3>
          <p>Upcoming payment notification</p>
          <button
            onClick={() => sendEmail('payment-reminder')}
            disabled={loading}
            style={{ width: '100%', padding: '10px' }}
          >
            Send Payment Reminder
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={sendAllEmails}
          disabled={loading}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Send All Test Emails
        </button>
      </div>

      {schedulerInfo && (
        <div style={{
          backgroundColor: '#e8f4f8',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3>Scheduler Information</h3>
          <p>Current Date: {schedulerInfo.currentDate}</p>
          <p>Day of Week: {schedulerInfo.currentDayOfWeek}</p>
          <p>Day of Month: {schedulerInfo.currentDayOfMonth}</p>
          <h4>Scheduled Tasks:</h4>
          <ul>
            {Object.entries(schedulerInfo.scheduledTasks).map(([task, schedule]) => (
              <li key={task}><strong>{task}:</strong> {schedule}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2>Email History (Last 20)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Subject</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Sent At</th>
            </tr>
            </thead>
            <tbody>
            {history.map((email) => (
              <tr key={email.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{email.type}</td>
                <td style={{ padding: '10px' }}>{email.subject}</td>
                <td style={{ padding: '10px' }}>
                    <span style={{
                      color: email.status === 'SENT' ? 'green' : 'red'
                    }}>
                      {email.status}
                    </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {email.sentAt || 'Not sent'}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a
          href="http://localhost:8025"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px'
          }}
        >
          Open MailHog 📮
        </a>
      </div>
    </div>
  );
}

export default EmailTestPage;
