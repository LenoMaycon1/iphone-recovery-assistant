import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useDeviceSession } from '@/hooks/useDeviceSession';
import { usePreferences } from '@/hooks/usePreferences';
import { useServiceRecords } from '@/hooks/useServiceRecords';
import { useUsbMonitor } from '@/hooks/useUsbMonitor';
import type { DeviceSnapshot } from '@/lib/deviceSession';
import type { PageId } from '@/lib/navigation';
import ConnectDevicePage from '@/pages/ConnectDevicePage';
import DashboardPage from '@/pages/DashboardPage';
import DataRecoveryPage from '@/pages/DataRecoveryPage';
import DiagnosticsPage from '@/pages/DiagnosticsPage';
import HistoryPage from '@/pages/HistoryPage';
import SettingsPage from '@/pages/SettingsPage';
import type { AppInfo } from '@/types/desktop';

const WEB_APP_INFO: AppInfo = { version: '1.0.0', platform: 'web' };

export default function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [selected, setSelected] = useState<DeviceSnapshot | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo>(WEB_APP_INFO);
  const { preferences, updatePreferences } = usePreferences();
  const usb = useUsbMonitor(preferences.autoRefresh, preferences.refreshSeconds * 1000);
  const session = useDeviceSession(usb);
  const history = useServiceRecords();

  useEffect(() => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;
    bridge.getAppInfo().then(setAppInfo).catch(() => undefined);
  }, []);

  useEffect(() => {
    const device = session.device;
    if (!device) return;
    const serialNumber = session.details?.serialNumber ?? null;
    const last = preferences.lastDevice;
    if (last && last.label === device.label && last.serialNumber === serialNumber && last.mode === device.mode) {
      return;
    }
    updatePreferences({
      lastDevice: {
        label: device.label,
        mode: device.mode,
        serialNumber,
        seenAt: device.detectedAt,
      },
    });
  }, [session.device, session.details, preferences.lastDevice, updatePreferences]);

  const isSelectedDeviceConnected = selected !== null && session.device?.id === selected.device.id;

  const handleUseDevice = (snapshot: DeviceSnapshot) => {
    setSelected(snapshot);
    setActivePage('diagnostics');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            usbStatus={usb.status}
            devices={usb.devices}
            lastDevice={preferences.lastDevice}
            records={history.records}
            historyLoading={history.isLoading}
            historyError={history.error}
            onNavigate={setActivePage}
          />
        );
      case 'connect':
        return (
          <ConnectDevicePage
            usbStatus={usb.status}
            usbError={usb.error}
            driverService={usb.driverService}
            deviceCount={usb.devices.length}
            session={session}
            isScanning={usb.isScanning}
            lastScanAt={usb.lastScanAt}
            onUseDevice={handleUseDevice}
          />
        );
      case 'diagnostics':
        return (
          <DiagnosticsPage
            snapshot={selected}
            isDeviceConnected={isSelectedDeviceConnected}
            technicianName={preferences.technicianName}
            onNavigate={setActivePage}
            onRecordSaved={history.reload}
          />
        );
      case 'recovery':
        return <DataRecoveryPage />;
      case 'history':
        return (
          <HistoryPage
            records={history.records}
            isLoading={history.isLoading}
            error={history.error}
            onRetry={history.reload}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            appVersion={appInfo.version}
            platform={appInfo.platform}
            preferences={preferences}
            onUpdatePreferences={updatePreferences}
          />
        );
    }
  };

  return (
    <AppShell
      activePage={activePage}
      usbStatus={usb.status}
      appVersion={appInfo.version}
      onNavigate={setActivePage}
    >
      {renderPage()}
    </AppShell>
  );
}
