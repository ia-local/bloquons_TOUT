// ascii-art.js

// Définition des dimensions des caractères ASCII en pixels
export const baseCharWidth = 10; // Largeur de base d'un caractère ASCII (ex: ' ') en pixels
export const baseCharHeight = 10; // Hauteur de base d'un caractère ASCII en pixels

// Calcul des dimensions maximales d'une lettre ASCII (en caractères) pour un espacement cohérent
export let maxLetterHeightInLines = 0;
export let maxLetterWidthInChars = 0;

// Définitions de l'ASCII Art pour chaque lettre et chiffre
// Les définitions sont ajustées pour une meilleure cohérence visuelle.
export const asciiArt = 
{
    'A': [ // Ajusté pour un style bloc plus cohérent
        "  ██  ",
        " ████ ",
        "██  ██",
        "██████",
        "██  ██"
    ],
    "B": [
        "██████╗  ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    "C": [
        " █████╗  ",
        "██╔═══╝  ",
        "██║      ",
        "██║      ",
        "╚█████╗  ",
        " ╚════╝  "
    ],
    "D": [
        "██████╗  ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "██║  ██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    'E': [
        "███████╗",
        "██╔════╝",
        "█████╗  ",
        "██╔══╝  ",
        "███████╗",
        "╚══════╝"
    ],
    'F': [ // Ajout de la lettre F
        "███████╗",
        "██╔════╝",
        "█████╗  ",
        "██╔══╝  ",
        "██║     ",
        "╚═╝     "
    ],
    "G": [
        "██████╗  ",
        "██╔════╝ ",
        "██║  ████╗",
        "██║    ██║",
        "╚███████╔╝",
        " ╚══════╝ "
    ],
    "H": [
        "██╗  ██╗",
        "██║  ██║",
        "███████║",
        "██╔══██║",
        "██║  ██║",
        "╚═╝  ╚═╝"
    ],
    "I": [
        "███████╗",
        " ╚███╔╝ ",
        "  ███╔╝ ",
        "  ███╔╝ ",
        "███████╗",
        "╚══════╝"
    ],
    "J": [
        "     ███║ ",
        "     ███║ ",
        "     ███║ ",
        "██║  ███║ ",
        " ██████╔╝ ",
        "  ╚════╝  "
    ],
    "K": [
        "██╗  ██╗",
        "██║ ██║ ",
        "█████╔╝ ",
        "██╔═██╗ ",
        "██║  ██╗",
        "╚═╝  ╚═╝"
    ],
    "L": [
        "██╗      ",
        "██║      ",
        "██║      ",
        "██║      ",
        "██████╗  ",
        "╚═════╝  "
    ],
    'M': [
        "██╗     ██╗",
        "███╗   ███║",
        "██╔████╔██║",
        "██║╚██╔╝██║",
        "██║ ╚═╝ ██║",
        "╚═╝     ╚═╝"
    ],
    "N": [
        " ███╗   ██╗",
        " ████╗  ██║",
        " ██╔██╗ ██║",
        " ██║╚██╗██║",
        " ██║ ╚████║",
        " ╚═╝  ╚═══╝"
    ],
    'O': [
        "  █████╗",
        "██╔═══██╗",
        "██║   ██║",
        "██║   ██║",
        "╚██████╔╝"
    ],
    "P": [
        "██████╗  ",
        "██╔══██╗ ",
        "██████╔╝ ",
        "██╔═══╝  ",
        "██║      ",
        "╚═╝      "
    ],
    'Q': [ // Ajusté pour être basé sur 'O' avec une queue intégrée
        "  █████╗  ",
        "██╔═══██╗ ",
        "██║   ██║ ",
        "██║   ██║ ",
        "╚██████╔╝ ",
        "      ╚═╝█" // Queue plus intégrée et utilisant des caractères de bordure
    ],
    'R': [ // Ajusté pour un style bloc plus cohérent
        "██████╗  ",
        "██╔══██╗ ",
        "██████╔╝ ",
        "██╔══██╗ ",
        "██║  ██║ ",
        "╚═╝  ╚═╝ "
    ],
    "S": [
        "██████╗  ",
        "██╔════╝ ",
        "███████╗ ",
        "╚════██║ ",
        "██████╔╝ ",
        "╚═════╝  "
    ],
    "T": [
        "████████╗",
        "╚══██╔══╝",
        "   ██║   ",
        "   ██║   ",
        "   ██║   ",
        "   ╚═╝   "
    ],
    "U": [
        "██╗   ██╗",
        "██║   ██║",
        "██║   ██║",
        "██║   ██║",
        "╚██████╔╝",
        " ╚═════╝ "
    ],
    "V": [
        "██╗     ██╗",
        "██║     ██║",
        "██║     ██║",
        "╚██╗   ██╔╝",
        " ╚█████╔╝ ",
        "  ╚════╝  "
    ],
    'W': [ // Ajout de la lettre W
        "██╗    ██╗",
        "██║    ██║",
        "██║ █╗ ██║",
        "██║███╗██║",
        "████╔████║",
        "╚══╝╚═══╝"
    ],
    "X": [
        "██╗   ██╗",
        "╚██╗ ██╔╝",
        "  ╚███╔╝ ",
        "  ██╔██╗ ",
        "██╔╝  ██╗",
        "╚═╝   ╚═╝"
    ],
    "Y": [
        "  ██╗   ██╗",
        "  ╚██╗ ██╔╝",
        "   ╚████╔╝ ",
        "    ╚██╔╝  ",
        "     ██║   ",
        "     ╚═╝   "
    ],
    "Z": [
        "███████╗",
        "╚══███╔╝",
        " ███╔╝ ",
        "███╔╝  ",
        "███████╗",
        "╚══════╝"
    ],
    '0': [
        '██████╗',
        '██╔══██╗',
        '██║  ██║',
        '██║  ██║',
        '██████╔╝',
        '╚═════╝ '
    ],
    '1': [
        '██═╗',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '██╔╝',
        '╚═╝ '
    ],
    '2': [
        '██████╗',
        '╚═══██╗',
        '█████╔╝',
        '██╔═══╝',
        '███████╗',
        '╚══════╝ '
    ],
    '3': [
        '██████╗',
        '╚═══██╗',
        '██████╔╝',
        '╚══███╗',
        '██████╔╝',
        '╚════╝ '
    ],
    '4': [
        '██╗ ██╗',
        '██║ ██║',
        '██████║',
        '╚═══██║',
        '    ██║',
        '    ╚═╝ '
    ],
    '5': [
        '███████╗',
        '██╔════╝',
        '███████╗',
        '╚════██║',
        '███████║',
        '╚══════╝ '
    ],
    '6': [
        '██████╗',
        '██╔════╝',
        '███████╗',
        '██╔══██╗',
        '╚██████╔╝',
        '╚═════╝ '
    ],
    '7': [
        '███████═╗',
        '╚════██ ║',
        '     ██╔╝',
        '     ██╔╝',
        '     ██╔╝',
        '     ╚═╝ '
    ],
    '8': [
        '██████╗',
        '██╔══██╗',
        '███████║',
        '██╔══██║',
        '╚██████║',
        '╚═════╝ '
    ],
    '9':[
        '███████╗',
        '██╔══██╗',
        '███████╝',
        '  ╚══██╗',
        ' ██████║',
        ' ╚═════╝'
    ],
    // Caractère pour l'espace (important pour le mode phrase)
    ' ': [
        "      ",
        "      ",
        "      ",
        "      ",
        "      ",
        "      "
    ]
};

// Calcul des dimensions maximales d'une lettre ASCII (en caractères) pour un espacement cohérent
// Ces calculs doivent être faits APRÈS la définition de asciiArt
for (const letterKey in asciiArt) {
    const letterDefinition = asciiArt[letterKey];
    if (letterDefinition.length > maxLetterHeightInLines) {
        maxLetterHeightInLines = letterDefinition.length;
    }
    letterDefinition.forEach(line => {
        if (line.length > maxLetterWidthInChars) {
            maxLetterWidthInChars = line.length;
        }
    });
}

// Dimensions effectives en pixels pour le calcul du layout (à la taille de base)
export const effectiveBaseLetterHeight = maxLetterHeightInLines * baseCharHeight;
export const effectiveBaseLetterWidth = maxLetterWidthInChars * baseCharWidth;

// Espacement entre les lettres (à la taille de base)
export const paddingBetweenLetters = 15; // Espacement en pixels entre les lettres

