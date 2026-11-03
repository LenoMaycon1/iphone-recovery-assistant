import { useCallback, useEffect, useRef, useState } from 'react';
import type { UsbMonitorState } from '@/hooks/useUsbMonitor';
import { deriveSessionState, noticeFromInspection, type DeviceSession } from '@/lib/deviceSession';
import type { InspectionResult } from '@/types/desktop';

const READ_FAILED_RESULT: InspectionResult = {
  status: 'read-error',
  details: null,
  message: 'Não foi possível ler as informações do aparelho.',
  confirmedMode: null,
};

export function useDeviceSession(usb: UsbMonitorState): DeviceSession {
  const { scan, driverService, lastScanAt, devices } = usb;
  const [isReleased, setIsReleased] = useState(false);
  const [inspection, setInspection] = useState<InspectionResult | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const requestIdRef = useRef(0);

  const device = isReleased ? null : (devices[0] ?? null);
  const deviceId = device?.id ?? null;
  const deviceMode = device?.mode ?? null;

  useEffect(() => {
    const bridge = window.iphoneRecovery;
    if (!bridge || !deviceMode) {
      setInspection(null);
      setIsInspecting(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsInspecting(true);
    bridge
      .inspectDevice({ mode: deviceMode, driverService })
      .then((result) => {
        if (requestId === requestIdRef.current) setInspection(result);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setInspection(READ_FAILED_RESULT);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsInspecting(false);
      });
  }, [deviceId, deviceMode, driverService, lastScanAt]);

  const refresh = useCallback(async () => {
    setIsReleased(false);
    await scan();
  }, [scan]);

  const release = useCallback(() => {
    requestIdRef.current += 1;
    setIsInspecting(false);
    setIsReleased(true);
  }, []);

  return {
    state: deriveSessionState(device, inspection),
    device,
    details: device ? (inspection?.details ?? null) : null,
    notice: device ? noticeFromInspection(inspection) : null,
    isInspecting,
    isReleased,
    refresh,
    release,
  };
}
