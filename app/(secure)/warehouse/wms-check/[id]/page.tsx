import { fetchWMSCheckResult } from "@/app/lib/warehouse/data";
import {
  Button,
  Card,
  CardBody,
} from "@heroui/react";
import {
  DangerTriangle,
  CheckCircle,
  ArrowRight,
} from "@solar-icons/react/ssr";
import { notFound } from "next/navigation";
import Link from "next/link";

interface WMSCheckResultPageProps {
  params: {
    id: string;
  };
}

export default async function WMSCheckResultPage({
  params,
}: WMSCheckResultPageProps) {
  const resultId = parseInt(params.id);
  if (isNaN(resultId)) {
    notFound();
  }

  const result = await fetchWMSCheckResult(resultId);
  if (!result) {
    notFound();
  }

  // Parse JSON fields
  const menusWithoutIngredients = result.menusWithoutIngredients as {
    id: number;
    name: string;
  }[];
  const addonsWithoutIngredients = result.addonsWithoutIngredients as {
    addons: { id: number; name: string }[];
    menuId: number;
    menuName: string;
  }[];
  const notEnoughIngredients = result.notEnoughIngredients as {
    itemId: number;
    itemName: string;
    required: number;
    stock: number;
    shortage: number;
  }[];
  const hitThresholdStocks = result.hitThresholdStocks as {
    itemId: number;
    itemName: string;
    threshold: number;
    stock: number;
  }[];

  const hasIssues =
    menusWithoutIngredients.length > 0 ||
    addonsWithoutIngredients.length > 0 ||
    notEnoughIngredients.length > 0 ||
    hitThresholdStocks.length > 0;

  const createdAt = new Date(result.createdAt);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">WMS Check Results</h1>
        <p className="text-sm text-gray-600">
          Checked on {createdAt.toLocaleString()}
        </p>
      </div>

      <div className="space-y-4">
        {!hasIssues ? (
          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <CardBody className="flex flex-row items-center gap-3">
              <CheckCircle
                className="text-green-600 dark:text-green-400"
                size={24}
              />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  All checks passed!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  No issues found in the warehouse management system.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {menusWithoutIngredients.length > 0 && (
              <Card className="border border-yellow-200 dark:border-yellow-800">
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <DangerTriangle
                      className="text-yellow-600 dark:text-yellow-400"
                      size={20}
                    />
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Menus Without Ingredients ({menusWithoutIngredients.length})
                    </h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                    {menusWithoutIngredients.map((menu) => (
                      <li
                        key={menu.id}
                        className="text-gray-700 dark:text-gray-300"
                      >
                        {menu.name}
                      </li>
                    ))}
                  </ul>
                  <WMSActionButton
                    href="/warehouse/item-ingredient"
                    label="Configure Menu Ingredients"
                    variant="yellow"
                  />
                </CardBody>
              </Card>
            )}

            {addonsWithoutIngredients.length > 0 && (
              <Card className="border border-yellow-200 dark:border-yellow-800">
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <DangerTriangle
                      className="text-yellow-600 dark:text-yellow-400"
                      size={20}
                    />
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Addons Without Ingredients ({addonsWithoutIngredients.length})
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    {addonsWithoutIngredients.map((item, idx) => (
                      <div
                        key={idx}
                        className="pl-4 border-l-2 border-yellow-300 dark:border-yellow-700"
                      >
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          Menu: {item.menuName}
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700 dark:text-gray-300">
                          {item.addons.map((addon) => (
                            <li key={addon.id}>{addon.name}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <WMSActionButton
                    href="/warehouse/addon-ingredient"
                    label="Configure Addon Ingredients"
                    variant="yellow"
                  />
                </CardBody>
              </Card>
            )}

            {notEnoughIngredients.length > 0 && (
              <Card className="border border-red-200 dark:border-red-800">
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <DangerTriangle
                      className="text-red-600 dark:text-red-400"
                      size={20}
                    />
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Insufficient Stock ({notEnoughIngredients.length})
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    {notEnoughIngredients.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {item.itemName}
                        </span>
                        <div className="text-right">
                          <p className="text-gray-600 dark:text-gray-400">
                            Stock: {item.stock} / Required: {item.required}
                          </p>
                          <p className="text-red-600 dark:text-red-400 font-semibold">
                            Shortage: {item.shortage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <WMSActionButton
                      href="/warehouse/purchase-order"
                      label="Create Purchase Order"
                      variant="red"
                      fullWidth
                    />
                    <WMSActionButton
                      href="/warehouse/stock"
                      label="View Stock"
                      variant="red-outline"
                      fullWidth
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {hitThresholdStocks.length > 0 && (
              <Card className="border border-orange-200 dark:border-orange-800">
                <CardBody>
                  <div className="flex items-center gap-2 mb-3">
                    <DangerTriangle
                      className="text-orange-600 dark:text-orange-400"
                      size={20}
                    />
                    <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                      Low Stock - Below Threshold ({hitThresholdStocks.length})
                    </h3>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    {hitThresholdStocks.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {item.itemName}
                        </span>
                        <div className="text-right">
                          <p className="text-gray-600 dark:text-gray-400">
                            Stock: {item.stock} / Threshold: {item.threshold}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <WMSActionButton
                      href="/warehouse/purchase-order"
                      label="Create Purchase Order"
                      variant="orange"
                      fullWidth
                    />
                    <WMSActionButton
                      href="/warehouse/stock"
                      label="View Stock"
                      variant="orange-outline"
                      fullWidth
                    />
                  </div>
                </CardBody>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WMSActionButton({
  href,
  label,
  variant,
  fullWidth = false,
}: {
  href: string;
  label: string;
  variant: "yellow" | "red" | "red-outline" | "orange" | "orange-outline";
  fullWidth?: boolean;
}) {
  const variantClasses = {
    yellow: "bg-yellow-600 text-white hover:bg-yellow-700",
    red: "bg-red-600 text-white hover:bg-red-700",
    "red-outline":
      "border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
    orange: "bg-orange-600 text-white hover:bg-orange-700",
    "orange-outline":
      "border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20",
  };

  return (
    <Link href={href} className={fullWidth ? "flex-1" : "w-full"}>
      <Button
        size="sm"
        className={`w-full ${variantClasses[variant]} ${
          variant.includes("outline") ? "variant-bordered" : ""
        }`}
        endContent={<ArrowRight size={16} />}
      >
        {label}
      </Button>
    </Link>
  );
}

