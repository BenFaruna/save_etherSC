// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract SaveEther {
    mapping(address => uint256) savings;

    event SavingsSuccess(address indexed user, uint256 value);
    event WithdrawalSuccess(address indexed user, uint256 value);


    function deposit() external payable {
        require(msg.sender != address(0), "no zero address call");
        require(msg.value > 0, "cannot save zero value");

        savings[msg.sender] += msg.value;
        emit SavingsSuccess(msg.sender, msg.value);
    }

    function withdraw() external {
        require(msg.sender != address(0), "not a valid address");
        uint256 _userSavings = savings[msg.sender];
        require(_userSavings > 0, "no savings for user");
        savings[msg.sender] -= _userSavings;
    
        payable(msg.sender).transfer(_userSavings);
        emit WithdrawalSuccess(msg.sender, _userSavings);
       
    }

    function checkSavings(address _user) external view returns (uint256) {
        return savings[_user];

    }

    function sendOutSavings(address _receiver, uint256 _amount) external {
        require(msg.sender != address(0), "no zero address calls");
        require(_amount > 0, "cannot send zero value");
        require(savings[msg.sender] >= _amount, "cannot send amount greater than savings");
        savings[msg.sender] -= _amount;

        payable(_receiver).transfer(_amount);
    }

    function checkContractBal() external view returns (uint256) {
        return address(this).balance;
    }
}