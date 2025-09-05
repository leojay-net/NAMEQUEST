// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AchievementNFT.sol";
import "./ReputationOracle.sol";
import "./QuestToken.sol";

/**
 * @title Marketplace
 * @dev Trading marketplace for NFTs and reputation-based transactions
 */
contract Marketplace is Ownable, ReentrancyGuard {
    AchievementNFT public immutable achievementNFT;
    ReputationOracle public immutable reputationOracle;
    QuestToken public immutable questToken;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 minTrustScore;
        bool isActive;
        uint256 listedAt;
    }

    struct ReputationLoan {
        address lender;
        address borrower;
        uint256 amount;
        uint256 interestRate; // basis points (100 = 1%)
        uint256 duration;
        uint256 startTime;
        bool isActive;
        bool isRepaid;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => ReputationLoan) public reputationLoans;

    uint256 public listingCounter;
    uint256 public loanCounter;
    uint256 public constant PLATFORM_FEE = 250; // 2.5%

    event ItemListed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 tokenId,
        uint256 price
    );
    event ItemSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price
    );
    event ReputationLoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed borrower
    );
    event LoanRepaid(uint256 indexed loanId);

    constructor(
        address _achievementNFT,
        address _reputationOracle,
        address _questToken
    ) Ownable(msg.sender) {
        achievementNFT = AchievementNFT(_achievementNFT);
        reputationOracle = ReputationOracle(_reputationOracle);
        questToken = QuestToken(_questToken);
    }

    function listItem(
        uint256 tokenId,
        uint256 price,
        uint256 minTrustScore
    ) external {
        require(
            achievementNFT.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(price > 0, "Price must be greater than 0");

        achievementNFT.transferFrom(msg.sender, address(this), tokenId);

        listingCounter++;
        listings[listingCounter] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            minTrustScore: minTrustScore,
            isActive: true,
            listedAt: block.timestamp
        });

        emit ItemListed(listingCounter, msg.sender, tokenId, price);
    }

    function buyItem(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.isActive, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        // Check trust score requirement
        if (listing.minTrustScore > 0) {
            uint256 buyerTrust = reputationOracle.getAccessLevel(msg.sender) *
                250;
            require(
                buyerTrust >= listing.minTrustScore,
                "Insufficient trust score"
            );
        }

        listing.isActive = false;

        // Calculate fees
        uint256 platformFee = (listing.price * PLATFORM_FEE) / 10000;
        uint256 sellerAmount = listing.price - platformFee;

        // Transfer NFT to buyer
        achievementNFT.transferFrom(address(this), msg.sender, listing.tokenId);

        // Transfer payment to seller
        payable(listing.seller).transfer(sellerAmount);

        emit ItemSold(listingId, msg.sender, listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }
    }

    function createReputationLoan(
        address borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 duration
    ) external {
        require(amount > 0, "Loan amount must be greater than 0");
        require(interestRate <= 5000, "Interest rate too high"); // Max 50%

        // Check lender has sufficient reputation to loan
        uint256 lenderTrust = reputationOracle.getAccessLevel(msg.sender) * 250;
        require(lenderTrust >= amount, "Insufficient reputation to loan");

        loanCounter++;
        reputationLoans[loanCounter] = ReputationLoan({
            lender: msg.sender,
            borrower: borrower,
            amount: amount,
            interestRate: interestRate,
            duration: duration,
            startTime: block.timestamp,
            isActive: true,
            isRepaid: false
        });

        // Transfer tokens to borrower
        questToken.mint(borrower, amount);

        emit ReputationLoanCreated(loanCounter, msg.sender, borrower);
    }

    function repayLoan(uint256 loanId) external {
        ReputationLoan storage loan = reputationLoans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not the borrower");
        require(!loan.isRepaid, "Loan already repaid");

        uint256 interest = (loan.amount * loan.interestRate) / 10000;
        uint256 totalRepayment = loan.amount + interest;

        // Transfer repayment from borrower to lender
        questToken.transferFrom(msg.sender, loan.lender, totalRepayment);

        loan.isRepaid = true;
        loan.isActive = false;

        emit LoanRepaid(loanId);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.isActive, "Listing not active");

        listing.isActive = false;
        achievementNFT.transferFrom(address(this), msg.sender, listing.tokenId);
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
