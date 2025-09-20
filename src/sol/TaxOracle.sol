// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./tvaCollector.sol";
import "./CVNU.sol";
import "./TaxOracle.sol"; // Import de l'oracle de taxe

contract TVA_RIB_Synchronizer is TVACollector {
    // Instance du contrat TaxOracle
    TaxOracle public taxOracle;
    CVNU public cvnuContract;

    // Événement pour la liaison du RIB (peut être utilisé hors-chaîne pour le virement bancaire)
    event RIBSynchronized(address indexed citizen, bytes32 indexed ribHash);

    // Mapping pour lier l'adresse du wallet à un RIB (Relevé d'Identité Bancaire)
    mapping(address => bytes32) public citizenRIB;

    constructor(address _cvnuContractAddress, address _taxOracleAddress) {
        cvnuContract = CVNU(_cvnuContractAddress);
        taxOracle = TaxOracle(_taxOracleAddress);
    }

    modifier onlyTaxOffice() {
        require(msg.sender == owner, "Seule l'autorite fiscale peut effectuer cette action.");
        _;
    }

    /**
     * @dev Synchronise le wallet d'un citoyen avec son RIB, après vérification de son identité.
     * @param _ribHash Un hachage du RIB.
     */
    function synchronizeRIB(bytes32 _ribHash) public {
        require(taxOracle.isVerified(msg.sender), "Le citoyen n'est pas verifie par le TaxOracle.");
        citizenRIB[msg.sender] = _ribHash;
        emit RIBSynchronized(msg.sender, _ribHash);
    }

    /**
     * @dev Opération de décaissement et de redistribution de la TVA pour un citoyen vérifié.
     * @param _citizen L'adresse du citoyen à payer.
     */
    function distributeFunds(address _citizen) public onlyTaxOffice {
        require(taxOracle.isVerified(_citizen), "Le citoyen n'est pas verifie par le TaxOracle.");
        require(citizenRIB[_citizen] != 0, "Le RIB du citoyen n'est pas synchronise.");

        uint256 allocationAmount = cvnuContract.calculateAllocation(_citizen);
        require(allocationAmount > 0, "L'allocation ne peut pas etre nulle.");
        require(address(this).balance >= allocationAmount, "Solde du contrat insuffisant.");
        
        withdrawFunds(allocationAmount);
        
        emit Withdrawal(
            _citizen, 
            allocationAmount, 
            citizenRIB[_citizen]
        );
    }
}