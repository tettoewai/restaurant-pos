"use client";
import { checkWMSAction } from "@/app/lib/warehouse/action";
import {
  addToast,
  Button,
  Card,
  CardBody,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import {
  DangerTriangle,
  CheckCircle,
  ArrowRight,
} from "@solar-icons/react/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WMSResult {
  menusWithoutIngredients: { id: number; name: string }[];
  addonsWithoutIngredients: {
    addons: { id: number; name: string }[];
    menuId: number;
    menuName: string;
  }[];
  notEnoughIngredients: {
    itemId: number;
    itemName: string;
    required: number;
    stock: number;
    shortage: number;
  }[];
  hitThresholdStocks: {
    itemId: number;
    itemName: string;
    threshold: number;
    stock: number;
  }[];
}

export default function CheckWMSDialog() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const router = useRouter();

  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<WMSResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleCheckWMS = async () => {
    setChecking(true);
    setShowResults(false);
    const response = await checkWMSAction();
    setChecking(false);

    if (response.isSuccess && response.data) {
      setResults(response.data);
      setShowResults(true);
      addToast({
        title: "WMS check completed successfully",
        color: "success",
      });
    } else {
      addToast({
        title: response.message || "Failed to check WMS",
        color: "danger",
      });
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setResults(null);
    onClose();
  };

  const hasIssues =
    results &&
    (results.menusWithoutIngredients.length > 0 ||
      results.addonsWithoutIngredients.length > 0 ||
      results.notEnoughIngredients.length > 0 ||
      results.hitThresholdStocks.length > 0);

  return (
    <div className="relative">
      <Button
        onPress={onOpen}
        variant="ghost"
        color="primary"
        endContent={<CheckCircle size={16} />}
      >
        Check
      </Button>
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={!checking}
        scrollBehavior="inside"
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {showResults ? "WMS Check Results" : "Checking WMS"}
          </ModalHeader>
          <ModalBody>
            {checking ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" variant="wave" />
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Checking warehouse management system...
                </p>
              </div>
            ) : showResults && results ? (
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
                    {results.menusWithoutIngredients.length > 0 && (
                      <Card className="border border-yellow-200 dark:border-yellow-800">
                        <CardBody>
                          <div className="flex items-center gap-2 mb-3">
                            <DangerTriangle
                              className="text-yellow-600 dark:text-yellow-400"
                              size={20}
                            />
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Menus Without Ingredients (
                              {results.menusWithoutIngredients.length})
                            </h3>
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm mb-3">
                            {results.menusWithoutIngredients.map((menu) => (
                              <li
                                key={menu.id}
                                className="text-gray-700 dark:text-gray-300"
                              >
                                {menu.name}
                              </li>
                            ))}
                          </ul>
                          <Button
                            size="sm"
                            className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                            onPress={() => {
                              router.push("/warehouse/item-ingredient");
                              handleClose();
                            }}
                            endContent={<ArrowRight size={16} />}
                          >
                            Configure Menu Ingredients
                          </Button>
                        </CardBody>
                      </Card>
                    )}

                    {results.addonsWithoutIngredients.length > 0 && (
                      <Card className="border border-yellow-200 dark:border-yellow-800">
                        <CardBody>
                          <div className="flex items-center gap-2 mb-3">
                            <DangerTriangle
                              className="text-yellow-600 dark:text-yellow-400"
                              size={20}
                            />
                            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                              Addons Without Ingredients (
                              {results.addonsWithoutIngredients.length})
                            </h3>
                          </div>
                          <div className="space-y-2 text-sm mb-3">
                            {results.addonsWithoutIngredients.map(
                              (item, idx) => (
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
                              )
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="w-full bg-yellow-600 text-white hover:bg-yellow-700"
                            onPress={() => {
                              router.push("/warehouse/addon-ingredient");
                              handleClose();
                            }}
                            endContent={<ArrowRight size={16} />}
                          >
                            Configure Addon Ingredients
                          </Button>
                        </CardBody>
                      </Card>
                    )}

                    {results.notEnoughIngredients.length > 0 && (
                      <Card className="border border-red-200 dark:border-red-800">
                        <CardBody>
                          <div className="flex items-center gap-2 mb-3">
                            <DangerTriangle
                              className="text-red-600 dark:text-red-400"
                              size={20}
                            />
                            <h3 className="font-semibold text-red-800 dark:text-red-200">
                              Insufficient Stock (
                              {results.notEnoughIngredients.length})
                            </h3>
                          </div>
                          <div className="space-y-2 text-sm mb-3">
                            {results.notEnoughIngredients.map((item) => (
                              <div
                                key={item.itemId}
                                className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded"
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {item.itemName}
                                </span>
                                <div className="text-right">
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Stock: {item.stock} / Required:{" "}
                                    {item.required}
                                  </p>
                                  <p className="text-red-600 dark:text-red-400 font-semibold">
                                    Shortage: {item.shortage}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-red-600 text-white hover:bg-red-700"
                              onPress={() => {
                                router.push("/warehouse/purchase-order");
                                handleClose();
                              }}
                              endContent={<ArrowRight size={16} />}
                            >
                              Create Purchase Order
                            </Button>
                            <Button
                              size="sm"
                              variant="bordered"
                              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onPress={() => {
                                router.push("/warehouse/stock");
                                handleClose();
                              }}
                              endContent={<ArrowRight size={16} />}
                            >
                              View Stock
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {results.hitThresholdStocks.length > 0 && (
                      <Card className="border border-orange-200 dark:border-orange-800">
                        <CardBody>
                          <div className="flex items-center gap-2 mb-3">
                            <DangerTriangle
                              className="text-orange-600 dark:text-orange-400"
                              size={20}
                            />
                            <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                              Low Stock - Below Threshold (
                              {results.hitThresholdStocks.length})
                            </h3>
                          </div>
                          <div className="space-y-2 text-sm mb-3">
                            {results.hitThresholdStocks.map((item) => (
                              <div
                                key={item.itemId}
                                className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded"
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  {item.itemName}
                                </span>
                                <div className="text-right">
                                  <p className="text-gray-600 dark:text-gray-400">
                                    Stock: {item.stock} / Threshold:{" "}
                                    {item.threshold}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-orange-600 text-white hover:bg-orange-700"
                              onPress={() => {
                                router.push("/warehouse/purchase-order");
                                handleClose();
                              }}
                              endContent={<ArrowRight size={16} />}
                            >
                              Create Purchase Order
                            </Button>
                            <Button
                              size="sm"
                              variant="bordered"
                              className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                              onPress={() => {
                                router.push("/warehouse/stock");
                                handleClose();
                              }}
                              endContent={<ArrowRight size={16} />}
                            >
                              View Stock
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="py-4">
                <p className="text-gray-700 dark:text-gray-300">
                  This will check the warehouse management system for:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Menus without ingredients configured</li>
                  <li>Addons without ingredients configured</li>
                  <li>Insufficient stock levels</li>
                  <li>Items below threshold levels</li>
                </ul>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {showResults ? (
              <Button
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                onPress={handleClose}
              >
                Close
              </Button>
            ) : (
              <>
                <Button
                  className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
                  onPress={handleClose}
                  isDisabled={checking}
                >
                  Cancel
                </Button>
                <Button
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  onPress={handleCheckWMS}
                  isDisabled={checking}
                >
                  {checking ? "Checking..." : "Check WMS"}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
