// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./tvaCollector.sol";

contract CVNU is TVACollector {
    // Structure pour représenter les compétences d'un citoyen
    struct Competence {
        uint256 level; // Niveau de 0 à 100
        uint256 experience; // Nombre d'années ou d'heures d'expérience
        bool isCertified; // Certifié par une autorité externe (e.g., smart contract)
    }

    // Mapping pour stocker les CV de chaque citoyen
    mapping(address => Competence[]) public citizenCV;

    // Allocation universelle mensuelle
    uint256 public constant MIN_ALLOCATION = 500;
    uint256 public constant MAX_ALLOCATION = 5000;
    
    // Événement pour la distribution de l'allocation
    event AllocationDistributed(address indexed citizen, uint256 amount);

    /**
     * @dev Enregistre ou met à jour les compétences d'un citoyen.
     * Cette fonction pourrait être appelée par un autre smart contract
     * certifiant les compétences (e.g., un oracle).
     * @param _citizen L'adresse du citoyen.
     * @param _level Le niveau de compétence (0-100).
     * @param _experience L'expérience en années ou heures.
     * @param _isCertified Si la compétence est certifiée.
     */
    function updateCompetence(address _citizen, uint256 _level, uint256 _experience, bool _isCertified) external {
        // Validation basique
        require(_level <= 100, "Le niveau de competence doit etre <= 100");
        
        citizenCV[_citizen].push(Competence(_level, _experience, _isCertified));
    }

    /**
     * @dev Calcule l'allocation d'un citoyen en fonction de ses compétences.
     * @param _citizen L'adresse du citoyen.
     * @return Le montant de l'allocation en wei.
     */
    function calculateAllocation(address _citizen) public view returns (uint256) {
        // On récupère le CV du citoyen
        Competence[] memory cv = citizenCV[_citizen];
        require(cv.length > 0, "Aucune competence enregistree pour ce citoyen.");

        uint256 totalScore = 0;
        for (uint i = 0; i < cv.length; i++) {
            if (cv[i].isCertified) {
                // Le calcul est basé sur le niveau et l'expérience.
                // On peut ajouter un coefficient pour la certification.
                totalScore += (cv[i].level * cv[i].experience) + 10;
            } else {
                totalScore += (cv[i].level * cv[i].experience);
            }
        }
        
        // La formule doit être ajustée pour mapper le score à l'allocation (500-5000)
        // Exemple de formule simple : (score / total_max_score) * (MAX - MIN) + MIN
        uint256 baseAllocation = MIN_ALLOCATION;
        uint256 progressivePart = (totalScore * (MAX_ALLOCATION - MIN_ALLOCATION)) / 2000; // 2000 est un exemple de facteur de normalisation
        
        uint256 finalAllocation = baseAllocation + progressivePart;

        if (finalAllocation > MAX_ALLOCATION) {
            return MAX_ALLOCATION;
        }
        
        return finalAllocation;
    }

    /**
     * @dev Distribue l'allocation mensuelle (base 28 jours) au citoyen.
     * @param _citizen L'adresse du citoyen.
     */
    function distributeAllocation(address _citizen) public onlyOwner {
        // Vérifie si le fonds a suffisamment d'argent pour la distribution
        require(address(this).balance > 0, "Fonds de distribution insuffisant.");

        uint256 amount = calculateAllocation(_citizen);
        require(amount <= address(this).balance, "Fonds insuffisants pour la distribution.");

        payable(_citizen).transfer(amount);
        emit AllocationDistributed(_citizen, amount);
    }
}