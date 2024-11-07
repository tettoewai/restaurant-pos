import React from "react";
import QRScanner from "../components/QRScanner";

function ChangeTablePage({
  searchParams,
}: {
  searchParams: { tableId: string };
}) {
  const prevTableId = Number(searchParams.tableId);

  return (
    <div className="h-full items-center">
      <QRScanner prevTableId={prevTableId} />
    </div>
  );
}

export default ChangeTablePage;
