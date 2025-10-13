import { baseMetadata } from "@/app/lib/baseMetadata";
import CheckWMSDialog from "@/components/CheckWMSDialog";
import SignOutDialog from "@/components/SignOutDialog";
import UpdateCompanyDialog from "@/components/UpdateCompanyDailog";
import { Card, Link as NextUiLink } from "@heroui/react";
import {
  BillList,
  Buildings3,
  Garage,
  RoundAltArrowRight,
  User,
} from "@solar-icons/react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Setting | ${baseMetadata.title}`,
};

function SettingPage({ params }: { params: { section: string } }) {
  const section = params.section;
  if (section !== "backoffice" && section !== "warehouse") {
    return <div>Invalid section</div>;
  }
  const itemClass =
    "flex justify-between flex-row items-center p-2 bg-background h-14";
  return (
    <div>
      <div className="flex flex-col pl-4">
        <span className="text-primary">Setting</span>
        <span className="text-sm text-gray-600">
          Manage your settings here.
        </span>
      </div>
      <div className="mt-5 space-y-2">
        <NextUiLink
          href={"/secure/backoffice/recent-receipt"}
          as={Link}
          className="w-full"
        >
          <Card className={itemClass} fullWidth radius="sm">
            <div className="flex items-center">
              <BillList className=" size-6 mr-2" />
              <span>Recent receipt</span>
            </div>
            <RoundAltArrowRight className="size-6 " />
          </Card>
        </NextUiLink>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <Garage className=" size-6 mr-2" />
            <span>Warehouse Management System</span>
          </div>
          <CheckWMSDialog />
        </Card>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <Buildings3 className=" size-6 mr-2" />
            <span>Company</span>
          </div>

          <UpdateCompanyDialog />
        </Card>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <User className=" size-6 mr-2" />
            <span>Account</span>
          </div>

          <SignOutDialog />
        </Card>
      </div>
    </div>
  );
}

export default SettingPage;
