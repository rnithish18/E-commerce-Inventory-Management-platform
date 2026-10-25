# ShopNest — Product Image Attribution & Credits

All product imagery and graphical assets served within the ShopNest storefront are stored locally under `/products/` and `/uploads/`. None of the assets are hotlinked from external or third-party web domains.

---

## 1. Asset Attribution & Licensing

| Asset Category | Location | Source / Tooling | License | Permitted Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Catalog Products (42 items)** | `frontend/public/products/*.svg` | ShopNest Design Studio (Vector Assets) | **CC0 1.0 Universal / Public Domain** | Free for personal, commercial, and educational application without copyright restrictions. |
| **Hero Tech Showcase** | `frontend/public/products/hero-headphones.svg` | ShopNest Design Studio | **CC0 1.0 Universal** | Unrestricted royalty-free promotional artwork. |
| **Platform Icons** | `frontend/public/icons.svg` | Lucide Icons & Tailwind UI | **MIT License** | Open-source attribution included. |
| **User Uploads & Sandbox Photos** | `backend/uploads/` | Local Multer / Sharp pipeline | **User-generated / Sandbox synthetic** | Processed through EXIF stripping and local hashing. |

---

## 2. Technical Asset Rules
1. **Zero External Hotlinking**: Images are loaded strictly from `/products/[slug].svg` or the backend upload proxy `/uploads/[filename]`.
2. **Metadata Protection**: User uploads processed by `sharp` have all EXIF, GPS, and camera sensor metadata stripped before storage.
3. **Format & Sizing**: High-density vector SVG and WebP thumbnails ensuring fast load times and clean presentation across all display densities.
