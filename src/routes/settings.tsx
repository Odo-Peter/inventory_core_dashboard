import { PageHeader } from '@/components/shared/page-header';

export function SettingsRoute() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Store settings" />
      <div className="border-border bg-card rounded-lg border p-4">
        <p className="text-sm">Settings placeholder</p>
      </div>
    </div>
  );
}
