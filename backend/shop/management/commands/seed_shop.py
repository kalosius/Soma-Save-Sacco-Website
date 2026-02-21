"""
Seed the shop with sample product categories and products.
Usage: python manage.py seed_shop
"""
from django.core.management.base import BaseCommand
from shop.models import ProductCategory, Product


# Unsplash/picsum URLs for realistic placeholder images
IMG = "https://picsum.photos/seed/{}/600/600"

CATEGORIES = [
    {
        "name": "Stationery",
        "slug": "stationery",
        "icon": "edit_note",
        "description": "Pens, notebooks, folders and everything you need for class.",
        "products": [
            {"name": "A4 Hardcover Notebook (200 pages)", "slug": "a4-hardcover-notebook", "price": 15000, "compare_at_price": 20000, "stock": 120, "tags": "notebook,writing,class", "description": "Durable hardcover notebook perfect for lecture notes. Ruled pages, easy to flip."},
            {"name": "Pack of 10 Ballpoint Pens", "slug": "ballpoint-pens-10pk", "price": 8000, "stock": 200, "tags": "pens,writing", "description": "Smooth-writing ballpoint pens in blue ink. Great value for students."},
            {"name": "Scientific Calculator (Casio fx-991)", "slug": "casio-fx991-calculator", "price": 85000, "compare_at_price": 110000, "stock": 30, "is_featured": True, "tags": "calculator,math,exam", "description": "The go-to scientific calculator for university exams. Solar + battery powered."},
            {"name": "A4 Lever Arch File", "slug": "a4-lever-arch-file", "price": 12000, "stock": 80, "tags": "file,storage", "description": "Organize your coursework and handouts. Holds 500+ sheets."},
            {"name": "Highlighter Set (5 Colours)", "slug": "highlighter-set-5", "price": 10000, "stock": 60, "tags": "highlighter,study", "description": "Bright neon highlighters for textbook annotations and revision."},
        ],
    },
    {
        "name": "Electronics",
        "slug": "electronics",
        "icon": "devices",
        "description": "Chargers, earphones, flash drives and tech essentials.",
        "products": [
            {"name": "32 GB USB Flash Drive", "slug": "usb-flash-drive-32gb", "price": 25000, "compare_at_price": 35000, "stock": 50, "is_featured": True, "tags": "usb,storage,tech", "description": "Compact USB 3.0 flash drive. Transfer assignments and projects fast."},
            {"name": "Wireless Earbuds", "slug": "wireless-earbuds", "price": 75000, "compare_at_price": 120000, "stock": 25, "is_featured": True, "tags": "earbuds,audio,music", "description": "Bluetooth 5.0 earbuds with charging case. Great for studying and commuting."},
            {"name": "Phone Charger Cable (USB-C, 1 m)", "slug": "usb-c-charger-cable", "price": 12000, "stock": 100, "tags": "charger,cable,phone", "description": "Fast-charging braided USB-C cable. Compatible with Samsung, Tecno, Infinix."},
            {"name": "Power Bank 10 000 mAh", "slug": "power-bank-10000", "price": 55000, "compare_at_price": 70000, "stock": 35, "tags": "power,battery,charger", "description": "Keep your phone alive through lectures all day. Dual USB output."},
            {"name": "Laptop Sleeve (15.6 inch)", "slug": "laptop-sleeve-15", "price": 40000, "stock": 40, "tags": "laptop,bag,protection", "description": "Padded neoprene sleeve to protect your laptop on the go."},
        ],
    },
    {
        "name": "Study Aids",
        "slug": "study-aids",
        "icon": "menu_book",
        "description": "Revision cards, past papers, textbooks and learning tools.",
        "products": [
            {"name": "Revision Flashcard Pack (100 pcs)", "slug": "flashcard-pack-100", "price": 18000, "stock": 70, "tags": "flashcards,revision,exam", "description": "Blank white flashcards perfect for making revision notes. Ring-bound."},
            {"name": "Past Paper Booklet – BCOM Year 2", "slug": "past-papers-bcom-yr2", "price": 30000, "stock": 40, "is_digital": True, "tags": "pastpapers,exam,bcom", "description": "Compiled past exam papers for Bachelor of Commerce Year 2 (PDF digital download)."},
            {"name": "Oxford English Dictionary (Pocket)", "slug": "oxford-dictionary-pocket", "price": 35000, "compare_at_price": 45000, "stock": 20, "tags": "dictionary,english,reference", "description": "Compact pocket dictionary. Essential reference for essays and reports."},
            {"name": "Sticky Note Pad (Neon, 400 sheets)", "slug": "sticky-notes-neon-400", "price": 8000, "stock": 90, "tags": "sticky,notes,study", "description": "Mark important textbook pages and jot quick reminders."},
        ],
    },
    {
        "name": "Apparel",
        "slug": "apparel",
        "icon": "checkroom",
        "description": "University-branded t-shirts, hoodies and accessories.",
        "products": [
            {"name": "SomaSave Branded T-Shirt", "slug": "somasave-tshirt", "price": 35000, "stock": 50, "is_featured": True, "tags": "tshirt,branded,apparel", "description": "100% cotton crew-neck tee with the SomaSave SACCO logo. Unisex fit."},
            {"name": "University Hoodie (Black)", "slug": "university-hoodie-black", "price": 80000, "compare_at_price": 100000, "stock": 30, "tags": "hoodie,warm,apparel", "description": "Warm fleece-lined hoodie with embroidered university crest. Perfect for chilly mornings."},
            {"name": "Campus Backpack", "slug": "campus-backpack", "price": 65000, "stock": 25, "tags": "bag,backpack,laptop", "description": "Water-resistant backpack with padded laptop compartment and multiple pockets."},
            {"name": "SomaSave Lanyard & ID Holder", "slug": "somasave-lanyard", "price": 10000, "stock": 100, "tags": "lanyard,id,accessory", "description": "Branded lanyard with transparent ID holder. Clip your student card in style."},
        ],
    },
    {
        "name": "Food & Drinks",
        "slug": "food-drinks",
        "icon": "restaurant",
        "description": "Snacks, beverages and meal vouchers for campus life.",
        "products": [
            {"name": "Campus Meal Voucher (5 meals)", "slug": "meal-voucher-5", "price": 25000, "stock": 200, "is_digital": True, "is_featured": True, "tags": "meal,voucher,food", "description": "Redeemable at any campus cafeteria. 5 standard meals included."},
            {"name": "Instant Coffee Sachets (20 pcs)", "slug": "instant-coffee-20", "price": 15000, "stock": 80, "tags": "coffee,drink,study", "description": "Stay alert during late-night study sessions. Nescafé Classic sachets."},
            {"name": "Bottled Water (500 ml × 12)", "slug": "bottled-water-12pk", "price": 12000, "stock": 60, "tags": "water,drink,hydration", "description": "Stay hydrated on campus. Pack of 12 bottles."},
            {"name": "Energy Bar Box (6 bars)", "slug": "energy-bars-6pk", "price": 20000, "stock": 45, "tags": "snack,energy,protein", "description": "Peanut butter & oat energy bars. Quick fuel between classes."},
        ],
    },
]


class Command(BaseCommand):
    help = "Seed sample product categories and products for the Shop"

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="Delete all shop data first")

    def handle(self, *args, **options):
        if options["reset"]:
            Product.objects.all().delete()
            ProductCategory.objects.all().delete()
            self.stdout.write(self.style.WARNING("  Cleared existing shop data"))

        cat_count = 0
        prod_count = 0
        for idx, cat_data in enumerate(CATEGORIES):
            cat, _ = ProductCategory.objects.get_or_create(
                slug=cat_data["slug"],
                defaults={
                    "name": cat_data["name"],
                    "icon": cat_data["icon"],
                    "description": cat_data["description"],
                    "sort_order": idx,
                    "image": IMG.format(cat_data["slug"]),
                },
            )
            cat_count += 1

            for p_data in cat_data["products"]:
                _, created = Product.objects.get_or_create(
                    slug=p_data["slug"],
                    defaults={
                        "category": cat,
                        "name": p_data["name"],
                        "description": p_data.get("description", ""),
                        "price": p_data["price"],
                        "compare_at_price": p_data.get("compare_at_price"),
                        "stock": p_data.get("stock", 50),
                        "is_featured": p_data.get("is_featured", False),
                        "is_digital": p_data.get("is_digital", False),
                        "tags": p_data.get("tags", ""),
                        "image": IMG.format(p_data["slug"]),
                    },
                )
                if created:
                    prod_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"  Shop seeded: {cat_count} categories, {prod_count} new products"
        ))
