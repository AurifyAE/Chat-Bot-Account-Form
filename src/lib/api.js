const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export const getSessionStatus = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/session/status?sessionId=${sessionId}`);
  return response.json();
};

export const getMetadata = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/metadata?sessionId=${sessionId}`);
  return response.json();
};

export const acquireSession = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/session/acquire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId })
  });
  return response.json();
};

export const releaseSession = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/session/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId }),
    keepalive: true
  });
  return response.json();
};

export const heartbeatSession = async (sessionId) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/session/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId })
  });
  return response.json();
};
export const checkDuplicateEmail = async (sessionId, email) => {
  const response = await fetch(`${BACKEND_URL}/api/account-creation/company-accounts/check-email?sessionId=${sessionId}&email=${encodeURIComponent(email)}`);
  return response.json();
};

export const submitParty = async (sessionId, payload, file) => {
  const headers = {
    'x-account-creation-session': sessionId
  };

  let body;
  if (file) {
    body = new FormData();
    body.append('file', file);
    body.append('payload', JSON.stringify(payload));
    
    // Flat attributes for file upload structure
    const flattenPayload = (obj, prefix = '') => {
      for (const key in obj) {
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          flattenPayload(obj[key], prefix ? `${prefix}[${key}]` : key);
        } else if (Array.isArray(obj[key])) {
          // not required for this specific case based on requirements, but generally good
        } else {
          const formKey = prefix ? `${prefix}[${key}]` : key;
          if (obj[key] !== undefined && obj[key] !== null) {
            body.append(formKey, obj[key]);
          }
        }
      }
    };
    flattenPayload(payload);
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  const response = await fetch(`${BACKEND_URL}/api/account-creation/company-accounts`, {
    method: 'POST',
    headers,
    body
  });
  
  return response.json();
};
