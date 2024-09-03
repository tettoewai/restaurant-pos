"use client";

import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

export interface CartItem {
  id: string;
  menuId: number;
  addons: number[];
  quantity: number;
  instructions?: string;
}

// Define the shape of the context value
interface OrderContext {
  carts: CartItem[];
  setCarts: Dispatch<SetStateAction<CartItem[]>>;
}

// Create a Context with a default value of null or an initial state
export const OrderContext = createContext<OrderContext>({} as OrderContext);

const OrderContextProvider = ({ children }: { children: ReactNode }) => {
  const [carts, setCarts] = useState([] as CartItem[]);

  return (
    <OrderContext.Provider value={{ carts, setCarts }}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContextProvider;
