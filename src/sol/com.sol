// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FondsDeReforme is Ownable {
    // Le "coffre-fort" de notre compte de campagne
    uint256 public tresorerieCompteCampagne;
    
    // Mapping pour associer un numéro fiscal à une adresse de compte (simulée)
    mapping(uint256 => address) public numeroFiscalToAdresse;
    
    // Les "caisses" des commerces contribuant à la réforme
    mapping(address => uint256) public caisseContributions;

    // Struct pour représenter un citoyen et ses données de CV
    struct Citoyen {
        uint256 numeroFiscal;
        uint8 age;
        uint256 scoreCompetences; // Score agrégé de 0 à 100
    }

    // Tableau des citoyens enregistrés
    Citoyen[] public citoyens;

    event AllocationVersee(uint256 indexed numeroFiscal, uint256 montant);
    event ContributionRecue(address indexed caisseSource, uint256 montant, uint256 soldeTresorerie);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // Fonction pour lier un citoyen (numéro fiscal) à une adresse de virement (simulée)
    function enregistrerCitoyen(uint256 _numeroFiscal, uint8 _age, uint256 _scoreCompetences) public {
        // La liaison avec le RIB serait gérée par une passerelle sécurisée et hors chaîne
        citoyens.push(Citoyen(_numeroFiscal, _age, _scoreCompetences));
    }
    
    // Fonction pour simuler la réception de la TVA réaffectée
    function recevoirFonds() public payable {
        // Enregistrement de la contribution dans la "caisse" du commerce
        caisseContributions[msg.sender] += msg.value;
        // Consolidation du fonds dans la "trésorerie"
        tresorerieCompteCampagne += msg.value;
        
        emit ContributionRecue(msg.sender, msg.value, tresorerieCompteCampagne);
    }
    
    // Fonction de décaissement
    function decaisserAllocations() public onlyOwner {
        uint256 montantTotalTheorique = 0;

        for(uint i = 0; i < citoyens.length; i++) {
            // Le calcul du montant est simplifié ici
            // 500€ à 16 ans, jusqu'à 5000€
            uint256 montantAlloue = (citoyens[i].age >= 16) ? 500 + citoyens[i].scoreCompetences * 45 : 0;
            montantTotalTheorique += montantAlloue;
        }

        uint256 montantDisponible = tresorerieCompteCampagne;
        uint256 ratioAjustement = (montantDisponible * 10**18) / montantTotalTheorique;

        for(uint i = 0; i < citoyens.length; i++) {
            uint256 montantAlloue = (citoyens[i].age >= 16) ? 500 + citoyens[i].scoreCompetences * 45 : 0;
            uint256 montantFinal = (montantAlloue * ratioAjustement) / 10**18;
            
            // Simuler le virement vers le RIB
            // En production, cette ligne appellerait une passerelle de virement sécurisée
            // payable(citoyens[i].ribAdresse).transfer(montantFinal);
            
            tresorerieCompteCampagne -= montantFinal;
            emit AllocationVersee(citoyens[i].numeroFiscal, montantFinal);
        }
    }
}