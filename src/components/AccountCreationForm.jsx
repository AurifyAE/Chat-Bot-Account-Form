import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { buildPartyPayload } from '../lib/payload';
import { submitParty, checkDuplicateEmail } from '../lib/api';

export const AccountCreationForm = ({ sessionId, metadata, canSubmit, setCanSubmit, setLockStatus, stopHeartbeat, onCancel }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone1: "",
    companyPhone2: "",
    website: "",
    accountMode: "",
    currency: "",
    division: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    tradeLicense: "",
    tradeLicenseExpiry: "",
    gstOrVatNumber: "",
    incorporationCertificate: "",
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [emailCheckStatus, setEmailCheckStatus] = useState('idle'); // 'idle', 'checking', 'available', 'duplicate', 'error'
  const [emailCheckMessage, setEmailCheckMessage] = useState('');
  const emailCheckTimeoutRef = useRef(null);

  const validateEmailFormat = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const performEmailCheck = async (email) => {
    if (!email || !validateEmailFormat(email)) {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
      return;
    }
    
    setEmailCheckStatus('checking');
    setEmailCheckMessage('Checking email...');
    
    try {
      const res = await checkDuplicateEmail(sessionId, email);
      if (res.success) {
        if (res.exists) {
          setEmailCheckStatus('duplicate');
          setEmailCheckMessage(res.message || 'CRM company account already exists for this email');
        } else {
          setEmailCheckStatus('available');
          setEmailCheckMessage('');
        }
      } else {
        if (res.message && res.message.toLowerCase().includes('session')) {
          setLockStatus('expired');
        } else {
          setEmailCheckStatus('error');
          setEmailCheckMessage('');
        }
      }
    } catch (err) {
      setEmailCheckStatus('error');
      setEmailCheckMessage('');
    }
  };

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    
    if (formData.companyEmail && validateEmailFormat(formData.companyEmail)) {
      emailCheckTimeoutRef.current = setTimeout(() => {
        performEmailCheck(formData.companyEmail);
      }, 500);
    } else {
      setEmailCheckStatus('idle');
      setEmailCheckMessage('');
    }

    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [formData.companyEmail, sessionId]);

  const handleEmailBlur = () => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    performEmailCheck(formData.companyEmail);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (name) => (value) => {
    setFormData(prev => ({ ...prev, [name]: value || "" }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        setFile(null);
      } else {
        toast.success(`Attached: ${selectedFile.name}`);
        setFile(selectedFile);
      }
    }
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      toast.error("Company Name is required");
      return false;
    }
    if (!formData.companyEmail.trim()) {
      toast.error("Company Email is required");
      return false;
    }
    if (!formData.companyPhone1) {
      toast.error("Company Phone is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!validateForm()) return;

    if (emailCheckStatus === 'duplicate') {
      toast.error(emailCheckMessage || "Company Email already exists.");
      return;
    }

    setSubmitting(true);

    const payload = buildPartyPayload(formData);

    try {
      setLockStatus("submitting");
      const res = await submitParty(sessionId, payload, file);

      if (res.success) {
        stopHeartbeat();
        setLockStatus("success");
        toast.success(res.message || "Account created successfully!");
        setCanSubmit(false);
      } else {
        setLockStatus("active");
        if (res.code === "CRM_COMPANY_ACCOUNT_EMAIL_DUPLICATE") {
          setEmailCheckStatus('duplicate');
          setEmailCheckMessage(res.message || "CRM company account already exists for this email");
        }
        toast.error(res.message || "Failed to create account.");
      }
    } catch (err) {
      setLockStatus("active");
      toast.error("An unexpected error occurred during submission.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="header">
        <h1 className="title">Create Account</h1>
        <p className="subtitle">Please provide your company details to finalize your profile.</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Company Info Card */}
        <div className="form-section">
          <div className="section-title">
            Company Information
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Company Name <span className="required-asterisk">*</span></label>
              <input className="form-control" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Company Email <span className="required-asterisk">*</span></label>
              <input 
                className="form-control" 
                style={emailCheckStatus === 'duplicate' ? { borderColor: '#DC2626' } : {}}
                type="email" 
                name="companyEmail" 
                value={formData.companyEmail} 
                onChange={handleChange} 
                onBlur={handleEmailBlur}
                placeholder="contact@company.com" 
              />
              {emailCheckStatus === 'checking' && <span style={{fontSize: '0.8rem', color: '#6B7280', marginTop: '4px'}}>Checking email...</span>}
              {emailCheckStatus === 'duplicate' && <span style={{fontSize: '0.8rem', color: '#DC2626', marginTop: '4px'}}>{emailCheckMessage}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Primary Phone <span className="required-asterisk">*</span></label>
              <PhoneInput
                country={'ae'}
                value={formData.companyPhone1}
                onChange={handlePhoneChange("companyPhone1")}
                enableSearch={true}
                countryCodeEditable={false}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <PhoneInput
                country={'ae'}
                value={formData.companyPhone2}
                onChange={handlePhoneChange("companyPhone2")}
                enableSearch={true}
                countryCodeEditable={false}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Website</label>
              <input className="form-control" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.company.com" />
            </div>
          </div>
        </div>



        {/* Address Card */}
        <div className="form-section">
          <div className="section-title">
            Address Details
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Address Line 1</label>
              <input className="form-control" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Street address" />
            </div>
            <div className="form-group">
              <label className="form-label">Address Line 2</label>
              <input className="form-control" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Apartment, suite, etc." />
            </div>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-control" name="city" value={formData.city} onChange={handleChange} placeholder="City name" />
            </div>
            <div className="form-group">
              <label className="form-label">State / Emirate</label>
              <input className="form-control" name="state" value={formData.state} onChange={handleChange} placeholder="State or Emirate" />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input className="form-control" name="country" value={formData.country} onChange={handleChange} placeholder="Country name" />
            </div>
            <div className="form-group">
              <label className="form-label">Zipcode</label>
              <input className="form-control" name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="Postal code" />
            </div>
          </div>
        </div>

        {/* KYC Card */}
        <div className="form-section">
          <div className="section-title">
            KYC & Legal
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Trade License Number</label>
              <input className="form-control" name="tradeLicense" value={formData.tradeLicense} onChange={handleChange} placeholder="License No." />
            </div>
            <div className="form-group">
              <label className="form-label">Trade License Expiry</label>
              <input className="form-control" type="date" name="tradeLicenseExpiry" value={formData.tradeLicenseExpiry} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">GST / VAT Number</label>
              <input className="form-control" name="gstOrVatNumber" value={formData.gstOrVatNumber} onChange={handleChange} placeholder="Tax ID" />
            </div>
            <div className="form-group">
              <label className="form-label">Incorporation Certificate</label>
              <input className="form-control" name="incorporationCertificate" value={formData.incorporationCertificate} onChange={handleChange} placeholder="Certificate No." />
            </div>

            {/* File Upload Box */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Trade License Attachment (Max 10MB)</label>
              <div className="file-wrapper">
                <input className="file-input" type="file" onChange={handleFileChange} accept="image/*,.pdf" />
                <div className="file-label">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>{file ? file.name : "Click or drag file to upload"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Area */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || submitting || emailCheckStatus === 'checking' || emailCheckStatus === 'duplicate'}
          >
            {submitting ? (
              <><span className="spinner"></span> Submitting...</>
            ) : (
              'Complete Account Setup'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
