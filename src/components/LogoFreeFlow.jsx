import React from "react";
import styled from "styled-components";

const Logo = styled.h1`
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  user-select: none;
  margin: 0;
  display: flex;
  align-items: center;
  letter-spacing: 0.5px;

  .free {
    color: #ff7b00;
    text-shadow: 0 0 6px #ff7b00, 0 0 12px rgba(255, 123, 0, 0.4);
    margin-right: 4px;
  }

  .flow {
    color: #ffffff;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.8),
                 0 0 16px rgba(255, 255, 255, 0.4);
  }
`;

export default function LogoFreeFlow() {
  return (
    <Logo>
      <span className="free">Free</span>
    </Logo>
  );
}


