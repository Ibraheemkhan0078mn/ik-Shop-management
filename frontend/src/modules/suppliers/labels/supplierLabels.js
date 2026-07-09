export const supplierLabels = {
  en: {
    // Page titles
    supplierManagement: "Supplier Management",
    manageSuppliers: "Manage your suppliers",
    addSupplier: "Add Supplier",
    editSupplier: "Edit Supplier",
    
    // Form labels
    name: "Name",
    type: "Type",
    phone: "Phone",
    email: "Email",
    address: "Address",
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
    noSuppliersFound: "No suppliers found",
    supplierCreated: "Supplier created successfully",
    supplierUpdated: "Supplier updated successfully",
    supplierDeleted: "Supplier deleted successfully",
    failedToCreate: "Failed to create supplier",
    failedToUpdate: "Failed to update supplier",
    failedToDelete: "Failed to delete supplier",
    deleteConfirm: "Are you sure you want to delete this supplier?",
    
    // Summary
    totalSuppliers: "Total Suppliers",
    activeSuppliers: "Active Suppliers",
    inactiveSuppliers: "Inactive Suppliers",
  },
  ur: {
    // Page titles
    supplierManagement: "سپلائر مینجمنٹ",
    manageSuppliers: "اپنے سپلائرز کا انتظام کریں",
    addSupplier: "سپلائر شامل کریں",
    editSupplier: "سپلائر میں ترمیم کریں",
    
    // Form labels
    name: "نام",
    type: "قسم",
    phone: "فون",
    email: "ای میل",
    address: "پتہ",
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
    noSuppliersFound: "کوئی سپلائر نہیں ملا",
    supplierCreated: "سپلائر کامیابی سے بنایا گیا",
    supplierUpdated: "سپلائر کامیابی سے اپ ڈیٹ ہو گیا",
    supplierDeleted: "سپلائر کامیابی سے حذف ہو گیا",
    failedToCreate: "سپلائر بنانے میں ناکامی",
    failedToUpdate: "سپلائر اپ ڈیٹ کرنے میں ناکامی",
    failedToDelete: "سپلائر حذف کرنے میں ناکامی",
    deleteConfirm: "کیا آپ واقعی اس سپلائر کو حذف کرنا چاہتے ہیں؟",
    
    // Summary
    totalSuppliers: "کل سپلائرز",
    activeSuppliers: "فعال سپلائرز",
    inactiveSuppliers: "غیر فعال سپلائرز",
  },
  ur_en: {
    // Page titles
    supplierManagement: "سپلائر مینجمنٹ / Supplier Management",
    manageSuppliers: "اپنے سپلائرز کا انتظام کریں / Manage your suppliers",
    addSupplier: "سپلائر شامل کریں / Add Supplier",
    editSupplier: "سپلائر میں ترمیم کریں / Edit Supplier",
    
    // Form labels
    name: "نام / Name",
    type: "قسم / Type",
    phone: "فون / Phone",
    email: "ای میل / Email",
    address: "پتہ / Address",
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
    noSuppliersFound: "کوئی سپلائر نہیں ملا / No suppliers found",
    supplierCreated: "سپلائر کامیابی سے بنایا گیا / Supplier created successfully",
    supplierUpdated: "سپلائر کامیابی سے اپ ڈیٹ ہو گیا / Supplier updated successfully",
    supplierDeleted: "سپلائر کامیابی سے حذف ہو گیا / Supplier deleted successfully",
    failedToCreate: "سپلائر بنانے میں ناکامی / Failed to create supplier",
    failedToUpdate: "سپلائر اپ ڈیٹ کرنے میں ناکامی / Failed to update supplier",
    failedToDelete: "سپلائر حذف کرنے میں ناکامی / Failed to delete supplier",
    deleteConfirm: "کیا آپ واقعی اس سپلائر کو حذف کرنا چاہتے ہیں؟ / Are you sure you want to delete this supplier?",
    
    // Summary
    totalSuppliers: "کل سپلائرز / Total Suppliers",
    activeSuppliers: "فعال سپلائرز / Active Suppliers",
    inactiveSuppliers: "غیر فعال سپلائرز / Inactive Suppliers",
  },
};

export const getSupplierLabels = (language) => {
  const langKey = language === "ur_en" ? "ur_en" : language === "ur" ? "ur" : "en";
  return supplierLabels[langKey] || supplierLabels.en;
};
