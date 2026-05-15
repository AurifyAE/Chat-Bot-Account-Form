export const buildPartyPayload = (formData) => {
  return {
    companyName: formData.companyName || "",
    companyEmail: formData.companyEmail || "",
    companyPhone1: formData.companyPhone1 || "",
    companyPhone2: formData.companyPhone2 || "",
    website: formData.website || "",
    sourceId: null,
    accountMode: formData.accountMode || null,
    currency: formData.currency || null,
    division: formData.division || null,
    accountStatus: "active",
    companyAddress: {
      addressLine1: formData.addressLine1 || "",
      addressLine2: formData.addressLine2 || "",
      city: formData.city || "",
      country: formData.country || "",
      emirates: formData.emirates || "",
      zipcode: formData.zipcode || ""
    },
    companyKyc: {
      tradeLicense: formData.tradeLicense || "",
      tradeLicenseExpiry: formData.tradeLicenseExpiry || "",
      tradeLicenseAttachment: formData.tradeLicenseAttachment || "",
      gstOrVatNumber: formData.gstOrVatNumber || "",
      incorporationCertificate: formData.incorporationCertificate || ""
    },
    signatory: {
      name: formData.signatoryName || "",
      designation: formData.signatoryDesignation || "",
      signedDate: formData.signatorySignedDate || ""
    },
    contactId: formData.contactId || "",
    name: formData.contactName || formData.companyName || "",
    phone1: formData.contactPhone1 || formData.companyPhone1 || "",
    email: formData.contactEmail || formData.companyEmail || "",
    type: "B2B",
    additionalContacts: []
  };
};
