import { api } from '../lib/api';
import { achievementService } from './achievementService';

jest.mock('../lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('../utils/secureLogger', () => ({
  secureLogger: {
    error: jest.fn(),
  },
}));

const mockedGet = api.get as jest.Mock;

describe('achievementService.getActivitySnapshot', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('uses the bounded activity request configuration and bank filter', async () => {
    const snapshot = { generated_at: '2026-07-24T12:00:00Z' };
    mockedGet.mockResolvedValue({
      data: {
        success: true,
        data: snapshot,
      },
    });

    await expect(
      achievementService.getActivitySnapshot({
        forceRecalculate: true,
        bankName: 'First National Bank',
      })
    ).resolves.toBe(snapshot);

    expect(mockedGet).toHaveBeenCalledWith(
      '/v1/achievements/user/activity?force_recalculate=true&bank_name=First+National+Bank',
      expect.objectContaining({
        timeout: 30000,
        retry: 0,
      })
    );
  });

  it('rejects failed requests so the page can show its fallback state', async () => {
    mockedGet.mockRejectedValue(new Error('Network error'));

    await expect(
      achievementService.getActivitySnapshot()
    ).rejects.toThrow('Network error');
  });

  it('deduplicates simultaneous snapshot requests for the same user and bank', async () => {
    let resolveRequest: (value: unknown) => void = () => undefined;
    mockedGet.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const options = {
      cacheScope: 'user-1',
      bankName: 'Bank A',
      bypassCache: true,
    };
    const first = achievementService.getActivitySnapshot(options);
    const second = achievementService.getActivitySnapshot(options);

    expect(mockedGet).toHaveBeenCalledTimes(1);
    resolveRequest({
      data: {
        success: true,
        data: { generated_at: '2026-07-24T12:00:00Z' },
      },
    });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });
});
