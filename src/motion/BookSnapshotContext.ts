import { createContext, useContext } from 'react';

/**
 * Indicates a section tree is being rendered inside a live 3D turning book leaf.
 * Allows components to render immediately at full contrast without duplicate DOM IDs,
 * fixed portal overlays, or scroll-reveal delays.
 */
export const BookSnapshotContext = createContext<boolean>(false);

export function useIsBookSnapshot(): boolean {
  return useContext(BookSnapshotContext);
}
