import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, type CategoryWithTemporary } from "@/lib/api";
import { useSubcategories } from "@/hooks/useSubcategories";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw } from "lucide-react";

interface CategorySubcategorySelectorProps {
  categoryId: string;
  subcategoryId: string | null;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string | null) => void;
  isManualOverride: boolean;
  aiSuggestion: {
    categoryId: string;
    subcategoryId: string | null;
  } | null;
  onResetToAI: () => void;
  isAiLoading?: boolean;
}

export function CategorySubcategorySelector({
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  isManualOverride,
  aiSuggestion,
  onResetToAI,
  isAiLoading = false,
}: CategorySubcategorySelectorProps) {
  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const { data: allSubcategories = [], isLoading: subcategoriesLoading } = useSubcategories();

  const filteredSubcategories = useMemo(() => {
    if (!categoryId) return [];
    return allSubcategories.filter(sub => sub.categoryId === categoryId);
  }, [categoryId, allSubcategories]);

  const isCategoryAiSuggested = !isManualOverride && aiSuggestion?.categoryId === categoryId;
  const isSubcategoryAiSuggested = !isManualOverride && aiSuggestion?.subcategoryId === subcategoryId && subcategoryId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="category-select">
              Category <span className="text-destructive">*</span>
            </Label>
            {isCategoryAiSuggested && (
              <Badge variant="secondary" className="gap-1" data-testid="ai-category-badge">
                <Sparkles className="h-3 w-3" />
                AI Suggested
              </Badge>
            )}
          </div>
          <Select
            value={categoryId || ""}
            onValueChange={onCategoryChange}
            disabled={isAiLoading}
          >
            <SelectTrigger id="category-select" data-testid="select-category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} data-testid={`category-option-${category.slug}`}>
                  {category.name}
                  {category.isTemporary && " (Pending Approval)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="subcategory-select">Subcategory (Optional)</Label>
          {isSubcategoryAiSuggested && (
            <Badge variant="secondary" className="gap-1" data-testid="ai-subcategory-badge">
              <Sparkles className="h-3 w-3" />
              AI Suggested
            </Badge>
          )}
        </div>
        <Select
          value={subcategoryId || ""}
          onValueChange={(value) => onSubcategoryChange(value === "" || value === "none" ? null : value)}
          disabled={!categoryId || subcategoriesLoading || isAiLoading}
        >
          <SelectTrigger id="subcategory-select" data-testid="select-subcategory">
            <SelectValue placeholder={categoryId ? "Select a subcategory (optional)" : "First select a category"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" data-testid="subcategory-option-none">
              None
            </SelectItem>
            {filteredSubcategories.map((subcategory) => (
              <SelectItem key={subcategory.id} value={subcategory.id} data-testid={`subcategory-option-${subcategory.slug}`}>
                {subcategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isManualOverride && aiSuggestion && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetToAI}
          className="gap-2"
          data-testid="button-reset-ai"
        >
          <RotateCcw className="h-4 w-4" />
          Reset to AI Suggestions
        </Button>
      )}
    </div>
  );
}
