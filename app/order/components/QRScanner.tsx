"use client";
import { fetchTableWithId } from "@/app/lib/backoffice/data";
import { changeTable } from "@/app/lib/order/action";
import { Button, Card, Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import { TbArrowsExchange2 } from "react-icons/tb";
import { toast } from "react-toastify";
import useSWR from "swr";

const QRScanner = ({ prevTableId }: { prevTableId: number }) => {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const router = useRouter();
  const [scanning, setScanning] = useState(true);
  const [changing, setChanging] = useState(false);
  const [tableResult, setTableResult] = useState(0);
  const { data: table } = useSWR(tableResult ? [tableResult] : null, () =>
    fetchTableWithId(tableResult)
  );
  const videoRef = useRef(null);
  const qrScannerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && videoRef.current) {
      // Initialize qr-scanner and start scanning
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setScanning(true);
          if (result) {
            const qrResult = new URL(result.data);
            const tableId = Number(qrResult.searchParams.get("tableId"));
            if (!tableId && tableId === prevTableId) return;
            setTableResult(tableId);
            if (table) {
              setScanning(false);
              qrScannerRef.current.stop();
              qrScannerRef.current.destroy();
              qrScannerRef.current = null;
            }
          }
        },
        { highlightCodeOutline: true }
      );

      qrScannerRef.current
        .start()
        .catch((error: any) =>
          console.error("Failed to start QR scanner:", error)
        );
    }

    // Stop the scanner when the component unmounts
    return () => {
      if (qrScannerRef.current) {
        setScanning(false);
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
    };
  }, [prevTableId, table]);
  useEffect(() => {
    if (tableResult) {
      setScanning(false);
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
  }, [tableResult]);
  const handleChangeTable = async () => {
    const isValid = table && prevTableId;
    if (!isValid) return;
    setChanging(true);
    const { isSuccess, message } = await changeTable({
      tableId: table.id,
      prevTableId,
    });
    if (isSuccess) {
      setChanging(false);
      await new Promise<void>((resolve) => {
        toast.success(message);
        resolve();
      });
      params.set("tableId", String(table.id));
      router.replace(`/order?${params.toString()}`);
    } else {
      setChanging(false);
      toast.error(message);
    }
  };
  return (
    <div className="w-full">
      <div>
        <h1 className="mt-4">Change Table</h1>
        <span className="mt-4 text-sm text-gray-600">Feel free at us</span>
      </div>
      <div className="w-full flex justify-center items-center flex-col mt-44">
        <div className="relative">
          {scanning ? (
            <div className="absolute -left-1 -top-1 z-0 rounded-md w-[308px] h-[308px] overflow-hidden">
              <div className="loadingDiv"></div>
            </div>
          ) : null}
          {scanning ? (
            <div className="bg-white relative z-10 w-[300px] h-[300px] rounded-md">
              <video
                ref={videoRef}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ) : null}
        </div>
        {scanning ? (
          <span className="mt-2 text-center">
            Please scan QR code from table you want to sit
          </span>
        ) : null}
        {table ? (
          <Card className="w-full p-4 flex justify-center items-center">
            <TbArrowsExchange2 className="text-primary" size={60} />
            <span className="mt-2">
              Are you sure you went to change {table?.name} table?
            </span>
            <div className="flex mt-5 space-x-1 w-full justify-end">
              <Button
                color="primary"
                className="w-28"
                isDisabled={changing}
                onPress={handleChangeTable}
              >
                {changing ? <Spinner color="white" /> : "Yes"}
              </Button>
              <Button
                className="w-28"
                onPress={() => {
                  params.set("tableId", String(prevTableId));
                  router.replace(`/order?${params.toString()}`);
                }}
              >
                No
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
};

export default QRScanner;
