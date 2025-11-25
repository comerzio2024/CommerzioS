import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import type { Subcategory } from "@shared/schema";

export function useSubcategories() {
  return useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
    queryFn: () => apiRequest("/api/subcategories"),
    staleTime: 5 * 60 * 1000,
  });
}
