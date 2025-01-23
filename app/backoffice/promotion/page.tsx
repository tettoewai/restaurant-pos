import {
  fetchFocCategoryAndFocMenu,
  fetchMenu,
  fetchPromotion,
  fetchPromotionMenu,
} from "@/app/lib/backoffice/data";
import { NewPromtionButton } from "@/components/Buttons";
import ListTable from "@/components/ListTable";
import MoreOptionButton from "@/components/MoreOptionButton";
import { convert12Hour, dateToString, formatCurrency } from "@/function";
import {
  Chip,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import { DISCOUNT } from "@prisma/client";

async function PromotionPage() {
  const promotion = await fetchPromotion();

  const promotionMenu = await fetchPromotionMenu();
  const menus = await fetchMenu();

  const columns = [
    { key: "key", label: "No." },
    { key: "name", label: "Name" },
    { key: "discountAmount", label: "Discount or FOC" },
    { key: "duration", label: "Duration" },
    { key: "menuOrPrice", label: "Menu Or Total price" },
    { key: "group", label: "Group" },
    { key: "status", label: "Status" },
    { key: "action", label: "Action" },
  ];

  const rows = await Promise.all(
    promotion.map(async (item, index) => {
      const name = (
        <div className="truncate max-w-36 max-h-20">
          <h3 className="font-semibold">{item.name}</h3>
          <span className="text-xs text-gray-400">{item.description}</span>
        </div>
      );
      const { focCategory, focMenu } = await fetchFocCategoryAndFocMenu(
        item.id
      );

      const focMenuChip =
        focCategory && focCategory.length && focMenu && focMenu.length ? (
          <div>
            {focCategory.slice(0, 1).map((item) => {
              const validFocMenuId = focMenu
                .filter((focM) => item.id === focM.focCategoryId)
                .map((focmenu) => focmenu.menuId);

              const validMenus = menus
                .filter((menu) => validFocMenuId.includes(menu.id))
                .map((menu) => menu.name);

              return (
                <Chip variant="bordered" key={item.id}>
                  {item.minSelection === 1
                    ? validMenus.join(" or ")
                    : validMenus.join(" , ")}{" "}
                  ({item.minSelection})
                </Chip>
              );
            })}
            {focCategory.length > 1 ? (
              <Popover placement="bottom-start" showArrow={true} size="sm">
                <PopoverTrigger>
                  <Chip variant="bordered" size="sm" className="cursor-pointer">
                    ....
                  </Chip>
                </PopoverTrigger>
                <PopoverContent className="p-2">
                  <div className="space-y-1 flex flex-col">
                    {focCategory.slice(1).map((item) => {
                      const validFocMenuId = focMenu
                        .filter((focM) => item.id === focM.focCategoryId)
                        .map((focmenu) => focmenu.menuId);

                      const validMenus = menus
                        .filter((menu) => validFocMenuId.includes(menu.id))
                        .map((menu) => menu.name);

                      return (
                        <Chip variant="bordered" key={item.id}>
                          {validMenus.join(", ")} ({item.minSelection})
                        </Chip>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        ) : null;

      const discountAmount =
        item.discount_type === DISCOUNT.PERCENTAGE
          ? `${item.discount_value} %`
          : item.discount_type === DISCOUNT.FIXED_AMOUNT && item.discount_value
          ? formatCurrency(item.discount_value)
          : focMenuChip;

      const startDate = dateToString({ date: item.start_date, type: "DMY" });
      const endDate = dateToString({ date: item.end_date, type: "DMY" });
      const conditions =
        item.conditions && JSON.parse(item.conditions?.toString());

      const conditionString = conditions
        ? conditions
            .map((condition: any) => {
              if (condition.days) {
                return condition.days.join(", ");
              }
              if (condition.startTime && condition.endTime) {
                return `From ${convert12Hour(
                  condition.startTime
                )} to ${convert12Hour(condition.endTime)}`;
              }
            })
            .filter((con: any) => con !== undefined)
            .join(" | ")
        : null;
      const duration = (
        <div className="max-w-80 max-h-20 truncate">
          <span className="text-sm">
            From {startDate} to {endDate}
            {conditionString ? ` (${conditionString})` : null}
          </span>
        </div>
      );
      const currentPromotionMenu = promotionMenu.filter(
        (promoMenu) => item.id === promoMenu.promotionId
      );
      const menuOrPrice = (
        <div>
          {currentPromotionMenu &&
            currentPromotionMenu.slice(0, 2).map((promoMenu) => {
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
                  {currentMenu?.name} ({promoMenu.quantity_required})
                </Chip>
              );
            })}
          {currentPromotionMenu.length > 2 ? (
            <Popover placement="bottom-start" showArrow={true} size="sm">
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
                      {item.quantity_required})
                    </Chip>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          ) : null}
          {item.totalPrice ? (
            <span>{formatCurrency(item.totalPrice)}</span>
          ) : null}
        </div>
      );
      const now = new Date();
      const isCurrentlyActive =
        item.is_active && item.start_date <= now && item.end_date >= now;

      return {
        key: index + 1,
        name,
        discountAmount,
        duration,
        menuOrPrice,
        group: (item.group || "") + `(${item.priority})`,
        status: isCurrentlyActive ? (
          <Chip color="success" className="text-white">
            Active
          </Chip>
        ) : !item.is_active ? (
          <Chip color="danger">Inactive</Chip>
        ) : !isCurrentlyActive ? (
          <Chip color="warning" className="text-white">
            Out of date
          </Chip>
        ) : null,
        action: (
          <MoreOptionButton
            itemType="promotion"
            id={item.id}
            menu={menus}
            promotion={item}
          />
        ),
      };
    })
  );

  return (
    <div>
      <div className="w-full flex justify-between items-center">
        <div className="flex flex-col pl-4">
          <span className="text-primary">Promotion</span>
          <span className="text-sm text-gray-600">Boost your business</span>
        </div>
        <NewPromtionButton />
      </div>
      <div className="mt-2">
        <ListTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}

export default PromotionPage;
