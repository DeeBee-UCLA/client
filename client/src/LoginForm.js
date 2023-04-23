import React, { useState } from 'react';
import styled from 'styled-components';
import Logo from './logo.png';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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

const LogoImage = styled.img`
  height: 100px;
  margin: 1rem;
`;



const LoginForm = (props) => {
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
    props.onLogin({username,password});
  };

  return (
    <Form onSubmit={handleSubmit}>
      <LogoImage src={Logo} alt="Logo" />
      <Label htmlFor="username">Username:</Label>
      <Input type="text" id="username" value={username} onChange={handleUsernameChange} />
      <Label htmlFor="password">Password:</Label>
      <Input type="password" id="password" value={password} onChange={handlePasswordChange} />
      <Button type="submit">Login</Button>
    </Form>
  );
};

export default LoginForm;
