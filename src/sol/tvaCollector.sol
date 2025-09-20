// SPDX-License-Identifier: GNU umcTolens umc
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TVACollectorV2 is Ownable {
    // Mapping pour stocker les soldes de TVA de chaque payeur
    mapping(address => uint256) public tvaBalances;
    // Solde total des recettes de TVA collectées
    uint256 public totalCollectedTVA;

    // L'adresse du contrat qui reçoit la part de TVA pour le financement du CVNU
    address public immutable cvnuFundAddress;
    // La part de la TVA réaffectée au fonds CVNU (par exemple, 10% ou 1000 = 10% pour 10000 = 100%)
    uint256 public constant CVNU_FUND_RATE = 1000;

    // Événements pour la transparence et la traçabilité
    event PaymentReceived(address indexed payer, uint256 amount, uint256 tvaAmount);
    event FundsDistributedToCVNU(address indexed recipient, uint256 amount);
    event OwnerWithdrawal(uint256 amount);

    constructor(address _cvnuFundAddress) Ownable(msg.sender) {
        require(_cvnuFundAddress != address(0), "Adresse du fonds CVNU invalide");
        cvnuFundAddress = _cvnuFundAddress;
    }

    /**
     * @dev Permet à un utilisateur de payer la TVA en fonction d'un montant hors taxes.
     * Le contrat calcule la TVA due et la part du fonds CVNU.
     * @param _baseAmount Le montant hors taxes (HT) de la transaction.
     */
    function payTVA(uint256 _baseAmount) public payable {
        // Le taux de TVA en France est typiquement de 20%
        uint256 tvaRate = 2000; // 20% en base 10000

        // Calcul de la TVA due.
        uint256 calculatedTVA = (_baseAmount * tvaRate) / 10000;
        require(msg.value >= calculatedTVA, "Le paiement ne couvre pas la TVA due.");
        
        // Mettre à jour le solde total des TVA collectées
        totalCollectedTVA += calculatedTVA;
        tvaBalances[msg.sender] += calculatedTVA;

        // Émettre un événement pour la traçabilité
        emit PaymentReceived(msg.sender, _baseAmount, calculatedTVA);
    }
    
    /**
     * @dev Distribue la part de TVA affectée au fonds CVNU.
     * Cette fonction est appelée périodiquement par l'autorité fiscale (le propriétaire).
     */
    function distributeToCVNUFund() public onlyOwner {
        // Calculer la part de la TVA qui revient au fonds CVNU
        uint256 cvnuShare = (totalCollectedTVA * CVNU_FUND_RATE) / 10000;

        require(cvnuShare > 0, "Aucune part a distribuer au fonds CVNU.");
        
        // Réinitialiser le total collecté après distribution
        totalCollectedTVA -= cvnuShare;
        
        // Envoyer les fonds au contrat du fonds CVNU
        payable(cvnuFundAddress).transfer(cvnuShare);
        
        emit FundsDistributedToCVNU(cvnuFundAddress, cvnuShare);
    }

    /**
     * @dev Le propriétaire (l'État) peut retirer les fonds non affectés au fonds CVNU.
     * Cette fonction représente la réaffectation des recettes générales de la TVA.
     * @param amount Le montant à retirer.
     */
    function ownerWithdrawal(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Solde du contrat insuffisant.");
        payable(owner()).transfer(amount);
        emit OwnerWithdrawal(amount);
    }

    /**
     * @dev Retourne le solde de la TVA collectée pour un payeur.
     * @param account L'adresse du payeur.
     */
    function getTvaBalance(address account) public view returns (uint256) {
        return tvaBalances[account];
    }
}