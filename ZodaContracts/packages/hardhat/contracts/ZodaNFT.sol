// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZodaNFT
 * @dev NFT contract for Zoda Farcaster mini app on Base network
 */
contract ZodaNFT is 
    Initializable, 
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC2981Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    using Strings for uint256;

    // Token ID counter
    uint256 private _nextTokenId;

    // Minting fee in ETH
    uint256 public mintFee;

    // Treasury address for fee collection
    address payable public treasuryAddress;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event MintFeeUpdated(uint256 newFee);
    event TreasuryAddressUpdated(address newTreasury);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialMintFee,
        address initialOwner,
        address payable initialTreasury
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        mintFee = initialMintFee;
        _nextTokenId = 1;
        treasuryAddress = initialTreasury;

        // Set default royalty to 2.5%
        _setDefaultRoyalty(initialOwner, 250);
        transferOwnership(initialOwner);
    }

    function mint(address to, string memory metadataURI) public payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient payment");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Auto-withdraw fees to treasury if balance exceeds 0.01 ETH
        if (address(this).balance >= 0.01 ether) {
            _withdrawFeesToTreasury();
        }

        emit NFTMinted(to, tokenId, metadataURI);

        return tokenId;
    }

    // Owner functions
    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function setTreasuryAddress(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = newTreasury;
        emit TreasuryAddressUpdated(newTreasury);
    }

    // View functions
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    function withdrawFees() external {
        _withdrawFeesToTreasury();
    }

    // Internal function to handle fee withdrawal
    function _withdrawFeesToTreasury() internal {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        require(treasuryAddress != address(0), "Treasury not set");
        
        (bool success, ) = treasuryAddress.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Required overrides
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // The following functions are overrides required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
} 