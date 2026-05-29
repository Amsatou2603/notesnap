/**
 * NoteSnap - Icon Generation Script
 * 
 * Génère toutes les icônes PWA avec dégradé violet → bleu et logo NoteSnap
 * Requirements: npm install canvas
 */

import { createCanvas } from 'canvas'
import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

/**
 * Génère une icône avec dégradé violet → bleu et logo NoteSnap
 * @param {number} size - Taille de l'icône en pixels
 * @param {string} outputPath - Chemin de sortie
 * @param {boolean} maskable - Si true, ajoute du padding pour maskable
 */
async function generateIcon(size, outputPath, maskable = false) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Dégradé violet → bleu
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#6C63FF')
  gradient.addColorStop(1, '#3B82F6')

  // Padding pour maskable (40% de la taille)
  const padding = maskable ? size * 0.4 : 0
  const iconSize = size - (padding * 2)
  const iconX = padding
  const iconY = padding

  // Fond avec dégradé
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  // Dessiner l'icône avec coins arrondis
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  ctx.roundRect(iconX, iconY, iconSize, iconSize, iconSize * 0.22)
  ctx.fill()
  ctx.restore()

  // Dessiner le logo NoteSnap (3 lignes représentant des notes)
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = size * 0.03
  ctx.lineCap = 'round'

  const centerX = size / 2
  const centerY = size / 2
  const lineSpacing = size * 0.08
  const lineWidth = iconSize * 0.6
  const startX = centerX - lineWidth / 2

  // Ligne 1
  ctx.beginPath()
  ctx.moveTo(startX, centerY - lineSpacing)
  ctx.lineTo(startX + lineWidth, centerY - lineSpacing)
  ctx.stroke()

  // Ligne 2
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(startX + lineWidth * 0.8, centerY)
  ctx.stroke()

  // Ligne 3
  ctx.beginPath()
  ctx.moveTo(startX, centerY + lineSpacing)
  ctx.lineTo(startX + lineWidth * 0.6, centerY + lineSpacing)
  ctx.stroke()

  // Sauvegarder l'image
  const buffer = canvas.toBuffer('image/png')
  await writeFile(outputPath, buffer)
  const type = maskable ? '(maskable)' : ''
  console.log(`✓ Icône générée: ${outputPath} (${size}x${size}) ${type}`)
}

/**
 * Génère une icône favicon ICO avec plusieurs tailles
 */
async function generateFavicon() {
  const sizes = [16, 32, 48]
  const outputPath = join(publicDir, 'favicon.ico')
  
  // Pour simplifier, on génère un PNG 32x32 comme favicon
  // Les navigateurs modernes supportent le favicon PNG
  const canvas = createCanvas(32, 32)
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, 32, 32)
  gradient.addColorStop(0, '#6C63FF')
  gradient.addColorStop(1, '#3B82F6')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)

  // Coins arrondis
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  ctx.roundRect(0, 0, 32, 32, 8)
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'

  // Logo simplifié
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'

  const centerX = 16
  const centerY = 16
  const lineSpacing = 3
  const lineWidth = 18
  const startX = centerX - lineWidth / 2

  ctx.beginPath()
  ctx.moveTo(startX, centerY - lineSpacing)
  ctx.lineTo(startX + lineWidth, centerY - lineSpacing)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(startX + lineWidth * 0.8, centerY)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(startX, centerY + lineSpacing)
  ctx.lineTo(startX + lineWidth * 0.6, centerY + lineSpacing)
  ctx.stroke()

  const buffer = canvas.toBuffer('image/png')
  await writeFile(outputPath, buffer)
  console.log(`✓ Favicon généré: ${outputPath} (32x32)`)
}

/**
 * Génère toutes les icônes PWA
 */
async function generateAllIcons() {
  console.log('🎨 Génération des icônes NoteSnap...\n')

  const icons = [
    { size: 192, name: 'icon-192.png', maskable: false },
    { size: 512, name: 'icon-512.png', maskable: false },
    { size: 192, name: 'icon-192-maskable.png', maskable: true },
    { size: 512, name: 'icon-512-maskable.png', maskable: true },
    { size: 180, name: 'apple-touch-icon.png', maskable: false }, // iOS standard
    { size: 192, name: 'favicon-192.png', maskable: false }, // Favicon HD
  ]

  for (const icon of icons) {
    const outputPath = join(publicDir, icon.name)
    await generateIcon(icon.size, outputPath, icon.maskable)
  }

  // Générer favicon.ico
  await generateFavicon()

  console.log('\n✅ Toutes les icônes ont été générées avec succès!')
}

// Exécuter la génération
generateAllIcons().catch(error => {
  console.error('❌ Erreur lors de la génération des icônes:', error)
  process.exit(1)
})
