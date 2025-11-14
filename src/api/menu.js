export async function fetchMenu() {
  const url = import.meta.env.VITE_SHEET_MENU_CSV_URL;

  const res = await fetch(url);
  const text = await res.text();

  // Convert CSV → Array
  const rows = text.trim().split("\n");
  const header = rows[0].split(",");

  const data = [];

  rows.slice(1).forEach((line) => {
    const cols = line.split(",");
    const item = {};

    header.forEach((h, i) => {
      item[h.trim()] = (cols[i] || "").trim();
    });

    data.push(item);
  });

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: r.price,
    category: r.category.toLowerCase(),
    isActive: (r.isActive || "").toLowerCase() === "true",
    availableDays: r.availableDays?.split(",") || [],
    imageUrl: r.imageUrl
  }));
}

export async function fetchMeal(meal) {
  const list = await fetchMenu();
  return list.filter(
    (item) => item.category === meal.toLowerCase() && item.isActive
  );
}
