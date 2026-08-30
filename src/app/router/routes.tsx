import { Route, Routes } from 'react-router-dom';
import { AuthRemotePage } from '@/modules/auth';
import { OnboardingRemotePage } from '@/modules/onboarding';
import { isDemoRemotesEnabled, listProductMounts } from '@/modules/mfe';
import { HomePage } from '@/modules/home';
import { NotFoundPage } from '@/modules/not-found';
import { RemoteModulePage } from '@/modules/remote';
import { SettingsRemotePage } from '@/modules/settings';
import { CatalogueRemotePage } from '@/modules/catalogue';
import { InventoryRemotePage } from '@/modules/inventory';
import { ProcurementRemotePage } from '@/modules/procurement';
import { PosRemotePage } from '@/modules/pos';
import { BillingRemotePage } from '@/modules/billing';
import { RxRemotePage } from '@/modules/rx';
import { SubscriptionRemotePage } from '@/modules/subscription';
import { TodosPage } from '@/modules/todos';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts().filter(
    (mount) =>
      mount.route !== '/login' &&
      mount.route !== '/pos-login' &&
      mount.route !== '/sessions' &&
      mount.route !== '/onboarding' &&
      mount.route !== '/register' &&
      mount.route !== '/settings' &&
      mount.route !== '/settings/profile' &&
      mount.route !== '/settings/storefront' &&
      mount.route !== '/settings/roles' &&
      mount.route !== '/subscription' &&
      mount.route !== '/billing' &&
      mount.route !== '/catalogue' &&
      mount.route !== '/catalogue/mapping' &&
      mount.route !== '/inventory' &&
      mount.route !== '/inventory/expiry' &&
      mount.route !== '/racks' &&
      mount.route !== '/purchases' &&
      mount.route !== '/distributors' &&
      mount.route !== '/reorder' &&
      mount.route !== '/pos' &&
      mount.route !== '/invoices' &&
      mount.route !== '/sales' &&
      mount.route !== '/invoice-settings' &&
      mount.route !== '/khata' &&
      mount.route !== '/offers' &&
      mount.route !== '/prescriptions' &&
      mount.route !== '/compliance/drug-register',
  );

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={<AuthRemotePage key="pharmacy" portalType="pharmacy" />}
      />
      <Route
        path="/pos-login"
        element={<AuthRemotePage key="pos" portalType="pos" />}
      />
      <Route
        path="/sessions"
        element={<AuthRemotePage key="sessions" portalType="sessions" />}
      />
      <Route
        path="/register"
        element={<OnboardingRemotePage key="register" screen="register" />}
      />
      <Route
        path="/register/verify"
        element={<OnboardingRemotePage key="verify" screen="verify" />}
      />
      <Route
        path="/onboarding"
        element={<OnboardingRemotePage key="status-root" screen="status" />}
      />
      <Route
        path="/onboarding/status"
        element={<OnboardingRemotePage key="status" screen="status" />}
      />
      <Route
        path="/onboarding/kyc"
        element={<OnboardingRemotePage key="kyc" screen="kyc" />}
      />
      <Route
        path="/settings/profile"
        element={<SettingsRemotePage key="profile" screen="profile" />}
      />
      <Route
        path="/settings/storefront"
        element={<SettingsRemotePage key="storefront" screen="storefront" />}
      />
      <Route
        path="/settings/roles"
        element={<SettingsRemotePage key="roles" screen="roles" />}
      />
      <Route
        path="/settings/*"
        element={<RemoteModulePage remoteName="settings" />}
      />
      <Route
        path="/subscription"
        element={<SubscriptionRemotePage key="plans" screen="plans" />}
      />
      <Route
        path="/billing"
        element={<SubscriptionRemotePage key="billing" screen="billing" />}
      />
      <Route
        path="/catalogue"
        element={<CatalogueRemotePage key="search" screen="search" />}
      />
      <Route
        path="/catalogue/mapping"
        element={<CatalogueRemotePage key="mapping" screen="mapping" />}
      />
      <Route
        path="/inventory"
        element={<InventoryRemotePage key="list" screen="list" />}
      />
      <Route
        path="/inventory/expiry"
        element={<InventoryRemotePage key="expiry" screen="expiry" />}
      />
      <Route
        path="/inventory/:productId"
        element={<InventoryRemotePage key="detail" screen="detail" />}
      />
      <Route
        path="/racks"
        element={<InventoryRemotePage key="racks" screen="racks" />}
      />
      <Route
        path="/purchases"
        element={<ProcurementRemotePage key="purchases" screen="purchases" />}
      />
      <Route
        path="/purchases/:grnId"
        element={<ProcurementRemotePage key="editor" screen="editor" />}
      />
      <Route
        path="/distributors"
        element={
          <ProcurementRemotePage key="distributors" screen="distributors" />
        }
      />
      <Route
        path="/reorder"
        element={<ProcurementRemotePage key="reorder" screen="reorder" />}
      />
      <Route path="/pos" element={<PosRemotePage />} />
      <Route path="/pos/*" element={<PosRemotePage />} />
      <Route
        path="/invoices"
        element={<BillingRemotePage key="invoices" screen="invoices" />}
      />
      <Route
        path="/invoices/:invoiceId"
        element={
          <BillingRemotePage key="invoice-detail" screen="invoice-detail" />
        }
      />
      <Route
        path="/invoice-settings"
        element={
          <BillingRemotePage key="invoice-settings" screen="invoice-settings" />
        }
      />
      <Route
        path="/sales"
        element={<BillingRemotePage key="sales" screen="sales" />}
      />
      <Route
        path="/khata"
        element={<BillingRemotePage key="khata" screen="khata" />}
      />
      <Route
        path="/khata/:customerId"
        element={<BillingRemotePage key="khata-detail" screen="khata-detail" />}
      />
      <Route
        path="/offers"
        element={<BillingRemotePage key="offers" screen="offers" />}
      />
      <Route
        path="/prescriptions"
        element={<RxRemotePage key="queue" screen="queue" />}
      />
      <Route
        path="/prescriptions/:rxId"
        element={<RxRemotePage key="detail" screen="detail" />}
      />
      <Route
        path="/compliance/drug-register"
        element={<RxRemotePage key="drug-register" screen="drug-register" />}
      />
      {mounts.map((mount) => (
        <Route
          key={`${mount.remoteName}:${mount.route}`}
          path={`${mount.route}/*`}
          element={<RemoteModulePage remoteName={mount.remoteName} />}
        />
      ))}
      {demoEnabled ? (
        <Route path="/todos/*" element={<TodosPage />} />
      ) : (
        <Route path="/todos" element={<NotFoundPage />} />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
