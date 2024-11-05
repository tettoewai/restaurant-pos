declare module "react-qr-scanner" {
  import { ComponentType } from "react";

  interface QrScannerProps {
    delay?: number; // Add the optional delay property
    onError: (error: Error) => void;
    onScan: (data: string | null) => void;
    style?: React.CSSProperties;
  }

  const QrScanner: ComponentType<QrScannerProps>;

  export default QrScanner;
}
