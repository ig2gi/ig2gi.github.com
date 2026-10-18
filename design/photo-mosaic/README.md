# Photography mosaics

The hero image of `/photographer` is a mosaic built from the photos in a set folder.

```
colour/        01.jpg … 08.jpg, sources.txt (500px link of each), order.txt
mosaic.mjs     builds public/images/photography/mosaic-<set>.jpg and -1028.jpg
px-get.mjs     downloads photos from 500px photo pages (max 1024px)
```

Change the mosaic:

1. Add photos: `node design/photo-mosaic/px-get.mjs colour 9 https://500px.com/photo/...`
   (or drop a JPG in the folder with the next number), and add its line to `sources.txt`.
2. Edit `colour/order.txt`: photo numbers, first = wide tile. 8 photos fill a 3x3 square.
3. Rebuild: `npm run mosaic -- colour`
4. If the photo list changed, update the alt text in `src/pages/photographer.astro`.

A sharper version: replace any `NN.jpg` with your original (same number) and rebuild.
