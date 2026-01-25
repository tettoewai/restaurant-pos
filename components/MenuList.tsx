"use client";

import { Menu, MenuCategory, MenuCategoryMenu, DisabledLocationMenu } from "@prisma/client";
import { useState } from "react";
import MenuCard from "./MenuCard";
import UpdateMenuDialog from "./UpdateMenuDailog";
import { useDisclosure } from "@heroui/react";
import { Suspense } from "react";
import { MenuLoading } from "@/app/ui/skeletons";

interface Props {
    menus: Menu[];
    categories: MenuCategory[];
    menuCategoryMenu: MenuCategoryMenu[];
    disableLocationMenu: DisabledLocationMenu[];
}

export default function MenuList({
    menus,
    categories,
    menuCategoryMenu,
    disableLocationMenu,
}: Props) {
    const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
    const [selectedMenuForUpdate, setSelectedMenuForUpdate] = useState<{
        id: number;
        menu?: Menu;
        menuCategoryMenu?: MenuCategoryMenu[];
    } | null>(null);

    const handleEditMenu = (
        id: number,
        menu: Menu,
        menuCategoryMenu: MenuCategoryMenu[]
    ) => {
        setSelectedMenuForUpdate({ id, menu, menuCategoryMenu });
        onOpen();
    };

    const handleClose = () => {
        setSelectedMenuForUpdate(null);
        onClose();
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-2">
                {menus.map((item, index) => {
                    const currentMenuCategoryMenu = menuCategoryMenu.filter(
                        (mcm) => mcm.menuId === item.id
                    );
                    return (
                        <Suspense key={item.id} fallback={<MenuLoading />}>
                            <MenuCard
                                menu={item}
                                categories={categories}
                                menuCategoryMenu={menuCategoryMenu}
                                disableLocationMenu={disableLocationMenu}
                                onEditMenu={handleEditMenu}
                            />
                        </Suspense>
                    );
                })}
            </div>
            {selectedMenuForUpdate && (
                <UpdateMenuDialog
                    key={selectedMenuForUpdate.id}
                    id={selectedMenuForUpdate.id}
                    menuCategory={categories}
                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                    onClose={handleClose}
                    menu={selectedMenuForUpdate.menu}
                    menuCategoryMenu={selectedMenuForUpdate.menuCategoryMenu}
                />
            )}
        </>
    );
}
