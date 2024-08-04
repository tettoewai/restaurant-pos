"use client";
import {
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure,
} from "@nextui-org/react";
import { MenuCategory } from "@prisma/client";
import { useState } from "react";
import { IoMdMore } from "react-icons/io";
import UpdateMenuDialog from "./UpdateMenuDailog";
import { MdDelete, MdEdit } from "react-icons/md";

interface Props {
  id: number;
  itemType: "menu";
  categories: MenuCategory[];
}

export default function MoreOptionButton({ id, itemType, categories }: Props) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const iconClasses =
    "text-xl text-default-500 pointer-events-none flex-shrink-0";
  return (
    <>
      <Dropdown>
        <DropdownTrigger>
          <button className="bg-background rounded-md bg-opacity-40 outline-none">
            <IoMdMore className="size-7" />
          </button>
        </DropdownTrigger>
        <DropdownMenu variant="faded">
          <DropdownItem
            key="edit"
            endContent={<MdEdit className={iconClasses} />}
            onClick={onOpen}
          >
            Edit file
          </DropdownItem>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            endContent={<MdDelete className={cn(iconClasses, "text-danger")} />}
          >
            Delete file
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <UpdateMenuDialog
        id={id}
        menuCategory={categories}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onClose={onClose}
      />
    </>
  );
}
