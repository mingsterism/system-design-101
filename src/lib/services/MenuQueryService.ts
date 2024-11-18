import { MenuService } from "../../interfaces";
import { MenuItem } from "../../types";

export class MenuQueryService {
    constructor(private menuService: MenuService) {}

    async getInitialPageData(): Promise<{
        categories: string[];
        popularItems: MenuItem[];
    }> {
        const [categories, popularItems] = await Promise.all([
            this.menuService.getMenuCategories(),
            this.menuService.getPopularItems()
        ]);
        return { categories, popularItems };
    }

    async getFilteredItems(category?: string, searchTerm?: string): Promise<MenuItem[]> {
        return this.menuService.getMenuItems({
            search: searchTerm,
            filters: category ? { category } : {}
        });
    }

    async getItemWithDetails(menuItemId: string): Promise<{
        item: MenuItem;
        isAvailable: boolean;
    }> {
        const [item, isAvailable] = await Promise.all([
            this.menuService.getMenuItemDetails(menuItemId),
            this.menuService.checkItemAvailability(menuItemId)
        ]);
        return { item, isAvailable };
    }
}
