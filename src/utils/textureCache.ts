'use client'

import * as THREE from 'three'

// Global texture cache for all images
const globalTextureCache = new Map<string, THREE.Texture>()
const texturePromises = new Map<string, Promise<THREE.Texture>>()

/**
 * Preload and cache a texture
 */
export function preloadTexture(url: string): Promise<THREE.Texture> {
  if (globalTextureCache.has(url)) {
    return Promise.resolve(globalTextureCache.get(url)!)
  }

  if (texturePromises.has(url)) {
    return texturePromises.get(url)!
  }

  const loader = new THREE.TextureLoader()

  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(1, 1)

        // sRGB (safe across versions)
        if ('colorSpace' in tex) {
          ;(tex as any).colorSpace = THREE.SRGBColorSpace
        } else {
          ;(tex as any).encoding = (THREE as any).sRGBEncoding
        }

        tex.needsUpdate = true
        globalTextureCache.set(url, tex)
        texturePromises.delete(url)
        resolve(tex)
      },
      undefined,
      (err) => {
        texturePromises.delete(url)
        reject(err)
      }
    )
  })

  texturePromises.set(url, promise)
  return promise
}

/**
 * Get cached texture
 */
export function getCachedTexture(
  url: string | null | undefined
): THREE.Texture | null {
  if (!url) return null
  return globalTextureCache.get(url) || null
}

/**
 * Clear all cached textures
 */
export function clearTextureCache() {
  globalTextureCache.forEach((tex) => tex.dispose())
  globalTextureCache.clear()
  texturePromises.clear()
}
