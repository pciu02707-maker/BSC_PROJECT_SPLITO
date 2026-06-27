/**
 * SPLITO BALANCE ENGINE — Multi-Payer Edition
 * Each expense can have multiple payers (each paid a portion)
 */

function calculateBalances(expenses) {
  const balances = {};

  expenses.forEach((expense) => {
    const amount = expense.amount;

    // Credit EACH payer their paid amount
    expense.paidBy.forEach((p) => {
      const pid = (p.user?._id || p.user).toString();
      if (!(pid in balances)) balances[pid] = 0;
      balances[pid] += p.amount;
    });

    // Debit each participant their share
    if (expense.splitType === 'equal') {
      const share = amount / expense.participants.length;
      expense.participants.forEach((p) => {
        const pid = (p.user?._id || p.user).toString();
        if (!(pid in balances)) balances[pid] = 0;
        balances[pid] -= share;
      });
    } else {
      expense.participants.forEach((p) => {
        const pid = (p.user?._id || p.user).toString();
        if (!(pid in balances)) balances[pid] = 0;
        balances[pid] -= p.share || 0;
      });
    }
  });

  Object.keys(balances).forEach((k) => {
    balances[k] = Math.round(balances[k] * 100) / 100;
  });
  return balances;
}

function optimizeSettlements(balances, users) {
  const userMap = {};
  users.forEach((u) => {
    const id = (u._id || u).toString();
    userMap[id] = u.name || 'Unknown';
  });

  const creditors = [];
  const debtors = [];
  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) creditors.push({ userId, balance });
    else if (balance < -0.01) debtors.push({ userId, balance });
  });

  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
    if (amount > 0.01) {
      transactions.push({
        from: debtor.userId, fromName: userMap[debtor.userId] || 'Unknown',
        to: creditor.userId, toName: userMap[creditor.userId] || 'Unknown',
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }
  return transactions;
}

function getMemberSummary(expenses, members) {
  const totalPaid = {};
  const totalShare = {};
  members.forEach((m) => {
    const id = m._id.toString();
    totalPaid[id] = 0;
    totalShare[id] = 0;
  });

  expenses.forEach((expense) => {
    // Credit each payer
    expense.paidBy.forEach((p) => {
      const pid = (p.user?._id || p.user).toString();
      if (pid in totalPaid) totalPaid[pid] += p.amount;
    });

    if (expense.splitType === 'equal') {
      const share = expense.amount / expense.participants.length;
      expense.participants.forEach((p) => {
        const pid = (p.user?._id || p.user).toString();
        if (pid in totalShare) totalShare[pid] += share;
      });
    } else {
      expense.participants.forEach((p) => {
        const pid = (p.user?._id || p.user).toString();
        if (pid in totalShare) totalShare[pid] += p.share || 0;
      });
    }
  });

  return members.map((m) => {
    const id = m._id.toString();
    return {
      user: { _id: id, name: m.name, avatar: m.avatar },
      totalPaid: Math.round(totalPaid[id] * 100) / 100,
      totalShare: Math.round(totalShare[id] * 100) / 100,
      netBalance: Math.round((totalPaid[id] - totalShare[id]) * 100) / 100,
    };
  });
}

module.exports = { calculateBalances, optimizeSettlements, getMemberSummary };
