import { Select, SelectItem } from "@nextui-org/react";
import { MenuCategory } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

interface Props {
  selectedList: Set<string>;
  setSelectedList: Dispatch<SetStateAction<Set<string>>>;
  list: MenuCategory[];
  isRequired: boolean;
}

export default function MultipleSelector({
  selectedList,
  setSelectedList,
  list,
  isRequired,
}: Props) {
  const handleSelectionChange = (e: any) => {
    const value = e.target.value;
    if (value.length === 0) {
      setSelectedList(new Set());
    } else {
      setSelectedList(new Set(e.target.value.split(",")));
    }
  };
  return (
    <div>
      <Select
        isRequired
        label="Menu Category"
        selectionMode="multiple"
        selectedKeys={selectedList}
        onChange={handleSelectionChange}
        variant="bordered"
        className="outline-none"
      >
        {list.map((item) => (
          <SelectItem key={item.id}>{item.name}</SelectItem>
        ))}
      </Select>
    </div>
  );
}
