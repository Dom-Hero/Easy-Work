declare module 'page-flip' {
  export type PageFlipCorner = 'top' | 'bottom'
  export type PageFlipOrientation = 'portrait' | 'landscape'
  export type PageFlipState = 'user_fold' | 'fold_corner' | 'flipping' | 'read'

  export type PageFlipEventData = {
    data: number | string | { page: number; mode: PageFlipOrientation } | null
    object: PageFlip
  }

  export type PageFlipSettings = {
    startPage?: number
    size?: 'fixed' | 'stretch'
    width: number
    height: number
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    drawShadow?: boolean
    flippingTime?: number
    usePortrait?: boolean
    startZIndex?: number
    autoSize?: boolean
    maxShadowOpacity?: number
    showCover?: boolean
    mobileScrollSupport?: boolean
    clickEventForward?: boolean
    useMouseEvents?: boolean
    swipeDistance?: number
    showPageCorners?: boolean
    disableFlipByClick?: boolean
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings)
    destroy(): void
    update(): void
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void
    clear(): void
    turnToPrevPage(): void
    turnToNextPage(): void
    turnToPage(pageNum: number): void
    flipNext(corner?: PageFlipCorner): void
    flipPrev(corner?: PageFlipCorner): void
    flip(pageNum: number, corner?: PageFlipCorner): void
    getPageCount(): number
    getCurrentPageIndex(): number
    getOrientation(): PageFlipOrientation
    getState(): PageFlipState
    on(event: string, callback: (e: PageFlipEventData) => void): this
    off(event: string): this
  }
}
