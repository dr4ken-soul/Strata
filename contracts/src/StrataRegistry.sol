// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Thrown when a caller that is not the ledger owner calls a gated function.
error NotLedgerOwner(bytes32 ledgerId, address caller);
/// @notice Thrown when a ledger id is already registered.
error LedgerAlreadyRegistered(bytes32 ledgerId);
/// @notice Thrown when a duplicate attestation is attempted for one claim.
error DuplicateAttestation(bytes32 claimHash);
/// @notice Thrown when a verdict outside the known set is supplied.
error InvalidVerdict(uint8 verdict);
/// @notice Thrown when the counters and the attestation count disagree.
error CountMismatch();

/// @title StrataRegistry
/// @notice A thin registry for ledger ownership and counts only. The record
///  itself lives in EAS attestations on Base, this contract deliberately keeps
///  no parallel record onchain.
/// @author Strata
contract StrataRegistry {
    /// @notice Verdict ids as written into attestations, held first so zero
    ///  is never a valid verdict.
    enum Verdict {
        None,
        Held,
        Broken,
        Unverifiable
    }

    struct Ledger {
        address owner;
        uint64 materialChangeCount;
        uint64 brokenCount;
        uint64 attestationCount;
    }

    /// @notice Ledger ownership and counts, keyed by a stable ledger id.
    mapping(bytes32 => Ledger) public ledgers;

    /// @notice One recorded claim hash per ledger, duplicate attestations
    ///  attempt are rejected here.
    mapping(bytes32 => mapping(bytes32 => bool)) public recordedClaims;

    /// @notice Global counters read by the landing page metrics.
    uint256 public projectsOnRecord;
    uint256 public totalMaterialChanges;
    uint256 public totalAttestations;

    /// @notice Emitted when a ledger is registered.
    event LedgerRegistered(bytes32 indexed ledgerId, address indexed owner);
    /// @notice Emitted when one claim verdict is recorded.
    event VerdictRecorded(
        bytes32 indexed ledgerId,
        bytes32 indexed claimHash,
        Verdict verdict,
        bytes32 attestationUid
    );

    /// @notice Registers a ledger and its owner.
    /// @param ledgerId - the stable ledger id, the slug hashed
    /// @param owner - the address permitted to record verdicts
    function registerLedger(bytes32 ledgerId, address owner) external {
        if (owner == address(0)) revert NotLedgerOwner(ledgerId, address(0));
        Ledger storage ledger = ledgers[ledgerId];
        if (ledger.owner != address(0)) revert LedgerAlreadyRegistered(ledgerId);
        // checks, effects, interactions: no external calls in this function
        ledger.owner = owner;
        unchecked {
            // projectsOnRecord increments one per registration, overflow is
            // unreachable below uint256 max in any realistic deployment
            projectsOnRecord += 1;
        }
        emit LedgerRegistered(ledgerId, owner);
    }

    /// @notice Records one verified or broken promise, after the EAS
    ///  attestation has confirmed onchain. The uid is recorded here, the record
    ///  itself lives in EAS.
    /// @param ledgerId - the ledger the claim belongs to
    /// @param claimHash - the hash of the source quote and source reference
    /// @param sourceRef - the archive capture id or commit hash, kept as an
    ///  event only, storage stays thin
    /// @param verifiedAtBlock - the block the verification was read at
    /// @param verdict - the verdict id, Held, Broken or Unverifiable
    /// @param attestationUid - the confirmed EAS attestation uid
    /// @return claimKey - the recorded claim key
    function recordVerdict(
        bytes32 ledgerId,
        bytes32 claimHash,
        string calldata sourceRef,
        uint64 verifiedAtBlock,
        uint8 verdict,
        bytes32 attestationUid
    ) external returns (bytes32 claimKey) {
        Ledger storage ledger = ledgers[ledgerId];
        address caller = msg.sender;
        if (ledger.owner != caller) revert NotLedgerOwner(ledgerId, caller);
        if (verdict == uint8(Verdict.None) || verdict > uint8(Verdict.Unverifiable)) {
            revert InvalidVerdict(verdict);
        }
        if (attestationUid == bytes32(0)) revert InvalidVerdict(uint8(Verdict.None));
        claimKey = keccak256(abi.encodePacked(ledgerId, claimHash));
        if (recordedClaims[ledgerId][claimHash]) revert DuplicateAttestation(claimHash);
        // checks, effects, interactions: state written before any external call,
        // and there are no external calls in this function at all
        recordedClaims[ledgerId][claimHash] = true;
        ledger.attestationCount += 1;
        if (verdict != uint8(Verdict.Unverifiable)) {
            ledger.materialChangeCount += 1;
            unchecked {
                // one increment per recorded claim, bounded by gas cost
                totalMaterialChanges += 1;
            }
        }
        if (verdict == uint8(Verdict.Broken)) {
            ledger.brokenCount += 1;
        }
        unchecked {
            // one increment per recorded claim, bounded by gas cost
            totalAttestations += 1;
        }
        emit VerdictRecorded(ledgerId, claimHash, Verdict(verdict), attestationUid);
    }
}
