'use client'

import type { CustomizationState } from '@/src/build/types'

/**
 * Wait for canvas to be fully rendered
 */
async function waitForCanvasRender(canvas: HTMLCanvasElement): Promise<void> {
  return new Promise((resolve) => {
    // Wait for next animation frame to ensure render is complete
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve()
      })
    })
  })
}

/**
 * Capture canvas as data URL with proper rendering wait
 */
async function captureCanvas(canvas: HTMLCanvasElement): Promise<string> {
  // Wait for canvas to render
  await waitForCanvasRender(canvas)
  
  // Get the WebGL context to ensure it's rendered
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
  if (gl) {
    gl.finish() // Wait for all WebGL operations to complete
  }
  
  // Capture with high quality
  return canvas.toDataURL('image/png', 1.0)
}

export async function exportConeToPDF(
  state: CustomizationState,
  canvas: HTMLCanvasElement
) {
  if (typeof window === 'undefined') return

  try {
    /* CAPTURE CANVAS IMAGE */
    const imgData = await captureCanvas(canvas)
    
    // Verify we got actual image data (not blank)
    if (!imgData || imgData === 'data:,') {
      throw new Error('Failed to capture canvas image')
    }

    // Load jsPDF
    const { jsPDF } = await import('jspdf')

    // Convert canvas dimensions from pixels to mm (assuming 96 DPI)
    const pxToMm = 0.264583 // 1px = 0.264583mm at 96 DPI
    const pdfWidth = canvas.width * pxToMm
    const pdfHeight = canvas.height * pxToMm

    // Create PDF with exact canvas dimensions
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight],
    })

    // Add image at exact size (no margins, no whitespace)
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)

    // Save with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    pdf.save(`cone-preview-${timestamp}.pdf`)
    
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('Failed to export PDF. Please try again.')
  }
}