import { useCallback, useEffect, useState } from 'react';
import { classifyUsbDevice, type ConnectedDevice } from '@/lib/usb';
import type { DriverServiceState } from '@/types/desktop';

export type UsbStatus = 'unsupported' | 'error' | 'connected' | 'disconnected';

export function useUsbMonitor(autoRefresh: boolean, intervalMs: number) {
  const bridgeAvailable = typeof window !== 'undefined' && Boolean(window.iphoneRecovery);
  const [supported, setSupported] = useState(bridgeAvailable);
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [driverService, setDriverService] = useState<DriverServiceState>('unknown');

  const scan = useCallback(async () => {
    const bridge = window.iphoneRecovery;
    if (!bridge) return;

    setIsScanning(true);
    try {
      const result = await bridge.scanUsbDevices();
      const detectedAt = new Date().toISOString();
      setSupported(result.supported);
      setDevices(
        result.devices
          .map((device) => classifyUsbDevice(device, detectedAt))
          .filter((device): device is ConnectedDevice => device !== null),
      );
      setDriverService(result.driverService);
      setError(result.error);
      setLastScanAt(detectedAt);
    } catch {
      setError('Não foi possível consultar a conexão USB.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    void scan();
  }, [scan]);

  useEffect(() => {
    if (!autoRefresh || !bridgeAvailable) return;
    const timer = window.setInterval(() => void scan(), intervalMs);
    return () => window.clearInterval(timer);
  }, [autoRefresh, bridgeAvailable, intervalMs, scan]);

  const status: UsbStatus = !supported
    ? 'unsupported'
    : error
      ? 'error'
      : devices.length > 0
        ? 'connected'
        : 'disconnected';

  return { status, devices, driverService, error, isScanning, lastScanAt, scan };
}

export type UsbMonitorState = ReturnType<typeof useUsbMonitor>;
