# FED Assignment

Credits:

- Chicken rice: https://www.istockphoto.com/photos/singapore-chicken-rice
- Mixed food: https://www.getyourguide.com/en-gb/explorer/singapore-ttd169042/food-in-singapore/?visitor-id=MWPFGWQFIVO4970I2QXS7I69MVALV23Q&locale_autoredirect_optout=true

# Adding icons

## 1. Add lucide.dev script tag in head

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

## 2. Run the lucide.createIcons() in your JavaScript

```html
<script>
  lucide.createIcons();
</script>
```

## 3. Start using icons in html using an `<i>` tag

```html
<i data-lucide="icon_name" class="any-class-you-want"></i>
```

To change the colour of the icon stroke, use the TailwindCSS `text-` property. For example, `text-red-500`.

To see all of the possible icons and their names, visit [https://lucide.dev/icons/](https://lucide.dev/icons/)
