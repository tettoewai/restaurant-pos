import {
  fetchMenuWithIds,
  fetchPromotionMenuWithPromoId,
  fetchPromotionWithId,
} from "@/app/lib/backoffice/data";
import { fetchFocMenuWithPromotiionId } from "@/app/lib/order/data";
import {
  checkPromotionDuration,
  checkTimeInDuration,
  convert12Hour,
  formatCurrency,
} from "@/function";
import {
  Card,
  Chip,
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@nextui-org/react";
import NextImage from "next/image";
import GetPromotion from "../../components/GetPromotion";
import { weekday } from "@/general";

const PromotionPage = async ({ params }: { params: { id: string } }) => {
  const promotionId = Number(params.id);
  const promotion = await fetchPromotionWithId(promotionId);

  if (!promotion) return <h1 className="pt-4">There is no promotion!</h1>;

  const isFoc = promotion.discount_type === "FOCMENU";

  const focData = isFoc
    ? await fetchFocMenuWithPromotiionId(promotion.id)
    : undefined;

  const focCategoryId = focData?.focCategory.map((item) => item.id);
  const promotionMenu = !promotion.totalPrice
    ? await fetchPromotionMenuWithPromoId(promotionId)
    : [];
  const menuIds: number[] = [];
  const focMenuIds = focData?.focMenu
    .filter((item) => focCategoryId?.includes(item.focCategoryId))
    .map((item) => item.menuId);
  focMenuIds && menuIds.push(...focMenuIds);
  const promotionMenuIds =
    promotionMenu && promotionMenu.map((item) => item.menuId);
  promotionMenuIds &&
    promotionMenuIds.length &&
    menuIds.push(...promotionMenuIds);
  const menus =
    menuIds && menuIds.length ? await fetchMenuWithIds(menuIds) : [];

  const promotionMenus = promotionMenu?.map((item) => {
    const validMenu = menus.find((menu) => menu.id === item.menuId);
    return `${validMenu?.name} (${item.quantity_required})`;
  });

  const conditions =
    promotion.conditions && JSON.parse(promotion.conditions.toString());
  const days: string =
    conditions &&
    conditions.length &&
    conditions
      .map((item: any) => (item.days ? item.days : []))
      .filter((item: any) => item !== undefined)
      .join(", ");

  const promotionAvailabel = checkPromotionDuration({ days, conditions });

  const duration =
    conditions &&
    conditions.length &&
    conditions.map((item: any) =>
      item.startTime && item.endTime
        ? `From ${convert12Hour(item.startTime)} to ${convert12Hour(
            item.endTime
          )}`
        : null
    );

  return (
    <div>
      <Card shadow="none" className="relative w-full h-full bg-background mt-2">
        <div className="absolute top-2 right-3 p-0 space-x-1">
          <Chip size="sm" variant="faded">
            <span>Priority</span> <span>{promotion.priority}</span>
          </Chip>
          {promotion.group && (
            <Chip size="sm" variant="faded">
              <span>{promotion.group}</span>
            </Chip>
          )}
        </div>

        <div className="w-full h-full items-center flex justify-center p-2">
          {promotion.imageUrl && (
            <Image
              isBlurred
              as={NextImage}
              src={promotion.imageUrl}
              alt="promotion image"
              height={240}
              width={240}
              className="object-fill h-full w-auto"
            />
          )}
        </div>
        <div className="pl-3 pb-2 flex flex-col">
          <div className="flex flex-col w-full">
            <h1 className="text-lg font-bold">{promotion.name}</h1>
            <h3 className="text-sm truncate">
              Buy{" "}
              {promotion.totalPrice
                ? `${formatCurrency(promotion.totalPrice)} or higher.`
                : promotionMenus?.join(", ")}
            </h3>
          </div>
          <div className="flex justify-end items-end flex-col text-end w-full pr-2">
            <h1 className="font-bold">{isFoc ? "Free Of Cost" : "Discount"}</h1>
            {promotion.discount_type === "PERCENTAGE" ? (
              <h1 className="font-extrabold text-3xl text-primary">
                {promotion.discount_value} %
              </h1>
            ) : promotion.discount_type === "FIXED_AMOUNT" &&
              promotion.discount_value ? (
              <h1 className="font-bold text-primary text-xl">
                {formatCurrency(promotion.discount_value)}
              </h1>
            ) : isFoc && focData?.focCategory && focData.focMenu ? (
              <div>
                {focData.focCategory.slice(0, 3).map((item) => {
                  const vaidFocMenuIds = focData.focMenu
                    .filter((focmenu) => focmenu.focCategoryId === item.id)
                    .map((menu) => menu.menuId);
                  const valdiFocMenu = menus
                    .filter((menu) => vaidFocMenuIds.includes(menu.id))
                    .map((menu) => menu.name)
                    .join(", ");

                  return (
                    <Chip size="sm" variant="bordered" key={item.id}>
                      {valdiFocMenu} ({item.minSelection})
                    </Chip>
                  );
                })}
                {focData.focCategory.length > 3 ? (
                  <Popover placement="bottom-start" showArrow={true} size="sm">
                    <PopoverTrigger>
                      <Chip
                        variant="bordered"
                        size="sm"
                        className="cursor-pointer"
                      >
                        ....
                      </Chip>
                    </PopoverTrigger>
                    <PopoverContent className="p-2">
                      <div className="space-y-1 flex flex-col">
                        {focData.focCategory.slice(3).map((item) => {
                          const vaidFocMenuIds = focData.focMenu
                            .filter(
                              (focmenu) => focmenu.focCategoryId === item.id
                            )
                            .map((menu) => menu.menuId);
                          const valdiFocMenu = menus
                            .filter((menu) => vaidFocMenuIds.includes(menu.id))
                            .map((menu) => menu.name)
                            .join(", ");

                          return (
                            <Chip size="sm" variant="bordered" key={item.id}>
                              {valdiFocMenu} ({item.minSelection})
                            </Chip>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="mt-2 min-h-28 p-2 bg-background">
        {days ? (
          <div className="text-sm mb-3 w-2/3">
            <span>{`Available in ${days}`}</span>
          </div>
        ) : null}
        {duration ? (
          <div className="text-sm mb-3 w-full flex justify-end">
            <span>{duration}</span>
          </div>
        ) : null}

        <h4 className="text-default-500 truncate">{promotion.description}</h4>
      </Card>

      <div className="fixed bottom-2 right-0 left-0 m-auto w-full px-2">
        <GetPromotion
          promotionMenu={promotionMenu}
          menus={menus}
          promotionAvailabel={promotionAvailabel}
        />
      </div>
    </div>
  );
};

export default PromotionPage;
