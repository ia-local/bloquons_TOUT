// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CVNU.sol : Smart Contract du Compte de Campagne N°647
 * @dev Ce contrat gère le fonds de redistribution de la TVA pour financer le Curriculum Vitae Numérique Universel (CVNU).
 * Il applique les principes des articles L4331-1 et L4333-1 du nouveau Code du Travail.
 */
contract FondsDeReformeCVNU is Ownable {
    // Article L4334-1 : Utilisation de la TVA pour le financement de la réforme.
    // Cette variable est la "trésorerie" du compte de campagne (le Compte 647).
    uint256 public tresorerieCompteCampagne;
    
    // Les "caisses" des commerces contribuant au projet.
    // Cette cartographie (mapping) associe une adresse de commerce à la somme qu'elle a contribué.
    mapping(address => uint256) public caisseContributions;

    // Représente le CVNU et les données de chaque citoyen (Article L3121-1).
    struct Citoyen {
        uint256 numeroFiscal;
        uint8 age;
        uint256 scoreCompetences; // Score agrégé de 0 à 100
    }

    // Le registre de tous les citoyens participants au programme.
    Citoyen[] public citoyens;

    // Événements pour la transparence et la traçabilité (Article L4333-1).
    // Permet à n'importe qui de vérifier les opérations de collecte et de décaissement.
    event AllocationVersee(uint256 indexed numeroFiscal, uint256 montant);
    event ContributionRecue(address indexed caisseSource, uint256 montant, uint256 soldeTresorerie);

    /**
     * @dev Constructeur du contrat. Définit le propriétaire initial, le Compte de Campagne.
     * @param initialOwner L'adresse de l'association de financement du parti politique.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Enregistre un citoyen dans le système du CVNU.
     * @param _numeroFiscal Le numéro fiscal unique du citoyen.
     * @param _age L'âge du citoyen (pour l'éligibilité à partir de 16 ans).
     * @param _scoreCompetences Le score de compétences validé sur le CVNU.
     */
    function enregistrerCitoyen(uint256 _numeroFiscal, uint8 _age, uint256 _scoreCompetences) public {
        citoyens.push(Citoyen(_numeroFiscal, _age, _scoreCompetences));
    }
    
    /**
     * @dev Point d'entrée pour les fonds de TVA réaffectée.
     * Simule l'opération de la Classe de Compte 7 (Produits).
     * L'Article 256 du CGI est la source de ces fonds.
     */
    function recevoirFonds() public payable {
        // Enregistre la contribution dans la "caisse" du commerce (msg.sender).
        caisseContributions[msg.sender] += msg.value;
        // Consolide les fonds dans la "trésorerie" centrale du Compte de Campagne.
        tresorerieCompteCampagne += msg.value;
        
        emit ContributionRecue(msg.sender, msg.value, tresorerieCompteCampagne);
    }
    
    /**
     * @dev Décaisse les allocations aux citoyens.
     * Cette fonction, exécutée par le propriétaire (le Compte 647), simule l'opération de la Classe de Compte 6 (Charges).
     */
    function decaisserAllocations() public onlyOwner {
        uint256 montantTotalTheorique = 0;

        for(uint i = 0; i < citoyens.length; i++) {
            // L'Article L3222-1 est appliqué ici pour la rémunération progressive
            // Le calcul du montant est basé sur l'âge et le score de compétences (500€ à 16 ans, jusqu'à 5000€).
            uint256 montantAlloue = (citoyens[i].age >= 16) ? 500 + citoyens[i].scoreCompetences * 45 : 0;
            montantTotalTheorique += montantAlloue;
        }

        uint256 montantDisponible = tresorerieCompteCampagne;
        uint256 ratioAjustement = (montantDisponible * 10**18) / montantTotalTheorique;

        for(uint i = 0; i < citoyens.length; i++) {
            uint256 montantAlloue = (citoyens[i].age >= 16) ? 500 + citoyens[i].scoreCompetences * 45 : 0;
            uint256 montantFinal = (montantAlloue * ratioAjustement) / 10**18;
            
            // L'opération est synchrone et sécurisée par les smart contracts (Article L4331-1).
            // Le versement se ferait vers le RIB lié au numéro fiscal.
            // payable(citoyens[i].ribAdresse).transfer(montantFinal);
            
            tresorerieCompteCampagne -= montantFinal;
            emit AllocationVersee(citoyens[i].numeroFiscal, montantFinal);
        }
    }
}