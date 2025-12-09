import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Layers, FolderPlus } from "lucide-react";
import { CategoryValidationDialog } from "./category-validation-dialog";
import type { Category } from "@shared/schema";

interface CategorySuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryCreated?: (categoryId: string) => void;
  onSubcategoryCreated?: (subcategoryId: string) => void;
}

interface ValidationResult {
  isValid: boolean;
  suggestedName?: string;
  reasoning: string;
  confidence: number;
  existingCategoryId?: string;
  existingCategoryName?: string;
  suggestedSubcategoryId?: string;
  suggestedSubcategoryName?: string;
}

type SuggestionType = "category" | "subcategory";

export function CategorySuggestionModal({ open, onOpenChange, onCategoryCreated, onSubcategoryCreated }: CategorySuggestionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [suggestionType, setSuggestionType] = useState<SuggestionType>("category");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryDescription, setSubcategoryDescription] = useState("");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);

  // Fetch all categories
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  // Helper function to normalize names for comparison
  const normalize = (str: string) => str.toLowerCase().trim().replace(/[&,]/g, '').replace(/\s+/g, ' ');

  // Helper to find exact or very similar category
  const findExistingCategory = (name: string) => {
    const normalized = normalize(name);
    return allCategories.find(cat => normalize(cat.name) === normalized);
  };

  // Helper function to generate unique slug with timestamp
  const generateUniqueSlug = (name: string) => {
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  };

  const validateCategoryMutation = useMutation({
    mutationFn: (data: { categoryName: string; description?: string }) =>
      apiRequest<ValidationResult>("/api/ai/validate-category", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      if (result.existingCategoryId) {
        toast({
          title: "Perfect Match Found!",
          description: result.suggestedSubcategoryName
            ? `We found "${result.existingCategoryName}" > "${result.suggestedSubcategoryName}" which matches your service perfectly.`
            : `We found "${result.existingCategoryName}" which is exactly what you need.`,
        });
        if (onCategoryCreated) {
          onCategoryCreated(result.existingCategoryId);
        }
        resetForm();
        onOpenChange(false);
        return;
      }

      if (result.isValid && result.confidence > 0.7) {
        const existing = findExistingCategory(categoryName.trim());
        if (existing) {
          toast({
            title: "Category Found!",
            description: `We found an existing category "${existing.name}". Using it instead.`,
          });
          if (onCategoryCreated) {
            onCategoryCreated(existing.id);
          }
          resetForm();
          onOpenChange(false);
          return;
        }

        createTemporaryCategoryMutation.mutate({
          name: categoryName.trim(),
          slug: generateUniqueSlug(categoryName.trim()),
        });
      } else {
        setValidationResult(result);
        setShowValidationDialog(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTemporaryCategoryMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      apiRequest("/api/temporary-categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });

      if (data.isExistingCategory) {
        toast({
          title: "Category Found!",
          description: data.message || `Using the existing category "${data.name}".`,
        });
      } else {
        toast({
          title: "Category Created!",
          description: "Your category has been created and selected.",
        });
      }

      if (onCategoryCreated) {
        onCategoryCreated(data.id);
      }
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Subcategory creation mutation
  const createSubcategoryMutation = useMutation({
    mutationFn: (data: { name: string; categoryId: string }) =>
      apiRequest("/api/temporary-subcategories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });

      if (data.isExistingSubcategory) {
        toast({
          title: "Subcategory Found!",
          description: data.message || `Using the existing subcategory "${data.name}".`,
        });
      } else {
        toast({
          title: "Subcategory Created!",
          description: `"${data.name}" has been added to ${data.categoryName || "the category"}.`,
        });
      }

      if (onSubcategoryCreated) {
        onSubcategoryCreated(data.id);
      }
      if (onCategoryCreated) {
        onCategoryCreated(data.categoryId);
      }
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subcategory",
        variant: "destructive",
      });
    },
  });

  const submitCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiRequest("/api/categories/suggest", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Category Suggested!",
        description: "Your category suggestion has been submitted for admin review.",
      });
      resetForm();
      onOpenChange(false);
      setShowValidationDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit category suggestion",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setSelectedCategoryId("");
    setSubcategoryName("");
    setSubcategoryDescription("");
    setValidationResult(null);
    setSuggestionType("category");
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() && categoryDescription.trim()) {
      const existing = findExistingCategory(categoryName.trim());
      if (existing) {
        toast({
          title: "Category Found!",
          description: `We found an existing category "${existing.name}". Using it instead of creating a duplicate.`,
        });
        if (onCategoryCreated) {
          onCategoryCreated(existing.id);
        }
        resetForm();
        onOpenChange(false);
        return;
      }

      validateCategoryMutation.mutate({
        categoryName: categoryName.trim(),
        description: categoryDescription.trim()
      });
    }
  };

  const handleSubcategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subcategoryName.trim() && selectedCategoryId) {
      createSubcategoryMutation.mutate({
        name: subcategoryName.trim(),
        categoryId: selectedCategoryId,
      });
    }
  };

  const handleUseSuggestedName = () => {
    if (!validationResult?.suggestedName) return;

    const existing = findExistingCategory(validationResult.suggestedName);
    if (existing) {
      toast({
        title: "Category Found!",
        description: `Using the existing category "${existing.name}".`,
      });
      if (onCategoryCreated) {
        onCategoryCreated(existing.id);
      }
      resetForm();
      onOpenChange(false);
      setShowValidationDialog(false);
      return;
    }

    createTemporaryCategoryMutation.mutate({
      name: validationResult.suggestedName,
      slug: generateUniqueSlug(validationResult.suggestedName),
    });
    setShowValidationDialog(false);
  };

  const handleSubmitForReview = () => {
    submitCategoryMutation.mutate({
      name: categoryName.trim(),
      description: categoryDescription.trim(),
    });
  };

  const isProcessing = validateCategoryMutation.isPending ||
    createTemporaryCategoryMutation.isPending ||
    createSubcategoryMutation.isPending ||
    submitCategoryMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Suggest New Category/Subcategory
            </DialogTitle>
            <DialogDescription>
              Can't find the right category for your service? Suggest a new category or subcategory.
            </DialogDescription>
          </DialogHeader>

          {/* Type Selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setSuggestionType("category")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${suggestionType === "category"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
                }`}
            >
              <Layers className="w-4 h-4" />
              Category
            </button>
            <button
              type="button"
              onClick={() => setSuggestionType("subcategory")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${suggestionType === "subcategory"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50 text-muted-foreground"
                }`}
            >
              <FolderPlus className="w-4 h-4" />
              Subcategory
            </button>
          </div>

          {suggestionType === "category" ? (
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name *</Label>
                <Input
                  id="category-name"
                  type="text"
                  placeholder="e.g., Pet Grooming, Home Renovation"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                  maxLength={100}
                  data-testid="input-suggest-category-name"
                />
                <p className="text-sm text-muted-foreground">
                  Provide a clear, descriptive name for the category
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-description">Description *</Label>
                <Textarea
                  id="category-description"
                  placeholder="Explain what types of services would fit in this category..."
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  required
                  maxLength={500}
                  rows={4}
                  data-testid="input-suggest-category-description"
                />
                <p className="text-sm text-muted-foreground">
                  Help us understand the purpose and scope of this category (10-500 characters)
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-category-suggestion"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !categoryName.trim() ||
                    !categoryDescription.trim() ||
                    isProcessing
                  }
                  data-testid="button-submit-category-suggestion"
                >
                  {isProcessing ? "Validating..." : "Submit Suggestion"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubcategorySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parent-category">Parent Category *</Label>
                <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                  <SelectTrigger id="parent-category" data-testid="select-parent-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose the main category this subcategory belongs to
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-name">Subcategory Name *</Label>
                <Input
                  id="subcategory-name"
                  type="text"
                  placeholder="e.g., Cat Grooming, Bathroom Renovation"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  required
                  maxLength={100}
                  data-testid="input-suggest-subcategory-name"
                />
                <p className="text-sm text-muted-foreground">
                  Provide a specific name for this subcategory
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory-description">Description (Optional)</Label>
                <Textarea
                  id="subcategory-description"
                  placeholder="Describe what services would fit this subcategory..."
                  value={subcategoryDescription}
                  onChange={(e) => setSubcategoryDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  data-testid="input-suggest-subcategory-description"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-subcategory-suggestion"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !subcategoryName.trim() ||
                    !selectedCategoryId ||
                    isProcessing
                  }
                  data-testid="button-submit-subcategory-suggestion"
                >
                  {isProcessing ? "Creating..." : "Create Subcategory"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {validationResult && (
        <CategoryValidationDialog
          open={showValidationDialog}
          onOpenChange={setShowValidationDialog}
          originalName={categoryName}
          aiSuggestedName={validationResult.suggestedName}
          aiReasoning={validationResult.reasoning}
          onUseSuggested={handleUseSuggestedName}
          onSubmitForReview={handleSubmitForReview}
          isProcessing={createTemporaryCategoryMutation.isPending || submitCategoryMutation.isPending}
        />
      )}
    </>
  );
}
