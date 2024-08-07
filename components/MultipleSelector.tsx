import { Select, SelectItem } from "@nextui-org/react";
import { Menu, MenuCategory } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

interface Props {
  selectedList: Set<string>;
  setSelectedList: Dispatch<SetStateAction<Set<string>>>;
  list?: MenuCategory[];
  menuList?: Menu[];
  isRequired: boolean;
  itemType: "menu" | "addonCategory";
}

export default function MultipleSelector({
  selectedList,
  setSelectedList,
  list,
  isRequired,
  menuList,
  itemType,
}: Props) {
  const handleSelectionChange = (e: any) => {
    const value = e.target.value;
    if (value.length === 0) {
      setSelectedList(new Set());
    } else {
      setSelectedList(new Set(e.target.value.split(",")));
    }
  };
  const validList =
    itemType === "menu" ? list : itemType === "addonCategory" ? menuList : null;
  if (!validList) return;
  return (
    <div>
      <Select
        isRequired
        label={
          itemType === "menu"
            ? "Menu Category"
            : itemType === "addonCategory"
            ? "Menu"
            : null
        }
        selectionMode="multiple"
        selectedKeys={selectedList}
        onChange={handleSelectionChange}
        variant="bordered"
        className="outline-none"
      >
        {validList.map((item) => (
          <SelectItem key={item.id}>{item.name}</SelectItem>
        ))}
      </Select>
    </div>
  );
}
