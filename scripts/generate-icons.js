/**
 * NoteSnap - Icon Generation Script
 * 
 * Génère les icônes PWA avec dégradé violet → bleu et lettre N blanche
 * Requirements: npm install canvas
 */

import { createCanvas } from 'canvas'
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

/**
 * Génère une icône avec dégradé violet → bleu et lettre N blanche
 * @param {number} size - Taille de l'icône en pixels
 * @param {string} outputPath - Chemin de sortie
 */
async function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dégradé violet → bleu
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#6C63FF')
  gradient.addColorStop(1, '#3B82F6')

  // Fond avec dégradé
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Arrondir les coins (pour style moderne)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.22)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Lettre N blanche
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${size * 0.5}px Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', size / 2, size / 2)

  // Sauvegarder l'image
  const buffer = canvas.toBuffer('image/png')
  await writeFile(outputPath, buffer)
  console.log(`✓ Icône générée: ${outputPath} (${size}x${size})`)
}

/**
 * Génère toutes les icônes PWA
 */
async function generateAllIcons() {
  console.log('🎨 Génération des icônes NoteSnap...\n')

  const icons = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' }
  ]

  for (const icon of icons) {
    const outputPath = join(publicDir, icon.name)
    await generateIcon(icon.size, outputPath)
  }

  console.log('\n✅ Toutes les icônes ont été générées avec succès!')
}

// Exécuter la génération
generateAllIcons().catch(error => {
  console.error('❌ Erreur lors de la génération des icônes:', error)
  process.exit(1)
})
