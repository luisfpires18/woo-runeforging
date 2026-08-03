import { resolveAsset } from '../assets/assetChain.ts';

/**
 * Building and portrait art, resolved through the fallback chain.
 *
 * Decorative by default: the information is in the text beside it, which is why
 * the settlement list is never merely a caption for a picture
 * (ACCESSIBILITY.md §4).
 */
export function Art({
  assetKey,
  className,
  factionFallback = true,
}: {
  readonly assetKey: string;
  readonly className?: string;
  readonly factionFallback?: boolean;
}) {
  const { src, isFallback } = resolveAsset(assetKey, factionFallback);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      className={className}
      data-fallback={isFallback ? 'true' : 'false'}
      data-asset-key={assetKey}
    />
  );
}
