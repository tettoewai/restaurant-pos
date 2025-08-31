import { baseMetadata } from "@/app/lib/baseMetadata";
import CheckWMSDialog from "@/components/CheckWMSDialog";
import SignOutDialog from "@/components/SignOutDialog";
import UpdateCompanyDialog from "@/components/UpdateCompanyDailog";
import { Card, Link as NextUiLink } from "@heroui/react";
import { Metadata } from "next";
import Link from "next/link";
import { BsBuildingGear, BsHouseCheck } from "react-icons/bs";
import { HiOutlineReceiptRefund } from "react-icons/hi2";
import { IoIosArrowForward } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";

export const metadata: Metadata = {
  ...baseMetadata,
  title: `Setting | ${baseMetadata.title}`,
};

function SettingPage() {
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
          href={"/backoffice/recent-receipt"}
          as={Link}
          className="w-full"
        >
          <Card className={itemClass} fullWidth radius="sm">
            <div className="flex items-center">
              <HiOutlineReceiptRefund className=" size-6 mr-2" />
              <span>Recent receipt</span>
            </div>
            <IoIosArrowForward className="size-6 " />
          </Card>
        </NextUiLink>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <BsHouseCheck className=" size-6 mr-2" />
            <span>Warehouse Management System</span>
          </div>
          <CheckWMSDialog />
        </Card>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <BsBuildingGear className=" size-6 mr-2" />
            <span>Company</span>
          </div>

          <UpdateCompanyDialog />
        </Card>
        <Card className={itemClass} fullWidth radius="sm">
          <div className="flex items-center">
            <VscAccount className=" size-6 mr-2" />
            <span>Account</span>
          </div>

          <SignOutDialog />
        </Card>
      </div>
    </div>
  );
}

export default SettingPage;
