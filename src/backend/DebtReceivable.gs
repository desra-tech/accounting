/**
 * Debt and Receivable Management
 * Mengelola piutang dan utang usaha
 */

// ==================== RECEIVABLES (PIUTANG) ====================

/**
 * Membuat piutang baru
 */
function createReceivable(receivableData) {
  if (!canAccessFeature('receivables_view')) {
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

    // Generate receivable number
    const year = new Date().getFullYear();
    const count = firestore.query('receivables').where('companyId', '==', companyId).execute().length;
    const receivableNo = 'AR-' + year + '-' + String(count + 1).padStart(4, '0');

    const receivableId = Utilities.getUuid();
    const newReceivable = {
      companyId: companyId,
      receivableNo: receivableNo,
      customerId: receivableData.customerId,
      customerName: receivableData.customerName,
      transactionDate: new Date(receivableData.transactionDate),
      dueDate: new Date(receivableData.dueDate),
      amount: receivableData.amount,
      paid: 0,
      balance: receivableData.amount,
      status: 'unpaid',
      description: receivableData.description || '',
      invoiceNo: receivableData.invoiceNo || '',
      journalId: '',
      createdBy: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('receivables/' + receivableId, newReceivable);

    // Create journal entry
    const entries = [
      {
        accountId: '1103', // Piutang Usaha
        accountCode: '1-1003',
        accountName: 'Piutang Usaha',
        description: receivableData.description || 'Piutang ' + receivableData.customerName,
        debit: receivableData.amount,
        credit: 0,
        customerId: receivableData.customerId
      },
      {
        accountId: '4101', // Pendapatan Penjualan
        accountCode: '4-0001',
        accountName: 'Pendapatan Penjualan',
        description: receivableData.description || 'Piutang ' + receivableData.customerName,
        debit: 0,
        credit: receivableData.amount,
        customerId: receivableData.customerId
      }
    ];

    const journalResult = createJournal({
      type: 'general',
      transactionDate: receivableData.transactionDate,
      description: 'Piutang ' + receivableData.customerName + ' - ' + receivableNo,
      reference: receivableData.invoiceNo || receivableNo,
      totalAmount: receivableData.amount,
      entries: entries
    });

    if (journalResult.success) {
      // Update receivable with journalId
      firestore.updateDocument('receivables/' + receivableId, {
        journalId: journalResult.journalId
      });

      // Post journal automatically
      postJournal(journalResult.journalId);
    }

    // Update customer balance
    updateCustomerBalance(receivableData.customerId, receivableData.amount);

    return {
      success: true,
      message: 'Piutang berhasil dibuat',
      receivableId: receivableId,
      receivableNo: receivableNo
    };
  } catch (error) {
    Logger.log('Error creating receivable: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mencatat pembayaran piutang
 */
function createReceivablePayment(paymentData) {
  if (!canAccessFeature('receivables_view')) {
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

    // Get receivable
    const receivable = firestore.getDocument('receivables/' + paymentData.receivableId);
    const currentBalance = receivable.fields.balance || 0;

    if (paymentData.amount > currentBalance) {
      return { success: false, message: 'Jumlah pembayaran melebihi sisa piutang' };
    }

    // Generate payment number
    const year = new Date().getFullYear();
    const count = firestore.query('payments').where('companyId', '==', companyId).execute().length;
    const paymentNo = 'PMT-' + year + '-' + String(count + 1).padStart(4, '0');

    const paymentId = Utilities.getUuid();
    const newPayment = {
      companyId: companyId,
      paymentNo: paymentNo,
      type: 'receivable',
      paymentDate: new Date(paymentData.paymentDate),
      referenceId: paymentData.receivableId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || 'cash',
      accountId: paymentData.accountId || '1101',
      description: paymentData.description || 'Pembayaran piutang ' + receivable.fields.customerName,
      journalId: '',
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    firestore.createDocument('payments/' + paymentId, newPayment);

    // Update receivable
    const newPaid = (receivable.fields.paid || 0) + paymentData.amount;
    const newBalance = currentBalance - paymentData.amount;
    const newStatus = newBalance === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    firestore.updateDocument('receivables/' + paymentData.receivableId, {
      paid: newPaid,
      balance: newBalance,
      status: newStatus,
      updatedAt: new Date()
    });

    // Create journal entry
    const entries = [
      {
        accountId: paymentData.accountId || '1101', // Kas/Bank
        accountCode: paymentData.accountCode || '1-1001',
        accountName: paymentData.accountName || 'Kas',
        description: 'Pembayaran piutang ' + receivable.fields.customerName,
        debit: paymentData.amount,
        credit: 0
      },
      {
        accountId: '1103', // Piutang Usaha
        accountCode: '1-1003',
        accountName: 'Piutang Usaha',
        description: 'Pembayaran piutang ' + receivable.fields.customerName,
        debit: 0,
        credit: paymentData.amount,
        customerId: receivable.fields.customerId
      }
    ];

    const journalResult = createJournal({
      type: 'receipt',
      transactionDate: paymentData.paymentDate,
      description: 'Pembayaran piutang ' + receivable.fields.customerName + ' - ' + receivable.fields.receivableNo,
      reference: paymentNo,
      totalAmount: paymentData.amount,
      entries: entries
    });

    if (journalResult.success) {
      // Update payment with journalId
      firestore.updateDocument('payments/' + paymentId, {
        journalId: journalResult.journalId
      });

      // Post journal automatically
      postJournal(journalResult.journalId);
    }

    // Update customer balance
    updateCustomerBalance(receivable.fields.customerId, -paymentData.amount);

    return {
      success: true,
      message: 'Pembayaran piutang berhasil dicatat',
      paymentId: paymentId,
      paymentNo: paymentNo
    };
  } catch (error) {
    Logger.log('Error creating receivable payment: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan semua piutang
 */
function getReceivables(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('receivables').where('companyId', '==', companyId);

    if (filters) {
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.customerId) {
        query = query.where('customerId', '==', filters.customerId);
      }
    }

    const receivables = query.execute();
    return { success: true, data: receivables.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== PAYABLES (UTANG) ====================

/**
 * Membuat utang baru
 */
function createPayable(payableData) {
  if (!canAccessFeature('payables_view')) {
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

    // Generate payable number
    const year = new Date().getFullYear();
    const count = firestore.query('payables').where('companyId', '==', companyId).execute().length;
    const payableNo = 'AP-' + year + '-' + String(count + 1).padStart(4, '0');

    const payableId = Utilities.getUuid();
    const newPayable = {
      companyId: companyId,
      payableNo: payableNo,
      supplierId: payableData.supplierId,
      supplierName: payableData.supplierName,
      transactionDate: new Date(payableData.transactionDate),
      dueDate: new Date(payableData.dueDate),
      amount: payableData.amount,
      paid: 0,
      balance: payableData.amount,
      status: 'unpaid',
      description: payableData.description || '',
      invoiceNo: payableData.invoiceNo || '',
      journalId: '',
      createdBy: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('payables/' + payableId, newPayable);

    // Create journal entry
    const entries = [
      {
        accountId: payableData.expenseAccountId || '5101', // Pembelian/Beban
        accountCode: payableData.expenseAccountCode || '5-0001',
        accountName: payableData.expenseAccountName || 'Pembelian Barang Dagangan',
        description: payableData.description || 'Utang ' + payableData.supplierName,
        debit: payableData.amount,
        credit: 0,
        supplierId: payableData.supplierId
      },
      {
        accountId: '2101', // Utang Usaha
        accountCode: '2-1001',
        accountName: 'Utang Usaha',
        description: payableData.description || 'Utang ' + payableData.supplierName,
        debit: 0,
        credit: payableData.amount,
        supplierId: payableData.supplierId
      }
    ];

    const journalResult = createJournal({
      type: 'general',
      transactionDate: payableData.transactionDate,
      description: 'Utang ' + payableData.supplierName + ' - ' + payableNo,
      reference: payableData.invoiceNo || payableNo,
      totalAmount: payableData.amount,
      entries: entries
    });

    if (journalResult.success) {
      // Update payable with journalId
      firestore.updateDocument('payables/' + payableId, {
        journalId: journalResult.journalId
      });

      // Post journal automatically
      postJournal(journalResult.journalId);
    }

    // Update supplier balance
    updateSupplierBalance(payableData.supplierId, payableData.amount);

    return {
      success: true,
      message: 'Utang berhasil dibuat',
      payableId: payableId,
      payableNo: payableNo
    };
  } catch (error) {
    Logger.log('Error creating payable: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mencatat pembayaran utang
 */
function createPayablePayment(paymentData) {
  if (!canAccessFeature('payables_view')) {
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

    // Get payable
    const payable = firestore.getDocument('payables/' + paymentData.payableId);
    const currentBalance = payable.fields.balance || 0;

    if (paymentData.amount > currentBalance) {
      return { success: false, message: 'Jumlah pembayaran melebihi sisa utang' };
    }

    // Generate payment number
    const year = new Date().getFullYear();
    const count = firestore.query('payments').where('companyId', '==', companyId).execute().length;
    const paymentNo = 'PMT-' + year + '-' + String(count + 1).padStart(4, '0');

    const paymentId = Utilities.getUuid();
    const newPayment = {
      companyId: companyId,
      paymentNo: paymentNo,
      type: 'payable',
      paymentDate: new Date(paymentData.paymentDate),
      referenceId: paymentData.payableId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || 'cash',
      accountId: paymentData.accountId || '1101',
      description: paymentData.description || 'Pembayaran utang ' + payable.fields.supplierName,
      journalId: '',
      createdBy: currentUser.uid,
      createdAt: new Date()
    };

    firestore.createDocument('payments/' + paymentId, newPayment);

    // Update payable
    const newPaid = (payable.fields.paid || 0) + paymentData.amount;
    const newBalance = currentBalance - paymentData.amount;
    const newStatus = newBalance === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    firestore.updateDocument('payables/' + paymentData.payableId, {
      paid: newPaid,
      balance: newBalance,
      status: newStatus,
      updatedAt: new Date()
    });

    // Create journal entry
    const entries = [
      {
        accountId: '2101', // Utang Usaha
        accountCode: '2-1001',
        accountName: 'Utang Usaha',
        description: 'Pembayaran utang ' + payable.fields.supplierName,
        debit: paymentData.amount,
        credit: 0,
        supplierId: payable.fields.supplierId
      },
      {
        accountId: paymentData.accountId || '1101', // Kas/Bank
        accountCode: paymentData.accountCode || '1-1001',
        accountName: paymentData.accountName || 'Kas',
        description: 'Pembayaran utang ' + payable.fields.supplierName,
        debit: 0,
        credit: paymentData.amount
      }
    ];

    const journalResult = createJournal({
      type: 'expense',
      transactionDate: paymentData.paymentDate,
      description: 'Pembayaran utang ' + payable.fields.supplierName + ' - ' + payable.fields.payableNo,
      reference: paymentNo,
      totalAmount: paymentData.amount,
      entries: entries
    });

    if (journalResult.success) {
      // Update payment with journalId
      firestore.updateDocument('payments/' + paymentId, {
        journalId: journalResult.journalId
      });

      // Post journal automatically
      postJournal(journalResult.journalId);
    }

    // Update supplier balance
    updateSupplierBalance(payable.fields.supplierId, -paymentData.amount);

    return {
      success: true,
      message: 'Pembayaran utang berhasil dicatat',
      paymentId: paymentId,
      paymentNo: paymentNo
    };
  } catch (error) {
    Logger.log('Error creating payable payment: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan semua utang
 */
function getPayables(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('payables').where('companyId', '==', companyId);

    if (filters) {
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.supplierId) {
        query = query.where('supplierId', '==', filters.supplierId);
      }
    }

    const payables = query.execute();
    return { success: true, data: payables.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Update customer balance
 */
function updateCustomerBalance(customerId, amount) {
  try {
    const firestore = getFirestore();
    const customer = firestore.getDocument('customers/' + customerId);
    const currentBalance = customer.fields.balance || 0;
    const newBalance = currentBalance + amount;

    firestore.updateDocument('customers/' + customerId, {
      balance: newBalance,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Update supplier balance
 */
function updateSupplierBalance(supplierId, amount) {
  try {
    const firestore = getFirestore();
    const supplier = firestore.getDocument('suppliers/' + supplierId);
    const currentBalance = supplier.fields.balance || 0;
    const newBalance = currentBalance + amount;

    firestore.updateDocument('suppliers/' + supplierId, {
      balance: newBalance,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan aging piutang
 */
function getReceivableAging() {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const receivables = firestore.query('receivables')
      .where('companyId', '==', companyId)
      .where('status', 'in', ['unpaid', 'partial'])
      .execute();

    const today = new Date();
    const aging = {
      current: [],
      overdue1_30: [],
      overdue31_60: [],
      overdue61_90: [],
      overdue90plus: []
    };

    receivables.forEach(receivable => {
      const dueDate = new Date(receivable.fields.dueDate);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

      const data = {
        receivableNo: receivable.fields.receivableNo,
        customerName: receivable.fields.customerName,
        amount: receivable.fields.amount,
        balance: receivable.fields.balance,
        dueDate: receivable.fields.dueDate,
        daysOverdue: daysOverdue
      };

      if (daysOverdue < 0) {
        aging.current.push(data);
      } else if (daysOverdue <= 30) {
        aging.overdue1_30.push(data);
      } else if (daysOverdue <= 60) {
        aging.overdue31_60.push(data);
      } else if (daysOverdue <= 90) {
        aging.overdue61_90.push(data);
      } else {
        aging.overdue90plus.push(data);
      }
    });

    return { success: true, data: aging };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
