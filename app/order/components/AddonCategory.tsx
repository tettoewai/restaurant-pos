"use client";
import {
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  Radio,
  RadioGroup,
} from "@nextui-org/react";
import { Addon, AddonCategory } from "@prisma/client";
import clsx from "clsx";
import React, { useState } from "react";
import { IoMdRadioButtonOn } from "react-icons/io";
import { MdRadioButtonChecked } from "react-icons/md";

interface Props {
  item: AddonCategory;
  validAddon: Addon[];
}

export default function AddonCategoryCard({ item, validAddon }: Props) {
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const handleChange = (value: number) => {
    setSelectedValue(
      selectedValue === String(value) && !item.isRequired ? null : String(value)
    );
  };

  return (
    <Card
      key={item.id}
      className={clsx("p-3 border", {
        "border-primary": item.isRequired,
      })}
    >
      <div className="flex justify-between mb-2">
        <span className="text-lg">{item.name}</span>
        {item.isRequired && (
          <Chip className="bg-primary text-white">Required</Chip>
        )}
      </div>
      <div className="flex flex-col space-y-2">
        {validAddon.map((valAddon) => (
          <div
            key={valAddon.id}
            className="border rounded-md w-full flex justify-between items-center p-2 cursor-pointer"
            onClick={() => handleChange(valAddon.id)}
          >
            <Checkbox
              size="lg"
              isSelected={selectedValue === String(valAddon.id)}
              onChange={(value) => handleChange(valAddon.id)}
            >
              {valAddon.name}
            </Checkbox>

            <span>+ {valAddon.price}Kyats</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
