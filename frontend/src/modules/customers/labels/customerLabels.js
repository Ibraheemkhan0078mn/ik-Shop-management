export const customerLabels = {
  en: {
    // Page titles
    customerManagement: "Customer Management",
    manageCustomers: "Manage your customers",
    addCustomer: "Add Customer",
    editCustomer: "Edit Customer",
    
    // Form labels
    name: "Name",
    phone: "Phone",
    cnic: "CNIC",
    address: "Address",
    image: "Image",
    status: "Status",
    notes: "Notes",
    
    // Status values
    active: "Active",
    inactive: "Inactive",
    
    // Table headers
    actions: "Actions",
    
    // Buttons
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    
    // Messages
    loading: "Loading...",
    noCustomersFound: "No customers found",
    customerCreated: "Customer created successfully",
    customerUpdated: "Customer updated successfully",
    customerDeleted: "Customer deleted successfully",
    failedToCreate: "Failed to create customer",
    failedToUpdate: "Failed to update customer",
    failedToDelete: "Failed to delete customer",
    deleteConfirm: "Are you sure you want to delete this customer?",
    
    // Summary
    totalCustomers: "Total Customers",
    activeCustomers: "Active Customers",
    inactiveCustomers: "Inactive Customers",
  },
  ur: {
    // Page titles
    customerManagement: "گاہک مینجمنٹ",
    manageCustomers: "اپنے گاہکوں کا انتظام کریں",
    addCustomer: "گاہک شامل کریں",
    editCustomer: "گاہک میں ترمیم کریں",
    
    // Form labels
    name: "نام",
    phone: "فون",
    cnic: "شناختی کارڈ",
    address: "پتہ",
    image: "تصویر",
    status: "حیثیت",
    notes: "نوٹس",
    
    // Status values
    active: "فعال",
    inactive: "غیر فعال",
    
    // Table headers
    actions: "اقدامات",
    
    // Buttons
    save: "محفوظ کریں",
    cancel: "منسوخ کریں",
    delete: "حذف کریں",
    edit: "ترمیم کریں",
    
    // Messages
    loading: "لوڈ ہو رہا ہے...",
    noCustomersFound: "کوئی گاہک نہیں ملا",
    customerCreated: "گاہک کامیابی سے بنایا گیا",
    customerUpdated: "گاہک کامیابی سے اپ ڈیٹ ہو گیا",
    customerDeleted: "گاہک کامیابی سے حذف ہو گیا",
    failedToCreate: "گاہک بنانے میں ناکامی",
    failedToUpdate: "گاہک اپ ڈیٹ کرنے میں ناکامی",
    failedToDelete: "گاہک حذف کرنے میں ناکامی",
    deleteConfirm: "کیا آپ واقعی اس گاہک کو حذف کرنا چاہتے ہیں؟",
    
    // Summary
    totalCustomers: "کل گاہک",
    activeCustomers: "فعال گاہک",
    inactiveCustomers: "غیر فعال گاہک",
  },
  ur_en: {
    // Page titles
    customerManagement: "گاہک مینجمنٹ / Customer Management",
    manageCustomers: "اپنے گاہکوں کا انتظام کریں / Manage your customers",
    addCustomer: "گاہک شامل کریں / Add Customer",
    editCustomer: "گاہک میں ترمیم کریں / Edit Customer",
    
    // Form labels
    name: "نام / Name",
    phone: "فون / Phone",
    cnic: "شناختی کارڈ / CNIC",
    address: "پتہ / Address",
    image: "تصویر / Image",
    status: "حیثیت / Status",
    notes: "نوٹس / Notes",
    
    // Status values
    active: "فعال / Active",
    inactive: "غیر فعال / Inactive",
    
    // Table headers
    actions: "اقدامات / Actions",
    
    // Buttons
    save: "محفوظ کریں / Save",
    cancel: "منسوخ کریں / Cancel",
    delete: "حذف کریں / Delete",
    edit: "ترمیم کریں / Edit",
    
    // Messages
    loading: "لوڈ ہو رہا ہے / Loading...",
    noCustomersFound: "کوئی گاہک نہیں ملا / No customers found",
    customerCreated: "گاہک کامیابی سے بنایا گیا / Customer created successfully",
    customerUpdated: "گاہک کامیابی سے اپ ڈیٹ ہو گیا / Customer updated successfully",
    customerDeleted: "گاہک کامیابی سے حذف ہو گیا / Customer deleted successfully",
    failedToCreate: "گاہک بنانے میں ناکامی / Failed to create customer",
    failedToUpdate: "گاہک اپ ڈیٹ کرنے میں ناکامی / Failed to update customer",
    failedToDelete: "گاہک حذف کرنے میں ناکامی / Failed to delete customer",
    deleteConfirm: "کیا آپ واقعی اس گاہک کو حذف کرنا چاہتے ہیں؟ / Are you sure you want to delete this customer?",
    
    // Summary
    totalCustomers: "کل گاہک / Total Customers",
    activeCustomers: "فعال گاہک / Active Customers",
    inactiveCustomers: "غیر فعال گاہک / Inactive Customers",
  },
};

export const getCustomerLabels = (language) => {
  const langKey = language === "ur_en" ? "ur_en" : language === "ur" ? "ur" : "en";
  return customerLabels[langKey] || customerLabels.en;
};
