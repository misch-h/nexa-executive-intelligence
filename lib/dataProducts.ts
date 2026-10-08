export type DataProduct = {
  product_id: string;
  product_name: string;
  domain: string;
  description: string | null;
  owner_role: string | null;
  source_datasets: string | null;
  refresh_cadence: string | null;
  access_classification: string | null;
  approval_role: string | null;
  access_sla: string | null;
  product_status: string | null;
};

export function parseDataProducts(data: unknown): DataProduct[] {
  if (!Array.isArray(data)) throw new Error("Invalid product response.");
  const ids = new Set<string>();
  return data.map((value): DataProduct => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid product record.");
    const row = value as Record<string, unknown>;
    function field(key: string, required = false): string | null {
      const value = row[key];
      if (value == null && !required) return null;
      if (typeof value !== "string") throw new Error(`Invalid ${key}.`);
      const result = value.trim();
      if (!result && required) throw new Error(`Missing ${key}.`);
      return result || null;
    }
    const product_id = field("product_id", true)!;
    if (ids.has(product_id)) throw new Error("Duplicate product ID.");
    ids.add(product_id);
    return {
      product_id, product_name: field("product_name", true)!, domain: field("domain", true)!,
      description: field("description"), owner_role: field("owner_role"), source_datasets: field("source_datasets"),
      refresh_cadence: field("refresh_cadence"), access_classification: field("access_classification"),
      approval_role: field("approval_role"), access_sla: field("access_sla"), product_status: field("product_status"),
    };
  }).sort((a, b) => a.product_name.localeCompare(b.product_name));
}

export function filterDataProducts(products: DataProduct[], query: string, domain: string) {
  const search = query.trim().toLocaleLowerCase();
  return products.filter((product) => (!domain || product.domain === domain) &&
    [product.product_name, product.description ?? ""].some((value) => value.toLocaleLowerCase().includes(search)));
}
