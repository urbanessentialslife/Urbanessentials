# Per-variant 3D models (GLB)

Each product variant can have its own interactive 3D / AR model on the
product page. Admins upload the `.glb` in Shopify Admin — no code change or
deploy needed. Variants without a model simply show photos only.

## One-time setup (Shopify Admin)

1. **Settings → Custom data → Variants → Add definition**
2. Name: `3D Model (GLB)` — namespace and key must be exactly `custom.model_glb`
3. Type: **File**
4. Under **Access**, tick **Storefront** (otherwise the site can't read it).
5. Save.

## Uploading a model

1. **Products →** pick the product → click the variant (e.g. Panda).
2. Scroll to **Metafields → 3D Model (GLB)** → upload the `.glb`.
3. Save. The product page shows a **3D • AR** thumbnail for that variant.

## Preparing the file

Keep GLBs small — the raw export of the Panda model was 64 MB and wouldn't
load on phones. Target under ~2 MB:

```bash
npx @gltf-transform/cli optimize in.glb out.glb \
  --compress false --texture-compress webp --texture-size 1024 --simplify-error 0.0005
```

(The Panda model went from 64 MB to 484 KB this way with no visible loss.)

## How the code reads it

`showcaseCommerce.ts` requests `metafield(namespace: "custom", key: "model_glb")`
on every variant and resolves its file URL (`GenericFile` or `Model3d`). An
uploaded file wins over any bundled fallback in `showcaseProducts.ts`
(`/models/character-bottle-panda.glb` is the bundled Panda fallback).
