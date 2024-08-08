import { Select, SelectItem } from "@nextui-org/react";
import { AddonCategory, Menu, MenuCategory } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

interface Props {
  selectedList: Set<string>;
  setSelectedList: Dispatch<SetStateAction<Set<string>>>;
  list?: MenuCategory[];
  menuList?: Menu[];
  addonCategoryList?: AddonCategory[];
  isRequired: boolean;
  itemType: "menu" | "addonCategory" | "addon";
}

export default function MultipleSelector({
  selectedList,
  setSelectedList,
  list,
  isRequired,
  menuList,
  addonCategoryList,
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
    itemType === "menu"
      ? list
      : itemType === "addonCategory"
      ? menuList
      : itemType === "addon"
      ? addonCategoryList
      : null;
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
            : itemType === "addon"
            ? "Addon Category"
            : null
        }
        selectionMode={itemType != "addon" ? "multiple" : "single"}
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
