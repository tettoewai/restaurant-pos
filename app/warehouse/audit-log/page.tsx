import { fetchAuditLog } from "@/app/lib/warehouse/data";
import { AuditLogTable } from "../components/AuditLogTable";
import { fetchUserWithIds } from "@/app/lib/backoffice/data";
import { captilize, dateToString } from "@/function";

export default async function AuditLogPage() {
  const auditLogs = await fetchAuditLog();
  const userIds = auditLogs.map((item) => item.userId);
  const users = await fetchUserWithIds(userIds);

  const columns = [
    { key: "key", label: "Id", sortable: true },
    { key: "user", label: "User", sortable: true },
    { key: "action", label: "Action", sortable: true },
    { key: "time", label: "Time", sortable: true },
  ];
  const rows = auditLogs.map((auditLog) => {
    const currentUser = users?.find((item) => item.id === auditLog.userId);
    return {
      key: auditLog.id,
      user: currentUser?.name || "",
      action: captilize(auditLog.action).replace("_", " "),
      time: dateToString({ date: auditLog.createdAt, type: "DMY" }),
    };
  });

  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Audit Log</span>
        <span className="text-sm text-gray-600">Audit every changes.</span>
      </div>
      <div className="mt-2">
        <AuditLogTable columns={columns} rows={rows} auditLogs={auditLogs} />
      </div>
    </div>
  );
}
