import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@heroui/react";
import { PiExportThin } from "react-icons/pi";

const exportToExcel = (
  sheetsData: {
    sheetName: string;
    data: any[];
  }[],
  fileName: string
) => {
  if (!sheetsData.length) {
    alert("No data to export!");
    return;
  }

  const sanitizeSheetName = (name: string) => {
    return name.replace(/[:\\/?*\[\]]/g, "").substring(0, 31); // Remove invalid chars & limit to 31 chars
  };

  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  sheetsData.forEach(({ sheetName, data }) => {
    if (data.length > 0) {
      const sanitizedSheetName = sanitizeSheetName(sheetName); // ✅ Ensure sanitized sheet name
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizedSheetName);
    }
  });

  // Write and save the file
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const fileBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });
  saveAs(fileBlob, fileName);
};

export default function ExportToExcelBtn({
  sheetsData,
  fileName,
}: {
  sheetsData: { sheetName: string; data: any[] }[];
  fileName: string;
}) {
  return (
    <Button
      radius="sm"
      color="primary"
      fullWidth
      startContent={<PiExportThin className="size-5" />}
      onPress={() => exportToExcel(sheetsData, fileName)}
    >
      Export to Excel
    </Button>
  );
}
