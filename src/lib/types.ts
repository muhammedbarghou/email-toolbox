export interface ImageState {
    offer: string | null
    footer1: string | null
    footer2: string | null
  }
  
  export interface ImageEdits {
    brightness?: number
    contrast?: number
    saturation?: number
    rotation?: number
    scale?: number
    flipH?: boolean
    flipV?: boolean
  }
  
  export interface EditsState {
    offer: ImageEdits
    footer1: ImageEdits
    footer2: ImageEdits
  }
  
  export interface LayoutSettings {
    spacing: number
    alignment: "center" | "left" | "right"
    backgroundColor: string
  }
  
  export interface TextOverlay {
    id: number
    text: string
    x: number
    y: number
    fontSize: number
    color: string
    fontFamily: string
  }
  
  export interface MapArea {
    id: number
    x: number
    y: number
    width: number
    height: number
    href: string
    alt: string
    isDrawing?: boolean
  }
  
  export interface ImageMapState {
    image: string | null
    areas: MapArea[]
    selectedAreaId: number | null
  }
  