import React, { useState } from 'react';
import { toast } from 'react-toastify';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { buildPartyPayload } from '../lib/payload';
import { submitParty } from '../lib/api';

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
        toast.error(res.message || "Failed to submit account creation form.");
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
            <span>🏢</span> Company Information
          </div>
          <div className="two-col">
            <div className="form-group">
              <label className="form-label">Company Name <span className="required-asterisk">*</span></label>
              <input className="form-control" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="e.g. Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Company Email <span className="required-asterisk">*</span></label>
              <input className="form-control" type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} placeholder="contact@company.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Phone <span className="required-asterisk">*</span></label>
              <PhoneInput
                international
                defaultCountry="AE"
                value={formData.companyPhone1}
                onChange={handlePhoneChange("companyPhone1")}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <PhoneInput
                international
                defaultCountry="AE"
                value={formData.companyPhone2}
                onChange={handlePhoneChange("companyPhone2")}
                className="form-control"
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
            <span>📍</span> Address Details
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
            <span>📋</span> KYC & Legal
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
            disabled={!canSubmit || submitting}
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
