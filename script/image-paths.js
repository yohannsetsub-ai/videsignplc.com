// Display a lightweight copy; the full-screen viewer uses the original path.
import { imageWidths } from './image-sizes.js';
import { imageAliases } from './image-aliases.js';

export function imageAsset(source) {
  return imageAliases[source] || source;
}

export function galleryImage(source, size) {
  return imageAsset(source.replace('images/gallery/large/', `images/gallery/${size}/`));
}

export function gallerySources(source) {
  // Spaces in the project's folder names must be encoded inside srcset.
  const [small, medium] = imageWidths[source] || [768, 1440];
  const mediumSource = `${encodeURI(galleryImage(source, 'medium'))} ${medium}w`;
  if (small === medium) return mediumSource;
  return `${encodeURI(galleryImage(source, 'small'))} ${small}w, ${mediumSource}`;
}
