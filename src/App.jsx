import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AccountCreationPage from './pages/AccountCreationPage'

function App() {
  const path = window.location.pathname;

  let content;
  if (path === '/account-creation') {
    content = <AccountCreationPage />;
  } else {
    content = (
      <div className="container">
        <div className="card">
          <div className="status-screen">
            <div className="status-icon">⚠️</div>
            <h1 className="status-title text-error">Not Found</h1>
            <p className="subtitle">The requested URL was not found on this server.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {content}
      <ToastContainer 
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
