import { ApplicationHeader } from '@/components/header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AccountSelector } from '@/components/account-selector';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCallback, useState} from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Account, ActivityDetails } from '@/lib/types';
import { getAccounts } from '@/commands/account';
import { ActivityDeleteModal } from './components/activity-delete-modal';
import { QueryKeys } from '@/lib/query-keys';
import { useActivityMutations } from './hooks/use-activity-mutations';
import { ActivityForm } from './components/activity-form';
import EditableActivityTable from './components/editable-activity-table';
import ActivityTable from './components/activity-table';
import { getActivityCountByAccount, exportActivitiesToCsv, searchActivities } from '@/commands/activity';
import { useBalancePrivacy } from '@/context/privacy-context';

const ActivityPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityDetails | undefined>();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditableTable, setShowEditableTable] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>(undefined);
  const [activityCount, setActivityCount] = useState<number>(0);
  const [previewActivities, setPreviewActivities] = useState<ActivityDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: accountsData } = useQuery<Account[], Error>({
    queryKey: [QueryKeys.ACCOUNTS],
    queryFn: getAccounts,
  });
  const accounts = accountsData || [];

  const { deleteActivityMutation } = useActivityMutations();

  const handleEdit = useCallback((activity?: ActivityDetails) => {
    setSelectedActivity(activity);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((activity: ActivityDetails) => {
    setSelectedActivity(activity);
    setShowDeleteAlert(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if(!selectedActivity) return;
    await deleteActivityMutation.mutateAsync(selectedActivity.id);
    setShowDeleteAlert(false);
    setSelectedActivity(undefined);
  };

  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setSelectedActivity(undefined);
  }, []);

  const { isBalanceHidden } = useBalancePrivacy();

  const handleAccountSelect = useCallback(async (account: Account) => {
    setSelectedAccount(account);
    setLoading(true);
    try {
      const count = await getActivityCountByAccount(account.id);
      setActivityCount(count);

      // Fetch all activities for preview
      if (count > 0) {
        const previewResponse = await searchActivities(1, count, { accountId: [account.id] }, '', { id: 'date', desc: true });
        setPreviewActivities(previewResponse.data);
      } else {
        setPreviewActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
      setActivityCount(0);
      setPreviewActivities([]);
    }
    setLoading(false);
  }, []);

  const handleExportConfirm = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const csvContent = await exportActivitiesToCsv(selectedAccount.id, isBalanceHidden);
      
      // Create filename with sanitized account name
      const sanitizedAccountName = selectedAccount.name.replace(/[^a-z0-9]/gi, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `activities-${sanitizedAccountName}-${dateStr}.csv`;
      
      // Use browser download - most reliable method for Tauri apps
      fallbackToBrowserDownload(csvContent, filename);
    } catch (error) {
      console.error('Error exporting activities:', error);
      // Use a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to export activities: ${errorMessage}`);
    }
    setShowExportModal(false);
    setSelectedAccount(undefined);
    setActivityCount(0);
    setLoading(false);
  }, [selectedAccount, isBalanceHidden]);

  // Fallback browser download function
  const fallbackToBrowserDownload = async (content: string, filename: string) => {
    try {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Show detailed info about download location and offer to open folder
      const userChoice = confirm(
        `CSV file "${filename}" has been downloaded.\n\n` +
        `In desktop applications, files are typically saved to your default Downloads folder.\n\n` +
        `Would you like to open the Downloads folder now?`
      );
      
      if (userChoice && typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        try {
          const { open } = await import('@tauri-apps/plugin-shell');
          // Try to open Downloads folder
          await open('$DOWNLOAD');
        } catch (openError) {
          console.warn('Could not open Downloads folder:', openError);
        }
      }
    } catch (downloadError) {
      console.error('Browser download failed:', downloadError);
      throw downloadError;
    }
  };

  const handleExport = useCallback(async () => {
    setShowExportModal(true);
  }, []);



  return (
    <div className="flex flex-col p-6">
      <ApplicationHeader heading="Activity">
        <div className="absolute right-6 flex items-center space-x-2">
          <Button size="sm" title="Import" asChild>
            <Link to={'/import'}>
              <Icons.Import className="mr-2 h-4 w-4" />
              Import from CSV
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleEdit(undefined)}>
            <Icons.PlusCircle className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
          <Button size="sm" title="Export to CSV" onClick={handleExport}>
            <Icons.Export className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>
      </ApplicationHeader>
      <Separator className="my-6" />
      <div className="pt-6">
        {showEditableTable ? (
            <EditableActivityTable
              accounts={accounts}
              isEditable={showEditableTable}
              onToggleEditable={setShowEditableTable}
            />
          ) : (
            <ActivityTable
              accounts={accounts}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              isEditable={showEditableTable}
              onToggleEditable={setShowEditableTable}
            />
          )
        }
      </div>
      <ActivityForm
        accounts={
          accounts
            ?.filter((acc) => acc.isActive)
            .map((account) => ({
              value: account.id,
              label: account.name,
              currency: account.currency,
            })) || []
        }
        activity={selectedActivity}
        open={showForm}
        onClose={handleFormClose}
      />
      <ActivityDeleteModal
        isOpen={showDeleteAlert}
        isDeleting={deleteActivityMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteAlert(false);
          setSelectedActivity(undefined);
        }}
      />

      <AlertDialog open={showExportModal} onOpenChange={setShowExportModal}>
        <AlertDialogContent className="flex flex-col max-h-[70vh]">
          <AlertDialogHeader>
            <AlertDialogTitle>Export Activities to CSV</AlertDialogTitle>
            <AlertDialogDescription>
              Select an account to export its activities. The CSV will include all activities sorted by date descending.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 flex-1">
            <AccountSelector
              selectedAccount={selectedAccount}
              setSelectedAccount={handleAccountSelect}
              includePortfolio={false}
              className="w-full"
            />
            {selectedAccount && (
              <p className="text-sm text-muted-foreground">
                Exporting {activityCount} activities from {selectedAccount.name}.
              </p>
            )}
            {activityCount === 0 && selectedAccount && (
              <p className="text-sm text-destructive">
                No activities found for the selected account.
              </p>
            )}
            {selectedAccount && activityCount > 0 && (
              <div className="space-y-2 flex-1 overflow-auto max-h-96">
                <p className="text-sm font-medium text-muted-foreground">Preview (up to 20 most recent activities):</p>
                <div className="overflow-x-auto min-h-32">
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Symbol</th>
                        <th className="text-left p-2">Quantity</th>
                        <th className="text-left p-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewActivities.map((activity) => (
                        <tr key={activity.id} className="border-b">
                          <td className="p-2">{new Date(activity.date).toLocaleDateString()}</td>
                          <td className="p-2">{activity.activityType}</td>
                          <td className="p-2">{activity.assetSymbol || 'N/A'}</td>
                          <td className="p-2">{activity.quantity}</td>
                          <td className="p-2">{activity.amount || 0}</td>
                        </tr>
                      ))}
                      {previewActivities.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            No activities to preview. Add some via "Add Manually" or import CSV.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground">
                  Showing first {previewActivities.length} of {activityCount} activities.
                </p>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowExportModal(false);
              setSelectedAccount(undefined);
              setActivityCount(0);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExportConfirm}
              disabled={!selectedAccount || activityCount === 0 || loading}
            >
              {loading ? 'Exporting...' : 'Export'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityPage;
