/**
 * imageUtils.js — Utilitaires de traitement d'images
 *
 * Fonctionnalités :
 *   - Compression d'images via Canvas API
 *   - Stockage exclusif en base64 (jamais de Blob dans IndexedDB)
 *   - Limite stricte 1,5 MB par image
 *   - Compatibilité Safari 14+, Chrome 90+, Firefox 90+
 *   - Gestion des erreurs lisibles utilisateur
 */

/** Taille maximale d'une image compressée en octets (1,5 MB) */
export const MAX_IMAGE_SIZE_BYTES = 1.5 * 1024 * 1024 // 1 572 864 octets

/** Dimensions maximales après redimensionnement */
const MAX_DIMENSION = 1920
const THUMBNAIL_DIMENSION = 200

/** Qualité JPEG initiale */
const INITIAL_QUALITY = 0.85

/** Qualité minimum autorisée avant refus */
const MIN_QUALITY = 0.3

/** Types MIME acceptés */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

/**
 * Vérifie si un type MIME est accepté
 * @param {string} mimeType
 * @returns {boolean}
 */
export function isAcceptedImageType(mimeType) {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType.toLowerCase())
}

/**
 * Retourne la taille en octets d'une chaîne base64
 * @param {string} base64String
 * @returns {number}
 */
export function getBase64SizeBytes(base64String) {
  if (!base64String) return 0
  // Retirer le préfixe data:image/...;base64,
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String

  // Calcul précis : chaque char base64 = 6 bits, 4 chars = 3 octets
  const padding = (base64Data.match(/=+$/) || [''])[0].length
  return Math.floor((base64Data.length * 3) / 4) - padding
}

/**
 * Formate une taille en octets en chaîne lisible
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 o'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

/**
 * Lit un File/Blob comme DataURL (base64)
 * @param {File|Blob} file
 * @returns {Promise<string>}
 */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Charge une image depuis une URL/base64
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()

    // Timeout de sécurité : 15 secondes
    const timeout = setTimeout(() => {
      reject(new Error('Délai de chargement de l\'image dépassé.'))
    }, 15000)

    img.onload = () => {
      clearTimeout(timeout)
      resolve(img)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Format d\'image non reconnu ou fichier corrompu.'))
    }

    img.src = src
  })
}

/**
 * Calcule les nouvelles dimensions en respectant le ratio
 * @param {number} width - Largeur originale
 * @param {number} height - Hauteur originale
 * @param {number} maxDim - Dimension maximale
 * @returns {{ width: number, height: number }}
 */
function calculateDimensions(width, height, maxDim) {
  if (width <= maxDim && height <= maxDim) {
    return { width, height }
  }
  const ratio = Math.min(maxDim / width, maxDim / height)
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  }
}

/**
 * Encode une image sur un canvas en base64
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality - 0 à 1
 * @returns {string}
 */
function canvasToBase64(canvas, quality) {
  // Safari : toDataURL avec qualité fonctionne correctement
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Compresse une image et la retourne en base64
 * Essaie de réduire la qualité itérativement pour respecter la limite 1,5 MB
 *
 * @param {File} file - Fichier image source
 * @returns {Promise<string>} base64 de l'image compressée
 * @throws {Error} si la compression échoue ou dépasse la taille max
 */
export async function compressImage(file) {
  if (!file) {
    throw new Error('Aucun fichier image fourni.')
  }

  if (!(file instanceof File) && !(file instanceof Blob)) {
    throw new Error('Le fichier doit être une instance de File ou Blob.')
  }

  // Vérification du type MIME
  if (!isAcceptedImageType(file.type)) {
    throw new Error(
      `Format d'image non supporté : "${file.type}". Formats acceptés : JPEG, PNG, WebP, GIF.`
    )
  }

  // Vérification de la taille brute initiale (limite souple : 15 MB source)
  if (file.size > 15 * 1024 * 1024) {
    throw new Error(
      `L'image source est trop volumineuse (${formatFileSize(file.size)}). Maximum autorisé : 15 Mo avant compression.`
    )
  }

  try {
    // Lecture comme DataURL
    const dataUrl = await readFileAsDataURL(file)

    // Chargement de l'image
    const img = await loadImage(dataUrl)

    // Calcul des dimensions cibles
    const { width, height } = calculateDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, MAX_DIMENSION)

    // Création du canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Impossible d\'initialiser le contexte Canvas. Navigateur incompatible.')
    }

    // Fond blanc pour les images PNG avec transparence → JPEG
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    // Dessin de l'image
    ctx.drawImage(img, 0, 0, width, height)

    // Compression itérative
    let quality = INITIAL_QUALITY
    let base64Result = canvasToBase64(canvas, quality)
    let sizeBytes = getBase64SizeBytes(base64Result)

    // Tant que trop grand, réduire la qualité
    while (sizeBytes > MAX_IMAGE_SIZE_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.1)
      base64Result = canvasToBase64(canvas, quality)
      sizeBytes = getBase64SizeBytes(base64Result)
    }

    // Si toujours trop grand, réduire les dimensions
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      let scaleFactor = 0.8
      const minScale = 0.1

      while (sizeBytes > MAX_IMAGE_SIZE_BYTES && scaleFactor >= minScale) {
        const newWidth = Math.round(width * scaleFactor)
        const newHeight = Math.round(height * scaleFactor)

        canvas.width = newWidth
        canvas.height = newHeight

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, newWidth, newHeight)
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        base64Result = canvasToBase64(canvas, MIN_QUALITY)
        sizeBytes = getBase64SizeBytes(base64Result)
        scaleFactor -= 0.1
      }
    }

    // Vérification finale
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(
        `Impossible de compresser l'image en dessous de ${formatFileSize(MAX_IMAGE_SIZE_BYTES)}. ` +
        `Taille minimale atteinte : ${formatFileSize(sizeBytes)}. Utilisez une image plus petite.`
      )
    }

    return base64Result
  } catch (err) {
    if (err.message.includes('compresser') || err.message.includes('Format') || err.message.includes('trop volumineuse')) {
      throw err
    }
    throw new Error(`Erreur lors du traitement de l'image : ${err.message}`)
  }
}

/**
 * Crée une miniature (thumbnail) en base64
 * @param {string} base64Image - Image source en base64
 * @param {number} size - Dimension max de la miniature (défaut: 200px)
 * @returns {Promise<string>} base64 de la miniature
 */
export async function createThumbnail(base64Image, size = THUMBNAIL_DIMENSION) {
  if (!base64Image) {
    throw new Error('Aucune image source fournie.')
  }

  try {
    const img = await loadImage(base64Image)
    const { width, height } = calculateDimensions(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      size
    )

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas non disponible pour la miniature.')
    }

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    return canvas.toDataURL('image/jpeg', 0.7)
  } catch (err) {
    throw new Error(`Erreur lors de la création de la miniature : ${err.message}`)
  }
}

/**
 * Traite plusieurs fichiers image en parallèle
 * @param {FileList|Array<File>} files
 * @param {Object} options
 * @param {Function} options.onProgress - callback(current, total, fileName)
 * @returns {Promise<Array<{base64: string, name: string, size: number} | {error: string, name: string}>>}
 */
export async function processMultipleImages(files, options = {}) {
  const { onProgress } = options
  const fileArray = Array.from(files)

  if (fileArray.length === 0) return []

  const results = []

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i]

    if (onProgress) {
      onProgress(i + 1, fileArray.length, file.name)
    }

    try {
      const base64 = await compressImage(file)
      results.push({
        base64,
        name: file.name,
        size: getBase64SizeBytes(base64)
      })
    } catch (err) {
      results.push({
        error: err.message,
        name: file.name
      })
    }
  }

  return results
}

/**
 * Vérifie si une chaîne est un base64 d'image valide
 * @param {string} str
 * @returns {boolean}
 */
export function isValidBase64Image(str) {
  if (!str || typeof str !== 'string') return false
  return /^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(str)
}

/**
 * Extrait le type MIME d'un base64
 * @param {string} base64
 * @returns {string|null}
 */
export function getMimeTypeFromBase64(base64) {
  const match = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)
  return match ? match[1] : null
}
