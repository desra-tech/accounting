/**
 * Financial Reports
 * Menghasilkan laporan keuangan: Laba Rugi, Neraca, Arus Kas
 */

// ==================== LAPORAN LABA RUGI ====================

/**
 * Membuat Laporan Laba Rugi
 */
function generateIncomeStatement(startDate, endDate) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    // Get all accounts dengan category revenue, cogs, expense, other
    const accounts = firestore.query('accounts')
      .where('companyId', '==', companyId)
      .where('type', '==', 'detail')
      .execute();

    // Group by category
    const revenue = [];
    const cogs = [];
    const expense = [];
    const otherIncome = [];
    const otherExpense = [];

    accounts.forEach(account => {
      const data = {
        id: account.name.split('/').pop(),
        code: account.fields.code,
        name: account.fields.name,
        balance: account.fields.balance || 0,
        normalBalance: account.fields.normalBalance
      };

      if (account.fields.category === 'revenue') {
        revenue.push(data);
      } else if (account.fields.category === 'cogs') {
        cogs.push(data);
      } else if (account.fields.category === 'expense') {
        expense.push(data);
      } else if (account.fields.category === 'other') {
        if (account.fields.normalBalance === 'credit') {
          otherIncome.push(data);
        } else {
          otherExpense.push(data);
        }
      }
    });

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalCOGS = cogs.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const grossProfit = totalRevenue - totalCOGS;

    const totalExpense = expense.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const operatingProfit = grossProfit - totalExpense;

    const totalOtherIncome = otherIncome.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalOtherExpense = otherExpense.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const netProfit = operatingProfit + totalOtherIncome - totalOtherExpense;

    return {
      success: true,
      data: {
        period: {
          startDate: startDate,
          endDate: endDate
        },
        revenue: revenue,
        totalRevenue: totalRevenue,
        cogs: cogs,
        totalCOGS: totalCOGS,
        grossProfit: grossProfit,
        expenses: expense,
        totalExpense: totalExpense,
        operatingProfit: operatingProfit,
        otherIncome: otherIncome,
        totalOtherIncome: totalOtherIncome,
        otherExpense: otherExpense,
        totalOtherExpense: totalOtherExpense,
        netProfit: netProfit
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== LAPORAN POSISI KEUANGAN (NERACA) ====================

/**
 * Membuat Laporan Posisi Keuangan (Neraca)
 */
function generateBalanceSheet(asOfDate) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    // Get all accounts dengan category asset, liability, equity
    const accounts = firestore.query('accounts')
      .where('companyId', '==', companyId)
      .where('type', '==', 'detail')
      .execute();

    // Group by category
    const assets = [];
    const liabilities = [];
    const equity = [];

    accounts.forEach(account => {
      const data = {
        id: account.name.split('/').pop(),
        code: account.fields.code,
        name: account.fields.name,
        balance: account.fields.balance || 0,
        normalBalance: account.fields.normalBalance
      };

      if (account.fields.category === 'asset') {
        assets.push(data);
      } else if (account.fields.category === 'liability') {
        liabilities.push(data);
      } else if (account.fields.category === 'equity') {
        equity.push(data);
      }
    });

    // Calculate totals
    const totalAssets = assets.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return {
      success: true,
      data: {
        asOfDate: asOfDate,
        assets: assets,
        totalAssets: totalAssets,
        liabilities: liabilities,
        totalLiabilities: totalLiabilities,
        equity: equity,
        totalEquity: totalEquity,
        totalLiabilitiesEquity: totalLiabilities + totalEquity
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ==================== LAPORAN ARUS KAS ====================

/**
 * Membuat Laporan Arus Kas
 */
function generateCashFlowStatement(startDate, endDate) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    // Get all journals in period
    const journals = firestore.query('journals')
      .where('companyId', '==', companyId)
      .where('status', '==', 'posted')
      .where('transactionDate', '>=', new Date(startDate))
      .where('transactionDate', '<=', new Date(endDate))
      .execute();

    // Initialize cash flow categories
    const operating = [];
    const investing = [];
    const financing = [];

    // Get cash/bank account IDs
    const cashAccounts = firestore.query('accounts')
      .where('companyId', '==', companyId)
      .where('code', 'in', ['1-1001', '1-1002']) // Kas dan Bank
      .execute();

    const cashAccountIds = cashAccounts.map(acc => acc.name.split('/').pop());

    // Process each journal
    journals.forEach(journal => {
      const journalId = journal.name.split('/').pop();
      const entries = firestore.query('journals/' + journalId + '/entries').execute();

      entries.forEach(entry => {
        const accountId = entry.fields.accountId;

        // Hanya proses entry yang melibatkan kas/bank
        if (cashAccountIds.includes(accountId)) {
          const amount = (entry.fields.debit || 0) - (entry.fields.credit || 0);
          const description = entry.fields.description || journal.fields.description;

          // Classify based on journal type
          if (journal.fields.journalType === 'receipt' || journal.fields.journalType === 'expense') {
            operating.push({
              date: journal.fields.transactionDate,
              description: description,
              amount: amount
            });
          } else if (journal.fields.journalType === 'capital') {
            financing.push({
              date: journal.fields.transactionDate,
              description: description,
              amount: amount
            });
          } else {
            // General journal - classify based on contra account
            // Ini bisa lebih kompleks tergantung kebutuhan
            operating.push({
              date: journal.fields.transactionDate,
              description: description,
              amount: amount
            });
          }
        }
      });
    });

    // Calculate totals
    const totalOperating = operating.reduce((sum, item) => sum + item.amount, 0);
    const totalInvesting = investing.reduce((sum, item) => sum + item.amount, 0);
    const totalFinancing = financing.reduce((sum, item) => sum + item.amount, 0);
    const netCashFlow = totalOperating + totalInvesting + totalFinancing;

    // Get beginning cash balance
    const beginningCash = getCashBalance(new Date(startDate).getTime() - 1);
    const endingCash = beginningCash + netCashFlow;

    return {
      success: true,
      data: {
        period: {
          startDate: startDate,
          endDate: endDate
        },
        beginningCash: beginningCash,
        operating: operating,
        totalOperating: totalOperating,
        investing: investing,
        totalInvesting: totalInvesting,
        financing: financing,
        totalFinancing: totalFinancing,
        netCashFlow: netCashFlow,
        endingCash: endingCash
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get cash balance at specific date
 */
function getCashBalance(date) {
  const companyId = getCurrentCompanyId();
  const firestore = getFirestore();

  const cashAccounts = firestore.query('accounts')
    .where('companyId', '==', companyId)
    .where('code', 'in', ['1-1001', '1-1002'])
    .execute();

  // Untuk implementasi yang lebih akurat, hitung dari semua transaksi sampai tanggal tersebut
  // Saat ini kita ambil saldo current saja (perlu disesuaikan dengan kebutuhan)
  return cashAccounts.reduce((sum, acc) => sum + (acc.fields.balance || 0), 0);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Mendapatkan trial balance
 */
function getTrialBalance() {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    const accounts = firestore.query('accounts')
      .where('companyId', '==', companyId)
      .where('type', '==', 'detail')
      .execute();

    let totalDebit = 0;
    let totalCredit = 0;

    const data = accounts.map(account => {
      const balance = account.fields.balance || 0;
      const normalBalance = account.fields.normalBalance;

      let debit = 0;
      let credit = 0;

      if (normalBalance === 'debit') {
        debit = balance;
        totalDebit += balance;
      } else {
        credit = balance;
        totalCredit += balance;
      }

      return {
        code: account.fields.code,
        name: account.fields.name,
        debit: debit,
        credit: credit
      };
    });

    return {
      success: true,
      data: {
        accounts: data,
        totalDebit: totalDebit,
        totalCredit: totalCredit,
        balanced: Math.abs(totalDebit - totalCredit) < 0.01
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Mendapatkan general ledger untuk akun tertentu
 */
function getGeneralLedger(accountId, startDate, endDate) {
  const companyId = getCurrentCompanyId();
  if (!companyId) {
    return { success: false, message: 'Company ID tidak ditemukan' };
  }

  try {
    const firestore = getFirestore();

    // Get account info
    const account = firestore.getDocument('accounts/' + accountId);

    // Get all journal entries for this account
    const journals = firestore.query('journals')
      .where('companyId', '==', companyId)
      .where('status', '==', 'posted')
      .where('transactionDate', '>=', new Date(startDate))
      .where('transactionDate', '<=', new Date(endDate))
      .execute();

    const entries = [];
    let balance = 0;

    journals.forEach(journal => {
      const journalId = journal.name.split('/').pop();
      const journalEntries = firestore.query('journals/' + journalId + '/entries')
        .where('accountId', '==', accountId)
        .execute();

      journalEntries.forEach(entry => {
        const debit = entry.fields.debit || 0;
        const credit = entry.fields.credit || 0;

        // Calculate running balance
        if (account.fields.normalBalance === 'debit') {
          balance += debit - credit;
        } else {
          balance += credit - debit;
        }

        entries.push({
          date: journal.fields.transactionDate,
          journalNo: journal.fields.journalNo,
          description: entry.fields.description || journal.fields.description,
          debit: debit,
          credit: credit,
          balance: balance
        });
      });
    });

    return {
      success: true,
      data: {
        account: {
          code: account.fields.code,
          name: account.fields.name
        },
        period: {
          startDate: startDate,
          endDate: endDate
        },
        entries: entries,
        endingBalance: balance
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}
