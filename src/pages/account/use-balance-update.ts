import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createActivity } from '@/commands/activity';
import { NewActivity, Account } from '@/lib/types';
import { QueryKeys } from '@/lib/query-keys';

export const useBalanceUpdate = (account?: Account | null) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newActivity: NewActivity) => createActivity(newActivity),
    onSuccess: () => {
      // Invalidate and refetch account data to reflect the new balance
      if (account) {
        queryClient.invalidateQueries({ queryKey: [QueryKeys.VALUATION_HISTORY, account.id] });
        queryClient.invalidateQueries({ queryKey: [QueryKeys.ACCOUNTS] });
      }
    },
  });

  const updateBalance = (newBalance: number) => {
    if (!account) return;

    const currentBalance = account.cashBalance || 0;
    const difference = newBalance - currentBalance;

    if (difference === 0) return;

    const activityType = difference > 0 ? 'DEPOSIT' : 'WITHDRAWAL';
    const amount = Math.abs(difference);

    const newActivity: NewActivity = {
      accountId: account.id,
      activityType,
      activityDate: new Date().toISOString(),
      assetId: `$CASH-${account.currency}`,
      currency: account.currency,
      amount: amount.toString(),
      isDraft: false,
      comment: 'Balance updated from account page',
    };

    mutation.mutate(newActivity);
  };

  return { updateBalance, ...mutation };
};
