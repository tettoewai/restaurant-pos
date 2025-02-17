import { useState } from "react";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";

const YearPicker = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const years = Array.from({ length: 121 }, (_, i) => currentYear - i);

  return (
    <div>
      <Dropdown>
        <DropdownTrigger>{selectedYear}</DropdownTrigger>
        <DropdownMenu
          aria-label="Year Selection"
          onAction={(key) => setSelectedYear(parseInt(String(key), 10))}
        >
          {years.map((year) => (
            <DropdownItem key={year}>{year}</DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <p>Selected Year: {selectedYear}</p>
    </div>
  );
};

export default YearPicker;
