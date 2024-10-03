import { useState } from "react";
import { Navigate } from "react-router-dom"; // Import Navigate for redirection
import Modal from 'react-modal'; // Import react-modal

Modal.setAppElement('#root'); // Setting the app element for accessibility

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false); // State to control modal visibility
  const [modalMessage, setModalMessage] = useState('');  // State to control modal content (success/failure message)
  const [redirect, setRedirect] = useState(false); // State to control redirection

  async function register(ev) {
    ev.preventDefault();
    const response = await fetch('http://localhost:4000/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 200) {
      setModalMessage(`Welcome, ${username}! Your registration was successful.`); // Success message
      setModalIsOpen(true); // Open modal on successful registration
    } else {
      setModalMessage('Registration failed. Please try again.'); // Failure message
      setModalIsOpen(true); // Open modal on failed registration
    }
  }

  // Function to close modal
  function closeModal() {
    setModalIsOpen(false);
    if (modalMessage.includes('successful')) {
      setRedirect(true); // Trigger redirect if registration was successful
    }
  }

  if (redirect) {
    return <Navigate to="/login" />; // Redirect to login page after successful registration
  }

  return (
    <>
      <form className="register" onSubmit={register}>
        <h1>Register</h1>
        <input 
          type="text"
          placeholder="username"
          value={username}
          onChange={ev => setUsername(ev.target.value)} 
        />
        <input 
          type="password"
          placeholder="password"
          value={password}
          onChange={ev => setPassword(ev.target.value)} 
        />
        <button>Register</button>
      </form>

      {/* Modal Component for both successful and failed registration */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Registration Status"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            textAlign: 'center'
          }
        }}
      >
        <h2>{modalMessage.includes('successful') ? 'Registration Successful' : 'Registration Failed'}</h2>
        <p>{modalMessage}</p>
        <button onClick={closeModal}>Close</button>
      </Modal>
    </>
  );
}
