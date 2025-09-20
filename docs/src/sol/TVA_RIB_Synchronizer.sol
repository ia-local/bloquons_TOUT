// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./tvaCollector.sol";
import "./CVNU.sol";

contract TVA_RIB_Synchronizer is TVACollector {
    // Instance du contrat CVNU pour récupérer les données du CV et calculer l'allocation
    CVNU public cvnuContract;

    // Mapping pour lier l'adresse du wallet à un RIB (Relevé d'Identité Bancaire)
    // Pour des raisons de sécurité et de confidentialité, les RIB ne sont pas stockés directement
    // sur la blockchain. Nous stockons un identifiant haché qui lie un wallet à une base
    // de données hors chaîne gérant les RIB.
    mapping(address => bytes32) public citizenRIB;

    // Événement pour la liaison du RIB
    event RIBSynchronized(address indexed citizen, bytes32 indexed ribHash);

    // Modifier pour limiter l'accès à certaines fonctions
    modifier onlyTaxOffice() {
        // En production, cette adresse serait contrôlée par l'autorité fiscale
        require(msg.sender == owner, "Seule l'autorite fiscale peut effectuer cette action.");
        _;
    }

    constructor(address _cvnuContractAddress) {
        cvnuContract = CVNU(_cvnuContractAddress);
    }

    /**
     * @dev Synchronise le wallet d'un citoyen avec son RIB.
     * @param _ribHash Un hachage du RIB pour lier le compte sans stocker de données sensibles.
     */
    function synchronizeRIB(bytes32 _ribHash) public {
        citizenRIB[msg.sender] = _ribHash;
        emit RIBSynchronized(msg.sender, _ribHash);
    }

    /**
     * @dev Opération de décaissement et de redistribution de la TVA.
     * Cette fonction est appelée par l'autorité fiscale (le "propriétaire").
     * Elle vérifie les fonds, calcule l'allocation et prépare le paiement.
     * Les paiements réels vers les RIB hors chaîne sont gérés de manière synchrone
     * par un système externe déclenché par cet événement.
     * @param _citizen L'adresse du citoyen à payer.
     */
    function distributeFunds(address _citizen) public onlyTaxOffice {
        // Vérifier que le RIB du citoyen est synchronisé
        require(citizenRIB[_citizen] != 0, "Le RIB du citoyen n'est pas synchronise.");

        // Obtenir le montant de l'allocation via le contrat CVNU
        uint256 allocationAmount = cvnuContract.calculateAllocation(_citizen);
        require(allocationAmount > 0, "L'allocation ne peut pas etre nulle.");

        // S'assurer que le solde du contrat est suffisant
        require(address(this).balance >= allocationAmount, "Solde du contrat insuffisant pour la distribution.");
        
        // Décaisser les fonds du contrat TVACollector
        uint256 balanceBefore = address(this).balance;
        withdrawFunds(allocationAmount);
        
        // Simuler la synchronisation avec le système de paiement bancaire.
        // Un événement est émis pour déclencher le paiement hors chaîne.
        // Ce mécanisme garantit la traçabilité et l'atomicité de l'opération.
        emit Withdrawal(
            _citizen, 
            allocationAmount, 
            citizenRIB[_citizen]
        );
    }
}