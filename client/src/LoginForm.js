import React, { useState } from 'react';
import styled from 'styled-components';
import Logo from './logo.png';

const ModalContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  border-radius: 10px;
  background-color: #e1f4cb;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
`;

const Label = styled.label`
  font-size: 1.2rem;
  font-weight: bold;
  color: #717568;
`;

const Input = styled.input`
  font-size: 1rem;
  padding: 0.5rem;
  border: none;
  border-radius: 5px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
`;

const Button = styled.button`
  font-size: 1rem;
  padding: 0.5rem;
  background-color: #f1bf98;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #bacba9;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  background-color: #3f4739;
  border-radius: 10px 10px 0 0;
`;

const LogoImage = styled.img`
  height: 100px;
  margin: 1rem;
`;

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // handle login logic here
    localStorage.setItem('username', username);
  };

  return (
    <ModalContainer>
      <ModalContent>
        <LogoContainer>
          <LogoImage src={Logo} alt="Logo" />
        </LogoContainer>
        <Form onSubmit={handleSubmit}>
          <Label htmlFor="username">Username:</Label>
          <Input type="text" id="username" value={username} onChange={handleUsernameChange} />
          <Label htmlFor="password">Password:</Label>
          <Input type="password" id="password" value={password} onChange={handlePasswordChange} />
          <Button type="submit">Login</Button>
        </Form>
      </ModalContent>
    </ModalContainer>
  );
};

export default LoginForm;
