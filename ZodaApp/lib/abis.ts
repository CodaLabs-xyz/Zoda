export const usdcAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export const zodaNftAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
    ],
    name: "mint",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "uri",
        type: "string",
      },
    ],
    name: "NFTMinted",
    type: "event",
  },
]

export const nftAbi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "username",
        type: "string",
      },
      {
        internalType: "uint16",
        name: "birthYear",
        type: "uint16",
      },
      {
        internalType: "string",
        name: "zodiacSign",
        type: "string",
      },
      {
        internalType: "string",
        name: "fortune",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "mintFortune",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

