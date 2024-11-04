// components/QRScanner.js
"use client";
import { fetchTableWithId } from "@/app/lib/backoffice/data";
import { changeTable } from "@/app/lib/order/action";
import { Button, Card, Spinner } from "@nextui-org/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TbArrowsExchange2 } from "react-icons/tb";
import { QrReader } from "react-qr-reader";
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
  useEffect(() => {
    if (tableResult) {
      setScanning(false);
    }
  }, [tableResult]);
  const handleChangeTable = async () => {
    if (!table) return;
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
              <QrReader
                containerStyle={{ width: "300px", height: "300px" }}
                videoContainerStyle={{ width: "100%", height: "100%" }}
                videoStyle={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onResult={(result: any, error) => {
                  setScanning(true);
                  if (result) {
                    const qrResult = new URL(result.text);
                    const tableId = Number(
                      qrResult.searchParams.get("tableId")
                    );
                    if (!tableId) return;
                    setTableResult(tableId);
                    if (table) {
                      setScanning(false);
                    }
                  }
                }}
                constraints={{ facingMode: "user" }}
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
                onClick={handleChangeTable}
              >
                {changing ? <Spinner color="white" /> : "Yes"}
              </Button>
              <Button
                className="w-28"
                onClick={() => {
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
