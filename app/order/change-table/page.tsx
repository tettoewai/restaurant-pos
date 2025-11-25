import React, { Suspense } from "react";
import QRScanner from "../components/QRScanner";

function ChangeTablePage({
  searchParams,
}: {
  searchParams: { tableId: string };
}) {
  const prevTableId = Number(searchParams.tableId);

  return (
    <div className="h-full items-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-40">
            <span>Loading scanner...</span>
          </div>
        }
      >
        <QRScanner prevTableId={prevTableId} />
      </Suspense>
    </div>
  );
}

export default ChangeTablePage;
