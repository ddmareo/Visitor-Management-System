import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";
import QrFrame from "../assets/qr-frame.svg";

interface QrScannerProps {
  onScanSuccess: (scannedUrl: string) => void;
}

const QrScannerComponent: React.FC<QrScannerProps> = ({ onScanSuccess }) => {
  const scanner = useRef<QrScanner | null>(null);
  const videoEl = useRef<HTMLVideoElement>(null);
  const qrBoxEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScanSuccess = (result: QrScanner.ScanResult) => {
      if (result?.data) {
        onScanSuccess(result.data);
        scanner.current?.destroy();
      }
    };

    if (videoEl.current) {
      scanner.current = new QrScanner(videoEl.current, handleScanSuccess, {
        preferredCamera: "environment",
        highlightScanRegion: true,
        overlay: qrBoxEl.current || undefined,
      });

      scanner.current.start().catch((err) => {
        console.error("Error starting QR scanner:", err);
        alert(
          "Camera is blocked or not accessible. Please allow camera in your browser permissions and reload."
        );
      });
    }

    return () => {
      scanner.current?.destroy();
      scanner.current = null;
    };
  }, []);

  return (
    <div className="qr-reader">
      <video ref={videoEl}></video>
      <div ref={qrBoxEl} className="qr-box">
        <img src={QrFrame} width={256} height={256} className="qr-frame" />
      </div>
    </div>
  );
};

export default QrScannerComponent;
