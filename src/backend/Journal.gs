/**
 * Journal Management
 * Mengelola jurnal transaksi: Penerimaan, Pengeluaran, Modal, dan Jurnal Umum
 */

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate nomor jurnal
 */
function generateJournalNo(type) {
  const companyId = getCurrentCompanyId();
  const firestore = getFirestore();
  const year = new Date().getFullYear();

  const prefix = type === 'receipt' ? 'RCP' :
                 type === 'expense' ? 'EXP' :
                 type === 'capital' ? 'CAP' : 'JRN';

  const count = firestore.query('journals')
    .where('companyId', '==', companyId)
    .where('journalType', '==', type)
    .execute().length;

  return prefix + '-' + year + '-' + String(count + 1).padStart(4, '0');
}

/**
 * Validasi jurnal (debit harus sama dengan kredit)
 */
function validateJournalEntries(entries) {
  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach(entry => {
    totalDebit += entry.debit || 0;
    totalCredit += entry.credit || 0;
  });

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      valid: false,
      message: 'Total debit dan kredit harus sama. Debit: ' + totalDebit + ', Kredit: ' + totalCredit
    };
  }

  return { valid: true };
}

/**
 * Update saldo akun
 */
function updateAccountBalance(accountId, amount, type) {
  try {
    const firestore = getFirestore();
    const account = firestore.getDocument('accounts/' + accountId);
    const currentBalance = account.fields.balance || 0;
    const normalBalance = account.fields.normalBalance;

    let newBalance = currentBalance;

    // Jika normal balance = debit, debit menambah, credit mengurangi
    // Jika normal balance = credit, credit menambah, debit mengurangi
    if (normalBalance === 'debit') {
      newBalance = type === 'debit' ? currentBalance + amount : currentBalance - amount;
    } else {
      newBalance = type === 'credit' ? currentBalance + amount : currentBalance - amount;
    }

    firestore.updateDocument('accounts/' + accountId, {
      balance: newBalance,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== JOURNAL CRUD ====================

/**
 * Mendapatkan semua jurnal
 */
function getJournals(filters) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    let query = firestore.query('journals').where('companyId', '==', companyId);

    if (filters) {
      if (filters.type) {
        query = query.where('journalType', '==', filters.type);
      }
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      }
      if (filters.startDate) {
        query = query.where('transactionDate', '>=', new Date(filters.startDate));
      }
      if (filters.endDate) {
        query = query.where('transactionDate', '<=', new Date(filters.endDate));
      }
    }

    const journals = query.execute();
    return { success: true, data: journals.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields })) };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan jurnal berdasarkan ID beserta entries-nya
 */
function getJournalById(journalId) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();
    const journal = firestore.getDocument('journals/' + journalId);

    // Get entries
    const entries = firestore.query('journals/' + journalId + '/entries').execute();

    return {
      success: true,
      data: {
        id: journalId,
        ...journal.fields,
        entries: entries.map(doc => ({ id: doc.name.split('/').pop(), ...doc.fields }))
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Membuat jurnal baru (draft)
 */
function createJournal(journalData) {
  if (!canAccessFeature('journal_' + journalData.type)) {
    return { success: false, message: 'Anda tidak memiliki akses untuk membuat jurnal ini' };
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

    // Validasi entries
    const validation = validateJournalEntries(journalData.entries);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const journalId = Utilities.getUuid();
    const journalNo = generateJournalNo(journalData.type);

    const newJournal = {
      companyId: companyId,
      journalNo: journalNo,
      journalType: journalData.type,
      transactionDate: new Date(journalData.transactionDate),
      description: journalData.description || '',
      reference: journalData.reference || '',
      totalAmount: journalData.totalAmount || 0,
      status: 'draft',
      createdBy: currentUser.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    firestore.createDocument('journals/' + journalId, newJournal);

    // Create entries
    journalData.entries.forEach((entry, index) => {
      const entryId = Utilities.getUuid();
      const newEntry = {
        accountId: entry.accountId,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        description: entry.description || '',
        debit: entry.debit || 0,
        credit: entry.credit || 0,
        customerId: entry.customerId || '',
        supplierId: entry.supplierId || '',
        productId: entry.productId || ''
      };
      firestore.createDocument('journals/' + journalId + '/entries/' + entryId, newEntry);
    });

    return { success: true, message: 'Jurnal berhasil dibuat', journalId: journalId, journalNo: journalNo };
  } catch (error) {
    Logger.log('Error creating journal: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Update jurnal (hanya jika masih draft)
 */
function updateJournal(journalId, journalData) {
  try {
    const firestore = getFirestore();
    const journal = firestore.getDocument('journals/' + journalId);

    if (journal.fields.status !== 'draft') {
      return { success: false, message: 'Jurnal yang sudah di-post tidak bisa diubah' };
    }

    // Validasi entries jika ada
    if (journalData.entries) {
      const validation = validateJournalEntries(journalData.entries);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      // Delete old entries
      const oldEntries = firestore.query('journals/' + journalId + '/entries').execute();
      oldEntries.forEach(entry => {
        firestore.deleteDocument(entry.name);
      });

      // Create new entries
      journalData.entries.forEach(entry => {
        const entryId = Utilities.getUuid();
        const newEntry = {
          accountId: entry.accountId,
          accountCode: entry.accountCode,
          accountName: entry.accountName,
          description: entry.description || '',
          debit: entry.debit || 0,
          credit: entry.credit || 0,
          customerId: entry.customerId || '',
          supplierId: entry.supplierId || '',
          productId: entry.productId || ''
        };
        firestore.createDocument('journals/' + journalId + '/entries/' + entryId, newEntry);
      });
    }

    // Update journal
    const updateData = {
      transactionDate: journalData.transactionDate ? new Date(journalData.transactionDate) : journal.fields.transactionDate,
      description: journalData.description || journal.fields.description,
      reference: journalData.reference || journal.fields.reference,
      totalAmount: journalData.totalAmount || journal.fields.totalAmount,
      updatedAt: new Date()
    };

    firestore.updateDocument('journals/' + journalId, updateData);

    return { success: true, message: 'Jurnal berhasil diubah' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Post jurnal (mengubah status dari draft ke posted dan update saldo akun)
 */
function postJournal(journalId) {
  try {
    const firestore = getFirestore();
    const journal = firestore.getDocument('journals/' + journalId);

    if (journal.fields.status !== 'draft') {
      return { success: false, message: 'Jurnal sudah di-post atau void' };
    }

    // Get entries
    const entries = firestore.query('journals/' + journalId + '/entries').execute();

    // Update saldo akun untuk setiap entry
    entries.forEach(entry => {
      if (entry.fields.debit > 0) {
        updateAccountBalance(entry.fields.accountId, entry.fields.debit, 'debit');
      }
      if (entry.fields.credit > 0) {
        updateAccountBalance(entry.fields.accountId, entry.fields.credit, 'credit');
      }
    });

    // Update status jurnal
    firestore.updateDocument('journals/' + journalId, {
      status: 'posted',
      postedAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, message: 'Jurnal berhasil di-post' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Void jurnal (membatalkan jurnal yang sudah di-post)
 */
function voidJournal(journalId) {
  if (!hasRole('admin')) {
    return { success: false, message: 'Hanya admin yang bisa void jurnal' };
  }

  try {
    const firestore = getFirestore();
    const journal = firestore.getDocument('journals/' + journalId);

    if (journal.fields.status !== 'posted') {
      return { success: false, message: 'Hanya jurnal yang sudah di-post yang bisa di-void' };
    }

    // Get entries
    const entries = firestore.query('journals/' + journalId + '/entries').execute();

    // Reverse saldo akun untuk setiap entry
    entries.forEach(entry => {
      if (entry.fields.debit > 0) {
        // Reverse: debit dikurangi
        updateAccountBalance(entry.fields.accountId, entry.fields.debit, 'credit');
      }
      if (entry.fields.credit > 0) {
        // Reverse: credit dikurangi
        updateAccountBalance(entry.fields.accountId, entry.fields.credit, 'debit');
      }
    });

    // Update status jurnal
    firestore.updateDocument('journals/' + journalId, {
      status: 'void',
      voidedAt: new Date(),
      updatedAt: new Date()
    });

    return { success: true, message: 'Jurnal berhasil di-void' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== QUICK TRANSACTIONS ====================

/**
 * Membuat transaksi penerimaan (kas/bank bertambah)
 */
function createReceiptTransaction(transactionData) {
  const entries = [
    {
      accountId: transactionData.accountId, // Kas/Bank (debit)
      accountCode: transactionData.accountCode,
      accountName: transactionData.accountName,
      description: transactionData.description,
      debit: transactionData.amount,
      credit: 0
    },
    {
      accountId: transactionData.revenueAccountId, // Pendapatan (credit)
      accountCode: transactionData.revenueAccountCode,
      accountName: transactionData.revenueAccountName,
      description: transactionData.description,
      debit: 0,
      credit: transactionData.amount,
      customerId: transactionData.customerId || ''
    }
  ];

  return createJournal({
    type: 'receipt',
    transactionDate: transactionData.transactionDate,
    description: transactionData.description,
    reference: transactionData.reference,
    totalAmount: transactionData.amount,
    entries: entries
  });
}

/**
 * Membuat transaksi pengeluaran (kas/bank berkurang)
 */
function createExpenseTransaction(transactionData) {
  const entries = [
    {
      accountId: transactionData.expenseAccountId, // Beban (debit)
      accountCode: transactionData.expenseAccountCode,
      accountName: transactionData.expenseAccountName,
      description: transactionData.description,
      debit: transactionData.amount,
      credit: 0,
      supplierId: transactionData.supplierId || ''
    },
    {
      accountId: transactionData.accountId, // Kas/Bank (credit)
      accountCode: transactionData.accountCode,
      accountName: transactionData.accountName,
      description: transactionData.description,
      debit: 0,
      credit: transactionData.amount
    }
  ];

  return createJournal({
    type: 'expense',
    transactionDate: transactionData.transactionDate,
    description: transactionData.description,
    reference: transactionData.reference,
    totalAmount: transactionData.amount,
    entries: entries
  });
}

/**
 * Membuat transaksi modal (investasi)
 */
function createCapitalInvestment(transactionData) {
  const entries = [
    {
      accountId: transactionData.accountId, // Kas/Bank (debit)
      accountCode: transactionData.accountCode,
      accountName: transactionData.accountName,
      description: transactionData.description,
      debit: transactionData.amount,
      credit: 0
    },
    {
      accountId: transactionData.capitalAccountId, // Modal Pemilik (credit)
      accountCode: transactionData.capitalAccountCode,
      accountName: transactionData.capitalAccountName,
      description: transactionData.description,
      debit: 0,
      credit: transactionData.amount
    }
  ];

  return createJournal({
    type: 'capital',
    transactionDate: transactionData.transactionDate,
    description: transactionData.description,
    reference: transactionData.reference,
    totalAmount: transactionData.amount,
    entries: entries
  });
}

/**
 * Membuat transaksi penarikan modal (prive)
 */
function createCapitalWithdrawal(transactionData) {
  const entries = [
    {
      accountId: transactionData.priveAccountId, // Prive (debit)
      accountCode: transactionData.priveAccountCode,
      accountName: transactionData.priveAccountName,
      description: transactionData.description,
      debit: transactionData.amount,
      credit: 0
    },
    {
      accountId: transactionData.accountId, // Kas/Bank (credit)
      accountCode: transactionData.accountCode,
      accountName: transactionData.accountName,
      description: transactionData.description,
      debit: 0,
      credit: transactionData.amount
    }
  ];

  return createJournal({
    type: 'capital',
    transactionDate: transactionData.transactionDate,
    description: transactionData.description,
    reference: transactionData.reference,
    totalAmount: transactionData.amount,
    entries: entries
  });
}
