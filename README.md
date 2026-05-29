# WW Cosmétiques — MVP

Static HTML/Tailwind MVP for the dual-universe brand (HIM / HER).

## Run locally

```bash
cd /Users/bbsctrad/CascadeProjects/ww-cosmetiques
python3 -m http.server 5500
```

Then open http://localhost:5500

## Pages

- `index.html` — splitscreen splash (HIM | HER)
- `him.html` — barber universe + Shiner Gold product
- `her.html` — cosmetics universe + Pure Line eyeliner
- `story.html` — brand story
- `contact.html` — contact form

## Stack

- Plain HTML
- Tailwind CDN (splash only) + custom CSS (`assets/styles.css`)
- Google Fonts: Playfair Display + Inter
- Unsplash placeholder images (replace with real shots)

## Brand tokens

| Token | HIM | HER |
|---|---|---|
| Background | `#0A0A0A` | `#F4F1EC` |
| Accent | `#C8A24B` (gold) | `#D9A89C` (rose) |
| Text | `#F4F1EC` | `#0A0A0A` |
