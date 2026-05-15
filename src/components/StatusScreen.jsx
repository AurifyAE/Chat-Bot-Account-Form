import React from 'react';

export const StatusScreen = ({ status, message, expiresAt, onExit }) => {
  let icon = "⏳";
  let title = "Loading";
  let isError = false;
  let isSuccess = false;

  switch (status) {
    case "loading":
      icon = "🔄";
      title = "Validating Secure Link...";
      break;
    case "invalid":
      icon = "❌";
      title = "Invalid Link";
      isError = true;
      break;
    case "expired":
      icon = "⏰";
      title = "Link Expired";
      isError = true;
      break;
    case "blocked":
      icon = "🔒";
      title = "Access Restricted";
      isError = true;
      break;
    case "success":
      icon = "🎉";
      title = "Account Created!";
      isSuccess = true;
      break;
    case "error":
      icon = "⚠️";
      title = "Oops! Something went wrong.";
      isError = true;
      break;
    default:
      icon = "ℹ️";
      title = "Status";
      break;
  }

  // Simple countdown logic for blocked sessions
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
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

  return (
    <div className="status-screen">
      <div className="status-icon">{icon}</div>
      <h1 className={`status-title ${isError ? 'text-error' : ''} ${isSuccess ? 'text-success' : ''}`}>
        {title}
      </h1>
      <p className="subtitle">{message}</p>
      
      {status === "blocked" && expiresAt && (
        <div className="countdown-box">
          <strong>Current session expires in: {timeLeft}</strong>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#B91C1C' }}>
            Please try opening this link again after the time expires.
          </p>
        </div>
      )}

      {status !== "loading" && onExit && (
        <button 
          className="btn btn-secondary" 
          style={{ marginTop: '2.5rem', minWidth: '200px' }} 
          onClick={onExit}
        >
          {isSuccess ? 'Return to Home' : 'Exit Setup'}
        </button>
      )}
    </div>
  );
};
