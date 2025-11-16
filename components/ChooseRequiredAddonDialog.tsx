"use client";
import {
  fetchAddonCategoryWithIds,
  fetchAddonWithAddonCatIds,
} from "@/app/lib/backoffice/data";
import {
  Button,
  Card,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { Menu } from "@prisma/client";
import useSWR from "swr";

interface Props {
  menuRequiredAddonCatQue: {
    menuId: number;
    addonCategoryIds: number[];
  }[];
  isOpen: boolean;
  onOpenChange: () => void;
  onClose: () => void;
  menus: Menu[];
  focAddonCategory: {
    menuId: number;
    addonCategoryId: number;
    addonId: number;
  }[];
  setFocAddonCategory: React.Dispatch<
    React.SetStateAction<
      {
        menuId: number;
        addonCategoryId: number;
        addonId: number;
      }[]
    >
  >;
  handleSetAddonCategory: () => void;
  creatingMenuAddonCategory: boolean;
  promotionId?: number;
}

export default function ChooseRequiredAddonDialog({
  menuRequiredAddonCatQue,
  isOpen,
  onClose,
  onOpenChange,
  menus,
  focAddonCategory,
  setFocAddonCategory,
  handleSetAddonCategory,
  creatingMenuAddonCategory,
  promotionId,
}: Props) {
  const addonCategoryIds = menuRequiredAddonCatQue.reduce(
    (acc: number[], item) => {
      item.addonCategoryIds.map((addonCat) => {
        if (!acc.includes(addonCat)) {
          acc.push(addonCat);
        }
      });
      return acc;
    },
    []
  );
  const { data: addonCategory } = useSWR(
    isOpen && addonCategoryIds.length
      ? `addonCategory-${addonCategoryIds}`
      : null,
    () => fetchAddonCategoryWithIds(addonCategoryIds)
  );

  const { data: addons } = useSWR(
    isOpen && addonCategoryIds.length ? `addons-${addonCategoryIds}` : null,
    () => fetchAddonWithAddonCatIds(addonCategoryIds)
  );

  return (
    <div className="relative">
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="bg-background"
        placement="center"
        isDismissable={false}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h1>Choose required addons.</h1>
            <span className="text-sm text-default-500">
              Menu that you choose for FOC has required addon category. Which
              addon will you give customers.
            </span>
          </ModalHeader>
          <ModalBody>
            {menuRequiredAddonCatQue.map((menuRequiredAddonCat) => {
              const validMenu = menus.find(
                (menu) => menu.id === menuRequiredAddonCat.menuId
              );
              return (
                <Card
                  key={menuRequiredAddonCat.menuId}
                  className="p-1 border-1"
                  shadow="none"
                >
                  <h1>{validMenu?.name}</h1>
                  {menuRequiredAddonCat.addonCategoryIds.map((addonCatId) => {
                    const validAddonCategory = addonCategory?.find(
                      (item) => item.id === addonCatId
                    );
                    const validAddon = addons?.filter(
                      (item) => item.addonCategoryId === addonCatId
                    );
                    return (
                      <div key={addonCatId}>
                        <h5>{validAddonCategory?.name}</h5>
                        <div className="flex space-x-1 justify-between w-full">
                          {validAddon?.map((valAddon) => (
                            <div
                              key={valAddon.id}
                              className="border rounded-md flex justify-between items-center p-1 cursor-pointer"
                            >
                              <Checkbox
                                size="sm"
                                isSelected={Boolean(
                                  focAddonCategory.find(
                                    (item) =>
                                      item.addonId === valAddon.id &&
                                      item.addonCategoryId ===
                                        validAddonCategory?.id &&
                                      item.menuId === validMenu?.id
                                  )
                                )}
                                required
                                isRequired
                                onChange={() => {
                                  setFocAddonCategory((prevFocAddonCat) => {
                                    const filtered = prevFocAddonCat.filter(
                                      (item) =>
                                        item.addonCategoryId !==
                                          validAddonCategory?.id ||
                                        item.menuId !== validMenu?.id
                                    );
                                    if (validAddonCategory && validMenu) {
                                      return [
                                        ...filtered,
                                        {
                                          addonCategoryId:
                                            validAddonCategory.id,
                                          addonId: valAddon.id,
                                          menuId: validMenu.id,
                                        },
                                      ];
                                    }
                                    return filtered;
                                  });
                                }}
                              >
                                {valAddon.name}
                                <span className="text-sm">
                                  + {valAddon.price}
                                </span>
                              </Checkbox>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </ModalBody>
          <ModalFooter>
            <Button
              className="mr-2 px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-900 rounded-md hover:bg-gray-300 focus:outline-none"
              onPress={onClose}
              isDisabled={creatingMenuAddonCategory}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSetAddonCategory}
              isDisabled={creatingMenuAddonCategory}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              {creatingMenuAddonCategory ? (
                <>
                  <span>Creating promotion</span>
                  <Spinner color="white" variant="wave" />
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
