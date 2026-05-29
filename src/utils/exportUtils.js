/**
 * exportUtils.js — Utilitaires d'export PDF et JSON
 *
 * Fonctionnalités :
 *   - Export PDF d'une note individuelle (avec photos)
 *   - Export PDF de plusieurs notes (liste ou détaillé)
 *   - Export JSON de toutes les données (sauvegarde complète)
 *   - Import JSON (restauration)
 *   - Génération de noms de fichiers horodatés
 *
 * Stack : jsPDF + jspdf-autotable
 * Zéro backend : tout s'exécute dans le navigateur
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateLong, formatDateShort, formatDateForFilename } from './dateUtils'

/** Couleurs du design system */
const COLORS = {
  violet: [108, 99, 255],
  blue: [59, 130, 246],
  dark: [15, 15, 19],
  surface: [22, 22, 30],
  text: [240, 240, 248],
  textSecondary: [160, 160, 192],
  textMuted: [96, 96, 128],
  white: [255, 255, 255],
  priorityHigh: [239, 68, 68],
  priorityMedium: [245, 158, 11],
  priorityLow: [34, 197, 94],
  priorityNone: [96, 96, 128]
}

/** Labels de priorité */
const PRIORITY_LABELS = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
  none: 'Aucune'
}

/**
 * Retourne la couleur RGB pour une priorité
 * @param {string} priority
 * @returns {number[]}
 */
function getPriorityColor(priority) {
  const map = {
    high: COLORS.priorityHigh,
    medium: COLORS.priorityMedium,
    low: COLORS.priorityLow,
    none: COLORS.priorityMuted
  }
  return map[priority] ?? COLORS.textMuted
}

/**
 * Déclenche le téléchargement d'un fichier dans le navigateur
 * Compatible Chrome 90+, Safari 14+, Firefox 90+
 * @param {string} url - URL blob ou data URL
 * @param {string} filename
 */
function triggerDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  // Nettoyage différé pour Safari
  setTimeout(() => {
    document.body.removeChild(link)
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }, 100)
}

/**
 * Nettoie un texte pour l'affichage PDF (supprime caractères problématiques)
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
  if (!text) return ''
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
}

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Ajoute l'en-tête NoteSnap au PDF
 * @param {jsPDF} doc
 * @param {string} subtitle
 */
function addPDFHeader(doc, subtitle = '') {
  const pageWidth = doc.internal.pageSize.getWidth()

  // Bande de couleur en haut
  doc.setFillColor(...COLORS.violet)
  doc.rect(0, 0, pageWidth, 18, 'F')

  // Nom de l'application
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COLORS.white)
  doc.text('NoteSnap', 14, 12)

  // Sous-titre
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.white)
    doc.text(subtitle, pageWidth - 14, 12, { align: 'right' })
  }

  return 22 // Hauteur de départ du contenu
}

/**
 * Ajoute un pied de page avec numérotation
 * @param {jsPDF} doc
 */
function addPDFFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Ligne séparatrice
    doc.setDrawColor(...COLORS.textMuted)
    doc.setLineWidth(0.3)
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14)

    // Numéro de page
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textMuted)
    doc.text(
      `Page ${i} / ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    )

    // Date d'export
    doc.text(
      `Exporté le ${formatDateShort(Date.now())}`,
      14,
      pageHeight - 8
    )

    // Nom app
    doc.text('NoteSnap', pageWidth - 14, pageHeight - 8, { align: 'right' })
  }
}

/**
 * Exporte une note individuelle en PDF
 * Inclut les photos si disponibles
 *
 * @param {Object} note - Données de la note
 * @param {Object} folder - Dossier parent (optionnel)
 * @returns {Promise<void>}
 */
export async function exportNoteToPDF(note, folder = null) {
  if (!note) throw new Error('Données de note manquantes pour l\'export.')

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    const contentWidth = pageWidth - margin * 2

    let y = addPDFHeader(doc, 'Export de note')

    // ── Titre de la note ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...COLORS.dark)
    const title = sanitizeText(note.title) || 'Note sans titre'
    const titleLines = doc.splitTextToSize(title, contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 8 + 4

    // ── Métadonnées ──
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.textSecondary)

    // Dossier
    const folderText = folder ? `📁 ${folder.name}` : '📁 Sans dossier'
    doc.text(folderText, margin + 4, y + 7)

    // Dates
    doc.text(`Créée : ${formatDateShort(note.createdAt)}`, margin + 4, y + 14)
    doc.text(`Modifiée : ${formatDateShort(note.updatedAt)}`, margin + 60, y + 14)

    // Priorité
    if (note.priority && note.priority !== 'none') {
      const priorityLabel = PRIORITY_LABELS[note.priority] || note.priority
      const pColor = getPriorityColor(note.priority)
      doc.setTextColor(...(pColor || COLORS.textMuted))
      doc.text(`⚑ Priorité ${priorityLabel}`, pageWidth - margin - 4, y + 7, { align: 'right' })
    }

    y += 28

    // ── Tags ──
    if (Array.isArray(note.tags) && note.tags.length > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...COLORS.violet)
      const tagsText = note.tags.map(t => `#${t}`).join('  ')
      doc.text(tagsText, margin, y)
      y += 8
    }

    // ── Séparateur ──
    doc.setDrawColor(...COLORS.violet)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    // ── Contenu ──
    if (note.content && note.content.trim()) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 50)

      const contentLines = doc.splitTextToSize(sanitizeText(note.content), contentWidth)

      for (let i = 0; i < contentLines.length; i++) {
        // Nouvelle page si nécessaire
        if (y > 260) {
          doc.addPage()
          y = 20
        }
        doc.text(contentLines[i], margin, y)
        y += 6
      }
    }

    // ── Photos ──
    if (Array.isArray(note.photos) && note.photos.length > 0) {
      y += 6

      if (y > 240) {
        doc.addPage()
        y = 20
      }

      // Titre section photos
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...COLORS.violet)
      doc.text(`Photos (${note.photos.length})`, margin, y)
      y += 8

      for (let i = 0; i < note.photos.length; i++) {
        const photo = note.photos[i]

        if (!photo || typeof photo !== 'string') continue

        try {
          // Calcul des dimensions (max 160mm de large)
          const imgMaxWidth = contentWidth
          const imgMaxHeight = 120

          if (y + imgMaxHeight > 270) {
            doc.addPage()
            y = 20
          }

          // Obtenir les dimensions réelles de l'image
          await new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
              const ratio = Math.min(
                imgMaxWidth / img.width,
                imgMaxHeight / img.height,
                1
              )
              const displayWidth = img.width * ratio
              const displayHeight = img.height * ratio

              try {
                doc.addImage(photo, 'JPEG', margin, y, displayWidth, displayHeight)
                y += displayHeight + 6

                // Légende
                doc.setFont('helvetica', 'italic')
                doc.setFontSize(8)
                doc.setTextColor(...COLORS.textMuted)
                doc.text(`Photo ${i + 1}`, margin, y)
                y += 6
              } catch {
                // Image non ajoutée silencieusement
              }
              resolve()
            }
            img.onerror = () => resolve()
            img.src = photo
          })
        } catch {
          // Photo ignorée silencieusement
        }
      }
    }

    addPDFFooter(doc)

    // Génération du nom de fichier
    const safeTitle = (note.title || 'note')
      .replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 40)

    const filename = `notesnap_${safeTitle}_${formatDateForFilename(Date.now())}.pdf`

    // Téléchargement
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
  } catch (err) {
    throw new Error(`Erreur lors de la génération du PDF : ${err.message}`)
  }
}

/**
 * Exporte plusieurs notes en PDF sous forme de liste
 * @param {Array} notes - Tableau de notes
 * @param {Array} folders - Tableau de dossiers (pour résolution des noms)
 * @param {Object} options - { title?, subtitle? }
 * @returns {Promise<void>}
 */
export async function exportNotesListToPDF(notes, folders = [], options = {}) {
  if (!Array.isArray(notes) || notes.length === 0) {
    throw new Error('Aucune note à exporter.')
  }

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const title = options.title || 'Mes notes'
    const subtitle = options.subtitle || `${notes.length} note${notes.length > 1 ? 's' : ''}`

    let y = addPDFHeader(doc, subtitle)

    // ── Titre ──
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(...COLORS.dark)
    doc.text(title, 14, y)
    y += 10

    // ── Sous-titre ──
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.textSecondary)
    doc.text(
      `Exporté le ${formatDateLong(Date.now())} — ${notes.length} note${notes.length > 1 ? 's' : ''}`,
      14,
      y
    )
    y += 10

    // ── Tableau des notes ──
    const folderMap = {}
    folders.forEach(f => { folderMap[f.id] = f.name })

    const tableBody = notes.map(note => [
      truncate(note.title || 'Sans titre', 40),
      truncate(note.content || '', 60),
      folderMap[note.folderId] || 'Sans dossier',
      PRIORITY_LABELS[note.priority] || 'Aucune',
      Array.isArray(note.tags) && note.tags.length > 0
        ? note.tags.slice(0, 3).map(t => `#${t}`).join(', ')
        : '—',
      formatDateShort(note.updatedAt)
    ])

    autoTable(doc, {
      startY: y,
      head: [['Titre', 'Aperçu', 'Dossier', 'Priorité', 'Étiquettes', 'Modifiée']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.violet,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        textColor: [40, 40, 50],
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [248, 248, 252]
      },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 65 },
        2: { cellWidth: 25 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      },
      margin: { left: 14, right: 14 },
      styles: {
        overflow: 'linebreak',
        lineColor: [220, 220, 230],
        lineWidth: 0.2
      }
    })

    addPDFFooter(doc)

    const filename = `notesnap_liste_${formatDateForFilename(Date.now())}.pdf`
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
  } catch (err) {
    throw new Error(`Erreur lors de la génération de la liste PDF : ${err.message}`)
  }
}

/**
 * Exporte toutes les données de l'application en JSON
 * Utilisé pour la sauvegarde complète
 *
 * @param {Array} notes - Toutes les notes
 * @param {Array} folders - Tous les dossiers
 * @returns {void}
 */
export function exportDataToJSON(notes, folders) {
  try {
    const exportData = {
      version: '1.0.0',
      app: 'NoteSnap',
      exportedAt: Date.now(),
      exportedAtFormatted: formatDateLong(Date.now()),
      stats: {
        noteCount: notes.length,
        folderCount: folders.length
      },
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        color: f.color,
        icon: f.icon,
        createdAt: f.createdAt
      })),
      notes: notes.map(n => ({
        id: n.id,
        folderId: n.folderId,
        title: n.title,
        content: n.content,
        tags: n.tags,
        priority: n.priority,
        photos: n.photos, // Inclure les photos base64
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }))
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const filename = `notesnap_sauvegarde_${formatDateForFilename(Date.now())}.json`

    triggerDownload(url, filename)
  } catch (err) {
    throw new Error(`Erreur lors de l'export JSON : ${err.message}`)
  }
}

/**
 * Valide et parse un fichier JSON de sauvegarde NoteSnap
 * @param {File} file - Fichier JSON
 * @returns {Promise<{ notes: Array, folders: Array }>}
 */
export async function parseImportJSON(file) {
  if (!file) throw new Error('Aucun fichier fourni.')

  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    throw new Error('Le fichier doit être au format JSON (.json).')
  }

  if (file.size > 100 * 1024 * 1024) {
    throw new Error('Le fichier est trop volumineux (max 100 Mo).')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        if (!data.app || data.app !== 'NoteSnap') {
          reject(new Error('Ce fichier n\'est pas une sauvegarde NoteSnap valide.'))
          return
        }

        if (!Array.isArray(data.notes)) {
          reject(new Error('Le fichier de sauvegarde est corrompu : propriété "notes" manquante.'))
          return
        }

        if (!Array.isArray(data.folders)) {
          reject(new Error('Le fichier de sauvegarde est corrompu : propriété "folders" manquante.'))
          return
        }

        resolve({
          notes: data.notes,
          folders: data.folders,
          exportedAt: data.exportedAt,
          version: data.version
        })
      } catch {
        reject(new Error('Le fichier JSON est invalide ou corrompu.'))
      }
    }

    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'))
    reader.readAsText(file, 'utf-8')
  })
}

/**
 * Exporte une note en texte brut (.txt)
 * @param {Object} note
 * @returns {void}
 */
export function exportNoteToText(note) {
  if (!note) throw new Error('Données de note manquantes.')

  try {
    const lines = [
      `NOTESNAP — Export de note`,
      `${'='.repeat(50)}`,
      ``,
      `Titre : ${note.title || 'Sans titre'}`,
      `Créée le : ${formatDateLong(note.createdAt)}`,
      `Modifiée le : ${formatDateLong(note.updatedAt)}`,
      `Priorité : ${PRIORITY_LABELS[note.priority] || 'Aucune'}`,
      `Étiquettes : ${Array.isArray(note.tags) && note.tags.length > 0 ? note.tags.join(', ') : 'Aucune'}`,
      ``,
      `${'─'.repeat(50)}`,
      ``,
      note.content || '',
      ``,
      `${'─'.repeat(50)}`,
      ``,
      `Exporté le ${formatDateLong(Date.now())} depuis NoteSnap`
    ]

    if (Array.isArray(note.photos) && note.photos.length > 0) {
      lines.push(``, `Note : Cette note contient ${note.photos.length} photo(s) non incluse(s) dans l'export texte.`)
    }

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const safeTitle = (note.title || 'note')
      .replace(/[^a-zA-Z0-9\u00C0-\u017F\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 40)

    const filename = `notesnap_${safeTitle}_${formatDateForFilename(Date.now())}.txt`
    triggerDownload(url, filename)
  } catch (err) {
    throw new Error(`Erreur lors de l'export texte : ${err.message}`)
  }
}
