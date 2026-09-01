// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {
    StrataRegistry,
    DuplicateAttestation,
    InvalidVerdict,
    NotLedgerOwner
} from "../src/StrataRegistry.sol";

/// @title StrataRegistryTest
/// @notice Covers a held verdict, a broken verdict, an unverifiable verdict, a
///  duplicate attestation attempt and an unauthorised caller, before any
///  deployment.
contract StrataRegistryTest is Test {
    StrataRegistry internal registry;
    address internal owner = makeAddr("ledger-owner");
    address internal stranger = makeAddr("stranger");
    bytes32 internal ledgerId = keccak256("degen");

    event VerdictRecorded(
        bytes32 indexed ledgerId,
        bytes32 indexed claimHash,
        StrataRegistry.Verdict verdict,
        bytes32 attestationUid
    );

    function setUp() public {
        registry = new StrataRegistry();
        registry.registerLedger(ledgerId, owner);
    }

    function testRegistersLedger() public {
        (address registeredOwner, , , ) = registry.ledgers(ledgerId);
        assertEq(registeredOwner, owner);
        assertEq(registry.projectsOnRecord(), 1);
    }

    function testHeldVerdict() public {
        bytes32 claimHash = keccak256("claim-1");
        bytes32 uid = keccak256("attestation-1");
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit VerdictRecorded(
            ledgerId,
            claimHash,
            StrataRegistry.Verdict.Held,
            uid
        );
        registry.recordVerdict(
            ledgerId,
            claimHash,
            "wb-20240211",
            1_000_000,
            uint8(StrataRegistry.Verdict.Held),
            uid
        );
        (, uint64 material, uint64 broken, uint64 attestations) = registry.ledgers(ledgerId);
        assertEq(material, 1);
        assertEq(broken, 0);
        assertEq(attestations, 1);
        assertTrue(registry.recordedClaims(ledgerId, claimHash));
    }

    function testBrokenVerdict() public {
        bytes32 claimHash = keccak256("claim-2");
        bytes32 uid = keccak256("attestation-2");
        vm.prank(owner);
        registry.recordVerdict(
            ledgerId,
            claimHash,
            "wb-20240301",
            1_100_000,
            uint8(StrataRegistry.Verdict.Broken),
            uid
        );
        (, uint64 material, uint64 broken, ) = registry.ledgers(ledgerId);
        assertEq(material, 1);
        assertEq(broken, 1);
    }

    function testUnverifiableVerdictIsNotMaterial() public {
        bytes32 claimHash = keccak256("claim-3");
        bytes32 uid = keccak256("attestation-3");
        vm.prank(owner);
        registry.recordVerdict(
            ledgerId,
            claimHash,
            "git-abc123",
            1_200_000,
            uint8(StrataRegistry.Verdict.Unverifiable),
            uid
        );
        (, uint64 material, uint64 broken, uint64 attestations) = registry.ledgers(ledgerId);
        assertEq(material, 0);
        assertEq(broken, 0);
        assertEq(attestations, 1);
    }

    function testDuplicateAttestationReverts() public {
        bytes32 claimHash = keccak256("claim-1");
        bytes32 uid = keccak256("attestation-1");
        vm.startPrank(owner);
        registry.recordVerdict(
            ledgerId,
            claimHash,
            "wb-20240211",
            1_000_000,
            uint8(StrataRegistry.Verdict.Held),
            uid
        );
        vm.expectRevert(
            abi.encodeWithSelector(DuplicateAttestation.selector, claimHash)
        );
        registry.recordVerdict(
            ledgerId,
            claimHash,
            "wb-20240212",
            1_000_100,
            uint8(StrataRegistry.Verdict.Held),
            keccak256("attestation-1b")
        );
        vm.stopPrank();
    }

    function testUnauthorisedCallerReverts() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(NotLedgerOwner.selector, ledgerId, stranger)
        );
        registry.recordVerdict(
            ledgerId,
            keccak256("claim-4"),
            "wb-20240211",
            1_000_000,
            uint8(StrataRegistry.Verdict.Held),
            keccak256("attestation-4")
        );
    }

    function testInvalidVerdictReverts() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(InvalidVerdict.selector, uint8(9))
        );
        registry.recordVerdict(
            ledgerId,
            keccak256("claim-5"),
            "wb-20240211",
            1_000_000,
            9,
            keccak256("attestation-5")
        );
    }
}
