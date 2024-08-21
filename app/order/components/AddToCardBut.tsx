import { Button, Input } from "@nextui-org/react";
import React from "react";
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";

export default function AddToCardBut() {
  return (
    <div className="flex flex-wrap w-full fixed bottom-0 left-0 rounded-t-md p-2 z-20 bg-background">
      <div className=" flex space-x-1 w-1/4">
        <button>
          <CiCirclePlus className="size-6 text-primary" />
        </button>
        <Input
          variant="flat"
          className="w-8"
          radius="sm"
          type="number"
          defaultValue="1"
        />
        <button>
          <CiCircleMinus className="size-6 text-primary" />
        </button>
      </div>

      <Button className="text-white bg-primary w-3/4">Add to cart</Button>
    </div>
  );
}
