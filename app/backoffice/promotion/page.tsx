import { fetchMenu, getPromotionAndMenu } from "@/app/lib/backoffice/data";
import { formatCurrency } from "@/function";
import ListTable from "@/components/ListTable";
import MoreOptionButton from "@/components/MoreOptionButton";
import NewPromotionDialog from "@/components/NewPromotionDialog";
import { dateToString } from "@/function";
import {
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { DISCOUNT } from "@prisma/client";

async function PromotionPage() {
  const { promotion, promotionMenu } = await getPromotionAndMenu();
  const menus = await fetchMenu();

  const columns = [
    { key: "key", label: "No." },
    { key: "name", label: "Name" },
    { key: "discountAmount", label: "Discount" },
    { key: "duration", label: "Duration" },
    { key: "menuAndQuantity", label: "Menu & Qty" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ];

  const rows = promotion.map((item, index) => {
    const name = (
      <div className="truncate max-w-36 max-h-20">
        <h3 className="font-semibold">{item.name}</h3>
        <span className="text-xs text-gray-400">{item.description}</span>
      </div>
    );
    const description = item.description;
    const discountAmount = `${
      item.discount_type === DISCOUNT.PERCENTAGE
        ? item.discount_value + " %"
        : formatCurrency(item.discount_value)
    }`;
    const startDate = dateToString({ date: item.start_date, type: "DMY" });
    const endDate = dateToString({ date: item.end_date, type: "DMY" });
    const duration = `From ${startDate} to ${endDate}`;
    const currentPromotionMenu = promotionMenu.filter(
      (promoMenu) => item.id === promoMenu.promotionId
    );
    const menuAndQuantity = (
      <div>
        {currentPromotionMenu.slice(0, 2).map((promoMenu) => {
          const currentMenu = menus.find(
            (menu) => menu.id === promoMenu.menuId
          );
          return (
            <Chip
              variant="bordered"
              size="sm"
              key={promoMenu.id}
              className="mr-1"
            >
              {currentMenu?.name} ({promoMenu.quantity_requried})
            </Chip>
          );
        })}
        {currentPromotionMenu.length > 2 ? (
          <Popover placement="bottom-start" showArrow={true}>
            <PopoverTrigger>
              <Chip variant="bordered" size="sm" className="cursor-pointer">
                ....
              </Chip>
            </PopoverTrigger>
            <PopoverContent className="p-2">
              <div className="space-y-1 flex flex-col">
                {currentPromotionMenu.slice(2).map((item) => (
                  <Chip variant="bordered" size="sm" key={item.id}>
                    {menus.find((menu) => menu.id === item.menuId)?.name} (
                    {item.quantity_requried})
                  </Chip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    );
    return {
      key: index + 1,
      name,
      discountAmount,
      duration,
      menuAndQuantity,
      status: item.is_active ? (
        <Chip color="primary">Active</Chip>
      ) : (
        <Chip>Inactive</Chip>
      ),
      action: (
        <MoreOptionButton
          itemType="promotion"
          id={item.id}
          menu={menus}
          promotion={item}
        />
      ),
    };
  });
  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Promotion</span>
          <span className="text-sm text-gray-600">Boost your business</span>
        </div>
        <NewPromotionDialog menus={menus} />
      </div>
      <div className="mt-2">
        <ListTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}

export default PromotionPage;
