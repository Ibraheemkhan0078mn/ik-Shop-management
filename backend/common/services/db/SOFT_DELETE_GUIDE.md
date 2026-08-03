# Soft Delete Implementation Guide

## Overview
The centralized MongoDB CRUD service now supports **soft delete** functionality. Instead of permanently removing documents from the database, they are marked as deleted and hidden from normal queries.

## How It Works

### 1. Database Schema Updates
Add these fields to **ALL your Mongoose models**:

```javascript
const yourSchema = new mongoose.Schema({
  // ... your existing fields ...
  
  // Soft Delete Fields
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  
}, { timestamps: true });
```

**Example - Product Model:**
```javascript
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  // ... other fields ...
  
  // Soft Delete Support
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });
```

---

## 2. Using the CRUD Functions

### **findDocs** - Automatically excludes deleted documents
```javascript
import { findDocs } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Normal query - excludes soft-deleted documents
const products = await findDocs({
  modelName: 'Product',
  filter: { category: 'Electronics' },
  options: { sort: { createdAt: -1 } }
});

// Include deleted documents if needed
const allProducts = await findDocs({
  modelName: 'Product',
  filter: { category: 'Electronics' },
  options: { includeDeleted: true }
});
```

### **findOneDoc** - Automatically excludes deleted documents
```javascript
import { findOneDoc } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Normal query - excludes soft-deleted document
const product = await findOneDoc({
  modelName: 'Product',
  filter: { _id: productId }
});

// Include deleted document if needed
const productWithDeleted = await findOneDoc({
  modelName: 'Product',
  filter: { _id: productId },
  options: { includeDeleted: true }
});
```

### **updateDocs** - Automatically excludes deleted documents
```javascript
import { updateDocs } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Update only non-deleted documents
const updated = await updateDocs({
  modelName: 'Product',
  filter: { _id: productId },
  data: { price: 100 }
});

// Update including deleted documents
const updatedAll = await updateDocs({
  modelName: 'Product',
  filter: { _id: productId },
  data: { price: 100 },
  options: { includeDeleted: true }
});
```

### **deleteDocs** - Soft delete (default) or hard delete
```javascript
import { deleteDocs } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Soft delete - marks as deleted, keeps in database
const softDeleted = await deleteDocs({
  modelName: 'Product',
  filter: { _id: productId }
  // By default: hardDelete = false
});

// Hard delete - permanently removes from database
const hardDeleted = await deleteDocs({
  modelName: 'Product',
  filter: { _id: productId },
  options: { hardDelete: true }
});

// Soft delete multiple documents
const softDeletedMany = await deleteDocs({
  modelName: 'Product',
  filter: { category: 'Obsolete' },
  options: { many: true }
});

// Hard delete multiple documents
const hardDeletedMany = await deleteDocs({
  modelName: 'Product',
  filter: { category: 'Test' },
  options: { many: true, hardDelete: true }
});
```

### **restoreDocs** - Restore soft-deleted documents
```javascript
import { restoreDocs } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Restore a single soft-deleted document
const restored = await restoreDocs({
  modelName: 'Product',
  filter: { _id: productId }
});

// Restore multiple soft-deleted documents
const restoredMany = await restoreDocs({
  modelName: 'Product',
  filter: { category: 'Electronics' },
  options: { many: true }
});
```

### **countDocs** - Count with soft delete support
```javascript
import { countDocs } from '../common/services/db/mongodbCentralizedCrud.service.js';

// Count only non-deleted documents
const activeCount = await countDocs({
  modelName: 'Product',
  filter: { category: 'Electronics' }
});

// Count all documents including deleted
const totalCount = await countDocs({
  modelName: 'Product',
  filter: { category: 'Electronics' },
  options: { includeDeleted: true }
});

// Count only deleted documents
const deletedCount = await countDocs({
  modelName: 'Product',
  filter: { category: 'Electronics', isDeleted: true },
  options: { includeDeleted: true }
});
```

---

## 3. Controller/Service Examples

### Delete Controller
```javascript
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    const product = await deleteDocs({
      modelName: 'Product',
      filter: { _id: id }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ 
      message: 'Product deleted successfully',
      data: product 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### List Controller (excludes deleted)
```javascript
export const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    
    // Automatically excludes deleted products
    const products = await findDocs({
      modelName: 'Product',
      filter,
      options: {
        limit: parseInt(limit),
        skip: (page - 1) * limit,
        sort: { createdAt: -1 }
      }
    });
    
    const total = await countDocs({
      modelName: 'Product',
      filter
    });
    
    res.status(200).json({
      data: products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### Restore Controller
```javascript
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await restoreDocs({
      modelName: 'Product',
      filter: { _id: id }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Deleted product not found' });
    }
    
    res.status(200).json({ 
      message: 'Product restored successfully',
      data: product 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### View Deleted Items Controller
```javascript
export const getDeletedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Explicitly filter for deleted items
    const products = await findDocs({
      modelName: 'Product',
      filter: { isDeleted: true },
      options: {
        includeDeleted: true,  // Must include to see deleted
        limit: parseInt(limit),
        skip: (page - 1) * limit,
        sort: { deletedAt: -1 }
      }
    });
    
    const total = await countDocs({
      modelName: 'Product',
      filter: { isDeleted: true },
      options: { includeDeleted: true }
    });
    
    res.status(200).json({
      data: products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## 4. Migration Steps

### Step 1: Update All Models
Add `isDeleted` and `deletedAt` fields to all existing models:

```javascript
// Add to EVERY model schema
isDeleted: { type: Boolean, default: false, index: true },
deletedAt: { type: Date, default: null },
```

### Step 2: Run Database Migration (Optional)
If you have existing data, run this script to add fields:

```javascript
// migration.js
import mongoose from 'mongoose';

const migrateModels = async () => {
  const models = ['Product', 'Customer', 'Order', 'Supplier', /* ... add all models */];
  
  for (const modelName of models) {
    const Model = mongoose.model(modelName);
    await Model.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false, deletedAt: null } }
    );
    console.log(`Migrated ${modelName}`);
  }
};

migrateModels();
```

### Step 3: Update Controllers
Replace direct Mongoose calls with the centralized CRUD functions.

### Step 4: Test
Test all delete operations to ensure soft delete is working.

---

## 5. Benefits

✅ **Data Recovery** - Easily restore accidentally deleted records  
✅ **Audit Trail** - Keep track of what was deleted and when  
✅ **Referential Integrity** - Related records remain intact  
✅ **Compliance** - Meet data retention requirements  
✅ **Safer Operations** - Reduce risk of permanent data loss  

---

## 6. Options Summary

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeDeleted` | boolean | false | Include soft-deleted documents in queries |
| `hardDelete` | boolean | false | Permanently delete instead of soft delete |
| `many` | boolean | false | Apply operation to multiple documents |

---

## 7. Important Notes

⚠️ **Index Performance**: The `isDeleted` field is indexed for better query performance  
⚠️ **Existing Code**: Update all existing Mongoose queries to use the centralized functions  
⚠️ **Hard Delete**: Use `hardDelete: true` only when absolutely necessary (e.g., GDPR requests)  
⚠️ **Relationships**: Consider soft deleting related documents together  
⚠️ **Background Jobs**: Set up periodic cleanup of old soft-deleted records if needed  

---

## Complete Example - Product CRUD

```javascript
import { 
  createDoc, 
  findDocs, 
  findOneDoc, 
  updateDocs, 
  deleteDocs, 
  restoreDocs,
  countDocs 
} from '../common/services/db/mongodbCentralizedCrud.service.js';

// CREATE
export const createProduct = async (req, res) => {
  const product = await createDoc({
    modelName: 'Product',
    data: req.body
  });
  res.status(201).json({ data: product });
};

// READ ALL (excludes deleted)
export const getAllProducts = async (req, res) => {
  const products = await findDocs({
    modelName: 'Product',
    filter: {},
    options: { sort: { createdAt: -1 } }
  });
  res.status(200).json({ data: products });
};

// READ ONE (excludes deleted)
export const getProduct = async (req, res) => {
  const product = await findOneDoc({
    modelName: 'Product',
    filter: { _id: req.params.id }
  });
  res.status(200).json({ data: product });
};

// UPDATE (excludes deleted)
export const updateProduct = async (req, res) => {
  const product = await updateDocs({
    modelName: 'Product',
    filter: { _id: req.params.id },
    data: req.body
  });
  res.status(200).json({ data: product });
};

// SOFT DELETE
export const deleteProduct = async (req, res) => {
  const product = await deleteDocs({
    modelName: 'Product',
    filter: { _id: req.params.id }
  });
  res.status(200).json({ message: 'Product deleted', data: product });
};

// RESTORE
export const restoreProduct = async (req, res) => {
  const product = await restoreDocs({
    modelName: 'Product',
    filter: { _id: req.params.id }
  });
  res.status(200).json({ message: 'Product restored', data: product });
};

// GET DELETED
export const getDeletedProducts = async (req, res) => {
  const products = await findDocs({
    modelName: 'Product',
    filter: { isDeleted: true },
    options: { includeDeleted: true }
  });
  res.status(200).json({ data: products });
};

// COUNT ACTIVE
export const countActiveProducts = async (req, res) => {
  const count = await countDocs({
    modelName: 'Product'
  });
  res.status(200).json({ count });
};
```

---

## Need Help?
If you encounter issues or need clarification, refer to the source code in:
`backend/common/services/db/mongodbCentralizedCrud.service.js`
