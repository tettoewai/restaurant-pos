import {
  fetchMenuWithIds,
  fetchPromotionWithId,
} from "@/app/lib/backoffice/data";
import { fetchFocMenuWithPromotiionId } from "@/app/lib/order/data";
import { formatCurrency } from "@/function";
import { Card, Chip } from "@nextui-org/react";
import { Image } from "@nextui-org/react";
import NextImage from "next/image";

const PromotionPage = async ({ params }: { params: { id: string } }) => {
  const promotionId = Number(params.id);
  const promotion = await fetchPromotionWithId(promotionId);

  if (!promotion) return <h1>There is no menu!</h1>;

  const isFoc = promotion.discount_type === "FOCMENU";

  const focData = isFoc
    ? await fetchFocMenuWithPromotiionId(promotion.id)
    : undefined;

  const focCategoryId = focData?.focCategory.map((item) => item.id);
  const menuIds = focData?.focMenu
    .filter((item) => focCategoryId?.includes(item.focCategoryId))
    .map((item) => item.menuId);

  const menus =
    menuIds && menuIds.length ? await fetchMenuWithIds(menuIds) : [];

  return (
    <div>
      <Card shadow="none" className="w-full bg-background mt-2">
        <div className="w-full h-full items-center flex justify-center p-2">
          <Image
            isBlurred
            as={NextImage}
            src=""
            alt="promotion image"
            height={240}
            width={240}
            className="object-fill h-full w-auto"
          />
        </div>
        <div className="pl-3 pb-2 flex justify-between items-center pr-2">
          <h1 className="text-lg font-bold">{promotion.name}</h1>
          <div className="flex justify-end items-end flex-col text-end w-3/5">
            <h1 className="text-sm">{isFoc ? "FOC" : "Discount"}</h1>
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
                {focData.focCategory.map((item) => {
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
              </div>
            ) : null}
          </div>
        </div>
      </Card>
      <Card className="mt-2 min-h-20">
        {<h4 className="text-default-500 truncate">{promotion.description}</h4>}
      </Card>
    </div>
  );
};

export default PromotionPage;
