import { Route, Routes } from 'react-router-dom';
import { AuthRemotePage } from '@/modules/auth';
import { OnboardingRemotePage } from '@/modules/onboarding';
import { isDemoRemotesEnabled, listProductMounts } from '@/modules/mfe';
import { HomePage } from '@/modules/home';
import { CustomersPage } from '@/modules/customers';
import { NotificationsPage } from '@/modules/notifications';
import { NotFoundPage } from '@/modules/not-found';
import { RemoteModulePage } from '@/modules/remote';
import { SettingsRemotePage } from '@/modules/settings';
import { CatalogueRemotePage } from '@/modules/catalogue';
import { InventoryRemotePage } from '@/modules/inventory';
import { ProcurementRemotePage } from '@/modules/procurement';
import { PosRemotePage } from '@/modules/pos';
import { BillingRemotePage } from '@/modules/billing';
import { RxRemotePage } from '@/modules/rx';
import { OrdersRemotePage } from '@/modules/orders';
import { FinanceRemotePage } from '@/modules/finance';
import { AnalyticsRemotePage } from '@/modules/analytics';
import { SupportRemotePage } from '@/modules/support';
import { SubscriptionRemotePage } from '@/modules/subscription';
import { TodosPage } from '@/modules/todos';

export function AppRoutes() {
  const demoEnabled = isDemoRemotesEnabled();
  const mounts = listProductMounts().filter(
    (mount) =>
      mount.route !== '/login' &&
      mount.route !== '/pos-login' &&
      mount.route !== '/sessions' &&
      mount.route !== '/forgot-password' &&
      mount.route !== '/reset-password' &&
      mount.route !== '/onboarding' &&
      mount.route !== '/register' &&
      mount.route !== '/settings' &&
      mount.route !== '/settings/profile' &&
      mount.route !== '/settings/storefront' &&
      mount.route !== '/settings/roles' &&
      mount.route !== '/settings/notifications' &&
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
      mount.route !== '/compliance/drug-register' &&
      mount.route !== '/rx-quotes' &&
      mount.route !== '/orders' &&
      mount.route !== '/finance/settlements' &&
      mount.route !== '/analytics' &&
      mount.route !== '/help' &&
      mount.route !== '/support',
  );

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route
        path="/login"
        element={<AuthRemotePage key="pharmacy" portalType="pharmacy" />}
      />
      <Route
        path="/forgot-password"
        element={
          <AuthRemotePage key="pharmacy-forgot" portalType="pharmacy-forgot" />
        }
      />
      <Route
        path="/reset-password"
        element={
          <AuthRemotePage key="pharmacy-reset" portalType="pharmacy-reset" />
        }
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
        path="/settings/notifications"
        element={
          <SettingsRemotePage key="notifications" screen="notifications" />
        }
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
      <Route
        path="/rx-quotes"
        element={<OrdersRemotePage key="rx-quotes" screen="rx-quotes" />}
      />
      <Route
        path="/orders"
        element={<OrdersRemotePage key="orders-home" screen="orders-home" />}
      />
      <Route
        path="/orders/:orderId"
        element={
          <OrdersRemotePage key="order-actions" screen="order-actions" />
        }
      />
      <Route
        path="/finance/settlements"
        element={<FinanceRemotePage key="settlements" screen="settlements" />}
      />
      <Route
        path="/finance/settlements/:id"
        element={
          <FinanceRemotePage
            key="settlement-detail"
            screen="settlement-detail"
          />
        }
      />
      <Route path="/analytics" element={<AnalyticsRemotePage />} />
      <Route
        path="/support"
        element={<SupportRemotePage key="ticket-list" screen="ticket-list" />}
      />
      <Route
        path="/support/new"
        element={<SupportRemotePage key="ticket-new" screen="ticket-new" />}
      />
      <Route
        path="/support/tickets/:id"
        element={
          <SupportRemotePage key="ticket-detail" screen="ticket-detail" />
        }
      />
      <Route
        path="/help"
        element={<SupportRemotePage key="help" screen="help" />}
      />
      <Route
        path="/help/articles/:id"
        element={<SupportRemotePage key="help-article" screen="help-article" />}
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
