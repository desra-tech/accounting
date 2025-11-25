/**
 * Master Data Management
 * Mengelola data master: Chart of Accounts, Customers, Suppliers, Products
 */

// ==================== CHART OF ACCOUNTS ====================

/**
 * Mendapatkan semua akun
 */
function getAccounts(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('accounts').where('companyId', '==', companyId);

    if (filters) {
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
    }

    const accounts = query.execute();
    return { success: true, data: accounts.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    Logger.log('Error getting accounts: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan akun berdasarkan ID
 */
function getAccountById(accountId) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const account = firestore.getDocument('accounts/' + accountId);
    return { success: true, data: { id: accountId, ...account.fields } };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Membuat akun baru
 */
function createAccount(accountData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa membuat akun' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const accountId = Utilities.getUuid();

    const newAccount = {
      companyId: companyId,
      code: accountData.code,
      name: accountData.name,
      type: accountData.type,
      category: accountData.category,
      normalBalance: accountData.normalBalance,
      level: accountData.level || 3,
      parentId: accountData.parentId || '',
      balance: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('accounts/' + accountId, newAccount);
    return { success: true, message: 'Akun berhasil dibuat', accountId: accountId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update akun
 */
function updateAccount(accountId, accountData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa mengubah akun' };
  }

  try {
    const firestore = getFirestore();
    accountData.updatedAt = new Date();
    firestore.updateDocument('accounts/' + accountId, accountData);
    return { success: true, message: 'Akun berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== CUSTOMERS ====================

/**
 * Mendapatkan semua pelanggan
 */
function getCustomers(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('customers').where('companyId', '==', companyId);

    if (filters && filters.type) {
      query = query.where('type', '==', filters.type);
    }

    const customers = query.execute();
    return { success: true, data: customers.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Membuat pelanggan baru
 */
function createCustomer(customerData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa membuat pelanggan' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const customerId = Utilities.getUuid();

    // Generate customer code
    const count = firestore.query('customers').where('companyId', '==', companyId).execute().length;
    const customerCode = 'CUST-' + String(count + 1).padStart(4, '0');

    const newCustomer = {
      companyId: companyId,
      code: customerCode,
      name: customerData.name,
      type: customerData.type || 'customer',
      phone: customerData.phone || '',
      email: customerData.email || '',
      address: customerData.address || '',
      city: customerData.city || '',
      taxId: customerData.taxId || '',
      balance: 0,
      creditLimit: customerData.creditLimit || 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('customers/' + customerId, newCustomer);
    return { success: true, message: 'Pelanggan berhasil dibuat', customerId: customerId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update pelanggan
 */
function updateCustomer(customerId, customerData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa mengubah pelanggan' };
  }

  try {
    const firestore = getFirestore();
    customerData.updatedAt = new Date();
    firestore.updateDocument('customers/' + customerId, customerData);
    return { success: true, message: 'Pelanggan berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== SUPPLIERS ====================

/**
 * Mendapatkan semua pemasok
 */
function getSuppliers() {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const suppliers = firestore.query('suppliers').where('companyId', '==', companyId).execute();
    return { success: true, data: suppliers.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Membuat pemasok baru
 */
function createSupplier(supplierData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa membuat pemasok' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const supplierId = Utilities.getUuid();

    // Generate supplier code
    const count = firestore.query('suppliers').where('companyId', '==', companyId).execute().length;
    const supplierCode = 'SUPP-' + String(count + 1).padStart(4, '0');

    const newSupplier = {
      companyId: companyId,
      code: supplierCode,
      name: supplierData.name,
      phone: supplierData.phone || '',
      email: supplierData.email || '',
      address: supplierData.address || '',
      city: supplierData.city || '',
      taxId: supplierData.taxId || '',
      balance: 0,
      creditTerm: supplierData.creditTerm || 30,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('suppliers/' + supplierId, newSupplier);
    return { success: true, message: 'Pemasok berhasil dibuat', supplierId: supplierId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update pemasok
 */
function updateSupplier(supplierId, supplierData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa mengubah pemasok' };
  }

  try {
    const firestore = getFirestore();
    supplierData.updatedAt = new Date();
    firestore.updateDocument('suppliers/' + supplierId, supplierData);
    return { success: true, message: 'Pemasok berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== PRODUCTS ====================

/**
 * Mendapatkan semua produk/jasa
 */
function getProducts(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('products').where('companyId', '==', companyId);

    if (filters) {
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }
    }

    const products = query.execute();
    return { success: true, data: products.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Membuat produk baru
 */
function createProduct(productData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa membuat produk' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const productId = Utilities.getUuid();

    // Generate product code
    const count = firestore.query('products').where('companyId', '==', companyId).execute().length;
    const productCode = 'PRD-' + String(count + 1).padStart(4, '0');

    const newProduct = {
      companyId: companyId,
      code: productCode,
      name: productData.name,
      type: productData.type || 'product',
      category: productData.category || '',
      unit: productData.unit || 'pcs',
      purchasePrice: productData.purchasePrice || 0,
      sellingPrice: productData.sellingPrice || 0,
      stock: productData.stock || 0,
      minStock: productData.minStock || 0,
      description: productData.description || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('products/' + productId, newProduct);
    return { success: true, message: 'Produk berhasil dibuat', productId: productId };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update produk
 */
function updateProduct(productId, productData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa mengubah produk' };
  }

  try {
    const firestore = getFirestore();
    productData.updatedAt = new Date();
    firestore.updateDocument('products/' + productId, productData);
    return { success: true, message: 'Produk berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update stok produk
 */
function updateProductStock(productId, newStock) {
  try {
    const firestore = getFirestore();
    firestore.updateDocument('products/' + productId, {
      stock: newStock,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
