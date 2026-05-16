import React, { useState, useEffect } from 'react';
import { useAccountCreationSession } from '../hooks/useAccountCreationSession';
import { StatusScreen } from '../components/StatusScreen';
import { AccountCreationForm } from '../components/AccountCreationForm';

const SessionTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiresAt).getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <div style={{ 
      textAlign: 'right', 
      fontSize: '0.9rem', 
      fontWeight: '600',
      color: timeLeft === "Expired" ? 'var(--error)' : 'var(--primary)', 
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '0.5rem'
    }}>
      <span>⏱️ Time Pending:</span>
      <span style={{ minWidth: '60px', textAlign: 'left' }}>{timeLeft}</span>
    </div>
  );
};

const AccountCreationPage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('sessionId');

  const {
    lockStatus,
    setLockStatus,
    metadata,
    expiresAt, // Use this for the StatusScreen if blocked
    sessionExpiresAt, // Use this for the active form countdown
    message,
    setMessage,
    canSubmit,
    setCanSubmit,
    manualRelease,
    stopHeartbeat
  } = useAccountCreationSession(sessionId);

  const handleExit = () => {
    manualRelease().then(() => {
      window.close();
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 300);
    });
  };

  const handleCancel = () => {
    manualRelease().then(() => {
      window.close();
      setTimeout(() => {
        window.location.href = "about:blank";
      }, 300);
    });
  };

  return (
    <div className="container">
      <div className="card">
        {lockStatus === "active" || lockStatus === "submitting" ? (
          <>
            {sessionExpiresAt && <SessionTimer expiresAt={sessionExpiresAt} />}
            <AccountCreationForm 
              sessionId={sessionId}
              metadata={metadata}
              canSubmit={canSubmit}
              setCanSubmit={setCanSubmit}
              setLockStatus={setLockStatus}
              setMessage={setMessage}
              stopHeartbeat={stopHeartbeat}
              onCancel={handleCancel}
            />
          </>
        ) : (
          <StatusScreen 
            status={lockStatus} 
            message={message} 
            expiresAt={expiresAt}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
};

export default AccountCreationPage;
