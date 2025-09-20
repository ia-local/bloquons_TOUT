// Fichier : public/src/js/layerModal.js

import { openBoycottageFormModal } from './boycottageForm.js';
import { openModalLegend } from './modalLegend.js';
import { openIpCamModal } from './ipCam.js';

/**
 * Gère l'ouverture de la modale de boycottage.
 */
export function openBoycottageModal() {
    openBoycottageFormModal();
}

/**
 * Gère l'ouverture de la modale de la légende.
 * @param {string} id L'ID du dossier à afficher.
 * @param {string} type Le type de l'objet (par exemple, 'Dossier' ou 'AG').
 */
export function openLegendModal(id, type) {
    openModalLegend(id, type);
}

/**
 * Gère l'ouverture de la modale pour les flux vidéo des caméras.
 * @param {string} videoUrl L'URL du flux vidéo.
 * @param {string} title Le titre de la modale.
 */
export function openIpCam(videoUrl, title) {
    openIpCamModal(videoUrl, title);
}