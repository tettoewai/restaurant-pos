import SignOutDialog from "@/components/SignOutDialog";
import UpdateCompanyDialog from "@/components/UpdateCompanyDailog";
import { Button, Card } from "@nextui-org/react";

function page() {
  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Setting</span>
        <span className="text-sm text-gray-600">Manage your application</span>
      </div>
      <div className="mt-5 space-y-2">
        <Card className="flex justify-between flex-row items-center p-2 bg-background">
          <span>Company</span>
          <UpdateCompanyDialog />
        </Card>
        <Card className="flex justify-between flex-row items-center p-2 bg-background">
          <span>Account</span>
          <SignOutDialog />
        </Card>
      </div>
    </div>
  );
}

export default page;
