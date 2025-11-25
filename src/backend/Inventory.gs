/**
 * Inventory Management
 * Mengelola persediaan barang: stock in, stock out, stock adjustment
 */

// ==================== INVENTORY TRANSACTIONS ====================

/**
 * Mencatat barang masuk (stock in)
 */
function createStockIn(stockData) {
  if (!canAccessFeature('inventory_view')) {
    return { success: false, message: 'Anda tidak memiliki akses untuk fitur ini' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'User tidak terautentikasi' };
  }

  try {
    const firestore = getFirestore();

    // Get current product
    const product = firestore.getDocument('products/' + stockData.productId);
    const currentStock = product.fields.stock || 0;
    const newStock = currentStock + stockData.quantity;

    // Create inventory record
    const inventoryId = Utilities.getUuid();
    const newInventory = {
      companyId: companyId,
      productId: stockData.productId,
      transactionDate: new Date(stockData.transactionDate),
      transactionType: 'in',
      referenceNo: stockData.referenceNo || '',
      quantity: stockData.quantity,
      unitPrice: stockData.unitPrice || 0,
      totalPrice: stockData.quantity * (stockData.unitPrice || 0),
      stockBefore: currentStock,
      stockAfter: newStock,
      description: stockData.description || 'Barang masuk',
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    firestore.createDocument('inventory/' + inventoryId, newInventory);

    // Update product stock
    updateProductStock(stockData.productId, newStock);

    // Create journal entry jika ada harga
    if (stockData.unitPrice && stockData.unitPrice > 0) {
      const totalAmount = stockData.quantity * stockData.unitPrice;

      // Debit: Persediaan Barang Dagangan
      // Credit: Kas/Utang Usaha (tergantung pembayaran)
      const entries = [
        {
          accountId: stockData.inventoryAccountId || '1104', // Persediaan
          accountCode: '1-1004',
          accountName: 'Persediaan Barang Dagangan',
          description: 'Pembelian ' + product.fields.name,
          debit: totalAmount,
          credit: 0,
          productId: stockData.productId
        },
        {
          accountId: stockData.paymentAccountId || '1101', // Kas atau Utang
          accountCode: stockData.paymentAccountCode || '1-1001',
          accountName: stockData.paymentAccountName || 'Kas',
          description: 'Pembelian ' + product.fields.name,
          debit: 0,
          credit: totalAmount,
          supplierId: stockData.supplierId || ''
        }
      ];

      createJournal({
        type: 'general',
        transactionDate: stockData.transactionDate,
        description: 'Pembelian ' + product.fields.name + ' - ' + stockData.quantity + ' ' + product.fields.unit,
        reference: stockData.referenceNo,
        totalAmount: totalAmount,
        entries: entries
      });
    }

    return {
      success: true,
      message: 'Stok berhasil ditambahkan',
      inventoryId: inventoryId,
      newStock: newStock
    };
  } catch (error) {
    Logger.log('Error creating stock in: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mencatat barang keluar (stock out)
 */
function createStockOut(stockData) {
  if (!canAccessFeature('inventory_view')) {
    return { success: false, message: 'Anda tidak memiliki akses untuk fitur ini' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'User tidak terautentikasi' };
  }

  try {
    const firestore = getFirestore();

    // Get current product
    const product = firestore.getDocument('products/' + stockData.productId);
    const currentStock = product.fields.stock || 0;

    // Check if stock is sufficient
    if (currentStock < stockData.quantity) {
      return { success: false, message: 'Stok tidak mencukupi. Stok saat ini: ' + currentStock };
    }

    const newStock = currentStock - stockData.quantity;

    // Create inventory record
    const inventoryId = Utilities.getUuid();
    const newInventory = {
      companyId: companyId,
      productId: stockData.productId,
      transactionDate: new Date(stockData.transactionDate),
      transactionType: 'out',
      referenceNo: stockData.referenceNo || '',
      quantity: stockData.quantity,
      unitPrice: stockData.unitPrice || product.fields.sellingPrice || 0,
      totalPrice: stockData.quantity * (stockData.unitPrice || product.fields.sellingPrice || 0),
      stockBefore: currentStock,
      stockAfter: newStock,
      description: stockData.description || 'Barang keluar',
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    firestore.createDocument('inventory/' + inventoryId, newInventory);

    // Update product stock
    updateProductStock(stockData.productId, newStock);

    // Create journal entry
    const costAmount = stockData.quantity * (product.fields.purchasePrice || 0);
    const saleAmount = stockData.quantity * (stockData.unitPrice || product.fields.sellingPrice || 0);

    if (saleAmount > 0) {
      // Debit: Kas/Piutang
      // Credit: Pendapatan Penjualan
      const revenueEntries = [
        {
          accountId: stockData.paymentAccountId || '1101', // Kas
          accountCode: stockData.paymentAccountCode || '1-1001',
          accountName: stockData.paymentAccountName || 'Kas',
          description: 'Penjualan ' + product.fields.name,
          debit: saleAmount,
          credit: 0,
          customerId: stockData.customerId || ''
        },
        {
          accountId: '4101', // Pendapatan Penjualan
          accountCode: '4-0001',
          accountName: 'Pendapatan Penjualan',
          description: 'Penjualan ' + product.fields.name,
          debit: 0,
          credit: saleAmount,
          productId: stockData.productId,
          customerId: stockData.customerId || ''
        }
      ];

      createJournal({
        type: 'receipt',
        transactionDate: stockData.transactionDate,
        description: 'Penjualan ' + product.fields.name + ' - ' + stockData.quantity + ' ' + product.fields.unit,
        reference: stockData.referenceNo,
        totalAmount: saleAmount,
        entries: revenueEntries
      });

      // Debit: Beban Pokok Penjualan
      // Credit: Persediaan
      if (costAmount > 0) {
        const cogsEntries = [
          {
            accountId: '5101', // HPP
            accountCode: '5-0001',
            accountName: 'Pembelian Barang Dagangan',
            description: 'HPP ' + product.fields.name,
            debit: costAmount,
            credit: 0,
            productId: stockData.productId
          },
          {
            accountId: '1104', // Persediaan
            accountCode: '1-1004',
            accountName: 'Persediaan Barang Dagangan',
            description: 'HPP ' + product.fields.name,
            debit: 0,
            credit: costAmount,
            productId: stockData.productId
          }
        ];

        createJournal({
          type: 'general',
          transactionDate: stockData.transactionDate,
          description: 'HPP Penjualan ' + product.fields.name,
          reference: stockData.referenceNo,
          totalAmount: costAmount,
          entries: cogsEntries
        });
      }
    }

    return {
      success: true,
      message: 'Stok berhasil dikurangi',
      inventoryId: inventoryId,
      newStock: newStock
    };
  } catch (error) {
    Logger.log('Error creating stock out: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Penyesuaian stok (stock adjustment)
 */
function createStockAdjustment(stockData) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa melakukan penyesuaian stok' };
  }

  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, message: 'User tidak terautentikasi' };
  }

  try {
    const firestore = getFirestore();

    // Get current product
    const product = firestore.getDocument('products/' + stockData.productId);
    const currentStock = product.fields.stock || 0;
    const newStock = stockData.newStock;
    const difference = newStock - currentStock;

    // Create inventory record
    const inventoryId = Utilities.getUuid();
    const newInventory = {
      companyId: companyId,
      productId: stockData.productId,
      transactionDate: new Date(stockData.transactionDate || new Date()),
      transactionType: 'adjustment',
      referenceNo: stockData.referenceNo || 'ADJ-' + new Date().getTime(),
      quantity: Math.abs(difference),
      unitPrice: product.fields.purchasePrice || 0,
      totalPrice: Math.abs(difference) * (product.fields.purchasePrice || 0),
      stockBefore: currentStock,
      stockAfter: newStock,
      description: stockData.description || 'Penyesuaian stok',
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    firestore.createDocument('inventory/' + inventoryId, newInventory);

    // Update product stock
    updateProductStock(stockData.productId, newStock);

    return {
      success: true,
      message: 'Penyesuaian stok berhasil',
      inventoryId: inventoryId,
      newStock: newStock,
      difference: difference
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== INVENTORY REPORTS ====================

/**
 * Mendapatkan kartu stok produk
 */
function getStockCard(productId, startDate, endDate) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    // Get product info
    const product = firestore.getDocument('products/' + productId);

    // Get inventory transactions
    let query = firestore.query('inventory')
      .where('companyId', '==', companyId)
      .where('productId', '==', productId);

    if (startDate) {
      query = query.where('transactionDate', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('transactionDate', '<=', new Date(endDate));
    }

    const transactions = query.execute();

    const stockCard = transactions.map(trans => ({
      date: trans.fields.transactionDate,
      referenceNo: trans.fields.referenceNo,
      description: trans.fields.description,
      type: trans.fields.transactionType,
      quantity: trans.fields.quantity,
      unitPrice: trans.fields.unitPrice,
      totalPrice: trans.fields.totalPrice,
      stockBefore: trans.fields.stockBefore,
      stockAfter: trans.fields.stockAfter
    }));

    return {
      success: true,
      data: {
        product: {
          code: product.fields.code,
          name: product.fields.name,
          unit: product.fields.unit,
          currentStock: product.fields.stock
        },
        transactions: stockCard
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan laporan stok semua produk
 */
function getStockReport() {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    const products = firestore.query('products')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .execute();

    const stockReport = products.map(product => {
      const stock = product.fields.stock || 0;
      const minStock = product.fields.minStock || 0;
      const purchasePrice = product.fields.purchasePrice || 0;
      const stockValue = stock * purchasePrice;

      return {
        code: product.fields.code,
        name: product.fields.name,
        unit: product.fields.unit,
        stock: stock,
        minStock: minStock,
        status: stock <= minStock ? 'Low Stock' : 'Normal',
        purchasePrice: purchasePrice,
        sellingPrice: product.fields.sellingPrice || 0,
        stockValue: stockValue
      };
    });

    const totalStockValue = stockReport.reduce((sum, item) => sum + item.stockValue, 0);

    return {
      success: true,
      data: {
        products: stockReport,
        totalStockValue: totalStockValue
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan produk dengan stok rendah
 */
function getLowStockProducts() {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    const products = firestore.query('products')
      .where('companyId', '==', companyId)
      .where('isActive', '==', true)
      .execute();

    const lowStockProducts = products.filter(product => {
      const stock = product.fields.stock || 0;
      const minStock = product.fields.minStock || 0;
      return stock <= minStock;
    }).map(product => ({
      code: product.fields.code,
      name: product.fields.name,
      unit: product.fields.unit,
      stock: product.fields.stock || 0,
      minStock: product.fields.minStock || 0
    }));

    return {
      success: true,
      data: lowStockProducts
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
