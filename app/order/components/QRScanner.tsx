"use client";
import React, { useState } from "react";
import QrScanner from "react-qr-scanner";

const QRScanner: React.FC = () => {
  const [result, setResult] = useState<string>("No result");

  const handleScan = (data: any) => {
    if (data && typeof data === "object" && "text" in data) {
      setResult(data.text);
    } else if (data) {
      setResult(data);
    }
  };

  const handleError = (err: Error) => {
    console.error(err);
  };

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <div className="bg-white w-[300px] h-[300px]">
        <QrScanner
          delay={300}
          onError={handleError}
          onScan={handleScan}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <p>Scanned Result: {result}</p>
    </div>
  );
};

export default QRScanner;
