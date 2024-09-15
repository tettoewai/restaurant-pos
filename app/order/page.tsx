import Order from "./components/Order";
import CheckLocationOrder from "./components/CheckLocationOrder";

const OrderPage = ({
  searchParams,
}: {
  searchParams: { tableId: string; menuCat: string };
}) => {
  const tableId = Number(searchParams.tableId);
  const menuCat = Number(searchParams.menuCat);
  return (
    <CheckLocationOrder tableId={tableId}>
      <Order tableId={tableId} menuCat={menuCat} />
    </CheckLocationOrder>
  );
};
export default OrderPage;
