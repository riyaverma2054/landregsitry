// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LandRegistry {
    struct Land {
        uint256 id;
        string parcelId;
        string location;
        uint256 areaSqm;
        address owner;
        bool exists;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Land) private landsById;
    mapping(bytes32 => uint256) private idByParcelHash;

    event LandRegistered(uint256 indexed id, string parcelId, address indexed owner);
    event OwnershipTransferred(uint256 indexed id, address indexed from, address indexed to);

    function registerLand(
        string calldata parcelId,
        string calldata location,
        uint256 areaSqm
    ) external returns (uint256 id) {
        require(bytes(parcelId).length > 0, "parcelId required");
        require(bytes(location).length > 0, "location required");
        require(areaSqm > 0, "areaSqm must be > 0");

        bytes32 key = keccak256(bytes(parcelId));
        require(idByParcelHash[key] == 0, "parcelId already registered");

        id = nextId++;
        landsById[id] = Land({
            id: id,
            parcelId: parcelId,
            location: location,
            areaSqm: areaSqm,
            owner: msg.sender,
            exists: true
        });
        idByParcelHash[key] = id;

        emit LandRegistered(id, parcelId, msg.sender);
    }

    function getLand(uint256 id) external view returns (Land memory) {
        require(landsById[id].exists, "land not found");
        return landsById[id];
    }

    function findByParcelId(string calldata parcelId) external view returns (uint256 id) {
        require(bytes(parcelId).length > 0, "parcelId required");
        id = idByParcelHash[keccak256(bytes(parcelId))];
        require(id != 0, "land not found");
    }

    function transferOwnership(uint256 id, address to) external {
        Land storage land = landsById[id];
        require(land.exists, "land not found");
        require(msg.sender == land.owner, "only owner");
        require(to != address(0), "invalid recipient");
        require(to != land.owner, "already owner");

        address from = land.owner;
        land.owner = to;

        emit OwnershipTransferred(id, from, to);
    }
}

