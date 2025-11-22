import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";

interface CategorySuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategorySuggestionModal({ open, onOpenChange }: CategorySuggestionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const submitCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) =>
      apiRequest("/api/categories/suggest", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Category Suggested!",
        description: "Your category suggestion has been submitted for review.",
      });
      setCategoryName("");
      setCategoryDescription("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit category suggestion",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim() && categoryDescription.trim()) {
      submitCategoryMutation.mutate({ 
        name: categoryName.trim(),
        description: categoryDescription.trim()
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Suggest a New Category
          </DialogTitle>
          <DialogDescription>
            Can't find the right category for your service? Suggest a new one and we'll review it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={!categoryName.trim() || !categoryDescription.trim() || submitCategoryMutation.isPending}
              data-testid="button-submit-category-suggestion"
            >
              {submitCategoryMutation.isPending ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
