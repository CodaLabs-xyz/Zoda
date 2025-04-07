// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721RoyaltyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ZodaNFT
 * @dev NFT contract for Zoda Farcaster mini app on Base network
 */
contract ZodaNFT is 
    Initializable, 
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721RoyaltyUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using Strings for uint256;

    // Token ID counter
    CountersUpgradeable.Counter private _tokenIds;

    // Base URI for metadata
    string private _baseTokenURI;

    // Minting fee in ETH
    uint256 public mintFee;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event MintFeeUpdated(uint256 newFee);
    event BaseURIUpdated(string newBaseURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 initialMintFee,
        address initialOwner
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Royalty_init();
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        _baseTokenURI = baseURI;
        mintFee = initialMintFee;

        // Set default royalty to 2.5%
        _setDefaultRoyalty(initialOwner, 250);
    }

    function mint(address to, string memory metadataURI) public payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient payment");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, metadataURI);

        emit NFTMinted(to, newTokenId, metadataURI);

        return newTokenId;
    }

    // Owner functions
    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Required overrides
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // The following functions are overrides required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721RoyaltyUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721RoyaltyUpgradeable) {
        super._burn(tokenId);
    }
} 