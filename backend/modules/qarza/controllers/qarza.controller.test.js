import { getAccountLedger } from './qarza.controller.js';
import { getTransactions } from '../../transactions/services/transaction.service.js';
import { findByIdQarzaAccountService } from '../services/qarzaAccount.crud.js';

jest.mock('../../transactions/services/transaction.service.js', () => ({
  getTransactions: jest.fn(),
  createTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
}));

jest.mock('../services/qarzaAccount.crud.js', () => ({
  findByIdQarzaAccountService: jest.fn(),
  updateQarzaAccountService: jest.fn(),
}));

describe('getAccountLedger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sorts customer ledger entries from oldest to newest so the newest transaction stays last', async () => {
    findByIdQarzaAccountService.mockResolvedValue({
      _id: 'acc-1',
      type: 'customer',
      name: 'Aaliyah',
    });

    getTransactions.mockResolvedValue([
      {
        _id: 'newer',
        sourceType: 'orderReturn',
        creditAmount: 250,
        creditType: 'cashin',
        transactionDate: '2024-12-10T10:00:00.000Z',
        notes: 'Latest return',
      },
      {
        _id: 'older',
        sourceType: 'sale',
        creditAmount: 150,
        creditType: 'cashout',
        transactionDate: '2024-12-01T09:00:00.000Z',
        notes: 'Earlier order',
      },
    ]);

    const req = {
      params: { accountId: 'acc-1' },
      query: {},
    };

    const res = {
      json: jest.fn(),
    };

    await getAccountLedger(req, res);

    expect(getTransactions).toHaveBeenCalledTimes(1);
    const ledger = res.json.mock.calls[0][0].data.ledger;
    expect(ledger.map(item => item.description)).toEqual(['Earlier order', 'Latest return']);
    expect(ledger[ledger.length - 1].description).toBe('Latest return');
  });
});
