"use client";

import { PromotionMenu } from "@prisma/client";
import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from "react";

export interface CartItem {
  id: string;
  menuId: number;
  addons: number[];
  quantity: number;
  instruction?: string;
  isFoc?: boolean;
  subTotal?: number;
}

// Define the shape of the context value
interface OrderContext {
  carts: CartItem[];
  setCarts: Dispatch<SetStateAction<CartItem[]>>;
  promotionQue: PromotionMenu[];
  setPromotionQue: Dispatch<SetStateAction<PromotionMenu[]>>;
}

// Create a Context with a default value of null or an initial state
export const OrderContext = createContext<OrderContext>({} as OrderContext);

const OrderContextProvider = ({ children }: { children: ReactNode }) => {
  const [carts, setCarts] = useState([] as CartItem[]);
  const [promotionQue, setPromotionQue] = useState([] as PromotionMenu[]);

  return (
    <OrderContext.Provider
      value={{ carts, setCarts, promotionQue, setPromotionQue }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContextProvider;
