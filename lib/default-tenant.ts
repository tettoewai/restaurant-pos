import {
  DiscountType,
  MovementSource,
  MovementType,
  POStatus,
  PrismaClient,
  Unit,
  UnitCategory,
} from "@prisma/client";
import { nanoid } from "nanoid";

const tableLabels = [
  "Chef Counter",
  "Garden Booth",
  "River View",
  "Courtyard High-top",
  "Private Lounge",
];

const locationSeeds = [
  {
    name: "Downtown Bistro",
    street: "12 Merchant Street",
    township: "Kyauktada",
    city: "Yangon",
    latitude: null,
    longitude: null,
  },
  {
    name: "Inya Lake Terrace",
    street: "55 Inya Road",
    township: "Kamayut",
    city: "Yangon",
    latitude: null,
    longitude: null,
  },
  {
    name: "Riverfront Grill",
    street: "19 Strand Quay",
    township: "Botahtaung",
    city: "Yangon",
    latitude: null,
    longitude: null,
  },
  {
    name: "Tea Garden Junction",
    street: "2 Hanthawaddy Road",
    township: "Sanchaung",
    city: "Yangon",
    latitude: null,
    longitude: null,
  },
  {
    name: "Hilltop Test Kitchen",
    street: "77 Pyay Road",
    township: "Ahlone",
    city: "Yangon",
    latitude: null,
    longitude: null,
  },
];

const menuCategorySeeds = [
  "Seasonal Mains",
  "Small Plates",
  "Beverages",
  "Desserts",
];

const menuSeeds = [
  {
    name: "River Prawn Laksa",
    price: 8500,
    description: "Coconut broth, river prawns, heirloom noodles.",
  },
  {
    name: "Tea Leaf Charred Chicken",
    price: 7800,
    description: "Grilled chicken, fermented tea leaf chimichurri.",
  },
  {
    name: "Smoked Tamarind Beef",
    price: 9800,
    description: "Slow-smoked brisket, tamarind glaze, pickled shallots.",
  },
  {
    name: "Lemongrass Pomelo Salad",
    price: 5200,
    description: "Pomelo, roasted peanuts, crisp tofu, citrus dressing.",
  },
  {
    name: "Ginger Lemongrass Cooler",
    price: 3000,
    description: "House soda with lemongrass cordial and ginger.",
  },
  {
    name: "Lotus Blossom Cheesecake",
    price: 4200,
    description: "Lotus biscuit crust, kaffir lime caramel.",
  },
];

const addonCategorySeeds = ["Dipping Sauces", "Rice & Bread"];

const addonSeeds = [
  { name: "Smoked Chili Oil", price: 800, addonCategory: "Dipping Sauces" },
  {
    name: "Roasted Garlic Yogurt",
    price: 700,
    addonCategory: "Dipping Sauces",
  },
  { name: "Coconut Rice", price: 1500, addonCategory: "Rice & Bread" },
  { name: "Charred Flatbread", price: 1400, addonCategory: "Rice & Bread" },
];

const warehouseItemSeeds = [
  {
    name: "River Prawn",
    unit: Unit.KG,
    unitCategory: UnitCategory.MASS,
    threshold: 10,
  },
  {
    name: "Lotus Root",
    unit: Unit.KG,
    unitCategory: UnitCategory.MASS,
    threshold: 8,
  },
  {
    name: "Heirloom Rice Noodles",
    unit: Unit.KG,
    unitCategory: UnitCategory.MASS,
    threshold: 6,
  },
  {
    name: "Lemongrass Stalks",
    unit: Unit.UNIT,
    unitCategory: UnitCategory.COUNT,
    threshold: 15,
  },
  {
    name: "Palm Sugar",
    unit: Unit.KG,
    unitCategory: UnitCategory.MASS,
    threshold: 4,
  },
];

const menuIngredientAssignments = [
  {
    menu: "River Prawn Laksa",
    items: [
      { name: "River Prawn", quantity: 2 },
      { name: "Heirloom Rice Noodles", quantity: 180 },
      { name: "Palm Sugar", quantity: 10 },
    ],
  },
  {
    menu: "Tea Leaf Charred Chicken",
    items: [
      { name: "Lotus Root", quantity: 120 },
      { name: "Lemongrass Stalks", quantity: 2 },
    ],
  },
  {
    menu: "Smoked Tamarind Beef",
    items: [
      { name: "Palm Sugar", quantity: 25 },
      { name: "Lemongrass Stalks", quantity: 3 },
    ],
  },
];

const supplierSeeds = [
  {
    name: "Ayeyar Fisheries",
    phone: "0942011223",
    email: "orders@ayeyarfish.com",
    address: "Fishery Jetty Road",
  },
  {
    name: "Green Fields Produce",
    phone: "0945566778",
    email: "contact@greenfields.com",
    address: "Thanlyin Agricultural Zone",
  },
  {
    name: "Heritage Provisions",
    phone: "0948001122",
    email: "sales@heritageprov.com",
    address: "Shwe Taw Street",
  },
];

const promotionSeeds = (
  locations: { id: number }[],
  menuMap: Map<string, { id: number }>
) => [
  {
    name: "Sunset Spritz Hour",
    description: "20% off coolers and salads between 3-6 PM.",
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 20,
    locationId: locations[0]?.id,
    priority: 1,
    group: "happy-hour",
    imageUrl: null,
    menuRefs: [
      { name: "Ginger Lemongrass Cooler", quantity: 1 },
      { name: "Lemongrass Pomelo Salad", quantity: 1 },
    ],
    startOffset: -3,
    endOffset: 45,
  },
  {
    name: "Laksa Lovers Combo",
    description: "Two laksa bowls and complimentary sauces.",
    discount_type: DiscountType.FIXED_AMOUNT,
    discount_value: 3000,
    locationId: locations[1]?.id,
    priority: 2,
    group: "bundles",
    imageUrl: null,
    menuRefs: [{ name: "River Prawn Laksa", quantity: 2 }],
    startOffset: 0,
    endOffset: 60,
  },
  {
    name: "Fire & Smoke Feast",
    description: "Smoked Tamarind Beef with free coconut rice.",
    discount_type: DiscountType.FIXED_AMOUNT,
    discount_value: 1500,
    locationId: locations[2]?.id,
    priority: 3,
    group: "chef-special",
    imageUrl: null,
    menuRefs: [{ name: "Smoked Tamarind Beef", quantity: 1 }],
    startOffset: -1,
    endOffset: 40,
  },
  {
    name: "Tea Garden Friends",
    description: "Buy three small plates, get the fourth free.",
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 25,
    locationId: locations[3]?.id,
    priority: 2,
    group: "friends",
    imageUrl: null,
    menuRefs: [
      { name: "Tea Leaf Charred Chicken", quantity: 2 },
      { name: "Lemongrass Pomelo Salad", quantity: 2 },
    ],
    startOffset: 2,
    endOffset: 50,
  },
  {
    name: "Sweet Ending Sampler",
    description: "Dessert platter with 15% off at Hilltop.",
    discount_type: DiscountType.PERCENTAGE,
    discount_value: 15,
    locationId: locations[4]?.id,
    priority: 1,
    group: "dessert",
    imageUrl: null,
    menuRefs: [{ name: "Lotus Blossom Cheesecake", quantity: 1 }],
    startOffset: -5,
    endOffset: 90,
  },
];

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

type EnsureDefaultTenantArgs = {
  prisma: PrismaClient;
  user: {
    email: string;
    name?: string | null;
    image?: string | null;
  };
};

export async function ensureDefaultTenant({
  prisma,
  user,
}: EnsureDefaultTenantArgs) {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (existingUser) {
    return existingUser;
  }

  const companyName = user.name
    ? `${user.name.split(" ")[0]}'s Dining Group`
    : "Aurora Dining Group";

  const { company, owner } = await prisma.$transaction(async (tx) => {
    const createdCompany = await tx.company.create({
      data: {
        name: companyName,
        street: "88 Strand Road",
        township: "Kyauktada",
        city: "Yangon",
        taxRate: 5,
      },
    });

    const createdOwner = await tx.user.create({
      data: {
        email: user.email,
        name: user.name ?? "Aurora Demo Owner",
        image: user.image ?? undefined,
        companyId: createdCompany.id,
      },
    });

    return { company: createdCompany, owner: createdOwner };
  });

  const locations = await prisma.$transaction(
    locationSeeds.map((location) =>
      prisma.location.create({ data: { ...location, companyId: company.id } })
    )
  );

  for (const location of locations) {
    await prisma.$transaction(
      tableLabels.map((label, index) =>
        prisma.table.create({
          data: {
            name: `${label} ${index + 1} - ${location.name.split(" ")[0]}`,
            locationId: location.id,
          },
        })
      )
    );
  }

  await prisma.selectedLocation.create({
    data: { userId: owner.id, locationId: locations[0]?.id ?? locations[0].id },
  });

  const warehouses = await prisma.$transaction([
    prisma.warehouse.create({
      data: { name: "Central Commissary", locationId: locations[0].id },
    }),
    prisma.warehouse.create({
      data: { name: "Inya Prep Kitchen", locationId: locations[1].id },
    }),
  ]);

  await prisma.selectedWarehouse.create({
    data: { userId: owner.id, warehouseId: warehouses[0].id },
  });

  const menuCategories = await prisma.$transaction(
    menuCategorySeeds.map((name) =>
      prisma.menuCategory.create({ data: { name, companyId: company.id } })
    )
  );

  const menus = await prisma.$transaction(
    menuSeeds.map((menu) => prisma.menu.create({ data: menu }))
  );

  const menuMap = new Map(menus.map((menu) => [menu.name, menu]));
  const categoryMap = new Map(
    menuCategories.map((category) => [category.name, category])
  );

  const categoryAssignments = [
    {
      category: "Seasonal Mains",
      menuNames: ["River Prawn Laksa", "Smoked Tamarind Beef"],
    },
    {
      category: "Small Plates",
      menuNames: ["Tea Leaf Charred Chicken", "Lemongrass Pomelo Salad"],
    },
    { category: "Beverages", menuNames: ["Ginger Lemongrass Cooler"] },
    { category: "Desserts", menuNames: ["Lotus Blossom Cheesecake"] },
  ];

  for (const assignment of categoryAssignments) {
    const category = categoryMap.get(assignment.category);
    if (!category) continue;
    const actions = assignment.menuNames
      .map((menuName) => {
        const menu = menuMap.get(menuName);
        if (!menu) return null;
        return prisma.menuCategoryMenu.create({
          data: { menuCategoryId: category.id, menuId: menu.id },
        });
      })
      .filter(
        (action): action is ReturnType<typeof prisma.menuCategoryMenu.create> =>
          Boolean(action)
      );
    if (actions.length) {
      await prisma.$transaction(actions);
    }
  }

  const addonCategories = await prisma.$transaction(
    addonCategorySeeds.map((name) =>
      prisma.addonCategory.create({ data: { name } })
    )
  );
  const addonCategoryMap = new Map(
    addonCategories.map((category) => [category.name, category])
  );

  const addons = await prisma.$transaction(
    addonSeeds.map((addon) =>
      prisma.addon.create({
        data: {
          name: addon.name,
          price: addon.price,
          addonCategoryId: addonCategoryMap.get(addon.addonCategory)!.id,
        },
      })
    )
  );

  await prisma.$transaction(
    menus.map((menu) =>
      prisma.menuAddonCategory.create({
        data: {
          menuId: menu.id,
          addonCategoryId: addonCategories[0].id,
        },
      })
    )
  );

  const warehouseItems = await prisma.$transaction(
    warehouseItemSeeds.map((item) =>
      prisma.warehouseItem.create({
        data: { ...item, companyId: company.id },
      })
    )
  );

  const warehouseItemMap = new Map(
    warehouseItems.map((item) => [item.name, item])
  );

  for (const assignment of menuIngredientAssignments) {
    const menu = menuMap.get(assignment.menu);
    if (!menu) continue;
    await prisma.$transaction(
      assignment.items.map((item) =>
        prisma.menuItemIngredient.create({
          data: {
            menuId: menu.id,
            itemId: warehouseItemMap.get(item.name)!.id,
            quantity: item.quantity,
          },
        })
      )
    );
  }

  await prisma.$transaction(
    addons.slice(0, 2).map((addon, index) =>
      prisma.addonIngredient.create({
        data: {
          addonId: addon.id,
          menuId: menuMap.get("River Prawn Laksa")!.id,
          itemId: warehouseItems[index].id,
          extraQty: index === 0 ? 1 : 50,
        },
      })
    )
  );

  const suppliers = await prisma.$transaction(
    supplierSeeds.map((supplier) =>
      prisma.supplier.create({
        data: { ...supplier, companyId: company.id },
      })
    )
  );

  const purchaseOrders = await prisma.$transaction(
    suppliers.map((supplier, index) =>
      prisma.purchaseOrder.create({
        data: {
          code: nanoid(8),
          supplierId: supplier.id,
          status: POStatus.RECEIVED,
          warehouseId: warehouses[index % warehouses.length].id,
        },
      })
    )
  );

  await prisma.$transaction(
    purchaseOrders.flatMap((order, index) => {
      const item = warehouseItems[index % warehouseItems.length];
      return [
        prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: order.id,
            itemId: item.id,
            quantity: 20,
            unitPrice: 2500,
          },
        }),
      ];
    })
  );

  await prisma.$transaction(
    warehouseItems.map((item, index) =>
      prisma.stockMovement.create({
        data: {
          itemId: item.id,
          type: MovementType.IN,
          quantity: 20,
          reference: `PO-${purchaseOrders[index % purchaseOrders.length].id}`,
          note: `Restock from ${suppliers[index % suppliers.length].name}`,
          warehouseId: warehouses[0].id,
          source: MovementSource.PURCHASE_ORDER,
        },
      })
    )
  );

  await prisma.$transaction(
    warehouseItems.map((item) =>
      prisma.warehouseStock.create({
        data: { itemId: item.id, quantity: 20, warehouseId: warehouses[0].id },
      })
    )
  );

  const promotions = promotionSeeds(locations, menuMap);

  for (const promo of promotions) {
    if (!promo.locationId) continue;
    await prisma.promotion.create({
      data: {
        name: promo.name,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        start_date: addDays(promo.startOffset),
        end_date: addDays(promo.endOffset),
        locationId: promo.locationId,
        priority: promo.priority,
        group: promo.group,
        imageUrl: promo.imageUrl,
        conditions: undefined,
        PromotionMenu: {
          create: promo.menuRefs
            .map((ref) => {
              const menu = menuMap.get(ref.name);
              if (!menu) return null;
              return {
                menuId: menu.id,
                quantity_required: ref.quantity,
              };
            })
            .filter(
              (entry): entry is { menuId: number; quantity_required: number } =>
                Boolean(entry)
            ),
        },
      },
    });
  }

  return owner;
}
