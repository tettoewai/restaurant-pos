"use client";
import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure,
} from "@nextui-org/react";
import { MenuCategory } from "@prisma/client";
import { IoMdMore } from "react-icons/io";
import { MdDelete, MdEdit } from "react-icons/md";
import DeleteMenuDialog from "./DeleteMenuDailog";
import UpdateMenuDialog from "./UpdateMenuDailog";

interface Props {
  id: number;
  itemType: "menu" | "menuCategory";
  categories?: MenuCategory[];
}

export default function MoreOptionButton({ id, itemType, categories }: Props) {
  const {
    isOpen: isUpdateOpen,
    onOpen: onUpdateOpen,
    onOpenChange: onUpdateOpenChange,
    onClose: onUpdateClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
    onClose: onDeleteClose,
  } = useDisclosure();
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
            onClick={onUpdateOpen}
          >
            Edit
          </DropdownItem>
          <DropdownItem
            key="delete"
            className="text-danger"
            color="danger"
            endContent={<MdDelete className={cn(iconClasses, "text-danger")} />}
            onClick={onDeleteOpen}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <UpdateMenuDialog
        id={id}
        menuCategory={categories}
        isOpen={isUpdateOpen}
        onOpenChange={onUpdateOpenChange}
        onClose={onUpdateClose}
      />
      <DeleteMenuDialog
        id={id}
        onClose={onDeleteClose}
        onOpenChange={onDeleteOpenChange}
        isOpen={isDeleteOpen}
      />
    </>
  );
}
